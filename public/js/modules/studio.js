/**
 * studio.js — Frontend module for Artist Studio & Creator Studio
 * All DOM operations use textContent / createElement (no innerHTML).
 */
document.addEventListener('DOMContentLoaded', () => {

  // ─── UTILITIES ──────────────────────────────────────────────────────────────

  /** Show a toast using the global showToast from modals.js */
  const toast = (msg) => window.showToast && window.showToast(msg);

  /** Open a modal */
  const openModal = (id) => document.getElementById(id)?.classList.remove('hidden');

  /** Close a modal */
  const closeModal = (id) => document.getElementById(id)?.classList.add('hidden');

  /** Read text value of an input */
  const val = (id) => (document.getElementById(id)?.value || '').trim();

  /** Set text content of element */
  const setText = (id, text) => {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  };

  /** Toggle disabled state and label on a button */
  const setLoading = (btn, loading, label) => {
    if (!btn) return;
    btn.disabled = loading;
    btn.textContent = loading ? 'Saving...' : label;
  };

  // ─── STUDIO HUB — Role registration ─────────────────────────────────────────

  window.studioRegisterArtist = async function () {
    try {
      const res = await fetch('/api/user/register-artist', { method: 'POST' });
      if (res.ok) {
        window.location.href = '/studio/artist';
      } else {
        toast('Failed to register as artist');
      }
    } catch (e) {
      toast('Network error');
    }
  };

  window.studioRegisterPodcaster = async function () {
    try {
      const res = await fetch('/api/user/register-podcaster', { method: 'POST' });
      if (res.ok) {
        window.location.href = '/studio/creator';
      } else {
        toast('Failed to register as podcaster');
      }
    } catch (e) {
      toast('Network error');
    }
  };

  // ─── ARTIST STUDIO ────────────────────────────────────────────────────────────

  // Bio character counter
  const bioInput = document.getElementById('sa-bio-input');
  const bioCount = document.getElementById('sa-bio-count');
  if (bioInput && bioCount) {
    bioInput.addEventListener('input', () => {
      bioCount.textContent = `${bioInput.value.length}/1000`;
    });
  }

  // Avatar area click → file input
  const avatarArea = document.getElementById('sa-avatar-area');
  const avatarInput = document.getElementById('sa-avatar-input');
  if (avatarArea && avatarInput) {
    avatarArea.addEventListener('click', () => avatarInput.click());
  }

  // Cover area click → file input
  const coverArea = document.getElementById('sa-cover-area');
  const coverInput = document.getElementById('sa-cover-input');
  if (coverArea && coverInput) {
    coverArea.addEventListener('click', () => coverInput.click());
  }

  // Preview avatar
  if (avatarInput) {
    avatarInput.addEventListener('change', () => {
      const file = avatarInput.files[0];
      if (!file) return;
      if (file.size > 5 * 1024 * 1024) { toast('Image too large (max 5MB)'); return; }
      const reader = new FileReader();
      reader.onload = (e) => {
        const preview = document.getElementById('sa-avatar-preview');
        const placeholder = document.getElementById('sa-avatar-placeholder');
        if (preview) { preview.src = e.target.result; preview.classList.remove('hidden'); }
        if (placeholder) placeholder.classList.add('hidden');
      };
      reader.readAsDataURL(file);
    });
  }

  // Preview cover
  if (coverInput) {
    coverInput.addEventListener('change', () => {
      const file = coverInput.files[0];
      if (!file) return;
      if (file.size > 5 * 1024 * 1024) { toast('Image too large (max 5MB)'); return; }
      const reader = new FileReader();
      reader.onload = (e) => {
        const preview = document.getElementById('sa-cover-preview');
        const placeholder = document.getElementById('sa-cover-placeholder');
        if (preview) { preview.src = e.target.result; preview.classList.remove('hidden'); }
        if (placeholder) placeholder.classList.add('hidden');
      };
      reader.readAsDataURL(file);
    });
  }

  // Save Artist Profile
  const saveBtn = document.getElementById('sa-save-btn');
  if (saveBtn) {
    saveBtn.addEventListener('click', async () => {
      const name = val('sa-name-input');
      if (!name) { toast('Artist name cannot be empty'); return; }

      const fd = new FormData();
      fd.append('name', name);
      const bio = document.getElementById('sa-bio-input')?.value || '';
      fd.append('bio', bio.slice(0, 1000));

      if (avatarInput?.files[0]) fd.append('avatar', avatarInput.files[0]);
      if (coverInput?.files[0]) fd.append('coverImage', coverInput.files[0]);

      setLoading(saveBtn, true, 'Save Profile');
      try {
        const res = await fetch('/api/studio/artist', { method: 'PUT', body: fd });
        const data = await res.json();
        if (data.success) {
          toast('Artist profile updated!');
          const newName = val('sa-name-input');
          const titleDisplay = document.getElementById('sa-title-display');
          if (titleDisplay) titleDisplay.textContent = newName;
          const viewLink = document.getElementById('sa-view-public-link');
          if (viewLink) viewLink.href = '/artist/' + encodeURIComponent(newName);
        } else {
          toast(data.error || 'Failed to update profile');
        }
      } catch (e) {
        toast('Network error');
      } finally {
        setLoading(saveBtn, false, 'Save Profile');
      }
    });
  }

  // ─── ARTIST TRACK UPLOAD ───────────────────────────────────────────────────

  let saSelectedAudioFile = null;

  function saResetTrackModal() {
    saSelectedAudioFile = null;
    document.getElementById('sa-track-modal-id').value = '';
    document.getElementById('sa-track-title-input').value = '';
    document.getElementById('sa-track-album-input').value = '';
    document.getElementById('sa-track-lyrics-input').value = '';
    setText('sa-track-audio-filename', 'Click to select audio file');
    const fileInput = document.getElementById('sa-track-audio-input');
    if (fileInput) fileInput.value = '';
    
    // Show audio dropzone by default
    const audioDrop = document.getElementById('sa-track-audio-drop');
    if (audioDrop) audioDrop.parentElement.classList.remove('hidden');
  }

  // Open Track modal for Upload
  ['sa-upload-track-btn', 'sa-upload-track-btn-empty'].forEach(id => {
    document.getElementById(id)?.addEventListener('click', () => {
      saResetTrackModal();
      setText('sa-track-modal-title', 'Upload Track');
      const saveBtn = document.getElementById('sa-track-modal-save');
      if (saveBtn) saveBtn.textContent = 'Upload Track';
      openModal('sa-track-modal');
    });
  });

  // Open Track modal for Edit
  document.addEventListener('click', (e) => {
    const editBtn = e.target.closest('.sa-edit-track-btn');
    if (editBtn) {
      saResetTrackModal();
      document.getElementById('sa-track-modal-id').value = editBtn.getAttribute('data-id');
      document.getElementById('sa-track-title-input').value = editBtn.getAttribute('data-title');
      document.getElementById('sa-track-album-input').value = editBtn.getAttribute('data-album') || '';
      document.getElementById('sa-track-lyrics-input').value = editBtn.getAttribute('data-lyrics') || '';
      
      // Hide audio upload in edit mode
      const audioDrop = document.getElementById('sa-track-audio-drop');
      if (audioDrop) audioDrop.parentElement.classList.add('hidden');

      setText('sa-track-modal-title', 'Edit Track');
      const saveBtn = document.getElementById('sa-track-modal-save');
      if (saveBtn) saveBtn.textContent = 'Save Changes';
      openModal('sa-track-modal');
    }
  });

  // Close Track modal
  ['sa-track-modal-close', 'sa-track-modal-cancel'].forEach(id => {
    document.getElementById(id)?.addEventListener('click', () => closeModal('sa-track-modal'));
  });

  // Audio drop zone
  const trackAudioDropZone = document.getElementById('sa-track-audio-drop');
  const trackAudioFileInput = document.getElementById('sa-track-audio-input');
  if (trackAudioDropZone && trackAudioFileInput) {
    trackAudioDropZone.addEventListener('click', () => trackAudioFileInput.click());
    trackAudioFileInput.addEventListener('change', () => {
      const file = trackAudioFileInput.files[0];
      if (!file) return;
      if (file.size > 50 * 1024 * 1024) { toast('Audio file too large (max 50MB)'); return; }
      saSelectedAudioFile = file;
      setText('sa-track-audio-filename', file.name);
    });
  }

  // Save/Upload Track
  const saTrackSaveBtn = document.getElementById('sa-track-modal-save');
  if (saTrackSaveBtn) {
    saTrackSaveBtn.addEventListener('click', async () => {
      const title = val('sa-track-title-input');
      const id = val('sa-track-modal-id');
      const isEdit = !!id;

      if (!title) { toast('Track title is required'); return; }
      if (!isEdit && !saSelectedAudioFile) { toast('Audio file is required'); return; }

      const fd = new FormData();
      fd.append('title', title);
      
      const albumId = val('sa-track-album-input');
      if (albumId || albumId === '') fd.append('albumId', albumId); // allow clearing album
      
      const lyrics = val('sa-track-lyrics-input');
      if (lyrics || lyrics === '') fd.append('lyrics', lyrics);

      const type = val('sa-track-type-input');
      if (type) fd.append('type', type);

      if (!isEdit && saSelectedAudioFile) {
        fd.append('audio', saSelectedAudioFile);
      }

      const url = isEdit ? `/api/studio/tracks/${id}` : '/api/studio/tracks';
      const method = isEdit ? 'PUT' : 'POST';

      setLoading(saTrackSaveBtn, true, isEdit ? 'Saving...' : 'Uploading...');
      try {
        const res = await fetch(url, { method, body: fd });
        const data = await res.json();
        if (data.success) {
          closeModal('sa-track-modal');
          toast(isEdit ? 'Track updated!' : 'Track uploaded successfully!');
          setTimeout(() => window.location.reload(), 600);
        } else {
          toast(data.error || 'Failed to save track');
        }
      } catch (e) {
        toast('Network error');
      } finally {
        setLoading(saTrackSaveBtn, false, isEdit ? 'Save Changes' : 'Upload Track');
      }
    });
  }

  // ─── ARTIST ALBUMS ───────────────────────────────────────────────────────────

  let saSelectedAlbumCoverFile = null;

  function saResetAlbumModal() {
    saSelectedAlbumCoverFile = null;
    document.getElementById('sa-album-modal-id').value = '';
    document.getElementById('sa-album-title-input').value = '';
    document.getElementById('sa-album-date-input').value = '';
    document.getElementById('sa-album-type-input').value = 'album';

    const preview = document.getElementById('sa-album-cover-preview');
    const placeholder = document.getElementById('sa-album-cover-placeholder');
    if (preview) { preview.src = ''; preview.classList.add('hidden'); }
    if (placeholder) placeholder.classList.remove('hidden');

    const fileInput = document.getElementById('sa-album-cover-input');
    if (fileInput) fileInput.value = '';

    const deleteBtn = document.getElementById('sa-album-delete-btn');
    if (deleteBtn) deleteBtn.classList.add('hidden');
  }

  // Open Create Album
  document.getElementById('sa-create-album-btn')?.addEventListener('click', () => {
    saResetAlbumModal();
    setText('sa-album-modal-title', 'Create Album');
    const saveBtn = document.getElementById('sa-album-modal-save');
    if (saveBtn) saveBtn.textContent = 'Create Album';
    openModal('sa-album-modal');
  });

  // Open Edit Album (Delegated to document for dynamic elements)
  document.addEventListener('click', (e) => {
    const editBtn = e.target.closest('.sa-edit-album-btn');
    if (editBtn) {
      saResetAlbumModal();
      document.getElementById('sa-album-modal-id').value = editBtn.getAttribute('data-id');
      document.getElementById('sa-album-title-input').value = editBtn.getAttribute('data-title');
      
      const dateVal = editBtn.getAttribute('data-date');
      if (dateVal) {
        document.getElementById('sa-album-date-input').value = new Date(dateVal).toISOString().split('T')[0];
      }
      document.getElementById('sa-album-type-input').value = editBtn.getAttribute('data-type') || 'album';

      const cover = editBtn.getAttribute('data-cover');
      if (cover) {
        const preview = document.getElementById('sa-album-cover-preview');
        const placeholder = document.getElementById('sa-album-cover-placeholder');
        if (preview) { preview.src = cover; preview.classList.remove('hidden'); }
        if (placeholder) placeholder.classList.add('hidden');
      }

      const deleteBtn = document.getElementById('sa-album-delete-btn');
      if (deleteBtn) deleteBtn.classList.remove('hidden');

      setText('sa-album-modal-title', 'Edit Album');
      const saveBtn = document.getElementById('sa-album-modal-save');
      if (saveBtn) saveBtn.textContent = 'Save Changes';
      openModal('sa-album-modal');
    }
  });

  // Album cover image file input
  const albumCoverArea = document.getElementById('sa-album-cover-area');
  const albumCoverInput = document.getElementById('sa-album-cover-input');
  if (albumCoverArea && albumCoverInput) {
    albumCoverArea.addEventListener('click', () => albumCoverInput.click());
    albumCoverInput.addEventListener('change', () => {
      const file = albumCoverInput.files[0];
      if (!file) return;
      if (file.size > 5 * 1024 * 1024) { toast('Image too large (max 5MB)'); return; }
      saSelectedAlbumCoverFile = file;
      const reader = new FileReader();
      reader.onload = (e) => {
        const preview = document.getElementById('sa-album-cover-preview');
        const placeholder = document.getElementById('sa-album-cover-placeholder');
        if (preview) { preview.src = e.target.result; preview.classList.remove('hidden'); }
        if (placeholder) placeholder.classList.add('hidden');
      };
      reader.readAsDataURL(file);
    });
  }

  // Save Album (Create or Update)
  const albumSaveBtn = document.getElementById('sa-album-modal-save');
  if (albumSaveBtn) {
    albumSaveBtn.addEventListener('click', async () => {
      const title = val('sa-album-title-input');
      if (!title) { toast('Album title is required'); return; }

      const id = val('sa-album-modal-id');
      const fd = new FormData();
      fd.append('title', title);
      fd.append('releaseDate', val('sa-album-date-input'));
      fd.append('type', val('sa-album-type-input'));
      if (saSelectedAlbumCoverFile) fd.append('cover', saSelectedAlbumCoverFile);

      const isEdit = !!id;
      const url = isEdit ? `/api/studio/albums/${id}` : '/api/studio/albums';
      const method = isEdit ? 'PUT' : 'POST';

      setLoading(albumSaveBtn, true, isEdit ? 'Save Changes' : 'Create Album');
      try {
        const res = await fetch(url, { method, body: fd });
        const data = await res.json();
        if (data.success) {
          closeModal('sa-album-modal');
          toast(isEdit ? 'Album updated!' : 'Album created!');
          setTimeout(() => window.location.reload(), 600);
        } else {
          toast(data.error || 'Failed to save album');
        }
      } catch (e) {
        toast('Network error');
      } finally {
        setLoading(albumSaveBtn, false, isEdit ? 'Save Changes' : 'Create Album');
      }
    });
  }

  // Delete Album
  const albumDeleteBtn = document.getElementById('sa-album-delete-btn');
  if (albumDeleteBtn) {
    albumDeleteBtn.addEventListener('click', async () => {
      const id = val('sa-album-modal-id');
      const title = val('sa-album-title-input');
      if (!confirm(`Delete album "${title}"? This cannot be undone. Tracks within the album will NOT be deleted, but they will be removed from the album.`)) return;
      
      try {
        const res = await fetch(`/api/studio/albums/${id}`, { method: 'DELETE' });
        if (res.ok) {
          toast('Album deleted');
          setTimeout(() => window.location.reload(), 600);
        } else {
          toast('Failed to delete album');
        }
      } catch (e) {
        toast('Network error');
      }
    });
  }

  // Close Album modal
  ['sa-album-modal-close', 'sa-album-modal-cancel'].forEach(id => {
    document.getElementById(id)?.addEventListener('click', () => closeModal('sa-album-modal'));
  });

  // ─── CREATOR STUDIO — SHOWS ──────────────────────────────────────────────────

  let csSelectedCoverFile = null;

  // Helper: reset Show modal fields
  function csResetShowModal() {
    csSelectedCoverFile = null;
    document.getElementById('cs-show-modal-id').value = '';
    document.getElementById('cs-show-title-input').value = '';
    document.getElementById('cs-show-description-input').value = '';
    document.getElementById('cs-show-category-input').value = '';
    document.getElementById('cs-show-language-input').value = 'en';
    document.getElementById('cs-show-explicit-input').checked = false;

    const preview = document.getElementById('cs-show-cover-preview');
    const placeholder = document.getElementById('cs-show-cover-placeholder');
    if (preview) { preview.src = ''; preview.classList.add('hidden'); }
    if (placeholder) placeholder.classList.remove('hidden');

    const fileInput = document.getElementById('cs-show-cover-input');
    if (fileInput) fileInput.value = '';
  }

  // Open Create Show modal
  function csOpenCreateShow() {
    csResetShowModal();
    setText('cs-show-modal-title', 'Create Podcast Show');
    const saveBtn = document.getElementById('cs-show-modal-save');
    if (saveBtn) saveBtn.textContent = 'Create Show';
    openModal('cs-show-modal');
  }

  // Open Edit Show modal
  window.csOpenEditShow = function (btn) {
    csResetShowModal();
    const id = btn.getAttribute('data-id');
    const title = btn.getAttribute('data-title');
    const description = btn.getAttribute('data-description') || '';
    const category = btn.getAttribute('data-category') || '';
    const language = btn.getAttribute('data-language') || 'en';
    const cover = btn.getAttribute('data-cover') || '';

    document.getElementById('cs-show-modal-id').value = id;
    document.getElementById('cs-show-title-input').value = title;
    document.getElementById('cs-show-description-input').value = description;
    document.getElementById('cs-show-category-input').value = category;
    document.getElementById('cs-show-language-input').value = language;

    if (cover) {
      const preview = document.getElementById('cs-show-cover-preview');
      const placeholder = document.getElementById('cs-show-cover-placeholder');
      if (preview) { preview.src = cover; preview.classList.remove('hidden'); }
      if (placeholder) placeholder.classList.add('hidden');
    }

    setText('cs-show-modal-title', 'Edit Show');
    const saveBtn = document.getElementById('cs-show-modal-save');
    if (saveBtn) saveBtn.textContent = 'Save Changes';
    openModal('cs-show-modal');
  };

  // Show cover image file input
  const showCoverArea = document.getElementById('cs-show-cover-area');
  const showCoverInput = document.getElementById('cs-show-cover-input');
  if (showCoverArea && showCoverInput) {
    showCoverArea.addEventListener('click', () => showCoverInput.click());
    showCoverInput.addEventListener('change', () => {
      const file = showCoverInput.files[0];
      if (!file) return;
      if (file.size > 5 * 1024 * 1024) { toast('Image too large (max 5MB)'); return; }
      csSelectedCoverFile = file;
      const reader = new FileReader();
      reader.onload = (e) => {
        const preview = document.getElementById('cs-show-cover-preview');
        const placeholder = document.getElementById('cs-show-cover-placeholder');
        if (preview) { preview.src = e.target.result; preview.classList.remove('hidden'); }
        if (placeholder) placeholder.classList.add('hidden');
      };
      reader.readAsDataURL(file);
    });
  }

  // Save Show (Create or Update)
  const showSaveBtn = document.getElementById('cs-show-modal-save');
  if (showSaveBtn) {
    showSaveBtn.addEventListener('click', async () => {
      const title = val('cs-show-title-input');
      if (!title) { toast('Show title is required'); return; }

      const id = val('cs-show-modal-id');
      const fd = new FormData();
      fd.append('title', title);
      fd.append('description', document.getElementById('cs-show-description-input')?.value || '');
      fd.append('category', document.getElementById('cs-show-category-input')?.value || '');
      fd.append('language', document.getElementById('cs-show-language-input')?.value || 'en');
      fd.append('explicit', document.getElementById('cs-show-explicit-input')?.checked ? 'true' : 'false');
      if (csSelectedCoverFile) fd.append('cover', csSelectedCoverFile);

      const isEdit = !!id;
      const url = isEdit ? `/api/studio/shows/${id}` : '/api/studio/shows';
      const method = isEdit ? 'PUT' : 'POST';

      setLoading(showSaveBtn, true, isEdit ? 'Save Changes' : 'Create Show');
      try {
        const res = await fetch(url, { method, body: fd });
        const data = await res.json();
        if (data.success) {
          closeModal('cs-show-modal');
          toast(isEdit ? 'Show updated!' : 'Show created!');
          setTimeout(() => window.location.reload(), 600);
        } else {
          toast(data.error || 'Failed to save show');
        }
      } catch (e) {
        toast('Network error');
      } finally {
        setLoading(showSaveBtn, false, isEdit ? 'Save Changes' : 'Create Show');
      }
    });
  }

  // Delete Show
  window.csDeleteShow = async function (btn) {
    const id = btn.getAttribute('data-id');
    const title = btn.getAttribute('data-title');
    if (!confirm(`Delete "${title}" and all its episodes? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/studio/shows/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast('Show deleted');
        setTimeout(() => window.location.reload(), 600);
      } else {
        toast('Failed to delete show');
      }
    } catch (e) {
      toast('Network error');
    }
  };

  // Close Show modal
  ['cs-show-modal-close', 'cs-show-modal-cancel'].forEach(id => {
    document.getElementById(id)?.addEventListener('click', () => closeModal('cs-show-modal'));
  });

  // Trigger create show from various buttons
  ['cs-create-show-btn', 'cs-create-show-btn-empty'].forEach(id => {
    document.getElementById(id)?.addEventListener('click', csOpenCreateShow);
  });

  // ─── CREATOR STUDIO — EPISODES ───────────────────────────────────────────────

  let csSelectedAudioFile = null;

  function csResetEpisodeModal() {
    csSelectedAudioFile = null;
    document.getElementById('cs-ep-modal-id').value = '';
    document.getElementById('cs-ep-modal-show-id').value = '';
    document.getElementById('cs-ep-title-input').value = '';
    document.getElementById('cs-ep-description-input').value = '';
    document.getElementById('cs-ep-explicit-input').checked = false;
    document.getElementById('cs-ep-status-input').value = 'draft';
    setText('cs-ep-audio-filename', 'Click to select audio file');

    const fileInput = document.getElementById('cs-ep-audio-input');
    if (fileInput) fileInput.value = '';
  }

  // Audio drop zone click
  const audioDropZone = document.getElementById('cs-ep-audio-drop');
  const audioFileInput = document.getElementById('cs-ep-audio-input');
  if (audioDropZone && audioFileInput) {
    audioDropZone.addEventListener('click', () => audioFileInput.click());
    audioFileInput.addEventListener('change', () => {
      const file = audioFileInput.files[0];
      if (!file) return;
      if (file.size > 50 * 1024 * 1024) { toast('Audio file too large (max 50MB)'); return; }
      csSelectedAudioFile = file;
      setText('cs-ep-audio-filename', file.name);
    });
  }

  // New Episode button
  document.getElementById('cs-new-episode-btn')?.addEventListener('click', () => {
    const showId = document.getElementById('cs-new-episode-btn')?.getAttribute('data-show-id') ||
                   document.getElementById('creator-studio-root')?.getAttribute('data-show-id') || '';
    csResetEpisodeModal();
    setText('cs-ep-modal-title', 'New Episode');
    document.getElementById('cs-ep-modal-show-id').value = showId;
    const saveBtn = document.getElementById('cs-ep-modal-save');
    if (saveBtn) saveBtn.textContent = 'Create Episode';
    openModal('cs-episode-modal');
  });

  // Edit Episode buttons (delegated)
  document.addEventListener('click', (e) => {
    const editBtn = e.target.closest('.cs-edit-ep-btn');
    if (editBtn) {
      csResetEpisodeModal();
      document.getElementById('cs-ep-modal-id').value = editBtn.getAttribute('data-id');
      document.getElementById('cs-ep-modal-show-id').value = editBtn.getAttribute('data-show-id') ||
        document.getElementById('creator-studio-root')?.getAttribute('data-show-id') || '';
      document.getElementById('cs-ep-title-input').value = editBtn.getAttribute('data-title') || '';
      document.getElementById('cs-ep-description-input').value = editBtn.getAttribute('data-description') || '';
      document.getElementById('cs-ep-explicit-input').checked = editBtn.getAttribute('data-explicit') === 'true';
      document.getElementById('cs-ep-status-input').value = editBtn.getAttribute('data-status') || 'draft';

      const existingAudio = editBtn.getAttribute('data-audio') || '';
      if (existingAudio) {
        const filename = existingAudio.split('/').pop();
        setText('cs-ep-audio-filename', `Current: ${filename}`);
      }

      setText('cs-ep-modal-title', 'Edit Episode');
      const saveBtn = document.getElementById('cs-ep-modal-save');
      if (saveBtn) saveBtn.textContent = 'Save Changes';
      openModal('cs-episode-modal');
    }

    // Publish episode
    const publishBtn = e.target.closest('.cs-publish-ep-btn');
    if (publishBtn) {
      const epId = publishBtn.getAttribute('data-id');
      csPublishEpisode(epId, publishBtn);
    }

    // Unpublish episode (set to draft)
    const unpublishBtn = e.target.closest('.cs-unpublish-ep-btn');
    if (unpublishBtn) {
      const epId = unpublishBtn.getAttribute('data-id');
      csSetEpisodeStatus(epId, 'draft', unpublishBtn);
    }

    // Delete episode
    const deleteBtn = e.target.closest('.cs-delete-ep-btn');
    if (deleteBtn) {
      const epId = deleteBtn.getAttribute('data-id');
      const title = deleteBtn.getAttribute('data-title');
      csDeleteEpisode(epId, title, deleteBtn);
    }

    // CS Tab switching
    const tabBtn = e.target.closest('.cs-tab-btn');
    if (tabBtn) {
      document.querySelectorAll('.cs-tab-btn').forEach(b => b.classList.remove('active-tab'));
      tabBtn.classList.add('active-tab');
      const tab = tabBtn.getAttribute('data-tab');
      ['episodes', 'analytics'].forEach(t => {
        const el = document.getElementById(`cs-tab-${t}`);
        if (el) el.classList.toggle('hidden', t !== tab);
      });
    }
  });

  // Save Episode (Create or Update)
  document.getElementById('cs-ep-modal-save')?.addEventListener('click', async () => {
    const title = val('cs-ep-title-input');
    if (!title) { toast('Episode title is required'); return; }

    const id = val('cs-ep-modal-id');
    const showId = val('cs-ep-modal-show-id');
    const fd = new FormData();
    fd.append('title', title);
    fd.append('description', document.getElementById('cs-ep-description-input')?.value || '');
    fd.append('explicit', document.getElementById('cs-ep-explicit-input')?.checked ? 'true' : 'false');
    fd.append('status', document.getElementById('cs-ep-status-input')?.value || 'draft');
    if (csSelectedAudioFile) fd.append('audio', csSelectedAudioFile);

    const isEdit = !!id;
    const url = isEdit ? `/api/studio/episodes/${id}` : `/api/studio/shows/${showId}/episodes`;
    const method = isEdit ? 'PUT' : 'POST';

    const saveBtn = document.getElementById('cs-ep-modal-save');
    setLoading(saveBtn, true, isEdit ? 'Save Changes' : 'Create Episode');
    try {
      const res = await fetch(url, { method, body: fd });
      const data = await res.json();
      if (data.success) {
        closeModal('cs-episode-modal');
        toast(isEdit ? 'Episode updated!' : 'Episode created!');
        setTimeout(() => window.location.reload(), 600);
      } else {
        toast(data.error || 'Failed to save episode');
      }
    } catch (e) {
      toast('Network error');
    } finally {
      setLoading(saveBtn, false, isEdit ? 'Save Changes' : 'Create Episode');
    }
  });

  // Close Episode modal
  ['cs-ep-modal-close', 'cs-ep-modal-cancel'].forEach(id => {
    document.getElementById(id)?.addEventListener('click', () => closeModal('cs-episode-modal'));
  });

  async function csPublishEpisode(epId, btn) {
    const original = btn.textContent;
    btn.disabled = true;
    btn.textContent = '...';
    try {
      const res = await fetch(`/api/studio/episodes/${epId}/publish`, { method: 'POST' });
      if (res.ok) {
        toast('Episode published!');
        setTimeout(() => window.location.reload(), 600);
      } else {
        toast('Failed to publish');
      }
    } catch (e) {
      toast('Network error');
    } finally {
      btn.disabled = false;
      btn.textContent = original;
    }
  }

  async function csSetEpisodeStatus(epId, status, btn) {
    const fd = new FormData();
    fd.append('status', status);
    btn.disabled = true;
    try {
      const res = await fetch(`/api/studio/episodes/${epId}`, { method: 'PUT', body: fd });
      if (res.ok) {
        toast(status === 'published' ? 'Episode published!' : 'Episode set to draft');
        setTimeout(() => window.location.reload(), 600);
      } else {
        toast('Failed to update episode');
      }
    } catch (e) {
      toast('Network error');
    } finally {
      btn.disabled = false;
    }
  }

  async function csDeleteEpisode(epId, title, btn) {
    if (!confirm(`Delete episode "${title}"? This cannot be undone.`)) return;
    btn.disabled = true;
    try {
      const res = await fetch(`/api/studio/episodes/${epId}`, { method: 'DELETE' });
      if (res.ok) {
        toast('Episode deleted');
        // Remove row from DOM
        const row = document.querySelector(`.episode-row[data-episode-id="${epId}"]`);
        if (row) {
          row.style.opacity = '0';
          row.style.transition = 'opacity 0.3s';
          setTimeout(() => row.remove(), 300);
        }
      } else {
        toast('Failed to delete episode');
        btn.disabled = false;
      }
    } catch (e) {
      toast('Network error');
      btn.disabled = false;
    }
  }

});
