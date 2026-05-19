document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initPlayer();
});

// --- SEAMLESS NAVIGATION ---
function initNavigation() {
  document.body.addEventListener('click', e => {
    // Intercept link clicks
    const link = e.target.closest('a');
    if (link && link.origin === window.location.origin) {
      if(link.getAttribute('href').startsWith('/switch-role') || link.getAttribute('href').startsWith('/api')) {
         return; // Let standard navigation handle these
      }
      e.preventDefault();
      navigateTo(link.pathname + link.search);
    }
  });

  window.addEventListener('popstate', () => {
    navigateTo(window.location.pathname + window.location.search, false);
  });
}

async function navigateTo(url, pushState = true) {
  try {
    const response = await fetch(url, {
      headers: { 'X-Requested-With': 'XMLHttpRequest' }
    });
    
    if (response.ok) {
      const html = await response.text();
      document.getElementById('central-content').innerHTML = html;
      
      if (pushState) {
        window.history.pushState(null, '', url);
      }

      // Re-bind dynamic events for new content
      bindDynamicEvents();

      // Update active nav state
      const pathname = url.split('?')[0];
      document.querySelectorAll('.nav-link').forEach(nav => {
        nav.classList.remove('active');
        if (nav.getAttribute('href') === pathname) {
          nav.classList.add('active');
        }
      });

      // Toggle search bar visibility based on URL
      const searchContainer = document.querySelector('.search-container');
      if (pathname === '/search') {
        searchContainer.style.display = 'block';
      } else {
        searchContainer.style.display = 'none';
      }

    } else {
      console.error('Failed to load page', response.status);
    }
  } catch (err) {
    console.error('Error navigating:', err);
  }
}

function bindDynamicEvents() {
  document.querySelectorAll('.track-card').forEach(card => {
    const playBtn = card.querySelector('.play-btn-overlay');
    playBtn.onclick = (e) => {
      e.stopPropagation();
      playTrack(card.dataset.trackId, card);
    };
  });
}

// --- AUDIO PLAYER ---
let currentTrackId = null;
let playTimeSeconds = 0;
let playTrackingInterval = null;
let playTracked = false;
const audio = document.getElementById('audio-element');

function initPlayer() {
  bindDynamicEvents();

  const playPauseBtn = document.getElementById('play-pause-btn');
  playPauseBtn.addEventListener('click', togglePlayPause);

  const progressBarWrapper = document.getElementById('progress-bar-wrapper');
  progressBarWrapper.addEventListener('click', (e) => {
    if (!audio.src) return;
    const rect = progressBarWrapper.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    audio.currentTime = percent * audio.duration;
  });

  const volumeBarWrapper = document.getElementById('volume-bar-wrapper');
  volumeBarWrapper.addEventListener('click', (e) => {
    const rect = volumeBarWrapper.getBoundingClientRect();
    let percent = (e.clientX - rect.left) / rect.width;
    percent = Math.max(0, Math.min(1, percent));
    audio.volume = percent;
    document.getElementById('volume-bar').style.width = (percent * 100) + '%';
  });

  audio.addEventListener('timeupdate', updateProgress);
  audio.addEventListener('ended', () => {
    document.getElementById('play-pause-btn').innerHTML = '<i class="fas fa-play-circle"></i>';
    clearInterval(playTrackingInterval);
  });
  
  audio.addEventListener('play', () => {
    document.getElementById('play-pause-btn').innerHTML = '<i class="fas fa-pause-circle"></i>';
    startTrackingPlay();
  });
  
  audio.addEventListener('pause', () => {
    document.getElementById('play-pause-btn').innerHTML = '<i class="fas fa-play-circle"></i>';
    clearInterval(playTrackingInterval);
  });
}

async function playTrack(trackId, cardElement) {
  if (currentTrackId === trackId) {
    togglePlayPause();
    return;
  }

  const title = cardElement.querySelector('h4').innerText;
  const artist = cardElement.querySelector('p').innerText;
  const coverUrl = cardElement.querySelector('img').src;

  // Optimistically update UI
  document.getElementById('player-title').innerText = title;
  document.getElementById('player-artist').innerText = artist;
  document.getElementById('player-cover').src = coverUrl;

  // Update Right Panel Context
  document.getElementById('context-title').innerText = title;
  document.getElementById('context-artist').innerText = artist;
  document.getElementById('context-cover').src = coverUrl;

  try {
    // Attempt to stream via the API
    const streamUrl = `/api/stream/${trackId}`;
    
    // Check if accessible before setting audio src
    const res = await fetch(streamUrl, { method: 'HEAD' });
    if (res.status === 403) {
      showToast('Premium Content. Please upgrade to play this track.');
      return;
    }

    currentTrackId = trackId;
    audio.src = streamUrl;
    audio.play();

    // Reset tracking logic
    playTimeSeconds = 0;
    playTracked = false;
    clearInterval(playTrackingInterval);

  } catch (err) {
    console.error('Error playing track:', err);
  }
}

function togglePlayPause() {
  if (!audio.src) return;
  if (audio.paused) {
    audio.play();
  } else {
    audio.pause();
  }
}

function updateProgress() {
  const currentSpan = document.getElementById('time-current');
  const totalSpan = document.getElementById('time-total');
  const bar = document.getElementById('progress-bar');

  if (audio.duration) {
    const percent = (audio.currentTime / audio.duration) * 100;
    bar.style.width = `${percent}%`;
    currentSpan.innerText = formatTime(audio.currentTime);
    totalSpan.innerText = formatTime(audio.duration);
  }
}

function formatTime(seconds) {
  if (isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

// --- TRACKING LOGIC ---
function startTrackingPlay() {
  if (playTracked) return;
  clearInterval(playTrackingInterval);
  playTrackingInterval = setInterval(() => {
    playTimeSeconds++;
    if (playTimeSeconds >= 30 && !playTracked) {
      recordPlay(currentTrackId);
      playTracked = true;
      clearInterval(playTrackingInterval);
    }
  }, 1000);
}

function recordPlay(trackId) {
  fetch(`/api/track-play/${trackId}`, { method: 'POST' })
    .then(res => res.json())
    .then(data => {
      console.log('Play recorded. New count:', data.newCount);
    })
    .catch(err => console.error('Error recording play:', err));
}

// --- UTILS ---
function showToast(message) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerText = message;
  container.appendChild(toast);
  
  // Trigger reflow
  toast.offsetHeight;
  toast.classList.add('show');

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}
