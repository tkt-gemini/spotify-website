document.addEventListener('DOMContentLoaded', () => {
  const mainContentArea = document.getElementById('main-content-area');

  // SPA Navigation
  document.body.addEventListener('click', async (e) => {
    // 1. Handle Navigation Links
    const link = e.target.closest('a.nav-item');
    if (link) {
      e.preventDefault();
      const url = link.getAttribute('href');
      if (url === '#') return;
      
      try {
        // Push state
        window.history.pushState(null, '', url);
        
        // Fetch new content with ajax param
        const fetchUrl = url + (url.includes('?') ? '&' : '?') + 'ajax=1';
        const response = await fetch(fetchUrl);
        
        if (response.ok) {
          const html = await response.text();
          mainContentArea.innerHTML = html;
          mainContentArea.scrollTop = 0;
          updateActiveNavStates(url);
          if (window.updatePlayButtonsState) window.updatePlayButtonsState();
          if (window.loadTrackDurations) window.loadTrackDurations();
        }
      } catch (err) {
        console.error('Navigation failed:', err);
      }
    }
  });

  // Handle Browser Back/Forward
  window.addEventListener('popstate', async () => {
    const url = window.location.pathname + window.location.search;
    try {
      const fetchUrl = url + (url.includes('?') ? '&' : '?') + 'ajax=1';
      const response = await fetch(fetchUrl);
      if (response.ok) {
        const html = await response.text();
        mainContentArea.innerHTML = html;
        mainContentArea.scrollTop = 0;
        updateActiveNavStates(url);
        if (window.updatePlayButtonsState) window.updatePlayButtonsState();
        if (window.loadTrackDurations) window.loadTrackDurations();
      }
    } catch (err) {
      console.error('Popstate navigation failed:', err);
    }
  });

  function updateActiveNavStates(url) {
    document.querySelectorAll('a.nav-item').forEach(link => {
      // Basic state update for left sidebar
      if (link.closest('nav')) {
        link.classList.remove('text-white');
        link.classList.add('text-spotify-subdued');
        if (link.getAttribute('href') === url) {
          link.classList.add('text-white');
          link.classList.remove('text-spotify-subdued');
        }
      }
    });
  };
    


  // Initial setup for search bar
  updateActiveNavStates(window.location.pathname);

  // Top bar background transition on scroll
  mainContentArea.addEventListener('scroll', () => {
    const topBar = document.getElementById('top-bar-header');
    if (topBar) {
      if (mainContentArea.scrollTop > 50) {
        topBar.classList.remove('bg-transparent');
        topBar.classList.add('bg-spotify-black/90', 'backdrop-blur-md');
      } else {
        topBar.classList.add('bg-transparent');
        topBar.classList.remove('bg-spotify-black/90', 'backdrop-blur-md');
      }
    }
  });
});