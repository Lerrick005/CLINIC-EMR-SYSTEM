require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const session = require('express-session');
const passport = require('passport');
const knexConfig = require('../knexfile');
const knex = require('knex')(knexConfig[process.env.NODE_ENV || 'development']);

const authRoutes = require('./routes/authRoutes');
const setupRoutes = require('./routes/setupRoutes');
const patientRoutes = require('./routes/patientRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const consultationRoutes = require('./routes/consultationRoutes');
const labRoutes = require('./routes/labRoutes');
const labCatalogRoutes = require('./routes/labCatalogRoutes');
const referralRoutes = require('./routes/referralRoutes');
const auditRoutes = require('./routes/auditRoutes');
const superAdminRoutes = require('./routes/superAdminRoutes');
const staffRoutes = require('./routes/staffRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const configRoutes = require('./routes/configRoutes');
const pharmacyRoutes = require('./routes/pharmacyRoutes');
const diagnosisRoutes = require('./routes/diagnosisRoutes');
const diseaseSurveillanceRoutes = require('./routes/diseaseSurveillanceRoutes');
const diseaseMonitoringRoutes = require('./routes/diseaseMonitoringRoutes');
const aiRoutes = require('./routes/aiRoutes');
const { tenantContext } = require('./middleware/tenantContext');
const { errorHandler } = require('./middleware/errorHandler');
const { initializeSocket } = require('./socket');

const app = express();
const PORT = process.env.PORT || 3001;

// CORS configuration
const allowedOrigins = process.env.FRONTEND_URL 
  ? [process.env.FRONTEND_URL] 
  : ['http://localhost:3000', 'http://localhost:3001'];

app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With']
}));

app.options('*', cors());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Middleware
app.use(helmet({ 
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false 
}));
app.use(compression());
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));

// Session & Passport
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }
}));
app.use(passport.initialize());
app.use(passport.session());

// Initialize Google OAuth
require('./services/googleAuthService')(passport, knex);

// Attach database
app.use((req, res, next) => {
  req.db = knex;
  next();
});

// Routes
app.use('/api/setup', setupRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/consultations', consultationRoutes);
app.use('/api/lab-orders', labRoutes);
app.use('/api/lab-catalog', labCatalogRoutes);
app.use('/api/referrals', referralRoutes);

// Audit routes
app.use('/api/audit', auditRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/notifications', notificationRoutes);

// Config routes
app.use('/api/config', configRoutes);

// Pharmacy routes
app.use('/api/pharmacy', pharmacyRoutes);

// Diagnosis routes
app.use('/api/diagnoses', diagnosisRoutes);

// Disease Surveillance routes
app.use('/api/disease-surveillance', diseaseSurveillanceRoutes);

// Disease Monitoring routes
app.use('/api/disease-monitoring', diseaseMonitoringRoutes);

// AI routes
app.use('/api/ai', aiRoutes);

// Super Admin routes (hidden)
app.use('/api/super-admin', superAdminRoutes);

// Protected routes placeholder
app.use('/api', tenantContext, (req, res, next) => {
  res.status(501).json({ message: 'Protected routes coming soon' });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use(errorHandler);

// Start server
if (require.main === module) {
  knex.raw('SELECT 1').then(() => {
    console.log('ÃƒÆ’Ã‚Â¢Ãƒâ€¦Ã¢â‚¬Å“ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ Database connected');
    
    const server = app.listen(PORT, () => {
      console.log(`ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸Ãƒâ€¦Ã‚Â¡ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ CLINIC EMR Backend running on port ${PORT}`);
      console.log(`   CORS allowed origins: ${allowedOrigins.join(', ')}`);
    });
    
    // Initialize Socket.io
    const io = initializeSocket(server);
    console.log('ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒâ€¦Ã¢â‚¬â„¢ Socket.io initialized');
    
    module.exports = { app, knex, io };
  }).catch(err => {
    console.error('ÃƒÆ’Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒâ€¦Ã¢â‚¬â„¢ Database connection failed:', err);
    process.exit(1);
  });
} else {
  module.exports = { app, knex };
}







