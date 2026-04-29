'use strict';

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  statement_cache: 0,
});

pool.on('error', (err) => {
  console.error('[db] 유휴 클라이언트 오류:', err);
});

async function query(text, params) {
  return pool.query(text, params);
}

module.exports = { pool, query };
