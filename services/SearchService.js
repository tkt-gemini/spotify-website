const { Op } = require('sequelize');
const { ArtistProfile, Track, PodcastShow, Playlist, User, PodcasterProfile } = require('../models');

class SearchService {
  async searchAll(query) {
    if (!query || query.trim().length === 0) {
      return { artists: [], tracks: [], playlists: [], podcasts: [] };
    }

    const searchPattern = `%${query}%`;
    
    const artists = await ArtistProfile.findAll({
      where: { name: { [Op.like]: searchPattern } },
      include: [{ model: User, as: 'user', attributes: ['avatar'] }],
      limit: 5
    });
    
    const tracks = await Track.findAll({
      where: {
        [Op.or]: [
          { title: { [Op.like]: searchPattern } },
          { artist: { [Op.like]: searchPattern } }
        ],
        type: 'song'
      },
      limit: 10
    });
    
    const podcasts = await PodcastShow.findAll({
      where: { title: { [Op.like]: searchPattern } },
      limit: 5,
      include: [{ 
        model: User, 
        as: 'owner', 
        attributes: ['name'],
        include: [{ model: PodcasterProfile, as: 'podcasterProfile' }]
      }]
    });
    
    const playlists = await Playlist.findAll({
      where: { title: { [Op.like]: searchPattern } },
      limit: 5,
      include: [{ model: User, as: 'creator', attributes: ['name', 'username'] }]
    });

    return { artists, tracks, playlists, podcasts };
  }
}

module.exports = new SearchService();
