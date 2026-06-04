document.addEventListener('DOMContentLoaded', () => {
  if (!document.getElementById('admin-stat-users')) return;

  // Tabs logic
  const tabBtns = document.querySelectorAll('.admin-tab-btn');
  const tabContents = document.querySelectorAll('.admin-tab-content');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      // Deactivate all
      tabBtns.forEach(b => {
        b.classList.remove('text-white', 'border-spotify-green');
        b.classList.add('text-spotify-subdued', 'border-transparent');
      });
      tabContents.forEach(c => c.classList.add('hidden'));

      // Activate clicked
      btn.classList.remove('text-spotify-subdued', 'border-transparent');
      btn.classList.add('text-white', 'border-spotify-green');
      document.getElementById(`admin-tab-${btn.getAttribute('data-tab')}`).classList.remove('hidden');
    });
  });

  // Fetch stats
  fetch('/admin/api/stats')
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        document.getElementById('admin-stat-users').textContent = data.stats.totalUsers;
        document.getElementById('admin-stat-tracks').textContent = data.stats.totalTracks;
        document.getElementById('admin-stat-playlists').textContent = data.stats.totalPlaylists;
      }
    })
    .catch(console.error);

  // Fetch users
  function loadUsers() {
    fetch('/admin/api/users')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          const tbody = document.getElementById('admin-users-tbody');
          tbody.innerHTML = '';
          data.users.forEach(u => {
            const tr = document.createElement('tr');
            tr.className = 'border-b border-white/5 hover:bg-white/5 transition-colors';
            
            const renderCheckbox = (role, val) => `
              <label class="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" value="" class="sr-only peer" ${val ? 'checked' : ''} onchange="window.adminUpdateRole(${u.id}, '${role}', this.checked)">
                <div class="w-9 h-5 bg-spotify-elevated-hover peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-spotify-green"></div>
              </label>
            `;

            tr.innerHTML = `
              <td class="p-4 text-spotify-subdued">${u.id}</td>
              <td class="p-4 font-medium text-white">${u.username}</td>
              <td class="p-4 text-spotify-subdued">${u.email || '-'}</td>
              <td class="p-4">${renderCheckbox('isAdmin', u.isAdmin)}</td>
              <td class="p-4">${renderCheckbox('isArtist', u.isArtist)}</td>
              <td class="p-4">${renderCheckbox('isPodcaster', u.isPodcaster)}</td>
              <td class="p-4">
                <button onclick="window.adminDeleteUser(${u.id})" class="text-red-500 hover:text-red-400 p-2 hover:bg-red-500/10 rounded-full transition-colors" title="Delete User">
                  <i class="ph ph-trash text-lg"></i>
                </button>
              </td>
            `;
            tbody.appendChild(tr);
          });
        }
      })
      .catch(console.error);
  }

  // Fetch tracks
  function loadTracks() {
    fetch('/admin/api/tracks')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          const tbody = document.getElementById('admin-tracks-tbody');
          tbody.innerHTML = '';
          data.tracks.forEach(t => {
            const tr = document.createElement('tr');
            tr.className = 'border-b border-white/5 hover:bg-white/5 transition-colors';
            tr.innerHTML = `
              <td class="p-4 text-spotify-subdued truncate max-w-[100px]" title="${t.id}">${t.id.substring(0,8)}...</td>
              <td class="p-4 font-medium text-white">${t.title}</td>
              <td class="p-4 text-spotify-subdued">${t.artist}</td>
              <td class="p-4 text-spotify-subdued uppercase text-xs tracking-wider">${t.type || 'song'}</td>
              <td class="p-4 text-spotify-subdued">${t.playCount || 0}</td>
              <td class="p-4">
                <button onclick="window.adminDeleteTrack('${t.id}')" class="text-red-500 hover:text-red-400 p-2 hover:bg-red-500/10 rounded-full transition-colors" title="Delete Track">
                  <i class="ph ph-trash text-lg"></i>
                </button>
              </td>
            `;
            tbody.appendChild(tr);
          });
        }
      })
      .catch(console.error);
  }

  loadUsers();
  loadTracks();

  window.adminUpdateRole = function(userId, role, value) {
    fetch(`/admin/api/users/${userId}/role`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role, value })
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        window.showToast(`Updated ${role} successfully`);
      } else {
        window.showToast(data.error || 'Failed to update role');
        loadUsers(); // revert
      }
    })
    .catch(() => {
      window.showToast('Network error');
      loadUsers(); // revert
    });
  };

  window.adminDeleteUser = function(userId) {
    if (!confirm('Are you sure you want to delete this user? This cannot be undone.')) return;
    fetch(`/admin/api/users/${userId}`, { method: 'DELETE' })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          window.showToast('User deleted');
          loadUsers();
        } else {
          window.showToast(data.error || 'Failed to delete user');
        }
      })
      .catch(() => window.showToast('Network error'));
  };

  window.adminDeleteTrack = function(trackId) {
    if (!confirm('Are you sure you want to delete this track? This cannot be undone.')) return;
    fetch(`/admin/api/tracks/${trackId}`, { method: 'DELETE' })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          window.showToast('Track deleted');
          loadTracks();
        } else {
          window.showToast(data.error || 'Failed to delete track');
        }
      })
      .catch(() => window.showToast('Network error'));
  };
});
