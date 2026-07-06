exports.up = async function(knex) {
  // Create lab_orders table
  const hasLabOrders = await knex.schema.hasTable('lab_orders');
  if (!hasLabOrders) {
    await knex.schema.createTable('lab_orders', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('clinic_id').notNullable().references('id').inTable('clinics').onDelete('CASCADE');
      table.uuid('patient_id').notNullable().references('id').inTable('patients').onDelete('CASCADE');
      table.uuid('consultation_id').references('id').inTable('consultations').onDelete('SET NULL');
      table.string('test_name', 255).notNullable();
      table.string('test_code', 50);
      table.string('test_category', 100);
      table.string('priority', 20).defaultTo('routine');
      table.string('status', 20).defaultTo('pending');
      table.uuid('ordered_by').references('id').inTable('users').onDelete('SET NULL');
      table.timestamp('ordered_date').defaultTo(knex.fn.now());
      table.boolean('fasting_required').defaultTo(false);
      table.text('clinical_notes');
      table.jsonb('result_data');
      table.text('result_notes');
      table.uuid('resulted_by').references('id').inTable('users').onDelete('SET NULL');
      table.timestamp('resulted_date');
      table.boolean('is_abnormal').defaultTo(false);
      table.specificType('abnormal_flags', 'text[]');
      table.uuid('reviewed_by').references('id').inTable('users').onDelete('SET NULL');
      table.timestamp('reviewed_date');
      table.decimal('amount_due', 10, 2).defaultTo(0);
      table.boolean('billed').defaultTo(false);
      table.uuid('bill_id');
      table.boolean('sample_collected').defaultTo(false);
      table.uuid('sample_collected_by').references('id').inTable('users').onDelete('SET NULL');
      table.timestamp('sample_collected_date');
      table.timestamps(true, true);
    });

    await knex.schema.raw(`
      CREATE INDEX idx_lab_orders_clinic_id ON lab_orders(clinic_id);
      CREATE INDEX idx_lab_orders_patient_id ON lab_orders(patient_id);
      CREATE INDEX idx_lab_orders_status ON lab_orders(status);
      CREATE INDEX idx_lab_orders_priority ON lab_orders(priority);
    `);
  }

  // Create lab_results table
  const hasLabResults = await knex.schema.hasTable('lab_results');
  if (!hasLabResults) {
    await knex.schema.createTable('lab_results', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('order_id').notNullable().references('id').inTable('lab_orders').onDelete('CASCADE');
      table.string('test_name', 255);
      table.string('parameter', 100);
      table.string('value', 100);
      table.string('unit', 20);
      table.string('reference_min', 20);
      table.string('reference_max', 20);
      table.boolean('is_abnormal').defaultTo(false);
      table.string('flag', 20);
      table.text('notes');
      table.timestamps(true, true);
    });

    await knex.schema.raw(`
      CREATE INDEX idx_lab_results_order_id ON lab_results(order_id);
    `);
  }

  // Create lab_catalog table
  const hasLabCatalog = await knex.schema.hasTable('lab_catalog');
  if (!hasLabCatalog) {
    await knex.schema.createTable('lab_catalog', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('clinic_id').references('id').inTable('clinics').onDelete('CASCADE');
      table.string('name', 255).notNullable();
      table.string('code', 50).notNullable();
      table.string('category', 100);
      table.string('turnaround', 50);
      table.decimal('price', 10, 2).defaultTo(0);
      table.jsonb('reference_ranges');
      table.boolean('is_active').defaultTo(true);
      table.boolean('is_system').defaultTo(false);
      table.timestamps(true, true);
    });

    await knex.schema.raw(`
      CREATE INDEX idx_lab_catalog_clinic_id ON lab_catalog(clinic_id);
      CREATE INDEX idx_lab_catalog_code ON lab_catalog(code);
    `);
  }
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('lab_results');
  await knex.schema.dropTableIfExists('lab_catalog');
  await knex.schema.dropTableIfExists('lab_orders');
};