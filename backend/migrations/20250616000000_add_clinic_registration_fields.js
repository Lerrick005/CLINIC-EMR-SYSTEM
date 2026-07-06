exports.up = async function(knex) {
  // Check if columns exist and add them if not
  const hasPlanType = await knex.schema.hasColumn('clinics', 'plan_type');
  const hasStatus = await knex.schema.hasColumn('clinics', 'status');
  const hasRegistrationDate = await knex.schema.hasColumn('clinics', 'registration_date');

  await knex.schema.table('clinics', (table) => {
    if (!hasPlanType) {
      table.string('plan_type', 50).defaultTo('free').comment('free, basic, premium');
    }
    if (!hasStatus) {
      table.string('status', 50).defaultTo('active').comment('active, suspended, expired');
    }
    if (!hasRegistrationDate) {
      table.timestamp('registration_date').defaultTo(knex.fn.now());
    }
  });
};

exports.down = async function(knex) {
  await knex.schema.table('clinics', (table) => {
    table.dropColumn('plan_type');
    table.dropColumn('status');
    table.dropColumn('registration_date');
  });
};