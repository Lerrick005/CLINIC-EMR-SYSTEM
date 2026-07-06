const jwt = require('jsonwebtoken');

function isSuperAdmin(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    
    // Check if user is SUPER_ADMIN
    if (decoded.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Access denied. Super Admin only.' });
    }
    
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

module.exports = { isSuperAdmin };
