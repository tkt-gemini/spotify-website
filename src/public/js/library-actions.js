// library-actions.js

document.addEventListener('click', async (e) => {
  // --- LIKE TRACK ---
  const likeBtn = e.target.closest('.js-like-track');
  if (likeBtn) {
    const trackId = likeBtn.dataset.trackId;
    const isLiked = likeBtn.dataset.liked === 'true';
    const method = isLiked ? 'DELETE' : 'POST';
    const originalContent = likeBtn.innerHTML;

    try {
      const res = await fetch(`/api/v1/me/library/tracks/${trackId}`, {
        method,
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      
      if (res.ok && data.success) {
        likeBtn.dataset.liked = isLiked ? 'false' : 'true';
        if (isLiked) {
          likeBtn.innerHTML = `<svg class="w-5 h-5 fill-none stroke-current stroke-2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg>`;
        } else {
          likeBtn.innerHTML = `<svg class="w-5 h-5 text-green-500 fill-current" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg>`;
        }
      } else {
        alert('Could not update library.');
      }
    } catch (err) {
      console.error(err);
      alert('Network error.');
    }
  }

  // --- FOLLOW ARTIST ---
  const followBtn = e.target.closest('.js-follow-artist');
  if (followBtn) {
    const artistId = followBtn.dataset.artistId;
    const isFollowed = followBtn.dataset.followed === 'true';
    const method = isFollowed ? 'DELETE' : 'POST';

    try {
      const res = await fetch(`/api/v1/me/follow/artists/${artistId}`, {
        method,
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      
      if (res.ok && data.success) {
        followBtn.dataset.followed = isFollowed ? 'false' : 'true';
        if (isFollowed) {
          followBtn.textContent = 'Follow';
          followBtn.className = 'js-follow-artist w-full py-2 rounded-full text-sm font-bold border transition-colors border-white text-white hover:scale-105';
        } else {
          followBtn.textContent = 'Following';
          followBtn.className = 'js-follow-artist w-full py-2 rounded-full text-sm font-bold border transition-colors border-zinc-500 text-white hover:border-white';
        }
      } else {
        alert('Could not follow artist.');
      }
    } catch (err) {
      console.error(err);
      alert('Network error.');
    }
  }

  // --- ADD TO PLAYLIST ---
  const addTrackBtn = e.target.closest('.js-add-playlist-track');
  if (addTrackBtn) {
    const playlistId = addTrackBtn.dataset.playlistId;
    const trackId = addTrackBtn.dataset.trackId;

    try {
      const res = await fetch(`/api/v1/playlists/${playlistId}/tracks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trackId })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        location.reload(); // Reload to show added track in list
      } else {
        alert(data.error || 'Could not add track.');
      }
    } catch (err) {
      console.error(err);
      alert('Network error.');
    }
  }

  // --- REMOVE FROM PLAYLIST ---
  const removeTrackBtn = e.target.closest('.js-remove-playlist-track');
  if (removeTrackBtn) {
    const playlistId = removeTrackBtn.dataset.playlistId;
    const playlistTrackId = removeTrackBtn.dataset.playlistTrackId;

    try {
      const res = await fetch(`/api/v1/playlists/${playlistId}/tracks/${playlistTrackId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        location.reload(); // Reload to remove track from list
      } else {
        alert(data.error || 'Could not remove track.');
      }
    } catch (err) {
      console.error(err);
      alert('Network error.');
    }
  }

  // --- SAVE/UNSAVE ALBUM ---
  const saveAlbumBtn = e.target.closest('.js-save-album-btn');
  if (saveAlbumBtn) {
    const albumId = saveAlbumBtn.dataset.albumId;
    const isSaved = saveAlbumBtn.dataset.saved === 'true';
    const method = isSaved ? 'DELETE' : 'POST';

    try {
      const res = await fetch(`/api/v1/me/library/albums/${albumId}`, {
        method,
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      
      if (res.ok && data.success) {
        saveAlbumBtn.dataset.saved = isSaved ? 'false' : 'true';
        if (isSaved) {
          saveAlbumBtn.innerHTML = `<svg class="w-9 h-9 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg>`;
        } else {
          saveAlbumBtn.innerHTML = `<svg class="w-9 h-9 text-green-500 fill-current" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg>`;
        }
      } else {
        alert('Could not update library.');
      }
    } catch (err) {
      console.error(err);
      alert('Network error.');
    }
  }

  // --- SUBSCRIBE/UNSUBSCRIBE SHOW ---
  const subscribeShowBtn = e.target.closest('.js-subscribe-show-btn');
  if (subscribeShowBtn) {
    const showId = subscribeShowBtn.dataset.showId;
    const isSubscribed = subscribeShowBtn.dataset.subscribed === 'true';
    const method = isSubscribed ? 'DELETE' : 'POST';

    try {
      const res = await fetch(`/api/v1/me/subscribe/shows/${showId}`, {
        method,
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      
      if (res.ok && data.success) {
        subscribeShowBtn.dataset.subscribed = isSubscribed ? 'false' : 'true';
        if (isSubscribed) {
          subscribeShowBtn.textContent = 'Follow';
          subscribeShowBtn.className = 'js-subscribe-show-btn border border-zinc-500 text-zinc-300 px-4 py-1.5 rounded-full text-sm font-bold hover:border-white hover:scale-105 transition-all';
        } else {
          subscribeShowBtn.textContent = 'Following';
          subscribeShowBtn.className = 'js-subscribe-show-btn border border-white text-white px-4 py-1.5 rounded-full text-sm font-bold hover:border-white hover:scale-105 transition-all';
        }
      } else {
        alert('Could not update subscription.');
      }
    } catch (err) {
      console.error(err);
      alert('Network error.');
    }
  }

  // Handle new follow artist button classes
  const followArtistBtnNew = e.target.closest('.js-follow-artist-btn');
  if (followArtistBtnNew) {
    const artistId = followArtistBtnNew.dataset.artistId;
    const isFollowed = followArtistBtnNew.dataset.followed === 'true';
    const method = isFollowed ? 'DELETE' : 'POST';

    try {
      const res = await fetch(`/api/v1/me/follow/artists/${artistId}`, {
        method,
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      
      if (res.ok && data.success) {
        followArtistBtnNew.dataset.followed = isFollowed ? 'false' : 'true';
        if (isFollowed) {
          followArtistBtnNew.textContent = 'Follow';
          followArtistBtnNew.className = 'js-follow-artist-btn border border-zinc-500 text-zinc-300 px-4 py-1.5 rounded-full text-sm font-bold hover:border-white hover:scale-105 transition-all';
        } else {
          followArtistBtnNew.textContent = 'Following';
          followArtistBtnNew.className = 'js-follow-artist-btn border border-white text-white px-4 py-1.5 rounded-full text-sm font-bold hover:border-white hover:scale-105 transition-all';
        }
      } else {
        alert('Could not follow artist.');
      }
    } catch (err) {
      console.error(err);
      alert('Network error.');
    }
  }
});
