// Emergency Super Admin Recovery
const bcrypt = require('bcryptjs');

const knexConfig = require('./knexfile');
const environment = process.env.NODE_ENV || 'development';
const knex = require('knex')(knexConfig[environment]);

async function recover() {
  const email = 'lerrickmushasha@gmail.com';
  const newPassword = process.argv[2] || 'wxyz4150';
  
  const hash = await bcrypt.hash(newPassword, 10);
  const user = await knex('users').where({ email }).first();
  
  if (!user) {
    console.log('Creating super admin...');
    const { v4: uuidv4 } = require('uuid');
    await knex('users').insert({
      id: uuidv4(),
      email,
      password_hash: hash,
      first_name: 'Super',
      last_name: 'Admin',
      role: 'SUPER_ADMIN',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    });
  } else {
    await knex('users').where({ email }).update({
      password_hash: hash,
      role: 'SUPER_ADMIN',
      is_active: true
    });
  }
  
  console.log('Super admin recovered!');
  console.log('Email:', email);
  console.log('Password:', newPassword);
  process.exit();
}

recover();