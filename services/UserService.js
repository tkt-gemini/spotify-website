const crypto = require('crypto');
const { User, ArtistProfile, PodcasterProfile } = require('../models');

class UserService {
  async updateProfile(userId, name, avatarFile) {
    if (!name || name.trim() === '') {
      throw new Error('INVALID_INPUT');
    }

    const user = await User.findByPk(userId);
    if (!user) throw new Error('NOT_FOUND');

    user.name = name.trim();
    
    if (avatarFile) {
      user.avatar = `/uploads/playlists/${avatarFile.filename}`;
    }

    await user.save();
    return { name: user.name, avatar: user.avatar };
  }

  async registerArtist(userId) {
    const user = await User.findByPk(userId);
    if (!user) throw new Error('NOT_FOUND');
    
    await ArtistProfile.findOrCreate({
      where: { userId: user.id },
      defaults: {
        id: crypto.randomUUID(),
        name: user.name || user.username
      }
    });
    
    return true;
  }

  async registerPodcaster(userId) {
    const user = await User.findByPk(userId);
    if (!user) throw new Error('NOT_FOUND');
    
    await PodcasterProfile.findOrCreate({
      where: { userId: user.id },
      defaults: {
        id: crypto.randomUUID(),
        name: user.name || user.username
      }
    });
    
    return true;
  }
}

module.exports = new UserService();
