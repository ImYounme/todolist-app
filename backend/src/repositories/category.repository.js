'use strict';

const { query } = require('../db/pool');

async function findCategoriesByUserId(userId) {
  const { rows } = await query(
    'SELECT id, name, created_at FROM category WHERE user_id = $1 ORDER BY created_at ASC',
    [userId]
  );
  return rows;
}

async function findCategoryById(id) {
  const { rows } = await query(
    'SELECT id, user_id, name, created_at FROM category WHERE id = $1',
    [id]
  );
  return rows[0] ?? null;
}

async function countCategoriesByUserId(userId) {
  const { rows } = await query(
    'SELECT COUNT(*) AS count FROM category WHERE user_id = $1',
    [userId]
  );
  return parseInt(rows[0].count, 10);
}

async function existsCategoryByUserIdAndName(userId, name, excludeId = null) {
  const { rows } = await query(
    'SELECT id FROM category WHERE user_id = $1 AND name = $2 AND ($3::int IS NULL OR id != $3)',
    [userId, name, excludeId]
  );
  return rows.length > 0;
}

async function createCategory(userId, name) {
  const { rows } = await query(
    'INSERT INTO category (user_id, name) VALUES ($1, $2) RETURNING id, name, created_at',
    [userId, name]
  );
  return rows[0];
}

async function updateCategory(id, name) {
  const { rows } = await query(
    'UPDATE category SET name = $1 WHERE id = $2 RETURNING id, name, created_at',
    [name, id]
  );
  return rows[0];
}

async function countTodosInCategory(categoryId) {
  const { rows } = await query(
    'SELECT COUNT(*) AS count FROM todo WHERE category_id = $1',
    [categoryId]
  );
  return parseInt(rows[0].count, 10);
}

async function deleteCategory(id) {
  await query('DELETE FROM category WHERE id = $1', [id]);
}

module.exports = {
  findCategoriesByUserId,
  findCategoryById,
  countCategoriesByUserId,
  existsCategoryByUserIdAndName,
  createCategory,
  updateCategory,
  countTodosInCategory,
  deleteCategory,
};
