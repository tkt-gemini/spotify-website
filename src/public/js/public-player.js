window.PublicPlayer = (function() {
  const audio = document.getElementById('public-audio-element');
  const btnPlayPause = document.getElementById('public-btn-play-pause');
  const progressBar = document.getElementById('public-progress-bar');
  const timeCurrent = document.getElementById('public-time-current');
  const timeTotal = document.getElementById('public-time-total');
  
  const coverImg = document.getElementById('public-player-cover');
  const infoContainer = document.getElementById('public-player-info');
  const titleEl = document.getElementById('public-player-title');
  const artistEl = document.getElementById('public-player-artist');

  let currentSessionId = null;
  let currentEntityType = null;
  let currentEntityId = null;

  function formatTime(seconds) {
    if (isNaN(seconds)) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  }

  async function loadAndPlay(entityType, entityId) {
    try {
      const res = await fetch('/api/v1/public/playback/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entityType, entityId })
      });
      const data = await res.json();
      if (data.success) {
        currentSessionId = data.playbackSessionId;
        currentEntityType = entityType;
        currentEntityId = entityId;

        titleEl.textContent = data.title;
        artistEl.textContent = data.artistName;
        coverImg.src = data.coverUrl || '/images/default-cover.png';
        
        coverImg.classList.remove('hidden');
        infoContainer.classList.remove('hidden');

        audio.src = data.audioUrl;
        audio.play();
        updatePlayPauseIcon(true);
      } else {
        alert('Cannot play this item. It might be unavailable or missing audio.');
      }
    } catch (e) {
      console.error(e);
      alert('Error starting playback');
    }
  }

  function updatePlayPauseIcon(isPlaying) {
    if (isPlaying) {
      btnPlayPause.innerHTML = `<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>`;
    } else {
      btnPlayPause.innerHTML = `<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>`;
    }
  }

  btnPlayPause.addEventListener('click', () => {
    if (!audio.src) return;
    if (audio.paused) {
      audio.play();
    } else {
      audio.pause();
    }
  });

  audio.addEventListener('play', () => updatePlayPauseIcon(true));
  audio.addEventListener('pause', () => updatePlayPauseIcon(false));

  audio.addEventListener('timeupdate', () => {
    timeCurrent.textContent = formatTime(audio.currentTime);
    if (audio.duration) {
      progressBar.style.width = `${(audio.currentTime / audio.duration) * 100}%`;
    }
  });

  audio.addEventListener('loadedmetadata', () => {
    timeTotal.textContent = formatTime(audio.duration);
  });

  audio.addEventListener('ended', async () => {
    updatePlayPauseIcon(false);
    if (currentSessionId && currentEntityType && currentEntityId) {
      try {
        await fetch('/api/v1/public/playback/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            playbackSessionId: currentSessionId,
            entityType: currentEntityType,
            entityId: currentEntityId
          })
        });
      } catch (e) {
        console.error('Error sending completion event', e);
      }
    }
  });

  return {
    playTrack: (id) => loadAndPlay('track', id),
    playEpisode: (id) => loadAndPlay('episode', id)
  };
})();
