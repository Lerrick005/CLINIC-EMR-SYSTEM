const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

class AuthService {
  constructor(db) {
    this.db = db;
  }

  async hashPassword(plainPassword) {
    const rounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    return bcrypt.hash(plainPassword, rounds);
  }

  async comparePassword(plainPassword, hash) {
    return bcrypt.compare(plainPassword, hash);
  }

  getJwtSecret() {
    return process.env.JWT_SECRET || 'fallback-secret-do-not-use-in-production';
  }

  getJwtRefreshSecret() {
    return process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret-do-not-use-in-production';
  }

  generateAccessToken(user) {
    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
      clinic_id: user.clinic_id || null
    };
    return jwt.sign(payload, this.getJwtSecret(), { expiresIn: '15m' });
  }

  generateRefreshToken(user) {
    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
      clinic_id: user.clinic_id || null
    };
    return jwt.sign(payload, this.getJwtRefreshSecret(), { expiresIn: '7d' });
  }

  async hashRefreshToken(refreshToken) {
    return bcrypt.hash(refreshToken, 10);
  }

  async verifyRefreshToken(refreshToken, userId) {
    try {
      const decoded = jwt.verify(refreshToken, this.getJwtRefreshSecret());
      if (decoded.id !== userId) throw new Error('Token user mismatch');
      const user = await this.db('users').where({ id: userId }).first();
      if (!user || !user.refresh_token_hash) return null;
      const isValid = await bcrypt.compare(refreshToken, user.refresh_token_hash);
      return isValid ? decoded : null;
    } catch (err) {
      return null;
    }
  }

  async createSuperAdmin(email, password, firstName, lastName) {
    const hashedPassword = await this.hashPassword(password);
    const userId = uuidv4();
    await this.db('users').insert({
      id: userId,
      email,
      password_hash: hashedPassword,
      first_name: firstName,
      last_name: lastName,
      role: 'SUPER_ADMIN',
      is_active: true,
      must_change_password: false
    });
    return this.db('users').where({ id: userId }).first();
  }

  async createClinicAndAdmin(clinicData, adminData) {
    const trx = await this.db.transaction();
    try {
      const clinicId = uuidv4();
      await trx('clinics').insert({
        id: clinicId,
        name: clinicData.name,
        mfl_code: clinicData.mflCode,
        address: clinicData.address,
        phone: clinicData.phone,
        email: clinicData.email,
        county: clinicData.county,
        subcounty: clinicData.subcounty,
        ward: clinicData.ward,
        settings: clinicData.settings || {}
      });

      const hashedPassword = await this.hashPassword(adminData.password);
      const userId = uuidv4();
      await trx('users').insert({
        id: userId,
        clinic_id: clinicId,
        email: adminData.email,
        password_hash: hashedPassword,
        first_name: adminData.firstName,
        last_name: adminData.lastName,
        role: 'CLINIC_ADMIN',
        is_active: true,
        must_change_password: true
      });

      await trx.commit();
      return { clinicId, userId };
    } catch (err) {
      await trx.rollback();
      throw err;
    }
  }

  async login(email, password) {
    const user = await this.db('users')
      .leftJoin('clinics', 'users.clinic_id', 'clinics.id')
      .select('users.*', 'clinics.name as clinic_name')
      .where('users.email', email)
      .first();

    if (!user) throw new Error('Invalid credentials');
    if (!user.is_active) throw new Error('Account disabled');
    const valid = await this.comparePassword(password, user.password_hash);
    if (!valid) throw new Error('Invalid credentials');

    await this.db('users')
      .where({ id: user.id })
      .update({ last_login: this.db.fn.now() });

    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);
    const refreshTokenHash = await this.hashRefreshToken(refreshToken);
    await this.db('users')
      .where({ id: user.id })
      .update({ refresh_token_hash: refreshTokenHash });

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        clinicId: user.clinic_id,
        clinicName: user.clinic_name
      },
      accessToken,
      refreshToken
    };
  }

  async logout(userId) {
    await this.db('users')
      .where({ id: userId })
      .update({ refresh_token_hash: null });
    return true;
  }

  async refreshAccessToken(refreshToken, userId) {
    const decoded = await this.verifyRefreshToken(refreshToken, userId);
    if (!decoded) throw new Error('Invalid refresh token');
    const user = await this.db('users').where({ id: userId }).first();
    if (!user || !user.is_active) throw new Error('User not found or inactive');
    const newAccessToken = this.generateAccessToken(user);
    return { accessToken: newAccessToken };
  }

  async isSetupComplete() {
    const setting = await this.db('system_settings')
      .where({ key: 'system.setup_complete', clinic_id: null })
      .first();
    if (!setting) return false;
    const raw = setting.value;
    // Try to parse as JSON
    if (typeof raw === 'string') {
      try {
        const parsed = JSON.parse(raw);
        return parsed === true;
      } catch (e) {
        // Not valid JSON, compare as plain string
        return raw === 'true';
      }
    }
    // If it's already a boolean or number, compare directly
    return raw === true || raw === 'true';
  }

  async markSetupComplete() {
    const exists = await this.db('system_settings')
      .where({ key: 'system.setup_complete', clinic_id: null })
      .first();
    if (exists) {
      await this.db('system_settings')
        .where({ key: 'system.setup_complete', clinic_id: null })
        .update({ value: JSON.stringify(true) });
    } else {
      await this.db('system_settings').insert({
        id: uuidv4(),
        clinic_id: null,
        key: 'system.setup_complete',
        value: JSON.stringify(true)
      });
    }
  }
}

module.exports = AuthService;