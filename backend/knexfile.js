require('dotenv').config();

module.exports = {
  development: {
    client: 'pg',
    connection: {
      host: 'localhost',
      port: 5432,
      user: 'postgres',
      password: 'admin123',
      database: 'clinic_emr'
    },
    migrations: {
      directory: './migrations'
    }
  }
};