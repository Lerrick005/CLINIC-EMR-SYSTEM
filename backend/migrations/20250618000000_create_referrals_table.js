exports.up = async function(knex) {
  const exists = await knex.schema.hasTable('referrals');
  if (!exists) {
    await knex.schema.createTable('referrals', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('clinic_id').notNullable().references('id').inTable('clinics').onDelete('CASCADE');
      table.uuid('patient_id').notNullable().references('id').inTable('patients').onDelete('CASCADE');
      table.uuid('consultation_id').references('id').inTable('consultations').onDelete('SET NULL');
      table.uuid('referring_doctor_id').references('id').inTable('users').onDelete('SET NULL');
      table.string('referral_no', 50).unique();
      table.text('past_medical_history');
      table.text('past_surgical_history');
      table.text('obstetric_history');
      table.text('current_diagnosis');
      table.text('investigations_done');
      table.text('investigation_results');
      table.text('reason_for_referral');
      table.text('clinical_summary');
      table.string('urgency', 20).defaultTo('routine');
      table.string('referring_clinician_name', 255);
      table.string('referring_clinician_title', 100);
      table.string('referring_clinician_phone', 50);
      table.string('referring_clinician_email', 255);
      table.string('facility_name', 255);
      table.string('department', 100);
      table.string('specialty', 100);
      table.string('facility', 255);
      table.string('doctor_name', 255);
      table.text('notes');
      table.string('status', 20).defaultTo('generated');
      table.timestamps(true, true);
    });

    await knex.schema.raw(`
      CREATE INDEX idx_referrals_clinic_id ON referrals(clinic_id);
      CREATE INDEX idx_referrals_patient_id ON referrals(patient_id);
      CREATE INDEX idx_referrals_status ON referrals(status);
      CREATE INDEX idx_referrals_urgency ON referrals(urgency);
    `);
  }
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('referrals');
};