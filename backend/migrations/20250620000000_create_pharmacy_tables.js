exports.up = async function(knex) {
  // 1. Pharmacy Inventory
  const hasInventory = await knex.schema.hasTable('pharmacy_inventory');
  if (!hasInventory) {
    await knex.schema.createTable('pharmacy_inventory', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('clinic_id').notNullable().references('id').inTable('clinics').onDelete('CASCADE');
      table.string('name', 255).notNullable();
      table.string('generic_name', 255);
      table.string('code', 50).unique();
      table.string('category', 100);
      table.string('form', 50);
      table.string('strength', 50);
      table.string('unit', 20).defaultTo('tablet');
      table.decimal('purchase_price', 10, 2).defaultTo(0);
      table.decimal('selling_price', 10, 2).defaultTo(0);
      table.integer('quantity_in_stock').defaultTo(0);
      table.integer('reorder_level').defaultTo(10);
      table.string('supplier', 255);
      table.date('expiry_date');
      table.boolean('requires_prescription').defaultTo(true);
      table.boolean('is_active').defaultTo(true);
      table.timestamps(true, true);
    });

    await knex.schema.raw(`
      CREATE INDEX idx_pharmacy_inventory_clinic_id ON pharmacy_inventory(clinic_id);
      CREATE INDEX idx_pharmacy_inventory_code ON pharmacy_inventory(code);
    `);
  }

  // 2. Prescriptions
  const hasPrescriptions = await knex.schema.hasTable('prescriptions');
  if (!hasPrescriptions) {
    await knex.schema.createTable('prescriptions', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('clinic_id').notNullable().references('id').inTable('clinics').onDelete('CASCADE');
      table.uuid('patient_id').notNullable().references('id').inTable('patients').onDelete('CASCADE');
      table.uuid('consultation_id').references('id').inTable('consultations').onDelete('SET NULL');
      table.uuid('doctor_id').references('id').inTable('users').onDelete('SET NULL');
      table.string('prescription_no', 50).unique();
      table.string('medication_name', 255).notNullable();
      table.string('dosage', 100);
      table.string('frequency', 50);
      table.string('route', 50);
      table.string('duration', 50);
      table.text('instructions');
      table.integer('quantity').defaultTo(1);
      table.string('status', 20).defaultTo('pending');
      table.uuid('dispensed_by').references('id').inTable('users').onDelete('SET NULL');
      table.timestamp('dispensed_date');
      table.text('dispensing_notes');
      table.timestamps(true, true);
    });

    await knex.schema.raw(`
      CREATE INDEX idx_prescriptions_clinic_id ON prescriptions(clinic_id);
      CREATE INDEX idx_prescriptions_patient_id ON prescriptions(patient_id);
      CREATE INDEX idx_prescriptions_status ON prescriptions(status);
    `);
  }

  // 3. Dispensing History
  const hasDispensing = await knex.schema.hasTable('dispensing_history');
  if (!hasDispensing) {
    await knex.schema.createTable('dispensing_history', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('clinic_id').notNullable().references('id').inTable('clinics').onDelete('CASCADE');
      table.uuid('prescription_id').notNullable().references('id').inTable('prescriptions').onDelete('CASCADE');
      table.uuid('inventory_id').references('id').inTable('pharmacy_inventory').onDelete('SET NULL');
      table.uuid('dispensed_by').references('id').inTable('users').onDelete('SET NULL');
      table.string('medication_name', 255);
      table.integer('quantity_dispensed').defaultTo(1);
      table.string('batch_number', 50);
      table.date('expiry_date');
      table.text('notes');
      table.timestamps(true, true);
    });

    await knex.schema.raw(`
      CREATE INDEX idx_dispensing_history_prescription_id ON dispensing_history(prescription_id);
    `);
  }
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('dispensing_history');
  await knex.schema.dropTableIfExists('prescriptions');
  await knex.schema.dropTableIfExists('pharmacy_inventory');
};