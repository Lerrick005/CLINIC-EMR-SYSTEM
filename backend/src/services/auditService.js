class AuditService {
  constructor(db) {
    this.db = db;
  }

  async logAction(data) {
    const {
      userId,
      clinicId,
      action,
      resourceType,
      resourceId,
      details,
      ipAddress,
      userAgent,
      changes
    } = data;

    try {
      const { v4: uuidv4 } = require('uuid');
      const id = uuidv4();

      await this.db('audit_logs').insert({
        id,
        clinic_id: clinicId,
        user_id: userId,
        action,
        resource_type: resourceType,
        resource_id: resourceId,
        details: details || {},
        ip_address: ipAddress || null,
        user_agent: userAgent || null,
        changes: changes || null,
        created_at: this.db.fn.now()
      });

      return { success: true, id };
    } catch (error) {
      console.error('Error logging audit:', error);
      return { success: false, error: error.message };
    }
  }

  async getLogs(clinicId, filters = {}) {
    const {
      userId,
      action,
      resourceType,
      dateFrom,
      dateTo,
      limit = 100,
      offset = 0 
    } = filters;

    let query = this.db('audit_logs')
      .where({ 'audit_logs.clinic_id': clinicId })
      .leftJoin('users', 'audit_logs.user_id', 'users.id')
      .select(
        'audit_logs.*',
        'users.first_name as user_first_name',
        'users.last_name as user_last_name',
        'users.email as user_email'
      )
      .orderBy('audit_logs.created_at', 'desc');

    if (userId) query = query.where({ 'audit_logs.user_id': userId });
    if (action) query = query.where({ 'audit_logs.action': action });
    if (resourceType) query = query.where({ 'audit_logs.resource_type': resourceType });
    if (dateFrom) query = query.where('audit_logs.created_at', '>=', dateFrom);
    if (dateTo) query = query.where('audit_logs.created_at', '<=', dateTo);

    const countQuery = this.db('audit_logs')
      .where({ 'audit_logs.clinic_id': clinicId })
      .leftJoin('users', 'audit_logs.user_id', 'users.id');
    
    if (userId) countQuery.where({ 'audit_logs.user_id': userId });
    if (action) countQuery.where({ 'audit_logs.action': action });
    if (resourceType) countQuery.where({ 'audit_logs.resource_type': resourceType });
    if (dateFrom) countQuery.where('audit_logs.created_at', '>=', dateFrom);
    if (dateTo) countQuery.where('audit_logs.created_at', '<=', dateTo);

    const totalResult = await countQuery.count('audit_logs.id as count').first();
    const data = await query.limit(limit).offset(offset);

    return {
      data,
      total: parseInt(totalResult?.count || 0),
      limit,
      offset
    };
  }

  async getLogsByUser(clinicId, userId, limit = 50) {
    return this.db('audit_logs')
      .where({ clinic_id: clinicId, user_id: userId })
      .orderBy('created_at', 'desc')
      .limit(limit);
  }

  async getLogsByResource(clinicId, resourceType, resourceId, limit = 50) {
    return this.db('audit_logs')
      .where({ clinic_id: clinicId, resource_type: resourceType, resource_id: resourceId })
      .orderBy('created_at', 'desc')
      .limit(limit);
  }

  async getUserActivitySummary(clinicId, userId, days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const logs = await this.db('audit_logs')
      .where({ clinic_id: clinicId, user_id: userId })
      .where('created_at', '>=', startDate)
      .select('action')
      .count('id as count')
      .groupBy('action');

    const total = await this.db('audit_logs')
      .where({ clinic_id: clinicId, user_id: userId })
      .where('created_at', '>=', startDate)
      .count('id as total')
      .first();

    return {
      user_id: userId,
      period_days: days,
      actions: logs,
      total_actions: parseInt(total?.total || 0)
    };
  }

  async getResourceHistory(clinicId, resourceType, resourceId) {
    return this.db('audit_logs')
      .where({ clinic_id: clinicId, resource_type: resourceType, resource_id: resourceId })
      .leftJoin('users', 'audit_logs.user_id', 'users.id')
      .select(
        'audit_logs.*',
        'users.first_name as user_first_name',
        'users.last_name as user_last_name',
        'users.email as user_email'
      )
      .orderBy('created_at', 'asc');
  }
}

module.exports = AuditService;
