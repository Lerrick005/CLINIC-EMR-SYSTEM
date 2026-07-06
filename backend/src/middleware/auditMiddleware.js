const AuditService = require('../services/auditService');

function auditLog(action, resourceType, getResourceId = null, getDetails = null) {
  return async (req, res, next) => {
    // Store the original send function
    const originalSend = res.send;
    const originalJson = res.json;
    const originalStatus = res.status;

    // Capture the response status
    let responseStatus = 200;
    let responseBody = null;

    res.status = function(statusCode) {
      responseStatus = statusCode;
      return originalStatus.call(this, statusCode);
    };

    res.send = function(body) {
      responseBody = body;
      return originalSend.call(this, body);
    };

    res.json = function(body) {
      responseBody = body;
      return originalJson.call(this, body);
    };

    // Wait for the route to finish
    res.on('finish', async () => {
      // Only log successful requests (2xx status codes)
      if (responseStatus < 200 || responseStatus >= 300) return;

      try {
        const db = req.db;
        const userId = req.user?.id;
        const clinicId = req.clinicId;
        const auditService = new AuditService(db);

        // Get resource ID if provided
        let resourceId = null;
        if (getResourceId) {
          resourceId = getResourceId(req);
        }

        // Get details if provided
        let details = null;
        if (getDetails) {
          details = getDetails(req, responseBody);
        }

        // Don't log GET requests (too noisy) unless specified
        if (req.method === 'GET' && !action.startsWith('VIEW')) {
          return;
        }

        await auditService.logAction({
          userId,
          clinicId,
          action: action,
          resourceType: resourceType,
          resourceId: resourceId,
          details: details || {
            method: req.method,
            path: req.path,
            query: req.query,
            body: req.body
          },
          ipAddress: req.ip || req.connection?.remoteAddress,
          userAgent: req.headers['user-agent']
        });
      } catch (error) {
        console.error('Audit log error:', error);
      }
    });

    next();
  };
}

// Pre-built audit middlewares
function auditCreate(resourceType) {
  return auditLog('CREATE', resourceType, 
    (req) => req.body?.id || req.params?.id,
    (req, res) => ({ created: req.body })
  );
}

function auditUpdate(resourceType) {
  return auditLog('UPDATE', resourceType,
    (req) => req.params?.id,
    (req, res) => ({ updated: req.body })
  );
}

function auditDelete(resourceType) {
  return auditLog('DELETE', resourceType,
    (req) => req.params?.id,
    (req, res) => ({ deleted: req.params?.id })
  );
}

function auditView(resourceType) {
  return auditLog('VIEW', resourceType,
    (req) => req.params?.id,
    (req, res) => ({ viewed: req.params?.id })
  );
}

module.exports = {
  auditLog,
  auditCreate,
  auditUpdate,
  auditDelete,
  auditView
};
