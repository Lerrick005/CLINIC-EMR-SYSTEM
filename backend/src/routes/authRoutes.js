const express = require('express');
const passport = require('passport');
const router = express.Router();
const AuthService = require('../services/authService');
const EmailService = require('../services/emailService');
const { tenantContext } = require('../middleware/tenantContext');
const crypto = require('crypto');

// ========== FORGOT PASSWORD ==========
router.post('/forgot-password', async (req, res, next) => {
  const db = req.db;
  const { email } = req.body;

  try {
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const user = await db('users').where({ email }).first();
    if (!user) {
      return res.status(404).json({ error: 'No account found with this email' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000);

    await db('users')
      .where({ id: user.id })
      .update({
        reset_token: resetToken,
        reset_token_expiry: resetTokenExpiry
      });

    const emailService = new EmailService();
    await emailService.sendPasswordReset(email, resetToken);

    res.json({
      success: true,
      message: 'Password reset email sent. Please check your inbox.'
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    next(error);
  }
});

// ========== RESET PASSWORD ==========
router.post('/reset-password', async (req, res, next) => {
  const db = req.db;
  const authService = new AuthService(db);
  const { token, newPassword } = req.body;

  try {
    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const user = await db('users')
      .where({ reset_token: token })
      .where('reset_token_expiry', '>', new Date())
      .first();

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    const hashedPassword = await authService.hashPassword(newPassword);
    await db('users')
      .where({ id: user.id })
      .update({
        password_hash: hashedPassword,
        reset_token: null,
        reset_token_expiry: null,
        must_change_password: false
      });

    res.json({
      success: true,
      message: 'Password reset successfully. You can now login with your new password.'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    next(error);
  }
});

// ========== Email/password login ==========
router.post('/login', async (req, res, next) => {
  const db = req.db;
  const authService = new AuthService(db);
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }
    const result = await authService.login(email, password);
    res.json(result);
  } catch (err) {
    if (err.message === 'Invalid credentials') {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    next(err);
  }
});

// ========== LOGOUT ==========
router.post('/logout', tenantContext, async (req, res, next) => {
  const db = req.db;
  const authService = new AuthService(db);
  try {
    await authService.logout(req.user.id);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// ========== REFRESH TOKEN ==========
router.post('/refresh', async (req, res, next) => {
  const db = req.db;
  const authService = new AuthService(db);
  const { refreshToken, userId } = req.body;
  try {
    if (!refreshToken || !userId) {
      return res.status(400).json({ error: 'Refresh token and user ID required' });
    }
    const { accessToken } = await authService.refreshAccessToken(refreshToken, userId);
    res.json({ accessToken });
  } catch (err) {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

// ========== GET CURRENT USER ==========
router.get('/me', tenantContext, (req, res) => {
  res.json({ user: req.user });
});

// ========== GOOGLE OAUTH ==========
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/google/callback', 
  passport.authenticate('google', { 
    failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=google_auth_failed`
  }),
  (req, res) => {
    const authService = new AuthService(req.db);
    const accessToken = authService.generateAccessToken(req.user);
    const refreshToken = authService.generateRefreshToken(req.user);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    
    const redirectPath = '/login';
    res.send(`
      <html>
        <head><title>Login Successful</title></head>
        <body style="font-family:Arial;text-align:center;padding-top:50px;">
          <h2>✅ Login Successful</h2>
          <p>Redirecting to dashboard...</p>
          <p>If not redirected automatically, <a href="${frontendUrl}${redirectPath}?accessToken=${accessToken}&refreshToken=${refreshToken}&userId=${req.user.id}">click here</a></p>
          <script>
            if (window.opener) {
              window.opener.location.href = '${frontendUrl}${redirectPath}?accessToken=${accessToken}&refreshToken=${refreshToken}&userId=${req.user.id}';
              window.close();
            } else {
              window.location.href = '${frontendUrl}${redirectPath}?accessToken=${accessToken}&refreshToken=${refreshToken}&userId=${req.user.id}';
            }
          </script>
        </body>
      </html>
    `);
  }
);

// ========== CLINIC REGISTRATION ==========
router.post('/register-clinic', async (req, res, next) => {
  const db = req.db;
  const authService = new AuthService(db);
  const EmailService = require('../services/emailService');
  const { v4: uuidv4 } = require('uuid');

  try {
    const { clinicName, clinicEmail, phone, country, county, address, mflCode, adminName, adminEmail, password } = req.body;

    if (!clinicName || !adminEmail || !password) {
      return res.status(400).json({ error: 'Clinic name, admin email, and password are required' });
    }

    const existingClinic = await db('clinics').where({ email: clinicEmail }).first();
    if (existingClinic) {
      return res.status(409).json({ error: 'A clinic with this email already exists' });
    }

    const existingUser = await db('users').where({ email: adminEmail }).first();
    if (existingUser) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    const trx = await db.transaction();

    try {
      const clinicId = uuidv4();
      await trx('clinics').insert({
        id: clinicId, name: clinicName, email: clinicEmail || adminEmail, phone: phone || '',
        county: county || '', address: address || '', mfl_code: mflCode || '',
        plan_type: 'free', status: 'active', registration_date: trx.fn.now(),
        settings: { country: country || 'Kenya' }, is_active: true
      });

      const hashedPassword = await authService.hashPassword(password);
      const userId = uuidv4();
      await trx('users').insert({
        id: userId, clinic_id: clinicId, email: adminEmail, password_hash: hashedPassword,
        first_name: adminName || 'Clinic', last_name: 'Admin', role: 'CLINIC_ADMIN',
        is_active: true, must_change_password: true, is_email_verified: false, email_verified_at: null
      });

      await trx.commit();

      try {
        const emailService = new EmailService();
        await emailService.sendWelcomeEmail(adminEmail, adminName);
      } catch (emailError) {
        console.error('Welcome email error:', emailError);
      }

      res.status(201).json({ success: true, message: 'Clinic registered! Check email for verification.', clinicId, userId });
    } catch (error) {
      await trx.rollback();
      throw error;
    }
  } catch (error) {
    console.error('Registration error:', error);
    next(error);
  }
});

// ========== VERIFY SUPER ADMIN PASSWORD ==========
router.post('/verify-super-admin', tenantContext, async (req, res, next) => {
  try {
    const db = req.db;
    const authService = new AuthService(db);
    const { password } = req.body;

    if (!password) return res.status(400).json({ error: 'Password is required' });
    if (req.user.role !== 'SUPER_ADMIN') return res.status(403).json({ error: 'Not authorized' });

    const user = await db('users').where({ id: req.user.id, role: 'SUPER_ADMIN', is_active: true }).first();
    if (!user) return res.status(401).json({ error: 'Super admin not found' });

    const isValid = await authService.comparePassword(password, user.password_hash);
    if (!isValid) return res.status(401).json({ error: 'Invalid password' });

    res.json({ success: true, message: 'Verified successfully' });
  } catch (err) {
    console.error('Error verifying super admin:', err);
    res.status(500).json({ error: err.message });
  }
});

// ========== EMERGENCY SUPER ADMIN RECOVERY ==========
router.post('/recover-super-admin', async (req, res) => {
  const { recoveryCode, newPassword } = req.body;
  
  if (recoveryCode !== 'lerrick-recover-2026') {
    return res.status(403).json({ error: 'Invalid recovery code' });
  }
  
  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }
  
  try {
    const bcrypt = require('bcryptjs');
    const hash = await bcrypt.hash(newPassword, 10);
    const user = await req.db('users').where({ email: 'lerrickmushasha@gmail.com' }).first();
    
    if (user) {
      await req.db('users').where({ email: 'lerrickmushasha@gmail.com' }).update({
        password_hash: hash,
        role: 'SUPER_ADMIN',
        is_active: true
      });
    } else {
      const { v4: uuidv4 } = require('uuid');
      await req.db('users').insert({
        id: uuidv4(),
        email: 'lerrickmushasha@gmail.com',
        password_hash: hash,
        first_name: 'Super',
        last_name: 'Admin',
        role: 'SUPER_ADMIN',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      });
    }
    
    res.json({ success: true, message: 'Super admin password reset successfully' });
  } catch (e) {
    console.error('Recovery error:', e);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

module.exports = router;
