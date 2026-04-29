'use strict';

const mockQuery = jest.fn();
jest.mock('../../src/db/pool', () => ({ query: mockQuery }));

const {
  findCategoriesByUserId,
  findCategoryById,
  countCategoriesByUserId,
  existsCategoryByUserIdAndName,
  createCategory,
  updateCategory,
  countTodosInCategory,
  deleteCategory,
} = require('../../src/repositories/category.repository');

beforeEach(() => mockQuery.mockReset());

describe('findCategoriesByUserId', () => {
  test('user_id로 카테고리 목록을 조회한다', async () => {
    const rows = [{ id: 1, name: '업무', created_at: new Date() }];
    mockQuery.mockResolvedValueOnce({ rows });
    const result = await findCategoriesByUserId(1);
    expect(result).toEqual(rows);
    expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('user_id = $1'), [1]);
  });
});

describe('findCategoryById', () => {
  test('id로 카테고리를 찾는다', async () => {
    const row = { id: 1, user_id: 1, name: '업무', created_at: new Date() };
    mockQuery.mockResolvedValueOnce({ rows: [row] });
    const result = await findCategoryById(1);
    expect(result).toEqual(row);
  });

  test('없으면 null을 반환한다', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });
    const result = await findCategoryById(99);
    expect(result).toBeNull();
  });
});

describe('countCategoriesByUserId', () => {
  test('user의 카테고리 수를 정수로 반환한다', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ count: '5' }] });
    const result = await countCategoriesByUserId(1);
    expect(result).toBe(5);
    expect(typeof result).toBe('number');
  });
});

describe('existsCategoryByUserIdAndName', () => {
  test('중복 이름이 있으면 true를 반환한다', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 2 }] });
    const result = await existsCategoryByUserIdAndName(1, '업무');
    expect(result).toBe(true);
  });

  test('중복 이름이 없으면 false를 반환한다', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });
    const result = await existsCategoryByUserIdAndName(1, '새카테고리');
    expect(result).toBe(false);
  });

  test('excludeId를 파라미터로 전달한다', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });
    await existsCategoryByUserIdAndName(1, '업무', 3);
    expect(mockQuery).toHaveBeenCalledWith(expect.any(String), [1, '업무', 3]);
  });
});

describe('createCategory', () => {
  test('생성된 카테고리 행을 반환한다', async () => {
    const row = { id: 1, name: '업무', created_at: new Date() };
    mockQuery.mockResolvedValueOnce({ rows: [row] });
    const result = await createCategory(1, '업무');
    expect(result).toEqual(row);
    expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('RETURNING'), [1, '업무']);
  });
});

describe('updateCategory', () => {
  test('수정된 카테고리 행을 반환한다', async () => {
    const row = { id: 1, name: '개인', created_at: new Date() };
    mockQuery.mockResolvedValueOnce({ rows: [row] });
    const result = await updateCategory(1, '개인');
    expect(result).toEqual(row);
  });
});

describe('countTodosInCategory', () => {
  test('카테고리에 속한 todo 수를 정수로 반환한다', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ count: '3' }] });
    const result = await countTodosInCategory(1);
    expect(result).toBe(3);
    expect(typeof result).toBe('number');
  });
});

describe('deleteCategory', () => {
  test('DELETE 쿼리를 실행한다', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });
    await deleteCategory(1);
    expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('DELETE'), [1]);
  });
});
