// player.js
const audio = document.getElementById('global-audio-player');
const playBtn = document.getElementById('player-play-btn');
const iconPlay = document.getElementById('icon-play');
const iconPause = document.getElementById('icon-pause');
const timeCurrent = document.getElementById('player-time-current');
const timeTotal = document.getElementById('player-time-total');
const progressBar = document.getElementById('player-progress-bar');
const progressFill = document.getElementById('player-progress-fill');
const playerTitle = document.getElementById('player-title');
const playerArtist = document.getElementById('player-artist');
const playerCoverContainer = document.getElementById('player-cover-container');

// Playback session state
let currentSessionId = null;
let currentEntityType = null;
let currentEntityId = null;
let progressInterval = null;

// Format time utility (seconds to m:ss)
function formatTime(seconds) {
  if (isNaN(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// Update play/pause icons
function updatePlayPauseIcons() {
  if (audio.paused) {
    iconPlay.classList.remove('hidden');
    iconPause.classList.add('hidden');
  } else {
    iconPlay.classList.add('hidden');
    iconPause.classList.remove('hidden');
  }
}

// Audio Event Listeners
audio.addEventListener('play', () => {
  updatePlayPauseIcons();
  startProgressReporting();
});
audio.addEventListener('pause', () => {
  updatePlayPauseIcons();
  stopProgressReporting();
});
audio.addEventListener('ended', async () => {
  updatePlayPauseIcons();
  stopProgressReporting();
  if (currentSessionId && currentEntityType && currentEntityId) {
    try {
      await fetch('/api/v1/playback/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playbackSessionId: currentSessionId,
          entityType: currentEntityType,
          entityId: currentEntityId
        })
      });
    } catch (err) {
      console.error('Failed to report completion:', err);
    }
  }
});

function startProgressReporting() {
  if (progressInterval) clearInterval(progressInterval);
  // Report progress every 15 seconds
  progressInterval = setInterval(async () => {
    if (currentSessionId && currentEntityType && currentEntityId && !audio.paused) {
      try {
        await fetch('/api/v1/playback/progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            playbackSessionId: currentSessionId,
            entityType: currentEntityType,
            entityId: currentEntityId,
            positionMs: Math.floor(audio.currentTime * 1000)
          })
        });
      } catch (err) {
        console.error('Failed to report progress:', err);
      }
    }
  }, 15000);
}

function stopProgressReporting() {
  if (progressInterval) {
    clearInterval(progressInterval);
    progressInterval = null;
  }
}

audio.addEventListener('timeupdate', () => {
  timeCurrent.textContent = formatTime(audio.currentTime);
  const percent = (audio.currentTime / audio.duration) * 100 || 0;
  progressFill.style.width = `${percent}%`;
});

audio.addEventListener('loadedmetadata', () => {
  timeTotal.textContent = formatTime(audio.duration);
});

// Progress Bar Click
progressBar.addEventListener('click', (e) => {
  if (!audio.duration) return;
  const rect = progressBar.getBoundingClientRect();
  const clickX = e.clientX - rect.left;
  const percent = clickX / rect.width;
  audio.currentTime = percent * audio.duration;
});

// Play/Pause Button
playBtn.addEventListener('click', () => {
  if (!audio.src) return;
  if (audio.paused) {
    audio.play().catch(console.error);
  } else {
    audio.pause();
  }
});

// Play Entity Logic
document.addEventListener('click', async (e) => {
  const playEntityBtn = e.target.closest('.js-play-entity');
  if (!playEntityBtn) return;
  
  const entityType = playEntityBtn.dataset.entityType;
  const entityId = playEntityBtn.dataset.entityId;

  if (!entityType || !entityId) return;

  try {
    const res = await fetch('/api/v1/playback/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entityType, entityId })
    });
    
    const data = await res.json();
    if (!res.ok || !data.success) {
      alert(data.error || 'Failed to play track');
      return;
    }

    // Update Player UI
    playerTitle.textContent = data.title;
    playerArtist.textContent = data.artistName || 'Unknown Artist';
    
    if (data.coverUrl) {
      playerCoverContainer.innerHTML = `<img src="${data.coverUrl}" class="w-full h-full object-cover" alt="Cover">`;
    }

    // Store session state
    currentSessionId = data.playbackSessionId;
    currentEntityType = entityType;
    currentEntityId = entityId;

    // Load Audio and Play
    audio.src = data.audioUrl;
    playBtn.disabled = false;
    
    audio.play().catch(err => {
      console.error('Audio play failed:', err);
      alert('Browser blocked autoplay. Please click play on the player.');
    });

  } catch (err) {
    console.error('Playback API error:', err);
    alert('An error occurred while trying to play.');
  }
});
