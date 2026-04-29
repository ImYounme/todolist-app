'use strict';

const { ValidationError, NotFoundError, ForbiddenError } = require('../utils/errors');
const { VALIDATION } = require('../constants/validation');
const todoRepository = require('../repositories/todo.repository');
const categoryRepository = require('../repositories/category.repository');

function formatTodo(row) {
  const dueDateStr = formatDateOnly(row.due_date);
  const todayStr = new Date().toISOString().split('T')[0];
  const isOverdue = row.status === 'in_progress' && dueDateStr !== null && dueDateStr < todayStr;

  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    description: row.description ?? null,
    status: row.status,
    dueDate: dueDateStr,
    categoryId: row.category_id ?? null,
    category: row.cat_id ? { id: row.cat_id, name: row.cat_name } : null,
    isOverdue,
    createdAt: row.created_at,
    completedAt: row.completed_at ?? null,
  };
}

function formatDateOnly(value) {
  if (!value) return null;
  if (value instanceof Date) {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  return String(value).split('T')[0];
}

function validateTitle(title) {
  if (!title || typeof title !== 'string' || title.trim() === '') {
    throw new ValidationError('할 일 제목을 입력해주세요.');
  }
  if (title.length > VALIDATION.MAX_TODO_TITLE_LENGTH) {
    throw new ValidationError(`제목은 ${VALIDATION.MAX_TODO_TITLE_LENGTH}자 이하여야 합니다.`);
  }
}

async function createTodo(userId, { title, description, dueDate, categoryId }) {
  validateTitle(title);

  if (categoryId != null) {
    const category = await categoryRepository.findCategoryById(categoryId);
    if (!category) throw new NotFoundError('카테고리를 찾을 수 없습니다.');
    if (category.user_id !== userId) throw new ForbiddenError();
  }

  const row = await todoRepository.createTodo(userId, title, description, dueDate, categoryId);
  return formatTodo(row);
}

async function getTodos(userId, filters = {}) {
  validateFilters(filters);
  const rows = await todoRepository.findTodosByUserId(userId, filters);
  return rows.map(formatTodo);
}

async function getTodo(userId, todoId) {
  const todo = await todoRepository.findTodoById(todoId);
  if (!todo) {
    throw new NotFoundError('???쇱쓣 李얠쓣 ???놁뒿?덈떎.');
  }
  if (todo.user_id !== userId) {
    throw new ForbiddenError();
  }

  return formatTodo(todo);
}

function validateFilters({ status, categoryId, uncategorized, overdue }) {
  if (status && status !== 'in_progress' && status !== 'done') {
    throw new ValidationError('상태는 in_progress 또는 done이어야 합니다.');
  }
  if (status === 'done' && overdue) {
    throw new ValidationError('완료 상태와 기한 초과 필터는 함께 사용할 수 없습니다.');
  }
  if (categoryId && uncategorized) {
    throw new ValidationError('categoryId와 uncategorized는 함께 사용할 수 없습니다.');
  }
}

function validateUpdateInput(title) {
  if (title !== undefined) {
    validateTitle(title);
  }
}

async function updateTodo(userId, todoId, { title, description, dueDate, categoryId }) {
  validateUpdateInput(title);

  const todo = await todoRepository.findTodoById(todoId);
  if (!todo) {
    throw new NotFoundError('할 일을 찾을 수 없습니다.');
  }
  if (todo.user_id !== userId) {
    throw new ForbiddenError();
  }

  if (categoryId != null) {
    const category = await categoryRepository.findCategoryById(categoryId);
    if (!category) {
      throw new NotFoundError('카테고리를 찾을 수 없습니다.');
    }
    if (category.user_id !== userId) {
      throw new ForbiddenError();
    }
  }

  const updated = await todoRepository.updateTodo(todoId, title, description, dueDate, categoryId);
  return formatTodo(updated);
}

async function deleteTodo(userId, todoId) {
  const todo = await todoRepository.findTodoById(todoId);
  if (!todo) {
    throw new NotFoundError('할 일을 찾을 수 없습니다.');
  }
  if (todo.user_id !== userId) {
    throw new ForbiddenError();
  }

  await todoRepository.deleteTodo(todoId);
}

function validateStatusInput(status) {
  if (status !== 'in_progress' && status !== 'done') {
    throw new ValidationError('상태는 in_progress 또는 done이어야 합니다.');
  }
}

async function updateTodoStatus(userId, todoId, status) {
  validateStatusInput(status);

  const todo = await todoRepository.findTodoById(todoId);
  if (!todo) {
    throw new NotFoundError('할 일을 찾을 수 없습니다.');
  }
  if (todo.user_id !== userId) {
    throw new ForbiddenError();
  }

  const updated = await todoRepository.updateTodoStatus(todoId, status);
  return formatTodo(updated);
}

module.exports = { createTodo, getTodos, getTodo, updateTodo, deleteTodo, updateTodoStatus, formatTodo };
