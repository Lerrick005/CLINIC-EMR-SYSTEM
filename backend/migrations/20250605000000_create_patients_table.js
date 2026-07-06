exports.up = async function(knex) {
    // Check if table exists – if not, create it
    const exists = await knex.schema.hasTable('patients');
    if (!exists) {
      await knex.schema.createTable('patients', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
        table.uuid('clinic_id').notNullable().references('id').inTable('clinics').onDelete('CASCADE');
        table.string('medical_no', 50).unique();
        table.string('first_name', 100).notNullable();
        table.string('last_name', 100).notNullable();
        table.date('date_of_birth');
        table.string('gender', 10).checkIn(['Male', 'Female', 'Other']);
        table.string('phone', 50);
        table.string('email', 255);
        table.text('address');
        table.string('emergency_contact_name', 255);
        table.string('emergency_contact_phone', 50);
        table.uuid('pcp_doctor_id').references('id').inTable('users').onDelete('SET NULL');
        table.boolean('is_active').defaultTo(true);
        table.timestamps(true, true);
      });
      await knex.schema.raw(`
        CREATE INDEX idx_patients_clinic_id ON patients(clinic_id);
        CREATE INDEX idx_patients_medical_no ON patients(medical_no);
        CREATE INDEX idx_patients_name ON patients(last_name, first_name);
      `);
    } else {
      // If table exists, add missing columns (optional, but safe)
      const hasMedicalNo = await knex.schema.hasColumn('patients', 'medical_no');
      if (!hasMedicalNo) await knex.schema.table('patients', (table) => {
        table.string('medical_no', 50).unique();
      });
      // Add other columns if needed...
    }
  };
  
  exports.down = async function(knex) {
    await knex.schema.dropTableIfExists('patients');
  };