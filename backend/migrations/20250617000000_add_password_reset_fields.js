exports.up = async function(knex) {
  await knex.schema.table('users', (table) => {
    table.string('reset_token', 255);
    table.timestamp('reset_token_expiry');
    table.timestamp('email_verified_at');
    table.boolean('is_email_verified').defaultTo(false);
  });
};

exports.down = async function(knex) {
  await knex.schema.table('users', (table) => {
    table.dropColumn('reset_token');
    table.dropColumn('reset_token_expiry');
    table.dropColumn('email_verified_at');
    table.dropColumn('is_email_verified');
  });
};