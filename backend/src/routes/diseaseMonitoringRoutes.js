const express = require('express');
const router = express.Router();
const { tenantContext } = require('../middleware/tenantContext');

router.use(tenantContext);

function getMonthName(monthNumber) {
    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[monthNumber - 1];
}

function formatTime(dateString) {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });
}

// GET: Monthly summary
router.get('/monthly-summary', async (req, res) => {
    try {
        const db = req.db;
        const clinicId = req.clinicId;
        const { year, month } = req.query;

        const consultations = await db('consultations')
            .where({ clinic_id: clinicId })
            .whereRaw('EXTRACT(YEAR FROM consultation_date) = ?', [parseInt(year)])
            .whereRaw('EXTRACT(MONTH FROM consultation_date) = ?', [parseInt(month)])
            .whereNotNull('diagnosis')
            .where('diagnosis', '!=', '')
            .where('diagnosis', '!=', 'null')
            .orderBy('consultation_date', 'asc')
            .select('id', 'consultation_date', 'diagnosis');

        const daysMap = {};

        consultations.forEach(function(consultation) {
            const consultDate = new Date(consultation.consultation_date);
            const day = consultDate.getDate();
            const diagnosis = consultation.diagnosis || 'Unknown';

            if (!daysMap[day]) {
                daysMap[day] = {
                    day: day,
                    totalCases: 0,
                    diseases: {}
                };
            }

            daysMap[day].totalCases += 1;

            if (daysMap[day].diseases[diagnosis]) {
                daysMap[day].diseases[diagnosis] += 1;
            } else {
                daysMap[day].diseases[diagnosis] = 1;
            }
        });

        const daysArray = Object.keys(daysMap).map(function(day) {
            const dayData = daysMap[day];
            const diseasesArray = Object.keys(dayData.diseases).map(function(name) {
                return { name: name, count: dayData.diseases[name] };
            });
            return {
                day: parseInt(day),
                totalCases: dayData.totalCases,
                diseases: diseasesArray
            };
        });

        daysArray.sort(function(a, b) { return a.day - b.day; });

        const daysInMonth = new Date(parseInt(year), parseInt(month), 0).getDate();
        const completeDaysArray = [];
        const daysArrayMap = {};
        daysArray.forEach(function(d) { daysArrayMap[d.day] = d; });

        for (let d = 1; d <= daysInMonth; d++) {
            if (daysArrayMap[d]) {
                completeDaysArray.push(daysArrayMap[d]);
            } else {
                completeDaysArray.push({ day: d, totalCases: 0, diseases: [] });
            }
        }

        res.json({
            success: true,
            year: parseInt(year),
            month: parseInt(month),
            monthName: getMonthName(parseInt(month)),
            days: completeDaysArray,
            totalCases: consultations.length
        });

    } catch (error) {
        console.error('Error fetching monthly summary:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET: Detailed diseases for a specific day
router.get('/day-details', async (req, res) => {
    try {
        const db = req.db;
        const clinicId = req.clinicId;
        const { year, month, day } = req.query;

        const consultations = await db('consultations')
            .where({ 'consultations.clinic_id': clinicId })
            .whereRaw('EXTRACT(YEAR FROM consultation_date) = ?', [parseInt(year)])
            .whereRaw('EXTRACT(MONTH FROM consultation_date) = ?', [parseInt(month)])
            .whereRaw('EXTRACT(DAY FROM consultation_date) = ?', [parseInt(day)])
            .whereNotNull('diagnosis')
            .where('diagnosis', '!=', '')
            .where('diagnosis', '!=', 'null')
            .leftJoin('patients', 'consultations.patient_id', 'patients.id')
            .leftJoin('users as doctor', 'consultations.doctor_id', 'doctor.id')
            .select(
                'consultations.id',
                'consultations.consultation_date',
                'consultations.diagnosis',
                'consultations.treatment_plan',
                'consultations.amount_due',
                'patients.first_name as patient_first_name',
                'patients.last_name as patient_last_name',
                'patients.date_of_birth',
                'patients.gender',
                'patients.phone',
                'doctor.first_name as doctor_first_name',
                'doctor.last_name as doctor_last_name'
            )
            .orderBy('consultation_date', 'asc');

        function calculateAge(dob) {
            if (!dob) return '—';
            const birthDate = new Date(dob);
            const today = new Date();
            let age = today.getFullYear() - birthDate.getFullYear();
            const m = today.getMonth() - birthDate.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                age--;
            }
            return age;
        }

        const diseasesWithDetails = consultations.map(function(consultation) {
            const diagnosis = consultation.diagnosis || 'Unknown';
            const firstName = consultation.patient_first_name || '';
            const lastName = consultation.patient_last_name || '';
            const patientName = (firstName + ' ' + lastName).trim() || '—';
            const patientAge = consultation.date_of_birth ? calculateAge(consultation.date_of_birth) : '—';
            const doctorName = consultation.doctor_first_name ?
                'Dr. ' + consultation.doctor_first_name + ' ' + consultation.doctor_last_name : '—';
            const consultationTime = consultation.consultation_date;

            return {
                name: diagnosis,
                time: formatTime(consultationTime),
                patientName: patientName,
                age: patientAge,
                doctorName: doctorName,
                amount: consultation.amount_due || 0
            };
        });

        res.json({
            success: true,
            year: parseInt(year),
            month: parseInt(month),
            day: parseInt(day),
            diseases: diseasesWithDetails,
            totalCases: diseasesWithDetails.length
        });

    } catch (error) {
        console.error('Error fetching day details:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET: Available years
router.get('/available-years', async (req, res) => {
    try {
        const db = req.db;
        const clinicId = req.clinicId;

        const results = await db('consultations')
            .where({ clinic_id: clinicId })
            .select(db.raw('DISTINCT EXTRACT(YEAR FROM consultation_date) as year'))
            .whereNotNull('consultation_date')
            .orderBy('year', 'desc');

        const years = results.map(function(row) { return parseInt(row.year); });

        res.json({
            success: true,
            years: years.length > 0 ? years : [new Date().getFullYear()]
        });

    } catch (error) {
        console.error('Error fetching available years:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
