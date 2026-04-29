'use strict';

const { query } = require('../db/pool');

async function findUserByEmail(email) {
  const { rows } = await query(
    'SELECT id, email, created_at FROM "user" WHERE email = $1',
    [email]
  );
  return rows[0] ?? null;
}

async function findUserForAuth(email) {
  const { rows } = await query(
    'SELECT id, email, password_hash, created_at FROM "user" WHERE email = $1',
    [email]
  );
  return rows[0] ?? null;
}

async function createUser(email, passwordHash) {
  const { rows } = await query(
    'INSERT INTO "user" (email, password_hash) VALUES ($1, $2) RETURNING id, email, created_at',
    [email, passwordHash]
  );
  return rows[0];
}

module.exports = { findUserByEmail, findUserForAuth, createUser };
