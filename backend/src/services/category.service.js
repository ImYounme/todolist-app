'use strict';

const { ValidationError, ConflictError, NotFoundError, ForbiddenError } = require('../utils/errors');
const { VALIDATION } = require('../constants/validation');
const categoryRepository = require('../repositories/category.repository');

function validateName(name) {
  if (!name || typeof name !== 'string' || name.trim() === '') {
    throw new ValidationError('카테고리 이름을 입력해주세요.');
  }
  if (name.length > VALIDATION.MAX_CATEGORY_NAME_LENGTH) {
    throw new ValidationError(`카테고리 이름은 ${VALIDATION.MAX_CATEGORY_NAME_LENGTH}자 이하여야 합니다.`);
  }
}

async function getCategories(userId) {
  const categories = await categoryRepository.findCategoriesByUserId(userId);
  return categories.map((c) => ({
    id: c.id,
    name: c.name,
    createdAt: c.created_at,
  }));
}

async function createCategory(userId, name) {
  validateName(name);

  const count = await categoryRepository.countCategoriesByUserId(userId);
  if (count >= VALIDATION.MAX_CATEGORY_COUNT) {
    throw new ValidationError(
      `카테고리는 최대 ${VALIDATION.MAX_CATEGORY_COUNT}개까지 생성할 수 있습니다.`,
      'CATEGORY_LIMIT_EXCEEDED'
    );
  }

  const isDuplicate = await categoryRepository.existsCategoryByUserIdAndName(userId, name);
  if (isDuplicate) {
    throw new ConflictError('이미 존재하는 카테고리 이름입니다.', 'DUPLICATE_CATEGORY_NAME');
  }

  const category = await categoryRepository.createCategory(userId, name);
  return { id: category.id, name: category.name, createdAt: category.created_at };
}

async function updateCategory(userId, categoryId, name) {
  validateName(name);

  const category = await categoryRepository.findCategoryById(categoryId);
  if (!category) {
    throw new NotFoundError('카테고리를 찾을 수 없습니다.');
  }
  if (category.user_id !== userId) {
    throw new ForbiddenError();
  }

  const isDuplicate = await categoryRepository.existsCategoryByUserIdAndName(userId, name, categoryId);
  if (isDuplicate) {
    throw new ConflictError('이미 존재하는 카테고리 이름입니다.', 'DUPLICATE_CATEGORY_NAME');
  }

  const updated = await categoryRepository.updateCategory(categoryId, name);
  return { id: updated.id, name: updated.name, createdAt: updated.created_at };
}

async function deleteCategory(userId, categoryId) {
  const category = await categoryRepository.findCategoryById(categoryId);
  if (!category) {
    throw new NotFoundError('카테고리를 찾을 수 없습니다.');
  }
  if (category.user_id !== userId) {
    throw new ForbiddenError();
  }

  const uncategorizedTodoCount = await categoryRepository.countTodosInCategory(categoryId);
  await categoryRepository.deleteCategory(categoryId);

  return { deletedCategoryId: categoryId, uncategorizedTodoCount };
}

module.exports = { getCategories, createCategory, updateCategory, deleteCategory };
