function requireAuth(req, res, next) {
  if (req.session && req.session.userId) return next();
  if (req.accepts('html')) return res.redirect('/login.html');
  return res.status(401).json({ error: 'Not authenticated' });
}

module.exports = { requireAuth };
