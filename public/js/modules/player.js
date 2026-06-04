document.addEventListener('DOMContentLoaded', () => {
  // --- AUDIO PLAYER LOGIC ---
  window.updatePlayButtonsState = function() {
    const isPlaying = window.audioPlayer && !window.audioPlayer.paused && window.audioPlayer.src;
    
    // Reset all track play buttons
    document.querySelectorAll('.play-btn-icon').forEach(icon => {
      icon.classList.remove('ph-pause');
      icon.classList.add('ph-play');
    });
    
    // If something is playing, find the specific track's button and change to pause
    if (isPlaying && window.currentTrackId) {
      // Find button by checking the onclick attribute or if it's inside a data-id container
      // Since our buttons are inside cards or rows, we can just look for data-id match on parent rows
      const rows = document.querySelectorAll(`[data-id="${window.currentTrackId}"]`);
      rows.forEach(row => {
        const icon = row.querySelector('.play-btn-icon');
        if (icon) {
          icon.classList.remove('ph-play');
          icon.classList.add('ph-pause');
        }
      });
      
      // Also look for buttons directly if they have some other association, but currently we use data-id on the wrapper
      // Let's also check the playTrack onclick itself as a fallback
      document.querySelectorAll('.play-btn-icon').forEach(icon => {
        const btn = icon.closest('button');
        if (btn && btn.getAttribute('onclick') && btn.getAttribute('onclick').includes(`'${window.currentTrackId}'`)) {
          icon.classList.remove('ph-play');
          icon.classList.add('ph-pause');
        }
      });
    }

    // Update main playback bar button
    const mainPlayBtn = document.querySelector('#main-play-btn');
    if (mainPlayBtn) {
      if (isPlaying) {
        mainPlayBtn.classList.remove('ph-play');
        mainPlayBtn.classList.add('ph-pause');
      } else {
        mainPlayBtn.classList.remove('ph-pause');
        mainPlayBtn.classList.add('ph-play');
      }
    }
  };

  if (!window.audioPlayer) {
    window.audioPlayer = new Audio();
    window.currentTrackId = null;

    window.audioPlayer.addEventListener('play', () => {
      window.updatePlayButtonsState();
    });

    window.audioPlayer.addEventListener('pause', () => {
      window.updatePlayButtonsState();
    });

    window.audioPlayer.addEventListener('timeupdate', () => {
      if (!window.audioPlayer.duration) return;
      const current = window.audioPlayer.currentTime;
      const duration = window.audioPlayer.duration;
      
      const currentTimeEl = document.querySelector('#playback-current-time');
      const durationEl = document.querySelector('#playback-duration');
      const progressBar = document.querySelector('#playback-progress-bar');
      const progressHandle = document.querySelector('#playback-progress-handle');
      
      if (currentTimeEl) currentTimeEl.textContent = formatTime(current);
      if (durationEl) durationEl.textContent = formatTime(duration);
      if (progressBar) progressBar.style.width = `${(current / duration) * 100}%`;
      if (progressHandle) progressHandle.style.left = `${(current / duration) * 100}%`;
    });

    window.audioPlayer.addEventListener('ended', () => {
      window.updatePlayButtonsState();
      if (window.repeatMode === 2) { // 2 = Repeat One
        window.audioPlayer.currentTime = 0;
        window.audioPlayer.play();
      } else {
        window.playNext();
      }
    });
  }

  window.repeatMode = 0; // 0 = Off, 1 = Repeat All, 2 = Repeat One
  window.isShuffle = false;
  
  // Spotify-like State
  window.userQueue = []; // Tracks added by "Add to queue"
  window.playbackContext = []; // Snapshot of the playlist/album tracks
  window.currentContextIndex = -1;

  window.playNext = function(forceUserQueue = false) {
    if (window.userQueue.length > 0) {
      const nextTrack = window.userQueue.shift();
      window.playTrack(nextTrack.id, nextTrack.title, nextTrack.artist, nextTrack.cover, nextTrack.audioUrl, true);
      return;
    }
    
    if (window.playbackContext.length === 0) return;
    
    let nextIndex = window.currentContextIndex + 1;
    if (window.isShuffle) {
      nextIndex = Math.floor(Math.random() * window.playbackContext.length);
    } else if (nextIndex >= window.playbackContext.length) {
      if (window.repeatMode === 1) { // 1 = Repeat All
        nextIndex = 0; // Wrap around to the beginning
      } else {
        // Reached the end of the context, stop playing.
        window.audioPlayer.pause();
        window.updatePlayButtonsState();
        return; 
      }
    }
    
    const track = window.playbackContext[nextIndex];
    if (track) {
      window.currentContextIndex = nextIndex;
      window.playTrack(track.id, track.title, track.artist, track.cover, track.audioUrl, true);
    }
  };

  window.playPrevious = function() {
    // If more than 3 seconds in, just restart song
    if (window.audioPlayer && window.audioPlayer.currentTime > 3) {
      window.audioPlayer.currentTime = 0;
      return;
    }

    if (window.playbackContext.length === 0) return;

    let prevIndex = window.currentContextIndex - 1;
    if (prevIndex < 0) {
      // If at the very beginning, just restart the first track
      prevIndex = 0;
    }
    
    const track = window.playbackContext[prevIndex];
    if (track) {
      window.currentContextIndex = prevIndex;
      window.playTrack(track.id, track.title, track.artist, track.cover, track.audioUrl, true);
    }
  };

  window.playFromQueue = function(index) {
    if (index >= 0 && index < window.userQueue.length) {
      const track = window.userQueue.splice(index, 1)[0];
      window.playTrack(track.id, track.title, track.artist, track.cover, track.audioUrl, true);
      
      const rightSidebar = document.querySelector('.\\[grid-area\\:right-panel\\]');
      if (rightSidebar) window.updateQueueUI(rightSidebar);
    }
  };

  function formatTime(seconds) {
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
  }

  // Helper to extract track metadata from DOM onclick
  window.extractTrackData = function(playBtnStr) {
    if (!playBtnStr.includes('window.playTrack(')) return null;
    try {
      const argsStr = playBtnStr.match(/window\.playTrack\((.*)\)/);
      if (argsStr && argsStr[1]) {
        // Simple eval to parse the arguments array safely
        // But since we can't eval safely easily, let's use a function trick
        // since the arguments are primitive strings.
        const parseFunc = new Function(`return [${argsStr[1]}];`);
        const args = parseFunc();
        if (args && args.length >= 5) {
          return { id: args[0], title: args[1], artist: args[2], cover: args[3], audioUrl: args[4] };
        }
      }
    } catch (e) {
      console.error('Error extracting track data:', e);
    }
    return null;
  };

  // Helper to load track durations
  window.loadTrackDurations = function() {
    document.querySelectorAll('.duration-display:not(.loaded)').forEach(el => {
      if (el.dataset.audioUrl) {
        // Mark as loaded so we don't attach multiple times if called repeatedly
        el.classList.add('loaded');
        const audio = new Audio(el.dataset.audioUrl);
        audio.addEventListener('loadedmetadata', () => {
          const mins = Math.floor(audio.duration / 60);
          const secs = Math.floor(audio.duration % 60).toString().padStart(2, '0');
          el.innerText = `${mins}:${secs}`;
        });
        audio.addEventListener('error', () => {
          el.innerText = '0:00';
        });
      }
    });
  };

  // Call it initially for normal page load
  window.loadTrackDurations();

  window.playTrack = function(id, title, artist, cover, audioUrl, isFromQueue = false) {
    if (window.currentTrackId === id) {
      window.togglePlay();
      return;
    }

    window.currentTrackId = id;

    // Record PlayHistory on the server
    fetch(`/api/tracks/${id}/play`, { method: 'POST' }).catch(e => console.error('Failed to record play:', e));

    // Snapshot Context if manually clicked (not auto-playing from queue)
    if (!isFromQueue) {
      window.playbackContext = [];
      window.currentContextIndex = -1;
      
      // Find the clicked element to determine its context
      // Note: we can't reliably find the exact clicked element if there are duplicates of the same track ID on the page,
      // but in most cases (like clicking a card or a row), we can find it.
      // A better way is to pass the click event, but since we don't, we will find the first matching track.
      const clickedEl = document.querySelector(`[data-type="track"][data-id="${id}"]`);
      
      let domTracks = [];
      let contextName = '';
      if (clickedEl) {
        const container = clickedEl.closest('.track-context-container');
        if (container) {
          domTracks = Array.from(container.querySelectorAll('[data-type="track"]'));
          if (container.dataset.contextName) {
            contextName = container.dataset.contextName;
          } else {
            const h1 = document.querySelector('h1');
            if (h1 && h1.textContent) contextName = h1.textContent.trim();
          }
        } else {
          // Standalone track
          domTracks = [clickedEl];
        }
      }

      domTracks.forEach((el, index) => {
        const btn = el.querySelector('.play-btn-icon');
        if (btn) {
          const onclickStr = (btn.getAttribute('onclick') || btn.parentElement.getAttribute('onclick') || '');
          const trackData = window.extractTrackData(onclickStr);
          if (trackData) {
            window.playbackContext.push(trackData);
            if (trackData.id === id) {
              window.currentContextIndex = window.playbackContext.length - 1;
            }
          }
        }
      });
      // If the clicked track wasn't found in DOM somehow, just set it as a 1-item context
      if (window.currentContextIndex === -1 || window.playbackContext.length === 0) {
        window.playbackContext = [{ id, title, artist, cover, audioUrl }];
        window.currentContextIndex = 0;
      }
      window.currentContextName = contextName;
    }
    
    // Update Right Sidebar (Now Playing & Queue)
    const rightSidebar = document.querySelector('.\\[grid-area\\:right-panel\\]');
    if (rightSidebar) {
      // Now Playing View updates
      const coverImg = rightSidebar.querySelector('#now-playing-view .aspect-square');
      if (coverImg) coverImg.innerHTML = `<img src="${cover}" alt="Cover" class="w-full h-full object-cover rounded-md">`;
      const titleEl = rightSidebar.querySelector('#now-playing-view .text-2xl');
      if (titleEl) titleEl.textContent = title;
      const artistEls = rightSidebar.querySelectorAll('#now-playing-view .text-spotify-subdued.text-base, #now-playing-view h3 ~ a');
      artistEls.forEach(el => el.textContent = artist);
      
      // Queue View updates
      const queueCurrent = rightSidebar.querySelector('#queue-current-track');
      if (queueCurrent) {
        const queueCover = queueCurrent.querySelector('.w-10');
        if (queueCover) queueCover.innerHTML = `<img src="${cover}" alt="Cover" class="w-full h-full object-cover rounded">`;
        const queueTitle = queueCurrent.querySelector('.text-spotify-green');
        if (queueTitle) queueTitle.textContent = title;
        const queueArtist = queueCurrent.querySelector('.text-spotify-subdued.text-xs');
        if (queueArtist) queueArtist.textContent = artist;
      }
      
      // Fetch dynamic artist bio
      fetch(`/api/artist/${encodeURIComponent(artist)}`)
        .then(res => res.json())
        .then(data => {
          const aboutSection = rightSidebar.querySelector('#now-playing-view .bg-spotify-elevated');
          if (aboutSection && data.success && data.data) {
            const bioText = aboutSection.querySelector('p');
            const avatarImg = aboutSection.querySelector('.w-16.h-16');
            if (bioText) {
              bioText.textContent = data.data.bio || data.data.description || 'No biography available for this artist yet.';
            }
            if (avatarImg) {
              if (data.data.avatar) {
                avatarImg.innerHTML = `<img src="${data.data.avatar}" alt="${artist}" class="w-full h-full object-cover rounded-full">`;
              } else {
                avatarImg.innerHTML = `<i class="ph ph-user text-gray-500"></i>`;
              }
            }
            
            // Update artist links
            const artistLinks = rightSidebar.querySelectorAll('#now-playing-view a[href="#"]');
            artistLinks.forEach(link => {
              if (link.textContent.trim() === artist) {
                link.href = `/artist/${encodeURIComponent(artist)}`;
              }
            });
            const followBtn = rightSidebar.querySelector('#follow-artist-btn');
            if (followBtn) followBtn.setAttribute('data-artist', artist);
          }
        })
        .catch(err => console.error('Failed to load artist info', err));
        
      // Update Next in Queue UI
      window.updateQueueUI(rightSidebar);
    }

    // Update Bottom Playback Bar
    const playbackBar = document.querySelector('.\\[grid-area\\:now-playing-bar\\]');
    if (playbackBar) {
      const coverImg = playbackBar.querySelector('.w-14.h-14');
      if (coverImg) coverImg.innerHTML = `<img src="${cover}" alt="Cover" class="w-full h-full object-cover rounded">`;
      
      // Update heart icon state
      fetch(`/api/library/check?trackId=${id}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
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
        })
        .catch(err => console.error('Failed to check liked status', err));
      const titleEl = playbackBar.querySelector('#playback-track-title');
      if (titleEl) titleEl.textContent = title;
      const artistEl = playbackBar.querySelector('#playback-track-artist');
      if (artistEl) artistEl.textContent = artist;
    }

    // Load and Play Audio
    window.audioPlayer.src = audioUrl;
    window.audioPlayer.play();
  };

  window.togglePlay = function() {
    if (!window.audioPlayer.src) return;
    if (window.audioPlayer.paused) {
      window.audioPlayer.play();
    } else {
      window.audioPlayer.pause();
    }
  };

  window.updateQueueUI = function(rightSidebar) {
    const queueContainer = rightSidebar.querySelector('#queue-next-tracks');
    if (!queueContainer) return;

    let html = '';
    
    // Render User Queue First
    if (window.userQueue.length > 0) {
      html += '<div class="text-white font-bold text-sm mb-3 mt-4">Next in queue</div>';
      window.userQueue.forEach((track, index) => {
        html += `
          <div class="flex items-center gap-3 p-2 hover:bg-spotify-elevated rounded-md cursor-pointer transition-colors group" onclick="window.playFromQueue(${index});">
            <div class="w-10 h-10 bg-spotify-card-hover rounded shrink-0 flex items-center justify-center overflow-hidden">
              ${track.cover ? `<img src="${track.cover}" class="w-full h-full object-cover">` : `<i class="ph ph-music-note text-gray-500 text-sm"></i>`}
            </div>
            <div class="flex flex-col min-w-0">
              <span class="text-white text-sm font-medium truncate group-hover:underline">${track.title}</span>
              <span class="text-spotify-subdued text-xs truncate">${track.artist}</span>
            </div>
          </div>
        `;
      });
    }

    // Render Next from Context
    if (window.playbackContext.length > 0 && window.currentContextIndex < window.playbackContext.length - 1) {
      const contextTitle = window.currentContextName ? `Next from: ${window.currentContextName}` : 'Next from context';
      html += `<div class="text-white font-bold text-sm mb-3 mt-6">${contextTitle}</div>`;
      // Show up to 10 next context tracks
      for (let i = 1; i <= 10; i++) {
        let nextIndex = window.currentContextIndex + i;
        if (nextIndex >= window.playbackContext.length) break;
        
        const track = window.playbackContext[nextIndex];
        html += `
          <div class="flex items-center gap-3 p-2 hover:bg-spotify-elevated rounded-md cursor-pointer transition-colors group" onclick="window.currentContextIndex = ${nextIndex}; window.playTrack('${track.id}', '${track.title.replace(/'/g, "\\'")}', '${track.artist.replace(/'/g, "\\'")}', '${track.cover}', '${track.audioUrl}', true);">
            <div class="w-10 h-10 bg-spotify-card-hover rounded shrink-0 flex items-center justify-center overflow-hidden">
              ${track.cover ? `<img src="${track.cover}" class="w-full h-full object-cover">` : `<i class="ph ph-music-note text-gray-500 text-sm"></i>`}
            </div>
            <div class="flex flex-col min-w-0">
              <span class="text-white text-sm font-medium truncate group-hover:underline">${track.title}</span>
              <span class="text-spotify-subdued text-xs truncate">${track.artist}</span>
            </div>
          </div>
        `;
      }
    }
    
    if (html === '') {
      html = '<p class="text-spotify-subdued text-sm px-2">No tracks in queue.</p>';
    }
    queueContainer.innerHTML = html;
  };

  // Setup Playback Bar Main Play Button
  const mainPlayBtnContainer = document.querySelector('#main-play-btn-container');
  if (mainPlayBtnContainer) {
    mainPlayBtnContainer.onclick = (e) => {
      e.preventDefault();
      window.togglePlay();
    };
  }

  // Setup Next/Prev Buttons
  const btnNext = document.querySelector('#btn-next');
  if (btnNext) {
    btnNext.onclick = (e) => { e.preventDefault(); window.playNext(); };
  }
  const btnPrev = document.querySelector('#btn-prev');
  if (btnPrev) {
    btnPrev.onclick = (e) => { e.preventDefault(); window.playPrevious(); };
  }

  // Setup Shuffle/Repeat
  const btnShuffle = document.querySelector('#btn-shuffle');
  if (btnShuffle) {
    btnShuffle.onclick = (e) => {
      e.preventDefault();
      window.isShuffle = !window.isShuffle;
      btnShuffle.classList.toggle('text-spotify-green', window.isShuffle);
    };
  }
  const btnRepeat = document.querySelector('#btn-repeat');
  if (btnRepeat) {
    btnRepeat.onclick = (e) => {
      e.preventDefault();
      window.repeatMode = (window.repeatMode + 1) % 3;
      
      const icon = btnRepeat.querySelector('.ph');
      if (window.repeatMode === 0) {
        btnRepeat.classList.remove('text-spotify-green');
        if (icon) { icon.classList.remove('ph-repeat-once'); icon.classList.add('ph-repeat'); }
      } else if (window.repeatMode === 1) {
        btnRepeat.classList.add('text-spotify-green');
        if (icon) { icon.classList.remove('ph-repeat-once'); icon.classList.add('ph-repeat'); }
      } else if (window.repeatMode === 2) {
        btnRepeat.classList.add('text-spotify-green');
        if (icon) { icon.classList.remove('ph-repeat'); icon.classList.add('ph-repeat-once'); }
      }
    };
  }

  // Setup Progress Bar Dragging
  const progressBarContainer = document.querySelector('#progress-bar-container');
  if (progressBarContainer) {
    let isDraggingProgress = false;
    
    const updateProgress = (e) => {
      if (!window.audioPlayer || !window.audioPlayer.duration) return;
      const rect = progressBarContainer.getBoundingClientRect();
      let pos = (e.clientX - rect.left) / rect.width;
      pos = Math.max(0, Math.min(1, pos));
      window.audioPlayer.currentTime = pos * window.audioPlayer.duration;
    };

    progressBarContainer.addEventListener('mousedown', (e) => {
      isDraggingProgress = true;
      updateProgress(e);
    });

    window.addEventListener('mousemove', (e) => {
      if (isDraggingProgress) updateProgress(e);
    });

    window.addEventListener('mouseup', () => {
      isDraggingProgress = false;
    });
  }

  // Setup Volume Slider
  const volumeSliderContainer = document.querySelector('#volume-slider-container');
  if (volumeSliderContainer) {
    let isDraggingVolume = false;
    
    // Initial volume
    if (window.audioPlayer) window.audioPlayer.volume = 1.0;
    
    const updateVolume = (e) => {
      if (!window.audioPlayer) return;
      const rect = volumeSliderContainer.getBoundingClientRect();
      let pos = (e.clientX - rect.left) / rect.width;
      pos = Math.max(0, Math.min(1, pos));
      
      window.audioPlayer.volume = pos;
      
      const fill = document.querySelector('#volume-slider-fill');
      const handle = document.querySelector('#volume-slider-handle');
      if (fill) fill.style.width = `${pos * 100}%`;
      if (handle) handle.style.left = `${pos * 100}%`;
      
      const icon = document.querySelector('#volume-icon');
      if (icon) {
        icon.classList.remove('ph-speaker-none', 'ph-speaker-low', 'ph-speaker-high');
        if (pos === 0) icon.classList.add('ph-speaker-none');
        else if (pos < 0.5) icon.classList.add('ph-speaker-low');
        else icon.classList.add('ph-speaker-high');
      }
    };

    volumeSliderContainer.addEventListener('mousedown', (e) => {
      isDraggingVolume = true;
      updateVolume(e);
    });

    window.addEventListener('mousemove', (e) => {
      if (isDraggingVolume) updateVolume(e);
    });

    window.addEventListener('mouseup', () => {
      isDraggingVolume = false;
    });
  }

  // Setup Mute Button
  const volumeMuteBtn = document.querySelector('#volume-mute-btn');
  if (volumeMuteBtn) {
    let previousVolume = 1.0;
    volumeMuteBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (!window.audioPlayer) return;
      
      const setVolumeUI = (pos) => {
        window.audioPlayer.volume = pos;
        const fill = document.querySelector('#volume-slider-fill');
        const handle = document.querySelector('#volume-slider-handle');
        if (fill) fill.style.width = `${pos * 100}%`;
        if (handle) handle.style.left = `${pos * 100}%`;
        
        const icon = document.querySelector('#volume-icon');
        if (icon) {
          icon.classList.remove('ph-speaker-none', 'ph-speaker-low', 'ph-speaker-high');
          if (pos === 0) icon.classList.add('ph-speaker-none');
          else if (pos < 0.5) icon.classList.add('ph-speaker-low');
          else icon.classList.add('ph-speaker-high');
        }
      };

      if (window.audioPlayer.volume > 0) {
        previousVolume = window.audioPlayer.volume;
        setVolumeUI(0);
      } else {
        setVolumeUI(previousVolume > 0 ? previousVolume : 1.0);
      }
    });
  }

  // Setup Queue Toggle
  const queueBtn = document.querySelector('#queue-btn');
  if (queueBtn) {
    queueBtn.addEventListener('click', (e) => {
      e.preventDefault();
      queueBtn.classList.toggle('text-spotify-green');
      
      const isQueue = queueBtn.classList.contains('text-spotify-green');
      const nowPlayingView = document.querySelector('#now-playing-view');
      const queueView = document.querySelector('#queue-view');
      
      if (nowPlayingView && queueView) {
        if (isQueue) {
          nowPlayingView.classList.add('hidden');
          queueView.classList.remove('hidden');
        } else {
          nowPlayingView.classList.remove('hidden');
          queueView.classList.add('hidden');
        }
      }
    });
  }

  // Setup Large Play Buttons (on playlist/artist/podcast headers)
  document.addEventListener('click', (e) => {
    const lgPlayBtn = e.target.closest('.btn-play-lg');
    if (lgPlayBtn) {
      e.preventDefault();
      // If something is already playing, this could act as pause/resume if it's the current context
      // But for simplicity, we just find the first track in the container and click its play button
      const firstTrackBtn = document.querySelector('.track-context-container [data-type="track"] .play-btn-icon');
      if (firstTrackBtn) {
        firstTrackBtn.click();
      }
    }
  });

  // Fullscreen Button
  const fullscreenBtn = document.getElementById('fullscreen-btn');
  if (fullscreenBtn) {
    fullscreenBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
          console.error(`Error attempting to enable fullscreen: ${err.message}`);
        });
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        }
      }
    });
  }

  // Lyrics Logic
  const lyricsBtn = document.getElementById('lyrics-btn');
  const lyricsOverlay = document.getElementById('lyrics-view-overlay');
  const closeLyricsBtn = document.getElementById('close-lyrics-btn');
  const lyricsContent = document.getElementById('lyrics-content');

  function closeLyrics() {
    if (lyricsOverlay) {
      lyricsOverlay.classList.remove('opacity-100');
      lyricsOverlay.classList.add('opacity-0');
      setTimeout(() => lyricsOverlay.classList.add('hidden', 'flex-col'), 300);
      lyricsBtn?.classList.remove('text-spotify-green');
    }
  }

  function openLyrics() {
    if (lyricsOverlay) {
      lyricsOverlay.classList.remove('hidden');
      lyricsOverlay.classList.add('flex', 'flex-col');
      // small delay to allow display block to apply before transition
      setTimeout(() => {
        lyricsOverlay.classList.remove('opacity-0');
        lyricsOverlay.classList.add('opacity-100');
      }, 10);
      lyricsBtn?.classList.add('text-spotify-green');
      
      // Fetch and display lyrics
      if (window.currentTrackId) {
        lyricsContent.textContent = 'Loading lyrics...';
        fetch(`/api/tracks/${window.currentTrackId}`)
          .then(res => res.json())
          .then(data => {
            if (data.success && data.track && data.track.lyrics) {
              lyricsContent.textContent = data.track.lyrics;
            } else {
              lyricsContent.textContent = "Looks like we don't have lyrics for this song.";
            }
          })
          .catch(() => {
            lyricsContent.textContent = "Could not load lyrics.";
          });
      } else {
        lyricsContent.textContent = "Play a song to see its lyrics.";
      }
    }
  }

  if (lyricsBtn) {
    lyricsBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const isVisible = !lyricsOverlay.classList.contains('hidden');
      if (isVisible) {
        closeLyrics();
      } else {
        openLyrics();
      }
    });
  }

  if (closeLyricsBtn) {
    closeLyricsBtn.addEventListener('click', (e) => {
      e.preventDefault();
      closeLyrics();
    });
  }

  // Auto update lyrics if track changes while lyrics overlay is open
  const originalPlayTrack = window.playTrack;
  window.playTrack = function(id, title, artist, cover, audioUrl, isFromQueue = false) {
    originalPlayTrack.apply(this, arguments);
    if (lyricsOverlay && !lyricsOverlay.classList.contains('hidden')) {
      // Re-fetch lyrics for the new track
      lyricsContent.textContent = 'Loading lyrics...';
      fetch(`/api/tracks/${id}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.track && data.track.lyrics) {
            lyricsContent.textContent = data.track.lyrics;
          } else {
            lyricsContent.textContent = "Looks like we don't have lyrics for this song.";
          }
        })
        .catch(() => {
          lyricsContent.textContent = "Could not load lyrics.";
        });
    }
  };

});