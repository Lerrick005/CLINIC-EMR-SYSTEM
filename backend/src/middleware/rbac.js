// Role-Based Access Control Middleware

const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    const user = req.user;

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized: No user found' });
    }

    if (!user.role) {
      return res.status(403).json({ error: 'Forbidden: No role assigned' });
    }

    // SUPER_ADMIN can do anything
    if (user.role === 'SUPER_ADMIN') {
      return next();
    }

    if (allowedRoles.includes(user.role)) {
      return next();
    }

    return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
  };
};

// Role constants for easy reference
const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  CLINIC_ADMIN: 'CLINIC_ADMIN',
  DOCTOR: 'DOCTOR',
  RECEPTIONIST: 'RECEPTIONIST',
  PHARMACIST: 'PHARMACIST',
  LAB_STAFF: 'LAB_STAFF',
  ACCOUNTANT: 'ACCOUNTANT'
};

// Role groups for quick reference
const ROLE_GROUPS = {
  // Can manage clinic settings and staff
  ADMIN_ROLES: ['SUPER_ADMIN', 'CLINIC_ADMIN'],
  
  // Can access clinical features (patients, consultations, etc.)
  CLINICAL_ROLES: ['SUPER_ADMIN', 'CLINIC_ADMIN', 'DOCTOR'],
  
  // Can access billing and financial features
  FINANCE_ROLES: ['SUPER_ADMIN', 'CLINIC_ADMIN', 'ACCOUNTANT'],
  
  // Can access lab features
  LAB_ROLES: ['SUPER_ADMIN', 'CLINIC_ADMIN', 'LAB_STAFF'],
  
  // Can access pharmacy features
  PHARMACY_ROLES: ['SUPER_ADMIN', 'CLINIC_ADMIN', 'PHARMACIST']
};

module.exports = {
  requireRole,
  ROLES,
  ROLE_GROUPS
};