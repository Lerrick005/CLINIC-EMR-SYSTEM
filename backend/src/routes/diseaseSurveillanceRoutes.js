const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { tenantContext } = require('../middleware/tenantContext');

router.use(tenantContext);

const adultDiseases = [
  'Diarrhoea', 'DIARRHOEA', 'Tuberculosis', 'Dysentery', 'Cholera',
  'Meningococcal Meningitis', 'Other Meningitis', 'Tetanus', 'Poliomyelitis',
  'Chicken Pox', 'Measles', 'Hepatitis', 'Mumps',
  'Suspected Malaria', 'Confirmed Malaria', 'Malaria', 'MALARIA',
  'Malaria in Pregnancy', 'Amoebiasis', 'Typhoid Fever', 'Typhoid', 'typhoid',
  'Sexually Transmitted Infection', 'Urinary Tract Infection',
  'Bilharzia', 'Intestinal Worms', 'Malnutrition',
  'Anaemia', 'Eye Infection', 'Ear Infection', 'Upper Respiratory Tract Infection',
  'Asthma', 'Pneumonia', 'Other Lower Respiratory Tract Infection', 'Abortion',
  'Hypertension', 'Mental Disorders', 'Dental Disorders',
  'Jiggers Infestation', 'Diseases of the Skin', 'Arthritis', 'Poisoning',
  'Road Traffic Injuries', 'Other Injuries', 'Sexual Violence',
  'Violence Related Injuries', 'Burns', 'Snake Bites', 'Dog Bites', 'Other Bites',
  'Diabetes', 'Epilepsy', 'Brucellosis', 'Cardiovascular Conditions',
  'Central Nervous System Disorders', 'Overweight', 'Musculoskeletal Conditions',
  'Fistula', 'Suspected Neoplasms', 'Physical Disability', 'Trypanosomiasis',
  'Rift Valley Fever', 'Yellow Fever', 'Viral Hemorrhagic Fever', 'Chikungunya',
  'Dengue Fever', 'Leishmaniasis', 'Cutaneous Leishmaniasis',
  'Suspected Anthrax', 'All Other Diseases'
];

const childrenDiseases = [
  'Diarrhoea', 'DIARRHOEA', 'Cholera', 'Dysentery', 'Gastroenteritis',
  'Pneumonia', 'Severe Pneumonia', 'Upper Respiratory Tract Infections',
  'Lower Respiratory Tract Infections', 'Asthma', 'Presumed Tuberculosis',
  'Suspected Malaria', 'Tested for Malaria', 'Confirmed Malaria', 'Malaria', 'MALARIA',
  'Measles', 'Malnutrition', 'Anaemia', 'Diarrhoea with Dehydration',
  'Ear Infection', 'Eye Infection', 'Skin Disease', 'Intestinal Worms',
  'Urinary Tract Infection', 'Neonatal Sepsis',
  'Other Neonatal Conditions', 'Birth asphyxia', 'Low birth weight',
  'Cerebral Palsy', 'Downs Syndrome', 'Autism', 'Other Congenital Abnormalities',
  'Rickets', 'Jiggers Infestation',
  'Meningococcal Meningitis', 'Other Meningitis', 'Tetanus', 'Neonatal Tetanus',
  'Poliomyelitis', 'Chicken Pox', 'Hepatitis', 'Mumps', 'Rubella',
  'Whooping Cough', 'Diphtheria', 'Amoebiasis', 'Typhoid Fever', 'Typhoid', 'typhoid',
  'Brucellosis', 'Leishmaniasis', 'Trypanosomiasis', 'Bilharzia',
  'Hydatid Disease', 'Rabies', 'Anthrax', 'Plague', 'Relapsing Fever',
  'Scabies', 'Ringworm', 'Pediculosis', 'Dental Disorders',
  'Eye Infections', 'Ear Infections', 'Poisoning', 'Burns', 'Fractures',
  'Other Injuries', 'Road Traffic Injuries', 'Dog Bites', 'Snake Bites',
  'Other Bites', 'Malaria in Pregnancy', 'All Other Diseases'
];

