const prisma = require('../config/prisma');

function requireAuth(req, res, next) {
  if (req.session && req.session.userId) {
    return next();
  }
  return res.redirect('/login');
}

function requireGuest(req, res, next) {
  if (req.session && req.session.userId) {
    return res.redirect('/app/home');
  }
  return next();
}

async function attachCurrentUserToLocals(req, res, next) {
  res.locals.currentUser = null;
  req.currentUser = null;
  
  if (req.session && req.session.userId) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.session.userId },
      });
      
      if (user) {
        if (user.status === 'DISABLED') {
          req.session.destroy();
          if (req.path.startsWith('/api/')) {
            return res.status(403).json({ error: 'Account is disabled' });
          }
          return res.redirect('/login?error=account_disabled');
        }

        // Exclude passwordHash from being exposed to views
        const { passwordHash, ...userWithoutPassword } = user;
        res.locals.currentUser = userWithoutPassword;
        req.currentUser = userWithoutPassword;
      } else {
        // Invalid session userId
        req.session.destroy();
      }
    } catch (err) {
      console.error('Error fetching current user:', err);
    }
  }
  
  next();
}

function sendForbidden(req, res) {
  if (req.path.startsWith('/api/')) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  return res.status(403).render('pages/error/403', { layout: false });
}

function requireAdmin(req, res, next) {
  if (req.currentUser && req.currentUser.defaultRole === 'ADMIN') {
    return next();
  }
  return sendForbidden(req, res);
}

function requireArtistRole(allowedRoles = []) {
  return async (req, res, next) => {
    if (!req.session || !req.session.userId) {
      return res.redirect('/login');
    }
    
    const artistId = parseInt(req.params.artistId, 10);
    if (isNaN(artistId)) {
      return res.status(400).send('Invalid artist ID');
    }

    try {
      const teamMember = await prisma.artistTeamMember.findUnique({
        where: {
          artistId_userId: {
            artistId: artistId,
            userId: req.session.userId
          }
        }
      });

      if (!teamMember) {
        return sendForbidden(req, res);
      }

      if (allowedRoles.length > 0 && !allowedRoles.includes(teamMember.role)) {
        return sendForbidden(req, res);
      }

      // Attach team member info for views
      res.locals.artistRole = teamMember.role;
      next();
    } catch (err) {
      console.error('Error checking artist role:', err);
      return res.status(500).send('Internal Server Error');
    }
  };
}

function requirePodcastRoleByShowId(allowedRoles = []) {
  return async (req, res, next) => {
    if (!req.session || !req.session.userId) return res.redirect('/login');
    
    const showId = parseInt(req.params.showId, 10);
    if (isNaN(showId)) return res.status(400).send('Invalid show ID');

    try {
      const teamMember = await prisma.podcastTeamMember.findUnique({
        where: { showId_userId: { showId, userId: req.session.userId } }
      });

      if (!teamMember) {
        return sendForbidden(req, res);
      }

      if (allowedRoles.length > 0 && !allowedRoles.includes(teamMember.role)) {
        return sendForbidden(req, res);
      }

      res.locals.showRole = teamMember.role;
      next();
    } catch (err) {
      console.error('Error checking podcast role by showId:', err);
      return res.status(500).send('Internal Server Error');
    }
  };
}

function requirePodcastRoleByEpisodeId(allowedRoles = []) {
  return async (req, res, next) => {
    if (!req.session || !req.session.userId) return res.redirect('/login');
    
    const episodeId = parseInt(req.params.episodeId, 10);
    if (isNaN(episodeId)) return res.status(400).send('Invalid episode ID');

    try {
      const episode = await prisma.podcastEpisode.findUnique({
        where: { id: episodeId },
        select: { showId: true }
      });

      if (!episode) return res.status(404).send('Episode not found');

      const teamMember = await prisma.podcastTeamMember.findUnique({
        where: { showId_userId: { showId: episode.showId, userId: req.session.userId } }
      });

      if (!teamMember) {
        return sendForbidden(req, res);
      }

      if (allowedRoles.length > 0 && !allowedRoles.includes(teamMember.role)) {
        return sendForbidden(req, res);
      }

      res.locals.showRole = teamMember.role;
      req.episodeShowId = episode.showId; // To avoid querying again in the controller
      next();
    } catch (err) {
      console.error('Error checking podcast role by episodeId:', err);
      return res.status(500).send('Internal Server Error');
    }
  };
}

module.exports = {
  requireAuth,
  requireGuest,
  attachCurrentUserToLocals,
  requireAdmin,
  requireArtistRole,
  requirePodcastRoleByShowId,
  requirePodcastRoleByEpisodeId
};
