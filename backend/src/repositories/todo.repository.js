'use strict';

const { query } = require('../db/pool');

const TODO_SELECT = `
  SELECT t.id, t.user_id, t.title, t.description, t.status,
         t.due_date, t.category_id, t.created_at, t.completed_at,
         c.id AS cat_id, c.name AS cat_name
  FROM todo t
  LEFT JOIN category c ON t.category_id = c.id
`;

async function createTodo(userId, title, description, dueDate, categoryId) {
  const { rows } = await query(
    `WITH inserted AS (
       INSERT INTO todo (user_id, title, description, due_date, category_id, status)
       VALUES ($1, $2, $3, $4, $5, 'in_progress')
       RETURNING *
     )
     SELECT i.*, c.id AS cat_id, c.name AS cat_name
     FROM inserted i
     LEFT JOIN category c ON i.category_id = c.id`,
    [userId, title, description ?? null, dueDate ?? null, categoryId ?? null]
  );
  return rows[0];
}

async function findTodoById(id) {
  const { rows } = await query(`${TODO_SELECT} WHERE t.id = $1`, [id]);
  return rows[0] ?? null;
}

async function findTodosByUserId(userId, { status, categoryId, uncategorized, overdue } = {}) {
  const conditions = ['t.user_id = $1'];
  const params = [userId];
  let paramIndex = 2;

  if (status) {
    conditions.push(`t.status = $${paramIndex++}::todo_status`);
    params.push(status);
  }

  if (categoryId) {
    conditions.push(`t.category_id = $${paramIndex++}`);
    params.push(categoryId);
  }

  if (uncategorized) {
    conditions.push('t.category_id IS NULL');
  }

  if (overdue) {
    conditions.push(`t.due_date < CURRENT_DATE`);
    if (!status) {
      conditions.push(`t.status = 'in_progress'::todo_status`);
    }
  }

  const whereClause = conditions.length > 1 ? conditions.join(' AND ') : '1=1';
  const { rows } = await query(
    `${TODO_SELECT} WHERE ${whereClause} ORDER BY t.created_at DESC`,
    params
  );
  return rows;
}

async function updateTodo(id, title, description, dueDate, categoryId) {
  const { rows } = await query(
    `WITH updated AS (
       UPDATE todo
       SET title = $1, description = $2, due_date = $3, category_id = $4
       WHERE id = $5
       RETURNING *
     )
     SELECT u.*, c.id AS cat_id, c.name AS cat_name
     FROM updated u
     LEFT JOIN category c ON u.category_id = c.id`,
    [title, description ?? null, dueDate ?? null, categoryId ?? null, id]
  );
  return rows[0] ?? null;
}

async function deleteTodo(id) {
  const result = await query('DELETE FROM todo WHERE id = $1', [id]);
  return result.rowCount > 0;
}

async function updateTodoStatus(id, status) {
  const completedAt = status === 'done' ? 'NOW()' : 'NULL';
  const { rows } = await query(
    `WITH updated AS (
       UPDATE todo
       SET status = $1::todo_status, completed_at = ${completedAt}
       WHERE id = $2
       RETURNING *
     )
     SELECT u.*, c.id AS cat_id, c.name AS cat_name
     FROM updated u
     LEFT JOIN category c ON u.category_id = c.id`,
    [status, id]
  );
  return rows[0] ?? null;
}

module.exports = { createTodo, findTodoById, findTodosByUserId, updateTodo, deleteTodo, updateTodoStatus };
