exports.up = async function(knex) {
    // Enable UUID extension
    await knex.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
  
    // Clinics table
    await knex.schema.createTable('clinics', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.string('name', 255).notNullable();
      table.string('mfl_code', 50).unique();
      table.text('address');
      table.string('phone', 50);
      table.string('email', 255);
      table.string('county', 100);
      table.string('subcounty', 100);
      table.string('ward', 100);
      table.text('logo_url');
      table.boolean('is_active').defaultTo(true);
      table.jsonb('settings').defaultTo('{}');
      table.timestamps(true, true);
    });
  
    // Users table
    await knex.schema.createTable('users', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('clinic_id').references('id').inTable('clinics').onDelete('CASCADE');
      table.string('email', 255).unique().notNullable();
      table.text('password_hash').notNullable();
      table.string('first_name', 100);
      table.string('last_name', 100);
      table.string('role', 50).notNullable()
        .checkIn(['SUPER_ADMIN', 'CLINIC_ADMIN', 'DOCTOR', 'RECEPTIONIST', 'PHARMACIST', 'LAB_STAFF', 'ACCOUNTANT']);
      table.boolean('is_active').defaultTo(true);
      table.boolean('must_change_password').defaultTo(false);
      table.timestamp('last_login');
      table.text('refresh_token_hash'); // hashed refresh token
      table.timestamps(true, true);
    });
  
    // System settings (global + per clinic)
    await knex.schema.createTable('system_settings', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('clinic_id').references('id').inTable('clinics').onDelete('CASCADE');
      table.string('key', 255).notNullable();
      table.jsonb('value');
      table.unique(['clinic_id', 'key']);
    });
  
    // Setup completion flag (stored as global setting)
    await knex('system_settings').insert({
      id: knex.raw('gen_random_uuid()'),
      clinic_id: null,
      key: 'system.setup_complete',
      value: JSON.stringify(false)
    });
  };
  
  exports.down = async function(knex) {
    await knex.schema.dropTableIfExists('system_settings');
    await knex.schema.dropTableIfExists('users');
    await knex.schema.dropTableIfExists('clinics');
  };