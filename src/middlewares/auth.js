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
  
  if (req.session && req.session.userId) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.session.userId },
      });
      
      if (user) {
        // Exclude passwordHash from being exposed to views
        const { passwordHash, ...userWithoutPassword } = user;
        res.locals.currentUser = userWithoutPassword;
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
        return res.status(403).send('Forbidden: You are not a team member of this artist');
      }

      if (allowedRoles.length > 0 && !allowedRoles.includes(teamMember.role)) {
        return res.status(403).send(`Forbidden: Requires one of roles: ${allowedRoles.join(', ')}`);
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

module.exports = {
  requireAuth,
  requireGuest,
  attachCurrentUserToLocals,
  requireArtistRole
};
