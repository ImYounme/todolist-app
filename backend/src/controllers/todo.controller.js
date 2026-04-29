'use strict';

const todoService = require('../services/todo.service');

async function list(req, res, next) {
  try {
    const { status, categoryId, uncategorized, overdue } = req.query;
    const filters = {
      status,
      categoryId: categoryId ? Number(categoryId) : undefined,
      uncategorized: uncategorized === 'true',
      overdue: overdue === 'true',
    };
    const todos = await todoService.getTodos(req.user.id, filters);
    res.json({ success: true, data: todos });
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const { title, description, dueDate, categoryId } = req.body;
    const todo = await todoService.createTodo(req.user.id, { title, description, dueDate, categoryId });
    res.status(201).json({ success: true, data: todo });
  } catch (err) {
    next(err);
  }
}

async function get(req, res, next) {
  try {
    const todo = await todoService.getTodo(req.user.id, Number(req.params.todoId));
    res.json({ success: true, data: todo });
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const { title, description, dueDate, categoryId } = req.body;
    const todo = await todoService.updateTodo(req.user.id, Number(req.params.todoId), { title, description, dueDate, categoryId });
    res.json({ success: true, data: todo });
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    await todoService.deleteTodo(req.user.id, Number(req.params.todoId));
    res.json({ success: true, data: null });
  } catch (err) {
    next(err);
  }
}

async function updateStatus(req, res, next) {
  try {
    const { status } = req.body;
    const todo = await todoService.updateTodoStatus(req.user.id, Number(req.params.todoId), status);
    res.json({ success: true, data: todo });
  } catch (err) {
    next(err);
  }
}

module.exports = { list, create, get, update, remove, updateStatus };
