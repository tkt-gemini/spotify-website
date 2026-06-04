module.exports = {
  users: [
    { id: 1, username: 'free_user', role: 'free', name: 'Free User' },
    { id: 2, username: 'premium_user', role: 'premium', name: 'Premium User' },
    { id: 3, username: 'creator_user', role: 'creator', name: 'Creator User' },
    { id: 4, username: 'artist_1', role: 'artist', name: 'Artist One' },
    { id: 5, username: 'artist_2', role: 'artist', name: 'Artist Two' },
    { id: 6, username: 'artist_3', role: 'artist', name: 'Artist Three' }
  ],
  artists: [
    { id: 'a1', name: 'Synthwave Maestro', userId: 4, avatar: 'https://i.scdn.co/image/ab6761610000e5eb1234', bio: 'A mysterious producer from the future, bringing neon-drenched retro-futuristic beats.' },
    { id: 'a2', name: 'Ambient Mind', userId: 5, avatar: 'https://i.scdn.co/image/ab6761610000e5eb5678', bio: 'Creating soundscapes that help you focus, relax, and meditate.' },
    { id: 'a3', name: 'DJ Premium', userId: 6, avatar: 'https://i.scdn.co/image/ab6761610000e5eb9012', bio: 'Exclusive tracks and mixes for premium listeners.' }
  ],
  podcasters: [
    { id: 'pd1', name: 'Tech Gurus', userId: 3, avatar: 'https://i.scdn.co/image/ab6761610000e5eb3456', description: 'Tech Gurus is a network of industry professionals breaking down complex topics into simple terms.' }
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
    }
  ],
  podcasts: [
    {
      id: 'show1',
      title: 'Tech Talk',
      ownerName: 'Tech Gurus', // We'll link to a creator user
      cover: 'https://picsum.photos/seed/p1/200/200',
      description: 'The latest in tech news and discussion.',
      episodes: [
        {
          id: 'p1',
          title: 'Tech Talk #42: Future of Web',
          description: 'We discuss the future of web applications.',
          audio: '/media/audio/song1.mp3',
          duration_ms: 3600000
        }
      ]
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
