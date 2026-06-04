document.addEventListener('DOMContentLoaded', () => {

  // --- GLOBAL LIBRARY TOGGLE FUNCTIONS ---

  window.toggleFollowArtist = function(btn) {
    const icon = btn.querySelector('i') || btn.querySelector('span');
    const artistName = btn.getAttribute('data-name');
    const avatarUrl = btn.getAttribute('data-avatar');
    fetch('/api/library/toggle-artist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ artistName })
    }).then(res => res.json()).then(data => {
      if (data.success) {
        if (icon) {
          if (data.isFollowing) {
            icon.classList.remove('ph-plus-circle', 'ph');
            icon.classList.add('ph-fill', 'ph-check-circle', 'text-spotify-green');
          } else {
            icon.classList.remove('ph-fill', 'ph-check-circle', 'text-spotify-green');
            icon.classList.add('ph', 'ph-plus-circle');
          }
          icon.style.color = '';
        }
        window.showToast(data.isFollowing ? 'Added to Your Library' : 'Removed from Your Library');

        const list = document.getElementById('library-list-container');
        const href = '/artist/' + encodeURIComponent(artistName);
        if (data.isFollowing) {
          if (list && !list.querySelector('[href="' + href + '"]')) {
            const imgHtml = avatarUrl
              ? '<img src="' + avatarUrl + '" class="w-full h-full object-cover">'
              : '<i class="ph ph-user text-[#7f7f7f] text-[24px]"></i>';
            const html = '<a href="' + href + '" data-type="artist" class="library-item nav-item flex items-center gap-3 p-2 rounded-md hover:bg-[#1a1a1a] transition-colors cursor-pointer center-on-collapse">'
              + '<div class="w-12 h-12 bg-spotify-card-hover flex items-center justify-center overflow-hidden shrink-0 rounded-full">' + imgHtml + '</div>'
              + '<div class="flex flex-col min-w-0 hide-on-collapse">'
              + '<span class="text-white font-medium truncate text-base mb-1">' + artistName + '</span>'
              + '<div class="flex items-center text-spotify-subdued text-sm gap-1"><span class="capitalize truncate">artist</span></div>'
              + '</div></a>';
            list.insertAdjacentHTML('beforeend', html);
          }
        } else {
          const item = list ? list.querySelector('[href="' + href + '"]') : null;
          if (item) item.remove();
        }
      }
    }).catch(err => console.error('Toggle artist error:', err));
  };

  window.toggleSavePlaylist = function(btn) {
    const icon = btn.querySelector('i') || btn.querySelector('span');
    const playlistId = btn.getAttribute('data-id');
    const title = btn.getAttribute('data-title');
    const cover = btn.getAttribute('data-cover');
    const creator = btn.getAttribute('data-creator');

    fetch('/api/library/toggle-playlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playlistId })
    }).then(res => res.json()).then(data => {
      if (data.success) {
        if (icon) {
          if (data.isSaved) {
            icon.classList.remove('ph-plus-circle', 'ph');
            icon.classList.add('ph-fill', 'ph-check-circle', 'text-spotify-green');
          } else {
            icon.classList.remove('ph-fill', 'ph-check-circle', 'text-spotify-green');
            icon.classList.add('ph', 'ph-plus-circle');
          }
          icon.style.color = '';
        }
        window.showToast(data.isSaved ? 'Added to Your Library' : 'Removed from Your Library');

        const list = document.getElementById('library-list-container');
        const href = '/playlist/' + playlistId;
        if (data.isSaved) {
          if (list && !list.querySelector('[href="' + href + '"]')) {
            const imgHtml = cover
              ? '<img src="' + cover + '" class="w-full h-full object-cover">'
              : '<i class="ph ph-music-note text-[#7f7f7f] text-[24px]"></i>';
            const html = '<a href="' + href + '" data-type="playlist" class="library-item nav-item flex items-center gap-3 p-2 rounded-md hover:bg-[#1a1a1a] transition-colors cursor-pointer center-on-collapse">'
              + '<div class="w-12 h-12 bg-spotify-card-hover flex items-center justify-center overflow-hidden shrink-0 rounded-sm">' + imgHtml + '</div>'
              + '<div class="flex flex-col min-w-0 hide-on-collapse">'
              + '<span class="text-white font-medium truncate text-base mb-1">' + title + '</span>'
              + '<div class="flex items-center text-spotify-subdued text-sm gap-1"><span class="truncate">Playlist • ' + creator + '</span></div>'
              + '</div></a>';
            list.insertAdjacentHTML('beforeend', html);
          }
        } else {
          const item = list ? list.querySelector('[href="' + href + '"]') : null;
          if (item) item.remove();
        }
      }
    }).catch(err => console.error('Toggle playlist error:', err));
  };

  window.toggleFollowPodcast = function(btn) {
    const icon = btn.querySelector('i') || btn.querySelector('span');
    const podcastId = btn.getAttribute('data-id');
    const title = btn.getAttribute('data-title');
    const cover = btn.getAttribute('data-cover');
    const owner = btn.getAttribute('data-owner');

    fetch('/api/library/toggle-podcast', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ podcastId })
    }).then(res => res.json()).then(data => {
      if (data.success) {
        if (icon) {
          if (data.isFollowing) {
            icon.classList.remove('ph-plus-circle', 'ph');
            icon.classList.add('ph-fill', 'ph-check-circle', 'text-spotify-green');
          } else {
            icon.classList.remove('ph-fill', 'ph-check-circle', 'text-spotify-green');
            icon.classList.add('ph', 'ph-plus-circle');
          }
          icon.style.color = '';
        }
        window.showToast(data.isFollowing ? 'Added to Your Library' : 'Removed from Your Library');

        const list = document.getElementById('library-list-container');
        const href = '/podcast/' + podcastId;
        if (data.isFollowing) {
          if (list && !list.querySelector('[href="' + href + '"]')) {
            const imgHtml = cover
              ? '<img src="' + cover + '" class="w-full h-full object-cover">'
              : '<i class="ph ph-microphone text-[#7f7f7f] text-[24px]"></i>';
            const html = '<a href="' + href + '" data-type="podcast" class="library-item nav-item flex items-center gap-3 p-2 rounded-md hover:bg-[#1a1a1a] transition-colors cursor-pointer center-on-collapse">'
              + '<div class="w-12 h-12 bg-spotify-card-hover flex items-center justify-center overflow-hidden shrink-0 rounded-sm">' + imgHtml + '</div>'
              + '<div class="flex flex-col min-w-0 hide-on-collapse">'
              + '<span class="text-white font-medium truncate text-base mb-1">' + title + '</span>'
              + '<div class="flex items-center text-spotify-subdued text-sm gap-1"><span class="truncate">Podcast • ' + owner + '</span></div>'
              + '</div></a>';
            list.insertAdjacentHTML('beforeend', html);
          }
        } else {
          const item = list ? list.querySelector('[href="' + href + '"]') : null;
          if (item) item.remove();
        }
      }
    }).catch(err => console.error('Toggle podcast error:', err));
  };

  window.toggleSaveEpisode = function(btn) {
    const icon = btn.querySelector('i') || btn.querySelector('span');
    const episodeId = btn.getAttribute('data-id');

    fetch('/api/library/toggle-episode', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ episodeId })
    }).then(res => res.json()).then(data => {
      if (data.success) {
        if (icon) {
          if (data.isSaved) {
            icon.classList.remove('ph-plus-circle', 'ph');
            icon.classList.add('ph-fill', 'ph-check-circle', 'text-spotify-green');
          } else {
            icon.classList.remove('ph-fill', 'ph-check-circle', 'text-spotify-green');
            icon.classList.add('ph', 'ph-plus-circle');
          }
          icon.style.color = '';
        }
        window.showToast(data.isSaved ? 'Episode saved to Your Episodes' : 'Episode removed from Your Episodes');
      }
    }).catch(err => console.error('Toggle episode error:', err));
  };




  // --- LEFT SIDEBAR LOGIC ---

  // Library Filters
  const filterBtns = document.querySelectorAll('.library-filter');
  const libraryItems = document.querySelectorAll('.library-item');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const filterType = btn.getAttribute('data-filter');
      const isActive = btn.classList.contains('bg-white');

      // Reset all buttons
      filterBtns.forEach(b => {
        b.classList.remove('bg-white', 'text-black');
        b.classList.add('bg-spotify-elevated', 'text-white', 'hover:bg-[#333333]');
      });

      if (isActive) {
        // If clicking active button, clear filter
        libraryItems.forEach(item => item.style.display = 'flex');
      } else {
        // Activate this button
        btn.classList.remove('bg-spotify-elevated', 'text-white', 'hover:bg-[#333333]');
        btn.classList.add('bg-white', 'text-black');
        
        // Filter items
        libraryItems.forEach(item => {
          if (item.getAttribute('data-type') === filterType) {
            item.style.display = 'flex';
          } else {
            item.style.display = 'none';
          }
        });
      }
    });
  });

  // Create Playlist/Folder Dropdown
  const createNewBtn = document.querySelector('#create-new-dropdown-btn');
  const createNewDropdown = document.querySelector('#create-new-dropdown');
  
  if (createNewBtn && createNewDropdown) {
    createNewBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      createNewDropdown.classList.toggle('hidden');
    });

    document.addEventListener('click', (e) => {
      if (!createNewDropdown.contains(e.target) && !createNewBtn.contains(e.target)) {
        createNewDropdown.classList.add('hidden');
      }
    });
  }

  const createPlaylistBtn = document.querySelector('#create-playlist-btn');
  const createFolderBtn = document.querySelector('#create-folder-btn');
  const libraryListContainer = document.querySelector('#library-list-container');

  if (createPlaylistBtn) {
    createPlaylistBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      if (createNewDropdown) createNewDropdown.classList.add('hidden');
      try {
        const response = await fetch('/api/playlists', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.playlist) {
            const p = data.playlist;
            
            // Create DOM element for new playlist
            const a = document.createElement('a');
            a.href = `/playlist/${p.id}`;
            a.className = 'nav-item library-item flex items-center gap-3 p-2 rounded-md hover:bg-spotify-elevated transition-colors cursor-pointer';
            a.setAttribute('data-type', 'playlist');
            a.innerHTML = `
              <div class="w-12 h-12 rounded bg-spotify-elevated flex items-center justify-center shrink-0">
                <i class="ph ph-list-plus text-gray-500"></i>
              </div>
              <div class="flex flex-col min-w-0">
                <span class="text-white font-medium truncate text-base">${p.title}</span>
                <span class="text-spotify-subdued text-sm truncate">Playlist</span>
              </div>
            `;
            
            // Prepend to library list
            if (libraryListContainer) {
              libraryListContainer.prepend(a);
            }
            
            // Navigate to the newly created playlist
            a.click();
          }
        }
      } catch (err) {
        console.error('Failed to create playlist:', err);
      }
    });
  }

  if (createFolderBtn) {
    createFolderBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      if (createNewDropdown) createNewDropdown.classList.add('hidden');
      try {
        const response = await fetch('/api/playlists/folder', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            window.location.reload(); // Simple reload to show new folder
          }
        }
      } catch (err) {
        console.error('Failed to create folder:', err);
      }
    });
  }

  // Folder Toggle
  document.addEventListener('click', (e) => {
    const folderToggle = e.target.closest('.folder-toggle');
    if (folderToggle) {
      const id = folderToggle.getAttribute('data-id');
      const content = document.querySelector(`.folder-content-${id}`);
      const icon = document.querySelector(`.folder-icon-${id}`);
      if (content && icon) {
        content.classList.toggle('hidden');
        content.classList.toggle('flex');
        icon.classList.toggle('rotate-180');
      }
    }
  });

  // --- LIBRARY SEARCH & SORT LOGIC ---
  const searchBtn = document.getElementById('library-search-btn');
  const searchContainer = document.getElementById('library-search-container');
  const searchInput = document.getElementById('library-search-input');
  const searchCloseBtn = document.getElementById('library-search-close');
  const sortBtn = document.getElementById('library-sort-btn');
  const sortLabel = document.getElementById('library-sort-label');
  const libraryContainer = document.getElementById('library-list-container');
  
  if (searchBtn && searchContainer && searchInput && searchCloseBtn && libraryContainer) {
    let currentSearchQuery = '';
    let currentFilterType = null;

    const filterItems = () => {
      const items = libraryContainer.querySelectorAll('.library-item');
      items.forEach(item => {
        const titleSpan = item.querySelector('.text-white.font-medium');
        const title = titleSpan ? titleSpan.textContent.toLowerCase() : '';
        const matchesQuery = title.includes(currentSearchQuery);
        const matchesType = currentFilterType ? item.dataset.type === currentFilterType : true;
        
        if (matchesQuery && matchesType) {
          item.style.display = '';
        } else {
          item.style.display = 'none';
        }
      });
    };

    // Show search input
    searchBtn.addEventListener('click', () => {
      searchContainer.classList.remove('w-8', 'opacity-0', 'pointer-events-none');
      searchContainer.classList.add('w-full', 'opacity-100', 'pointer-events-auto');
      searchCloseBtn.classList.remove('hidden');
      searchCloseBtn.classList.add('flex');
      searchInput.focus();
    });

    // Hide search input and clear filter function
    const closeSearch = () => {
      if (searchContainer.classList.contains('w-full')) {
        searchContainer.classList.remove('w-full', 'opacity-100', 'pointer-events-auto');
        searchContainer.classList.add('w-8', 'opacity-0', 'pointer-events-none');
        searchCloseBtn.classList.add('hidden');
        searchCloseBtn.classList.remove('flex');
        searchInput.value = '';
        currentSearchQuery = '';
        filterItems();
      }
    };

    // Close on X button
    searchCloseBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      closeSearch();
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeSearch();
      }
    });

    // Close on click outside
    document.addEventListener('click', (e) => {
      // If click is not inside the container and not on the search button
      if (!searchContainer.contains(e.target) && !searchBtn.contains(e.target)) {
        closeSearch();
      }
    });

    // Filter items on type
    searchInput.addEventListener('input', (e) => {
      currentSearchQuery = e.target.value.toLowerCase();
      filterItems();
    });

    // Handle tag filters
    const filterBtns = document.querySelectorAll('.library-filter');
    filterBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const type = btn.dataset.filter;
        // If clicking the active one, deactivate it
        if (currentFilterType === type) {
          currentFilterType = null;
          btn.classList.remove('bg-white', 'text-black');
          btn.classList.add('bg-spotify-elevated', 'text-white');
        } else {
          // Deactivate all
          filterBtns.forEach(b => {
            b.classList.remove('bg-white', 'text-black');
            b.classList.add('bg-spotify-elevated', 'text-white');
          });
          // Activate this one
          currentFilterType = type;
          btn.classList.remove('bg-spotify-elevated', 'text-white');
          btn.classList.add('bg-white', 'text-black');
        }
        filterItems();
      });
    });
  }

  if (sortBtn && sortLabel && libraryContainer) {
    const sortDropdown = document.getElementById('library-sort-dropdown');
    const sortOptions = document.querySelectorAll('.sort-option');
    const originalOrder = Array.from(libraryContainer.children);

    let currentSort = 'recents'; // 'recents' or 'alphabetical'
    let currentDir = 'asc'; // 'asc' or 'desc'

    // Open/Close dropdown
    sortBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      sortDropdown.classList.toggle('hidden');
    });

    // Close on click outside
    document.addEventListener('click', (e) => {
      if (sortDropdown && !sortDropdown.contains(e.target) && !sortBtn.contains(e.target)) {
        sortDropdown.classList.add('hidden');
      }
    });

    const applySort = (type, dir) => {
      const items = Array.from(libraryContainer.children);
      
      if (type === 'alphabetical') {
        items.sort((a, b) => {
          const titleA = a.querySelector('.text-white.font-medium')?.textContent.toLowerCase() || '';
          const titleB = b.querySelector('.text-white.font-medium')?.textContent.toLowerCase() || '';
          return dir === 'asc' ? titleA.localeCompare(titleB) : titleB.localeCompare(titleA);
        });
        sortLabel.textContent = 'Alphabetical';
      } else {
        // Recents
        items.sort((a, b) => {
          const val = originalOrder.indexOf(a) - originalOrder.indexOf(b);
          return dir === 'asc' ? val : -val;
        });
        sortLabel.textContent = 'Recents';
      }
      
      // Update UI
      sortOptions.forEach(opt => {
        const icon = opt.querySelector('.sort-dir-icon');
        if (opt.dataset.sort === type) {
          opt.classList.add('text-spotify-green');
          icon.classList.remove('hidden');
          icon.textContent = dir === 'asc' ? 'arrow_upward' : 'arrow_downward';
        } else {
          opt.classList.remove('text-spotify-green');
          icon.classList.add('hidden');
        }
      });
      
      // Re-append
      items.forEach(item => libraryContainer.appendChild(item));
      
      // Save
      localStorage.setItem('spotify-library-sort', JSON.stringify({ type, dir }));
    };

    // Load from storage
    const savedSort = localStorage.getItem('spotify-library-sort');
    if (savedSort) {
      try {
        const parsed = JSON.parse(savedSort);
        if (parsed.type && parsed.dir) {
          currentSort = parsed.type;
          currentDir = parsed.dir;
        }
      } catch (e) {}
    }
    // Apply initial
    applySort(currentSort, currentDir);

    // Option clicks
    sortOptions.forEach(opt => {
      opt.addEventListener('click', (e) => {
        e.stopPropagation();
        const type = opt.dataset.sort;
        if (type === currentSort) {
          // Toggle dir
          currentDir = currentDir === 'asc' ? 'desc' : 'asc';
        } else {
          currentSort = type;
          currentDir = 'asc';
        }
        applySort(currentSort, currentDir);
        sortDropdown.classList.add('hidden');
      });
    });
  }

  // --- PLAYLIST EDIT LOGIC (Delegated) ---
  
  window.selectedCoverFile = null;

  document.addEventListener('click', async (e) => {
    // Open Modal
    const triggerImg = e.target.closest('#edit-playlist-trigger-img');
    const triggerTitle = e.target.closest('#playlist-title-display');
    if (triggerImg || triggerTitle) {
      const modal = document.querySelector('#edit-playlist-modal');
      if (modal) {
        modal.classList.remove('hidden');
        window.selectedCoverFile = null; // reset
      }
    }

    // Close Modal
    const closeBtn = e.target.closest('#close-edit-modal-btn');
    if (closeBtn) {
      const modal = document.querySelector('#edit-playlist-modal');
      if (modal) modal.classList.add('hidden');
    }

    // Trigger File Input
    const editCoverArea = e.target.closest('#edit-cover-area');
    if (editCoverArea) {
      const fileInput = document.querySelector('#cover-upload-input');
      if (fileInput) fileInput.click();
    }

    // Save Playlist
    const saveBtn = e.target.closest('#save-playlist-btn');
    if (saveBtn) {
      const playlistId = saveBtn.getAttribute('data-playlist-id');
      const titleInput = document.querySelector('#edit-title-input');
      const descInput = document.querySelector('#edit-desc-input');
      const publicInput = document.querySelector('#edit-public-input');
      const folderInput = document.querySelector('#edit-folder-input');
      
      const newTitle = titleInput ? titleInput.value.trim() : '';
      if (!newTitle) return; // Prevent empty title

      const formData = new FormData();
      formData.append('title', newTitle);
      
      if (descInput) formData.append('description', descInput.value.trim());
      if (publicInput) formData.append('isPublic', publicInput.checked);
      if (folderInput) formData.append('parentId', folderInput.value);

      if (window.selectedCoverFile) {
        formData.append('coverImage', window.selectedCoverFile);
      }

      saveBtn.textContent = 'Saving...';
      saveBtn.disabled = true;

      try {
        const response = await fetch(`/api/playlists/${playlistId}`, {
          method: 'PUT',
          body: formData
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            // Update UI
            const titleDisplay = document.querySelector('#playlist-title-display');
            if (titleDisplay) titleDisplay.textContent = newTitle;
            
            const descDisplay = document.querySelector('#playlist-description-display');
            if (descDisplay) {
              const descInput = document.querySelector('#edit-desc-input');
              if (descInput) descDisplay.textContent = descInput.value.trim();
            }
            
            if (data.playlist.cover) {
              const coverDisplay = document.querySelector('#playlist-cover-display');
              if (coverDisplay) coverDisplay.src = data.playlist.cover;
              else {
                // If there was no cover before, the image tag might not exist, we'd need to replace the placeholder
                // This is a simple fallback for now
                window.location.reload(); 
              }
            }
            
            // Update Left Sidebar
            const sidebarItem = document.querySelector(`.library-item[href="/playlist/${playlistId}"] .text-white`);
            if (sidebarItem) {
              sidebarItem.textContent = newTitle;
            }
            
            // If parent folder changed, we reload to rebuild the sidebar tree
            if (folderInput) {
              window.location.reload();
              return;
            }

            // Close modal
            document.querySelector('#edit-playlist-modal').classList.add('hidden');
          }
        }
      } catch (err) {
        console.error('Failed to update playlist', err);
      } finally {
        saveBtn.textContent = 'Save';
        saveBtn.disabled = false;
      }
    }
  });

});
