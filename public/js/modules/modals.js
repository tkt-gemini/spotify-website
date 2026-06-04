document.addEventListener('DOMContentLoaded', () => {
  // Global Toast Notification
  window.showToast = function(message) {
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-24 left-1/2 -translate-x-1/2 bg-white text-black font-semibold text-sm px-6 py-3 rounded-lg shadow-2xl z-[9999] opacity-0 transition-opacity duration-300';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    requestAnimationFrame(() => {
      toast.classList.remove('opacity-0');
      toast.classList.add('opacity-100');
    });
    
    setTimeout(() => {
      toast.classList.remove('opacity-100');
      toast.classList.add('opacity-0');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  };
  
  // Safe Clipboard Copy
  window.copyToClipboard = function(text, successMessage) {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text)
        .then(() => window.showToast(successMessage))
        .catch(() => window.showToast('Failed to copy link'));
    } else {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
        window.showToast(successMessage);
      } catch (err) {
        window.showToast('Failed to copy link');
      }
      document.body.removeChild(textArea);
    }
  };

  // Handle file input change (preview)
  document.addEventListener('change', (e) => {
    if (e.target.id === 'cover-upload-input') {
      const file = e.target.files[0];
      if (file) {
        window.selectedCoverFile = file;
        const reader = new FileReader();
        reader.onload = function(e) {
          const previewImg = document.querySelector('#edit-cover-preview');
          const placeholder = document.querySelector('#edit-cover-placeholder');
          if (previewImg) {
            previewImg.src = e.target.result;
            previewImg.classList.remove('hidden');
          }
          if (placeholder) placeholder.classList.add('hidden');
        }
        reader.readAsDataURL(file);
      }
    }
  });


  // --- PROFILE EDIT LOGIC (Delegated) ---
  
  window.selectedProfileAvatarFile = null;

  document.addEventListener('click', async (e) => {
    // Open Profile Modal
    const triggerProfileAvatar = e.target.closest('#edit-profile-trigger-avatar');
    const triggerProfileName = e.target.closest('#edit-profile-trigger-name');
    
    if (triggerProfileAvatar || triggerProfileName) {
      const modal = document.querySelector('#edit-profile-modal');
      if (modal) {
        modal.classList.remove('hidden');
        window.selectedProfileAvatarFile = null; // reset
        
        // Populate current data
        const triggerEl = triggerProfileAvatar || triggerProfileName;
        const currentName = triggerEl.getAttribute('data-current-name');
        const currentAvatar = triggerEl.getAttribute('data-current-avatar');
        
        const nameInput = document.querySelector('#edit-profile-name-input');
        if (nameInput) nameInput.value = currentName;
        
        const previewImg = document.querySelector('#edit-profile-preview');
        const placeholder = document.querySelector('#profile-avatar-placeholder');
        if (currentAvatar) {
          if (previewImg) {
            previewImg.src = currentAvatar;
            previewImg.classList.remove('hidden');
          }
          if (placeholder) placeholder.classList.add('hidden');
        } else {
          if (previewImg) previewImg.classList.add('hidden');
          if (placeholder) placeholder.classList.remove('hidden');
        }
      }
    }

    // Close Profile Modal
    const closeProfileBtn = e.target.closest('#close-profile-modal-btn');
    if (closeProfileBtn) {
      const modal = document.querySelector('#edit-profile-modal');
      if (modal) modal.classList.add('hidden');
    }

    // Trigger File Input for Profile Avatar
    const editProfileAvatarArea = e.target.closest('#edit-profile-avatar-area');
    if (editProfileAvatarArea) {
      const fileInput = document.querySelector('#profile-upload-input');
      if (fileInput) fileInput.click();
    }

    // Save Profile
    const saveProfileBtn = e.target.closest('#save-profile-btn');
    if (saveProfileBtn) {
      const nameInput = document.querySelector('#edit-profile-name-input');
      const newName = nameInput ? nameInput.value.trim() : '';
      
      if (!newName) return; // Prevent empty name

      const formData = new FormData();
      formData.append('name', newName);
      if (window.selectedProfileAvatarFile) {
        formData.append('avatar', window.selectedProfileAvatarFile);
      }

      saveProfileBtn.textContent = 'Saving...';
      saveProfileBtn.disabled = true;

      try {
        const response = await fetch(`/api/users/profile`, {
          method: 'PUT',
          body: formData
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            // Update UI on Profile Page
            const nameDisplay = document.querySelector('#profile-name-display');
            if (nameDisplay) nameDisplay.textContent = newName;
            
            // Update data attributes
            const triggers = document.querySelectorAll('#edit-profile-trigger-avatar, #edit-profile-trigger-name');
            triggers.forEach(t => t.setAttribute('data-current-name', newName));
            
            if (data.user.avatar) {
              const profileContainer = document.querySelector('#profile-avatar-container');
              if (profileContainer) {
                profileContainer.innerHTML = `<img src="${data.user.avatar}" class="w-full h-full object-cover">`;
              }
              triggers.forEach(t => t.setAttribute('data-current-avatar', data.user.avatar));
            }
            
            // Update Topbar Profile Name
            const topbarName = document.querySelector('#topbar-user-name');
            if (topbarName) topbarName.textContent = newName;

            // Update Topbar Profile Avatar
            if (data.user.avatar) {
              const topbarBtn = document.querySelector('#topbar-profile-btn');
              if (topbarBtn) {
                topbarBtn.innerHTML = `<img src="${data.user.avatar}" class="w-full h-full object-cover">`;
              }
            }

            // Close modal
            document.querySelector('#edit-profile-modal').classList.add('hidden');
          }
        }
      } catch (err) {
        console.error('Failed to update profile', err);
      } finally {
        saveProfileBtn.textContent = 'Save';
        saveProfileBtn.disabled = false;
      }
    }
  });

  // Handle Profile Avatar file input change
  document.addEventListener('change', (e) => {
    if (e.target.id === 'profile-upload-input') {
      const file = e.target.files[0];
      if (file) {
        window.selectedProfileAvatarFile = file;
        const reader = new FileReader();
        reader.onload = function(e) {
          const previewImg = document.querySelector('#edit-profile-preview');
          const placeholder = document.querySelector('#profile-avatar-placeholder');
          if (previewImg) {
            previewImg.src = e.target.result;
            previewImg.classList.remove('hidden');
          }
          if (placeholder) placeholder.classList.add('hidden');
        }
        reader.readAsDataURL(file);
      }
    }
  });

  // --- CONTEXT MENU & ACTION LOGIC ---
  const contextMenu = document.getElementById('context-menu');
  let currentTrackContext = null; // { id, playlistId (optional) }

  // Close context menu on outside click
  document.addEventListener('click', (e) => {
    if (contextMenu && !contextMenu.contains(e.target) && !e.target.closest('.cm-trigger')) {
      contextMenu.classList.add('hidden');
    }
  });

  // Close context menu on any scroll (except inside the menu itself)
  document.addEventListener('scroll', (e) => {
    if (contextMenu && !contextMenu.classList.contains('hidden')) {
      if (!contextMenu.contains(e.target)) {
        contextMenu.classList.add('hidden');
      }
    }
  }, true);

  // Shared function to open context menu
  const openContextMenu = async (trackId, playlistId, x, y) => {
    currentTrackContext = { id: trackId, playlistId: playlistId || null };
    
    // Setup menu items based on context
    const removeBtn = document.getElementById('cm-remove-from-playlist');
    if (removeBtn) {
      if (currentTrackContext.playlistId) {
        removeBtn.classList.remove('hidden');
        removeBtn.classList.add('flex');
      } else {
        removeBtn.classList.add('hidden');
        removeBtn.classList.remove('flex');
      }
    }
    
    // Show menu first to calculate size
    contextMenu.style.top = `${y}px`;
    contextMenu.style.left = `${Math.min(x, window.innerWidth - 250)}px`;
    contextMenu.classList.remove('hidden');
    
    // Adjust Y position if parent overflows the bottom
    const rect = contextMenu.getBoundingClientRect();
    if (rect.bottom > window.innerHeight) {
      const newY = Math.max(10, window.scrollY + y - rect.height);
      contextMenu.style.top = `${newY}px`;
    }

    // Adjust Submenu (child dropdown) if it overflows the bottom
    const submenu = document.getElementById('cm-playlist-submenu');
    const trigger = document.getElementById('cm-add-to-playlist');
    if (submenu && trigger) {
      // Reset first
      submenu.style.top = '-8px';
      submenu.style.bottom = 'auto';
      
      // We assume max height of submenu is around 380px based on UI
      // 100px (header+btn) + 300px (list) = max 400px. Let's use 400px.
      const estimatedSubmenuHeight = 400;
      
      // We need to re-fetch trigger rect because parent might have moved
      const triggerRect = trigger.getBoundingClientRect();
      const expectedBottom = triggerRect.top - 8 + estimatedSubmenuHeight;
      
      if (expectedBottom > window.innerHeight) {
        // Calculate how much we need to push it up
        const overflowAmount = expectedBottom - window.innerHeight + 16; // 16px safe margin
        // Prevent it from pushing too high off the top of screen
        const maxPushUp = triggerRect.top - 16; // Don't go above 16px from viewport top
        
        const finalTop = -8 - Math.min(overflowAmount, maxPushUp);
        submenu.style.top = `${finalTop}px`;
      }
    }
    
    // Pre-fetch user playlists for "Add to playlist"
    const listContainer = document.getElementById('atp-playlist-list');
    if (listContainer) {
      listContainer.innerHTML = '<div class="flex items-center justify-center h-full text-gray-500 text-sm">Loading...</div>';
      try {
        const res = await fetch('/api/user/playlists');
        const data = await res.json();
        if (data.success) {
          let html = '';
          data.playlists.forEach(p => {
            html += `
              <button class="atp-playlist-item flex items-center justify-between w-full px-2 py-2 hover:bg-[#3e3e3e] rounded group transition-colors" data-playlist-id="${p.id}">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 bg-[#282828] rounded flex items-center justify-center shrink-0 shadow-md">
                    <i class="ph ph-music-note text-gray-500 text-sm font-light"></i>
                  </div>
                  <span class="text-white text-[14px] font-bold truncate">${p.title}</span>
                </div>
                <div class="atp-checkbox w-5 h-5 rounded-full border border-gray-500 group-hover:border-white transition-colors flex items-center justify-center shrink-0"></div>
              </button>
            `;
          });
          listContainer.innerHTML = html || '<div class="px-4 py-2 text-xs text-gray-500 text-center w-full">No playlists found</div>';
        }
      } catch (err) {}
    }
  };

  // Handle opening context menu on tracks via Right-Click
  document.body.addEventListener('contextmenu', async (e) => {
    const trackEl = e.target.closest('[data-type="track"]');
    if (trackEl) {
      e.preventDefault();
      e.stopPropagation();
      openContextMenu(
        trackEl.getAttribute('data-id'),
        trackEl.getAttribute('data-playlist-id'),
        e.pageX,
        e.pageY
      );
    }
  });

  // Global click listener for all interactive elements
  document.body.addEventListener('click', async (e) => {
    const trigger = e.target.closest('.cm-trigger');
    if (trigger) {
      e.preventDefault();
      e.stopPropagation();
      
      const trackRow = trigger.closest('[data-type="track"]');
      if (trackRow) {
        const rect = trigger.getBoundingClientRect();
        openContextMenu(
          trackRow.getAttribute('data-id'), 
          trackRow.getAttribute('data-playlist-id'),
          rect.left + window.scrollX - 150,
          rect.bottom + window.scrollY
        );
      }
    }
    
    // Handle "Add to Specific Playlist" click (The old logic is removed, handled below)
    
    // Handle "+ New Playlist" button in Add to Playlist Modal
    const newPlaylistBtn = e.target.closest('#atp-new-playlist-btn');
    if (newPlaylistBtn && currentTrackContext) {
      try {
        // Create new playlist
        const createRes = await fetch('/api/playlists', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        const createData = await createRes.json();
        if (createData.success && createData.playlist) {
          const newP = createData.playlist;
          // Automatically add the track to this new playlist
          const addRes = await fetch(`/api/tracks/${currentTrackContext.id}/add-to-playlists`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ playlistIds: [newP.id] })
          });
          
          if (addRes.ok) {
            // Close the modal or re-render
            const modal = document.querySelector('#add-to-playlist-modal');
            if (modal) modal.classList.add('hidden');
            
            // Re-fetch or add it to sidebar? (Sidebar will refresh on navigation anyway, but we could do it)
            // It's fine to just close for now
          }
        }
      } catch (err) {}
    }

    // Handle clicking a playlist in the Add to Playlist Modal
    const atpPlaylistItem = e.target.closest('.atp-playlist-item');
    if (atpPlaylistItem && currentTrackContext) {
      const playlistId = atpPlaylistItem.getAttribute('data-playlist-id');
      const checkbox = atpPlaylistItem.querySelector('.atp-checkbox');
      const isChecked = checkbox.classList.contains('checked');
      
      try {
        const endpoint = isChecked ? `/api/tracks/${currentTrackContext.id}/remove-from-playlists` : `/api/tracks/${currentTrackContext.id}/add-to-playlists`;
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ playlistIds: [playlistId] })
        });
        
        if (res.ok) {
          if (isChecked) {
            checkbox.classList.remove('checked', 'border-0');
            checkbox.classList.add('border', 'border-gray-500');
            checkbox.innerHTML = '';
          } else {
            checkbox.classList.add('checked', 'border-0');
            checkbox.classList.remove('border', 'border-gray-500');
            checkbox.innerHTML = `
              <svg class="w-6 h-6 text-spotify-green" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            `;
          }
        }
      } catch (err) {}
    }
    
    // Handle "Add to queue"
    const addToQueueBtn = e.target.closest('#cm-add-to-queue');
    if (addToQueueBtn && currentTrackContext && currentTrackContext.id) {
      contextMenu.classList.add('hidden');
      const row = document.querySelector(`[data-type="track"][data-id="${currentTrackContext.id}"]`);
      if (row) {
        const btn = row.querySelector('.play-btn-icon');
        if (btn) {
          const onclickStr = btn.getAttribute('onclick') || btn.parentElement.getAttribute('onclick') || '';
          if (window.extractTrackData) {
            const trackData = window.extractTrackData(onclickStr);
            if (trackData) {
              if (!window.userQueue) window.userQueue = [];
              window.userQueue.push(trackData);
              const rightSidebar = document.querySelector('.\\[grid-area\\:right-panel\\]');
              if (rightSidebar && window.updateQueueUI) {
                window.updateQueueUI(rightSidebar);
              }
            }
          }
        }
      }
    }
    
    // Handle "Remove from Playlist"
    const removeBtn = e.target.closest('#cm-remove-from-playlist');
    if (removeBtn && currentTrackContext && currentTrackContext.playlistId) {
      try {
        const res = await fetch(`/api/tracks/${currentTrackContext.id}/remove-from-playlists`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ playlistIds: [currentTrackContext.playlistId] })
        });
        if (res.ok) {
          contextMenu.classList.add('hidden');
          const row = document.querySelector(`[data-id="${currentTrackContext.id}"][data-playlist-id="${currentTrackContext.playlistId}"]`);
          if (row) row.remove();
        }
      } catch (err) {}
    }
    
    // Handle "Like" Track
    const likeBtn = e.target.closest('.btn-like-track') || e.target.closest('#cm-toggle-like');
    if (likeBtn) {
      const trackId = (currentTrackContext && currentTrackContext.id) || (likeBtn.closest('[data-type="track"]') && likeBtn.closest('[data-type="track"]').getAttribute('data-id')) || window.currentTrackId;
      if (trackId) {
        try {
          const res = await fetch('/api/library/toggle-track', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ trackId })
          });
          const data = await res.json();
          if (data.success) {
            contextMenu.classList.add('hidden');
            // Optimistic UI update for heart icons if they clicked a direct button
            if (likeBtn.classList.contains('btn-like-track')) {
              const icon = likeBtn.querySelector('.ph') || likeBtn.querySelector('.ph-fill');
              if (icon) {
                if (data.isLiked) {
                  icon.classList.remove('ph');
                  icon.classList.add('ph-fill');
                  icon.classList.add('text-spotify-green');
                } else {
                  icon.classList.remove('ph-fill');
                  icon.classList.add('ph');
                  icon.classList.remove('text-spotify-green');
                }
              }
            }
            
            // Also explicitly update the playback bar and sidebar right if playing
            if (trackId === window.currentTrackId) {
              document.querySelectorAll('#playback-bar-favorite, #right-sidebar-favorite').forEach(btn => {
                const icon = btn.querySelector('.ph') || btn.querySelector('.ph-fill');
                if (icon) {
                  if (data.isLiked) {
                    icon.classList.remove('ph');
                    icon.classList.add('ph-fill');
                    icon.classList.add('text-spotify-green');
                  } else {
                    icon.classList.remove('ph-fill');
                    icon.classList.add('ph');
                    icon.classList.remove('text-spotify-green');
                  }
                }
              });
            }
          }
        } catch (err) {}
      }
    }
    
    // Handle "Delete Playlist"
    const deletePlaylistBtn = e.target.closest('#delete-playlist-btn');
    if (deletePlaylistBtn) {
      const pId = deletePlaylistBtn.getAttribute('data-id');
      if (confirm('Are you sure you want to delete this playlist?')) {
        try {
          const res = await fetch(`/api/playlists/${pId}`, { method: 'DELETE' });
          if (res.ok) window.location.href = '/';
        } catch (err) {}
      }
    }
    

  });

  // Handle Search inside Add to Playlist Modal
  const atpSearchInput = document.getElementById('atp-search-input');
  if (atpSearchInput) {
    atpSearchInput.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase();
      const items = document.querySelectorAll('.atp-playlist-item');
      items.forEach(item => {
        const title = item.querySelector('.text-white').textContent.toLowerCase();
        if (title.includes(query)) {
          item.style.display = 'flex';
        } else {
          item.style.display = 'none';
        }
      });
    });
  }

});
