module.exports = {
  users: [
    { id: 1, username: 'free_user', role: 'free', name: 'Free User' },
    { id: 2, username: 'premium_user', role: 'premium', name: 'Premium User' },
    { id: 3, username: 'creator_user', role: 'creator', name: 'Creator User' }
  ],
  tracks: [
    {
      id: 't1',
      title: 'Neon Nights',
      artist: 'Synthwave Maestro',
      cover: 'https://picsum.photos/seed/t1/200/200',
      audio: '/media/audio/song1.mp3',
      type: 'song',
      isPremium: false,
      playCount: 1200
    },
    {
      id: 't2',
      title: 'Deep Focus',
      artist: 'Ambient Mind',
      cover: 'https://picsum.photos/seed/t2/200/200',
      audio: '/media/audio/song1.mp3',
      type: 'song',
      isPremium: false,
      playCount: 345
    },
    {
      id: 't3',
      title: 'Exclusive Beats',
      artist: 'DJ Premium',
      cover: 'https://picsum.photos/seed/t3/200/200',
      audio: '/media/audio/song1.mp3',
      type: 'song',
      isPremium: true,
      playCount: 5000
    },
    {
      id: 'p1',
      title: 'Tech Talk #42',
      artist: 'Tech Gurus',
      cover: 'https://picsum.photos/seed/p1/200/200',
      audio: '/media/audio/song1.mp3',
      type: 'podcast',
      isPremium: false,
      playCount: 890
    }
  ],
  playlists: [
    {
      id: 'pl1',
      title: 'Chill Vibes',
      creator: 'Antigravity',
      tracks: ['t1', 't2']
    },
    {
      id: 'pl2',
      title: 'Premium Hits',
      creator: 'Antigravity',
      tracks: ['t3']
    }
  ],
  getTrack(id) {
    return this.tracks.find(t => t.id === id);
  },
  incrementPlayCount(id) {
    const track = this.getTrack(id);
    if (track) {
      track.playCount += 1;
      return track.playCount;
    }
    return null;
  }
};
