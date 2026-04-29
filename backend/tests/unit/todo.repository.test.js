'use strict';

const mockQuery = jest.fn();
jest.mock('../../src/db/pool', () => ({ query: mockQuery }));

const { createTodo, findTodoById, findTodosByUserId } = require('../../src/repositories/todo.repository');

beforeEach(() => mockQuery.mockReset());

describe('createTodo', () => {
  const row = {
    id: 1, user_id: 1, title: '보고서 작성', description: null, status: 'in_progress',
    due_date: null, category_id: null, created_at: new Date(), completed_at: null,
    cat_id: null, cat_name: null,
  };

  test('INSERT 쿼리를 실행하고 생성된 행을 반환한다', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [row] });
    const result = await createTodo(1, '보고서 작성', null, null, null);
    expect(result).toEqual(row);
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO todo'),
      [1, '보고서 작성', null, null, null]
    );
  });

  test('status가 in_progress로 설정된다', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [row] });
    await createTodo(1, '보고서 작성', null, null, null);
    const sql = mockQuery.mock.calls[0][0];
    expect(sql).toMatch(/in_progress/);
  });

  test('category LEFT JOIN 쿼리를 포함한다', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [row] });
    await createTodo(1, '보고서 작성', null, null, null);
    const sql = mockQuery.mock.calls[0][0];
    expect(sql).toMatch(/LEFT JOIN category/);
  });

  test('description, dueDate, categoryId는 null로 저장된다', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [row] });
    await createTodo(1, '보고서 작성', undefined, undefined, undefined);
    expect(mockQuery).toHaveBeenCalledWith(expect.any(String), [1, '보고서 작성', null, null, null]);
  });

  test('categoryId가 있는 경우 파라미터에 포함된다', async () => {
    const rowWithCat = { ...row, category_id: 2, cat_id: 2, cat_name: '업무' };
    mockQuery.mockResolvedValueOnce({ rows: [rowWithCat] });
    const result = await createTodo(1, '보고서 작성', '설명', '2026-04-30', 2);
    expect(result.cat_id).toBe(2);
    expect(mockQuery).toHaveBeenCalledWith(expect.any(String), [1, '보고서 작성', '설명', '2026-04-30', 2]);
  });
});

describe('findTodoById', () => {
  test('id로 todo를 조회하고 카테고리 정보를 포함한다', async () => {
    const row = { id: 1, user_id: 1, title: '보고서', status: 'in_progress', cat_id: null, cat_name: null };
    mockQuery.mockResolvedValueOnce({ rows: [row] });
    const result = await findTodoById(1);
    expect(result).toEqual(row);
    expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('WHERE t.id = $1'), [1]);
  });

  test('없으면 null을 반환한다', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });
    const result = await findTodoById(999);
    expect(result).toBeNull();
  });

  test('LEFT JOIN category 쿼리를 포함한다', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });
    await findTodoById(1);
    const sql = mockQuery.mock.calls[0][0];
    expect(sql).toMatch(/LEFT JOIN category/);
  });
});

describe('findTodosByUserId', () => {
  test('user_id로 todo 목록을 조회한다', async () => {
    const rows = [
      { id: 1, user_id: 1, title: '보고서', status: 'in_progress', cat_id: null, cat_name: null },
      { id: 2, user_id: 1, title: '회의', status: 'done', cat_id: 1, cat_name: '업무' },
    ];
    mockQuery.mockResolvedValueOnce({ rows });
    const result = await findTodosByUserId(1);
    expect(result).toEqual(rows);
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('ORDER BY t.created_at DESC'),
      [1]
    );
  });

  test('created_at DESC 정렬 쿼리를 포함한다', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });
    await findTodosByUserId(1);
    const sql = mockQuery.mock.calls[0][0];
    expect(sql).toMatch(/ORDER BY t\.created_at DESC/);
  });

  test('목록이 없으면 빈 배열을 반환한다', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });
    const result = await findTodosByUserId(1);
    expect(result).toEqual([]);
  });

  test('LEFT JOIN category 쿼리를 포함한다', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });
    await findTodosByUserId(1);
    const sql = mockQuery.mock.calls[0][0];
    expect(sql).toMatch(/LEFT JOIN category/);
  });

  test('필터와 함께 조회', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });
    await findTodosByUserId(1, { status: 'done' });
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('t.status'),
      expect.arrayContaining([1, 'done'])
    );
  });
});
