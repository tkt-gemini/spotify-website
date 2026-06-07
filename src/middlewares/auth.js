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

module.exports = {
  requireAuth,
  requireGuest,
  attachCurrentUserToLocals
};
