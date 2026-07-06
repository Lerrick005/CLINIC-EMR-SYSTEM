const jwt = require('jsonwebtoken');

function tenantContext(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid token' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // contains id, email, role, clinic_id
    if (decoded.role !== 'SUPER_ADMIN' && !decoded.clinic_id) {
      return res.status(403).json({ error: 'Missing clinic context' });
    }
    req.clinicId = decoded.clinic_id;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

module.exports = { tenantContext };