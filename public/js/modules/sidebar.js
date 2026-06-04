document.addEventListener('DOMContentLoaded', () => {
  // --- SIDEBAR RESIZE LOGIC ---
  const sidebarResizer = document.getElementById('sidebar-resizer');
  const appGrid = document.querySelector('.spotify-app-grid');
  const navBar = document.querySelector('nav.\\[grid-area\\:nav-bar\\]');
  const toggleLibraryBtn = document.getElementById('toggle-library-btn');
  
  if (sidebarResizer && appGrid && navBar) {
    let isResizing = false;
    let lastExpandedWidth = 280;

    // Load preferred width
    const savedWidth = localStorage.getItem('spotify-sidebar-width');
    if (savedWidth) {
      const widthNum = parseInt(savedWidth, 10);
      if (widthNum >= 250) {
        lastExpandedWidth = widthNum;
      }
      if (widthNum < 250) {
        navBar.classList.add('is-collapsed');
        appGrid.style.gridTemplateColumns = `72px 1fr auto`;
      } else {
        navBar.classList.remove('is-collapsed');
        appGrid.style.gridTemplateColumns = `${widthNum}px 1fr auto`;
      }
    }

    sidebarResizer.addEventListener('mousedown', (e) => {
      isResizing = true;
      document.body.style.cursor = 'col-resize';
      // Disable text selection while dragging
      document.body.style.userSelect = 'none';
    });

    document.addEventListener('mousemove', (e) => {
      if (!isResizing) return;
      
      let newWidth = e.clientX;
      
      // Limit max width
      if (newWidth > 600) newWidth = 600;
      
      if (newWidth < 250) {
        // Snap to collapsed state
        navBar.classList.add('is-collapsed');
        appGrid.style.gridTemplateColumns = `72px 1fr auto`;
      } else {
        // Expand state
        navBar.classList.remove('is-collapsed');
        appGrid.style.gridTemplateColumns = `${newWidth}px 1fr auto`;
      }
    });

    document.addEventListener('mouseup', (e) => {
      if (isResizing) {
        isResizing = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        
        let finalWidth = e.clientX;
        if (finalWidth > 600) finalWidth = 600;
        
        if (finalWidth < 250) {
           localStorage.setItem('spotify-sidebar-width', '72');
        } else {
           lastExpandedWidth = finalWidth;
           localStorage.setItem('spotify-sidebar-width', finalWidth.toString());
        }
      }
    });

    if (toggleLibraryBtn) {
      toggleLibraryBtn.addEventListener('click', () => {
        if (navBar.classList.contains('is-collapsed')) {
          // Expand
          navBar.classList.remove('is-collapsed');
          appGrid.style.gridTemplateColumns = `${lastExpandedWidth}px 1fr auto`;
          localStorage.setItem('spotify-sidebar-width', lastExpandedWidth.toString());
        } else {
          // Collapse
          navBar.classList.add('is-collapsed');
          appGrid.style.gridTemplateColumns = `72px 1fr auto`;
          localStorage.setItem('spotify-sidebar-width', '72');
        }
      });
    }
  }

  // --- RIGHT SIDEBAR RESIZE LOGIC ---
  const rightSidebarResizer = document.getElementById('right-sidebar-resizer');
  const rightSidebar = document.getElementById('right-sidebar');
  
  if (rightSidebarResizer && rightSidebar && appGrid) {
    let isResizingRight = false;
    let lastExpandedRightWidth = 280;

    const savedRightWidth = localStorage.getItem('spotify-right-sidebar-width');
    if (savedRightWidth) {
      const widthNum = parseInt(savedRightWidth, 10);
      if (widthNum >= 250 && widthNum <= 600) {
        lastExpandedRightWidth = widthNum;
        rightSidebar.style.width = `${widthNum}px`;
        rightSidebar.classList.remove('is-collapsed');
      } else if (widthNum === 40) {
        rightSidebar.style.width = `40px`;
        rightSidebar.classList.add('is-collapsed');
      }
    }

    rightSidebarResizer.addEventListener('mousedown', (e) => {
      isResizingRight = true;
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    });

    document.addEventListener('mousemove', (e) => {
      if (!isResizingRight) return;
      
      // Calculate width from the right edge of the screen
      let newWidth = window.innerWidth - e.clientX;
      
      if (newWidth > 600) newWidth = 600;
      
      if (newWidth < 150) {
        // Snap to collapsed state if dragged very small
        rightSidebar.classList.add('is-collapsed');
        rightSidebar.style.width = '40px';
      } else {
        // Expand state
        rightSidebar.classList.remove('is-collapsed');
        // Enforce minimum expanded width of 280px
        if (newWidth < 280) newWidth = 280;
        rightSidebar.style.width = `${newWidth}px`;
      }
    });

    document.addEventListener('mouseup', (e) => {
      if (isResizingRight) {
        isResizingRight = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        
        let finalWidth = window.innerWidth - e.clientX;
        if (finalWidth > 600) finalWidth = 600;
        
        if (finalWidth < 150) {
          localStorage.setItem('spotify-right-sidebar-width', '40');
        } else {
          if (finalWidth < 280) finalWidth = 280;
          lastExpandedRightWidth = finalWidth;
          localStorage.setItem('spotify-right-sidebar-width', finalWidth.toString());
        }
      }
    });

    // Close button logic
    const closeRightSidebarBtn = document.getElementById('close-right-sidebar');
    const closeQueueSidebarBtn = document.getElementById('close-queue-sidebar');
    if (closeRightSidebarBtn) {
      closeRightSidebarBtn.addEventListener('click', () => {
        rightSidebar.classList.add('is-collapsed');
        rightSidebar.style.width = '40px';
        localStorage.setItem('spotify-right-sidebar-width', '40');
      });
    }
    if (closeQueueSidebarBtn) {
      closeQueueSidebarBtn.addEventListener('click', () => {
        const queueBtn = document.querySelector('#queue-btn');
        if (queueBtn && queueBtn.classList.contains('text-spotify-green')) {
          queueBtn.click();
        }
      });
    }

    // Expand button logic (when collapsed)
    const rightSidebarCollapsedBtn = document.getElementById('right-sidebar-collapsed-btn');
    if (rightSidebarCollapsedBtn) {
      rightSidebarCollapsedBtn.addEventListener('click', () => {
        rightSidebar.classList.remove('is-collapsed');
        rightSidebar.style.width = `${lastExpandedRightWidth}px`;
        localStorage.setItem('spotify-right-sidebar-width', lastExpandedRightWidth.toString());
      });
    }
  }

});
