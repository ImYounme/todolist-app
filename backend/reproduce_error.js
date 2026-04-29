'use strict';

require('dotenv').config();
const { query } = require('./src/db/pool');

async function testConnection() {
  try {
    console.log('Testing connection and querying "user" table...');
    const result = await query('SELECT * FROM "user" LIMIT 1');
    console.log('Successfully queried "user" table:', result.rows);
    
    console.log('Testing query on "users" table (expected to fail)...');
    await query('SELECT * FROM users LIMIT 1');
  } catch (err) {
    console.error('Caught expected error or unexpected error:', err.message);
  } finally {
    process.exit(0);
  }
}

testConnection();
