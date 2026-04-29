'use strict';

jest.mock('../../src/repositories/category.repository');

const categoryRepository = require('../../src/repositories/category.repository');
const { getCategories, createCategory, updateCategory, deleteCategory } = require('../../src/services/category.service');
const { ValidationError, ConflictError, NotFoundError, ForbiddenError } = require('../../src/utils/errors');

beforeEach(() => jest.clearAllMocks());

describe('getCategories', () => {
  test('userId에 해당하는 카테고리 목록을 반환한다', async () => {
    const now = new Date();
    categoryRepository.findCategoriesByUserId.mockResolvedValueOnce([
      { id: 1, name: '업무', created_at: now },
      { id: 2, name: '개인', created_at: now },
    ]);
    const result = await getCategories(1);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ id: 1, name: '업무', createdAt: now });
  });

  test('카테고리가 없으면 빈 배열을 반환한다', async () => {
    categoryRepository.findCategoriesByUserId.mockResolvedValueOnce([]);
    const result = await getCategories(1);
    expect(result).toEqual([]);
  });
});

describe('createCategory - 입력 검증', () => {
  test('name이 없으면 ValidationError를 던진다', async () => {
    await expect(createCategory(1, '')).rejects.toThrow(ValidationError);
  });

  test('name이 undefined이면 ValidationError를 던진다', async () => {
    await expect(createCategory(1, undefined)).rejects.toThrow(ValidationError);
  });

  test('name이 20자를 초과하면 ValidationError를 던진다', async () => {
    await expect(createCategory(1, 'a'.repeat(21))).rejects.toThrow(ValidationError);
  });

  test('정확히 20자는 허용된다', async () => {
    categoryRepository.countCategoriesByUserId.mockResolvedValueOnce(0);
    categoryRepository.existsCategoryByUserIdAndName.mockResolvedValueOnce(false);
    categoryRepository.createCategory.mockResolvedValueOnce({ id: 1, name: 'a'.repeat(20), created_at: new Date() });
    const result = await createCategory(1, 'a'.repeat(20));
    expect(result.name).toHaveLength(20);
  });
});

describe('createCategory - 한도 초과', () => {
  test('카테고리가 20개이면 CATEGORY_LIMIT_EXCEEDED를 던진다', async () => {
    categoryRepository.countCategoriesByUserId.mockResolvedValueOnce(20);
    await expect(createCategory(1, '새카테고리')).rejects.toMatchObject({
      code: 'CATEGORY_LIMIT_EXCEEDED',
      status: 400,
    });
  });
});

describe('createCategory - 중복 이름', () => {
  test('중복 이름이면 DUPLICATE_CATEGORY_NAME ConflictError를 던진다', async () => {
    categoryRepository.countCategoriesByUserId.mockResolvedValueOnce(0);
    categoryRepository.existsCategoryByUserIdAndName.mockResolvedValueOnce(true);
    await expect(createCategory(1, '업무')).rejects.toMatchObject({
      code: 'DUPLICATE_CATEGORY_NAME',
      status: 409,
    });
  });
});

describe('createCategory - 성공', () => {
  test('생성된 카테고리를 반환한다', async () => {
    const now = new Date();
    categoryRepository.countCategoriesByUserId.mockResolvedValueOnce(0);
    categoryRepository.existsCategoryByUserIdAndName.mockResolvedValueOnce(false);
    categoryRepository.createCategory.mockResolvedValueOnce({ id: 1, name: '업무', created_at: now });
    const result = await createCategory(1, '업무');
    expect(result).toEqual({ id: 1, name: '업무', createdAt: now });
  });
});

describe('updateCategory', () => {
  test('카테고리가 없으면 NotFoundError를 던진다', async () => {
    categoryRepository.findCategoryById.mockResolvedValueOnce(null);
    await expect(updateCategory(1, 99, '새이름')).rejects.toThrow(NotFoundError);
  });

  test('다른 사용자의 카테고리이면 ForbiddenError를 던진다', async () => {
    categoryRepository.findCategoryById.mockResolvedValueOnce({ id: 1, user_id: 2, name: '업무' });
    await expect(updateCategory(1, 1, '새이름')).rejects.toThrow(ForbiddenError);
  });

  test('중복 이름이면 DUPLICATE_CATEGORY_NAME을 던진다', async () => {
    categoryRepository.findCategoryById.mockResolvedValueOnce({ id: 1, user_id: 1, name: '업무' });
    categoryRepository.existsCategoryByUserIdAndName.mockResolvedValueOnce(true);
    await expect(updateCategory(1, 1, '개인')).rejects.toMatchObject({ code: 'DUPLICATE_CATEGORY_NAME' });
  });

  test('같은 이름으로 수정 시 중복 체크에 현재 id가 제외된다', async () => {
    categoryRepository.findCategoryById.mockResolvedValueOnce({ id: 1, user_id: 1, name: '업무' });
    categoryRepository.existsCategoryByUserIdAndName.mockResolvedValueOnce(false);
    categoryRepository.updateCategory.mockResolvedValueOnce({ id: 1, name: '업무', created_at: new Date() });
    await updateCategory(1, 1, '업무');
    expect(categoryRepository.existsCategoryByUserIdAndName).toHaveBeenCalledWith(1, '업무', 1);
  });

  test('수정된 카테고리를 반환한다', async () => {
    const now = new Date();
    categoryRepository.findCategoryById.mockResolvedValueOnce({ id: 1, user_id: 1, name: '업무' });
    categoryRepository.existsCategoryByUserIdAndName.mockResolvedValueOnce(false);
    categoryRepository.updateCategory.mockResolvedValueOnce({ id: 1, name: '개인', created_at: now });
    const result = await updateCategory(1, 1, '개인');
    expect(result).toEqual({ id: 1, name: '개인', createdAt: now });
  });

  test('name 검증: 빈 문자열이면 ValidationError를 던진다', async () => {
    await expect(updateCategory(1, 1, '')).rejects.toThrow(ValidationError);
  });
});

describe('deleteCategory', () => {
  test('카테고리가 없으면 NotFoundError를 던진다', async () => {
    categoryRepository.findCategoryById.mockResolvedValueOnce(null);
    await expect(deleteCategory(1, 99)).rejects.toThrow(NotFoundError);
  });

  test('다른 사용자의 카테고리이면 ForbiddenError를 던진다', async () => {
    categoryRepository.findCategoryById.mockResolvedValueOnce({ id: 1, user_id: 2, name: '업무' });
    await expect(deleteCategory(1, 1)).rejects.toThrow(ForbiddenError);
  });

  test('삭제 후 deletedCategoryId와 uncategorizedTodoCount를 반환한다', async () => {
    categoryRepository.findCategoryById.mockResolvedValueOnce({ id: 1, user_id: 1, name: '업무' });
    categoryRepository.countTodosInCategory.mockResolvedValueOnce(3);
    categoryRepository.deleteCategory.mockResolvedValueOnce();
    const result = await deleteCategory(1, 1);
    expect(result).toEqual({ deletedCategoryId: 1, uncategorizedTodoCount: 3 });
  });
});
