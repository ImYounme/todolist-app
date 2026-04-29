'use strict';

const { query } = require('../db/pool');

async function findUserById(id) {
  const { rows } = await query(
    'SELECT id, email, created_at FROM "user" WHERE id = $1',
    [id]
  );
  return rows[0] ?? null;
}

module.exports = { findUserById };
