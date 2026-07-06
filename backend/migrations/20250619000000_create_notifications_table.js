exports.up = async function(knex) {
  const exists = await knex.schema.hasTable('notifications');
  if (!exists) {
    await knex.schema.createTable('notifications', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('clinic_id').notNullable().references('id').inTable('clinics').onDelete('CASCADE');
      table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
      table.string('title', 255);
      table.text('message');
      table.string('type', 50);
      table.uuid('reference_id');
      table.string('reference_type', 50);
      table.boolean('is_read').defaultTo(false);
      table.timestamps(true, true);
    });

    await knex.schema.raw(`
      CREATE INDEX idx_notifications_user_id ON notifications(user_id);
      CREATE INDEX idx_notifications_clinic_id ON notifications(clinic_id);
      CREATE INDEX idx_notifications_is_read ON notifications(is_read);
    `);
  }
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('notifications');
};