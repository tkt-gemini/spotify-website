document.addEventListener('DOMContentLoaded', () => {
  // --- TOPBAR SEARCH LOGIC ---
  const topbarSearchInput = document.getElementById('topbar-search-input');
  const topbarSearchClear = document.getElementById('topbar-search-clear');
  const topbarSearchDropdown = document.getElementById('topbar-search-dropdown');
  
  if (topbarSearchInput && topbarSearchClear && topbarSearchDropdown) {
    let searchTimeout;

    const performSearch = async (query) => {
      if (query.trim().length === 0) {
        topbarSearchDropdown.classList.add('hidden');
        topbarSearchDropdown.classList.remove('flex');
        topbarSearchDropdown.innerHTML = '';
        return;
      }

      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        if (!response.ok) return;
        const data = await response.json();
        const results = data.searchResults;
        
        let html = '';
        const hasResults = results.artists.length > 0 || results.tracks.length > 0 || results.playlists.length > 0;

        if (!hasResults) {
          html = `<div class="p-4 text-spotify-subdued text-sm text-center">No results found for "${query}"</div>`;
        } else {
          // Render Tracks
          if (results.tracks.length > 0) {
            html += `<h4 class="text-[11px] font-bold text-spotify-subdued uppercase tracking-wider mb-1 px-2 pt-2">Songs</h4>`;
            results.tracks.slice(0, 5).forEach(track => {
              html += `
                <div class="flex items-center gap-3 p-2 hover:bg-[#3e3e3e] rounded-md group cursor-pointer transition-colors" data-type="track" data-id="${track.id}" onclick="window.playTrack('${track.id}', '${track.title.replace(/'/g, "\\'")}', '${track.artist.replace(/'/g, "\\'")}', '${track.cover || ''}', '${track.audio || ''}')">
                  <div class="w-10 h-10 bg-[#282828] rounded overflow-hidden shrink-0 relative">
                    ${track.cover ? `<img src="${track.cover}" class="w-full h-full object-cover">` : '<i class="ph ph-music-note text-gray-500 w-full h-full flex items-center justify-center text-xl"></i>'}
                    <div class="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <i class="ph-fill ph-play text-white text-xl" ></i>
                    </div>
                  </div>
                  <div class="flex flex-col flex-1 min-w-0">
                    <span class="text-white text-sm font-bold truncate">${track.title}</span>
                    <span class="text-spotify-subdued text-xs truncate">${track.artist}</span>
                  </div>
                </div>
              `;
            });
          }

          // Render Artists
          if (results.artists.length > 0) {
            html += `<h4 class="text-[11px] font-bold text-spotify-subdued uppercase tracking-wider mb-1 px-2 mt-2 pt-2 border-t border-[#333]">Artists</h4>`;
            results.artists.slice(0, 3).forEach(artist => {
              const artistImg = (artist.user && artist.user.avatar) ? artist.user.avatar : null;
              html += `
                <a href="/artist/${encodeURIComponent(artist.name)}" class="nav-item flex items-center gap-3 p-2 hover:bg-[#3e3e3e] rounded-md transition-colors">
                  <div class="w-10 h-10 bg-[#282828] rounded-full overflow-hidden shrink-0 flex items-center justify-center">
                    ${artistImg ? `<img src="${artistImg}" class="w-full h-full object-cover">` : '<i class="ph ph-user text-gray-500 text-xl"></i>'}
                  </div>
                  <div class="flex flex-col flex-1 min-w-0">
                    <span class="text-white text-sm font-bold truncate">${artist.name}</span>
                    <span class="text-spotify-subdued text-xs truncate">Artist</span>
                  </div>
                </a>
              `;
            });
          }

          // Render Playlists
          if (results.playlists.length > 0) {
            html += `<h4 class="text-[11px] font-bold text-spotify-subdued uppercase tracking-wider mb-1 px-2 mt-2 pt-2 border-t border-[#333]">Playlists</h4>`;
            results.playlists.slice(0, 3).forEach(playlist => {
              html += `
                <a href="/playlist/${playlist.id}" class="nav-item flex items-center gap-3 p-2 hover:bg-[#3e3e3e] rounded-md transition-colors">
                  <div class="w-10 h-10 bg-[#282828] rounded overflow-hidden shrink-0">
                    ${playlist.cover ? `<img src="${playlist.cover}" class="w-full h-full object-cover">` : '<i class="ph ph-music-note text-gray-500 w-full h-full flex items-center justify-center text-xl"></i>'}
                  </div>
                  <div class="flex flex-col flex-1 min-w-0">
                    <span class="text-white text-sm font-bold truncate">${playlist.title}</span>
                    <span class="text-spotify-subdued text-xs truncate">Playlist</span>
                  </div>
                </a>
              `;
            });
          }
        }
        
        topbarSearchDropdown.innerHTML = html;
        topbarSearchDropdown.classList.remove('hidden');
        topbarSearchDropdown.classList.add('flex');
      } catch (err) {
        console.error('Search error:', err);
      }
    };

    topbarSearchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const query = topbarSearchInput.value.trim();
        if (query) {
          window.location.href = '/search?q=' + encodeURIComponent(query);
        }
      }
    });

    topbarSearchInput.addEventListener('input', (e) => {
      const val = e.target.value;
      if (val.length > 0) {
        topbarSearchClear.classList.remove('hidden');
        topbarSearchClear.classList.add('flex');
      } else {
        topbarSearchClear.classList.add('hidden');
        topbarSearchClear.classList.remove('flex');
        topbarSearchDropdown.classList.add('hidden');
        topbarSearchDropdown.classList.remove('flex');
      }
      
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        performSearch(val);
      }, 300); // 300ms debounce
    });

    topbarSearchInput.addEventListener('focus', (e) => {
      if (e.target.value.length > 0) {
        topbarSearchClear.classList.remove('hidden');
        topbarSearchClear.classList.add('flex');
        if (topbarSearchDropdown.innerHTML.trim().length > 0) {
          topbarSearchDropdown.classList.remove('hidden');
          topbarSearchDropdown.classList.add('flex');
        } else {
          performSearch(e.target.value);
        }
      }
    });

    topbarSearchClear.addEventListener('click', () => {
      topbarSearchInput.value = '';
      topbarSearchClear.classList.add('hidden');
      topbarSearchClear.classList.remove('flex');
      topbarSearchDropdown.classList.add('hidden');
      topbarSearchDropdown.classList.remove('flex');
      topbarSearchInput.focus();
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (!e.target.closest('#topbar-search-container')) {
        topbarSearchDropdown.classList.add('hidden');
        topbarSearchDropdown.classList.remove('flex');
      }
    });
  }

});
