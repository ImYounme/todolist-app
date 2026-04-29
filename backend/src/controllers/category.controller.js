'use strict';

const categoryService = require('../services/category.service');

async function list(req, res, next) {
  try {
    const categories = await categoryService.getCategories(req.user.id);
    res.json({ success: true, data: categories });
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const category = await categoryService.createCategory(req.user.id, req.body.name);
    res.status(201).json({ success: true, data: category });
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const category = await categoryService.updateCategory(
      req.user.id,
      parseInt(req.params.categoryId, 10),
      req.body.name
    );
    res.json({ success: true, data: category });
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const result = await categoryService.deleteCategory(
      req.user.id,
      parseInt(req.params.categoryId, 10)
    );
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

module.exports = { list, create, update, remove };
