exports.up = async function(knex) {
  const exists = await knex.schema.hasTable('consultations');
  if (!exists) {
    await knex.schema.createTable('consultations', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('clinic_id').notNullable().references('id').inTable('clinics').onDelete('CASCADE');
      table.uuid('patient_id').notNullable().references('id').inTable('patients').onDelete('CASCADE');
      table.uuid('doctor_id').references('id').inTable('users').onDelete('SET NULL');
      table.timestamp('consultation_date').defaultTo(knex.fn.now());
      table.text('chief_complaint');
      table.text('history_of_presenting_illness');
      table.jsonb('review_of_systems');
      table.jsonb('physical_examination');
      table.text('diagnosis');
      table.text('differential_diagnosis');
      table.text('treatment_plan');
      table.text('follow_up_plan');
      table.decimal('amount_due', 10, 2).defaultTo(0);
      table.jsonb('prescriptions').defaultTo('[]');
      table.jsonb('vitals');
      table.text('notes');
      table.string('status', 20).defaultTo('completed');
      table.timestamps(true, true);
    });
    
    await knex.schema.raw(`
      CREATE INDEX idx_consultations_patient_id ON consultations(patient_id);
      CREATE INDEX idx_consultations_clinic_id ON consultations(clinic_id);
      CREATE INDEX idx_consultations_date ON consultations(consultation_date);
    `);
  }
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('consultations');
};