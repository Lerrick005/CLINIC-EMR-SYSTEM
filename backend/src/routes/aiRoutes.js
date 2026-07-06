const express = require('express');
const router = express.Router();
const AIService = require('../services/aiService');
const { tenantContext } = require('../middleware/tenantContext');
const { requireRole, ROLES } = require('../middleware/rbac');

// All AI routes require clinic context
router.use(tenantContext);

// ============================================
// PROCESS VOICE TO SOAP NOTES
// ============================================
router.post('/voice/process', requireRole([ROLES.SUPER_ADMIN, ROLES.CLINIC_ADMIN, ROLES.DOCTOR]), async (req, res, next) => {
  try {
    const db = req.db;
    const clinicId = req.clinicId;
    const { text, consultationId } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    const aiService = new AIService(db);
    
    const extractedData = await aiService.extractMedicalInfo(text);
    const soap = await aiService.generateSOAP(extractedData);

    // Save AI session to database (optional)
    // await db('ai_sessions').insert({ ... });

    res.json({
      success: true,
      data: {
        extracted: extractedData,
        soap: soap,
        processed_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Voice processing error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// ============================================
// SUGGEST DIAGNOSIS
// ============================================
router.post('/suggest/diagnosis', requireRole([ROLES.SUPER_ADMIN, ROLES.CLINIC_ADMIN, ROLES.DOCTOR]), async (req, res, next) => {
  try {
    const db = req.db;
    const { symptoms, age, gender } = req.body;

    if (!symptoms) {
      return res.status(400).json({ error: 'Symptoms are required' });
    }

    const aiService = new AIService(db);
    const suggestions = await aiService.suggestDiagnosis(symptoms, age, gender);

    res.json({
      success: true,
      data: suggestions
    });

  } catch (error) {
    console.error('Diagnosis suggestion error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// ============================================
// SUGGEST TREATMENT
// ============================================
router.post('/suggest/treatment', requireRole([ROLES.SUPER_ADMIN, ROLES.CLINIC_ADMIN, ROLES.DOCTOR]), async (req, res, next) => {
  try {
    const db = req.db;
    const { diagnosis, allergies, age, weight } = req.body;

    if (!diagnosis) {
      return res.status(400).json({ error: 'Diagnosis is required' });
    }

    const aiService = new AIService(db);
    const suggestions = await aiService.suggestTreatment(diagnosis, allergies, age, weight);

    res.json({
      success: true,
      data: suggestions
    });

  } catch (error) {
    console.error('Treatment suggestion error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// ============================================
// CHECK DRUG INTERACTIONS
// ============================================
router.post('/check/interactions', requireRole([ROLES.SUPER_ADMIN, ROLES.CLINIC_ADMIN, ROLES.DOCTOR, ROLES.PHARMACIST]), async (req, res, next) => {
  try {
    const db = req.db;
    const { currentMedications, newMedication } = req.body;

    if (!currentMedications || !newMedication) {
      return res.status(400).json({ error: 'Current medications and new medication are required' });
    }

    const aiService = new AIService(db);
    const interactions = await aiService.checkInteractions(currentMedications, newMedication);

    res.json({
      success: true,
      data: interactions
    });

  } catch (error) {
    console.error('Interaction check error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// ============================================
// GENERATE CONSULTATION SUMMARY
// ============================================
router.post('/summary', requireRole([ROLES.SUPER_ADMIN, ROLES.CLINIC_ADMIN, ROLES.DOCTOR]), async (req, res, next) => {
  try {
    const db = req.db;
    const { consultationId } = req.body;

    if (!consultationId) {
      return res.status(400).json({ error: 'Consultation ID is required' });
    }

    const consultation = await db('consultations')
      .where({ id: consultationId })
      .first();

    if (!consultation) {
      return res.status(404).json({ error: 'Consultation not found' });
    }

    const aiService = new AIService(db);
    const summary = await aiService.generateSummary(consultation);

    res.json({
      success: true,
      data: { summary }
    });

  } catch (error) {
    console.error('Summary generation error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// ============================================
// GET HEALTH ADVICE
// ============================================
router.post('/health/advice', requireRole([ROLES.SUPER_ADMIN, ROLES.CLINIC_ADMIN, ROLES.DOCTOR]), async (req, res, next) => {
  try {
    const db = req.db;
    const { condition, age, language } = req.body;

    if (!condition) {
      return res.status(400).json({ error: 'Condition is required' });
    }

    const aiService = new AIService(db);
    const advice = await aiService.getHealthAdvice(condition, age, language);

    res.json({
      success: true,
      data: advice
    });

  } catch (error) {
    console.error('Health advice error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

module.exports = router;