// POST /api/disease-surveillance/auto-sync
router.post('/auto-sync', async (req, res, next) => {
  try {
    const db = req.db;
    const clinicId = req.clinicId;
    const { month, year } = req.body;

    console.log('🔍 AUTO-SYNC - Clinic:', clinicId, 'Month:', month, 'Year:', year);

    const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    const monthIndex = monthNames.indexOf(month) + 1;

    await db('disease_surveillance')
      .where({ clinic_id: clinicId })
      .whereRaw('EXTRACT(MONTH FROM diagnosis_date) = ?', [monthIndex])
      .whereRaw('EXTRACT(YEAR FROM diagnosis_date) = ?', [parseInt(year)])
      .del();

    const consultations = await db('consultations')
      .where({ 'consultations.clinic_id': clinicId })
      .whereNotNull('diagnosis')
      .where('diagnosis', '!=', '')
      .whereRaw('EXTRACT(MONTH FROM consultation_date) = ?', [monthIndex])
      .whereRaw('EXTRACT(YEAR FROM consultation_date) = ?', [parseInt(year)])
      .leftJoin('patients', 'consultations.patient_id', 'patients.id')
      .select(
        'consultations.id as consultation_id',
        'consultations.diagnosis',
        'consultations.consultation_date',
        'patients.id as patient_id',
        'patients.date_of_birth',
        'patients.gender'
      );

    let matchedCount = 0;

    for (const c of consultations) {
      let age = 0;
      let isAdult = true;

      if (c.date_of_birth) {
        const dob = new Date(c.date_of_birth);
        const consultationDate = new Date(c.consultation_date);
        age = consultationDate.getFullYear() - dob.getFullYear();
        const monthDiff = consultationDate.getMonth() - dob.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && consultationDate.getDate() < dob.getDate())) {
          age--;
        }
        isAdult = age >= 18;
      }

      const diagnosis = c.diagnosis;
      const diseaseList = isAdult ? adultDiseases : childrenDiseases;
      let matchedDisease = null;
      const diagnosisLower = diagnosis.toLowerCase().trim();

      for (const d of diseaseList) {
        if (d.toLowerCase().trim() === diagnosisLower) {
          matchedDisease = d;
          break;
        }
      }

      if (!matchedDisease) {
        for (const d of diseaseList) {
          const diseaseLower = d.toLowerCase().trim();
          if (diagnosisLower.includes(diseaseLower) || diseaseLower.includes(diagnosisLower)) {
            matchedDisease = d;
            break;
          }
        }
      }

      if (matchedDisease) {
        matchedCount++;
        await db('disease_surveillance').insert({
          id: uuidv4(),
          clinic_id: clinicId,
          consultation_id: c.consultation_id,
          patient_id: c.patient_id,
          disease_name: matchedDisease,
          age_group: isAdult ? 'ADULT' : 'CHILD',
          gender: c.gender || 'UNKNOWN',
          diagnosis_date: c.consultation_date,
          reported_date: new Date(),
          is_outbreak: false,
          status: 'ACTIVE',
          created_at: new Date(),
          updated_at: new Date()
        });
      }
    }

    res.json({
      success: true,
      totalConsultations: consultations.length,
      matchedConsultations: matchedCount,
      message: 'Synced ' + consultations.length + ' consultations, saved ' + matchedCount + ' records'
    });

  } catch (err) {
    console.error('Auto-sync error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/disease-surveillance/data
router.get('/data', async (req, res, next) => {
  try {
    const db = req.db;
    const clinicId = req.clinicId;
    const { month, year, ageGroup } = req.query;

    const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    const monthIndex = monthNames.indexOf(month) + 1;

    let query = db('disease_surveillance')
      .where({ clinic_id: clinicId })
      .whereRaw('EXTRACT(MONTH FROM diagnosis_date) = ?', [monthIndex])
      .whereRaw('EXTRACT(YEAR FROM diagnosis_date) = ?', [parseInt(year)]);

    if (ageGroup && ageGroup !== 'all' && ageGroup !== 'undefined') {
      query = query.where({ age_group: ageGroup });
    }

    const data = await query;

    res.json({
      success: true,
      data: data,
      count: data.length
    });

  } catch (err) {
    console.error('Error fetching surveillance data:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
