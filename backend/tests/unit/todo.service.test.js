'use strict';

jest.mock('../../src/repositories/todo.repository');
jest.mock('../../src/repositories/category.repository');

const todoRepository = require('../../src/repositories/todo.repository');
const categoryRepository = require('../../src/repositories/category.repository');
const { createTodo, getTodos, updateTodo, deleteTodo, updateTodoStatus, formatTodo } = require('../../src/services/todo.service');
const { ValidationError, NotFoundError, ForbiddenError } = require('../../src/utils/errors');

beforeEach(() => {
  jest.clearAllMocks();
  jest.resetAllMocks();
});

const makeRow = (overrides = {}) => ({
  id: 1, user_id: 1, title: '보고서 작성', description: null, status: 'in_progress',
  due_date: null, category_id: null, created_at: new Date(), completed_at: null,
  cat_id: null, cat_name: null,
  ...overrides,
});

describe('formatTodo', () => {
  test('기본 필드를 camelCase로 변환한다', () => {
    const now = new Date();
    const row = makeRow({ created_at: now });
    const result = formatTodo(row);
    expect(result.id).toBe(1);
    expect(result.title).toBe('보고서 작성');
    expect(result.status).toBe('in_progress');
    expect(result.dueDate).toBeNull();
    expect(result.categoryId).toBeNull();
    expect(result.category).toBeNull();
    expect(result.isOverdue).toBe(false);
    expect(result.createdAt).toBe(now);
    expect(result.completedAt).toBeNull();
  });

  test('카테고리 정보가 있으면 category 객체를 포함한다', () => {
    const row = makeRow({ category_id: 2, cat_id: 2, cat_name: '업무' });
    const result = formatTodo(row);
    expect(result.categoryId).toBe(2);
    expect(result.category).toEqual({ id: 2, name: '업무' });
  });

  test('due_date가 오늘 이전이고 in_progress면 isOverdue가 true다', () => {
    const row = makeRow({ due_date: '2020-01-01', status: 'in_progress' });
    const result = formatTodo(row);
    expect(result.isOverdue).toBe(true);
  });

  test('due_date가 오늘 이후면 isOverdue가 false다', () => {
    const row = makeRow({ due_date: '2099-12-31', status: 'in_progress' });
    const result = formatTodo(row);
    expect(result.isOverdue).toBe(false);
  });

  test('status가 done이면 due_date가 과거여도 isOverdue가 false다', () => {
    const row = makeRow({ due_date: '2020-01-01', status: 'done' });
    const result = formatTodo(row);
    expect(result.isOverdue).toBe(false);
  });

  test('due_date가 null이면 isOverdue가 false다', () => {
    const row = makeRow({ due_date: null, status: 'in_progress' });
    const result = formatTodo(row);
    expect(result.isOverdue).toBe(false);
  });
});

describe('createTodo', () => {
  test('유효한 입력으로 Todo를 생성한다', async () => {
    const row = makeRow();
    todoRepository.createTodo.mockResolvedValueOnce(row);
    const result = await createTodo(1, { title: '보고서 작성' });
    expect(result.title).toBe('보고서 작성');
    expect(result.status).toBe('in_progress');
    expect(todoRepository.createTodo).toHaveBeenCalledWith(1, '보고서 작성', undefined, undefined, undefined);
  });

  test('제목이 없으면 ValidationError를 던진다', async () => {
    await expect(createTodo(1, { title: '' })).rejects.toThrow(ValidationError);
  });

  test('제목이 null이면 ValidationError를 던진다', async () => {
    await expect(createTodo(1, { title: null })).rejects.toThrow(ValidationError);
  });

  test('제목이 공백만 있으면 ValidationError를 던진다', async () => {
    await expect(createTodo(1, { title: '   ' })).rejects.toThrow(ValidationError);
  });

  test('제목이 100자를 초과하면 ValidationError를 던진다', async () => {
    await expect(createTodo(1, { title: 'a'.repeat(101) })).rejects.toThrow(ValidationError);
  });

  test('제목이 정확히 100자이면 생성에 성공한다', async () => {
    todoRepository.createTodo.mockResolvedValueOnce(makeRow({ title: 'a'.repeat(100) }));
    await expect(createTodo(1, { title: 'a'.repeat(100) })).resolves.not.toThrow();
  });

  test('categoryId가 존재하지 않으면 NotFoundError를 던진다', async () => {
    categoryRepository.findCategoryById.mockResolvedValueOnce(null);
    await expect(createTodo(1, { title: '보고서', categoryId: 999 })).rejects.toThrow(NotFoundError);
  });

  test('categoryId가 타 사용자 것이면 ForbiddenError를 던진다', async () => {
    categoryRepository.findCategoryById.mockResolvedValueOnce({ id: 1, user_id: 2, name: '업무' });
    await expect(createTodo(1, { title: '보고서', categoryId: 1 })).rejects.toThrow(ForbiddenError);
  });

  test('categoryId가 본인 것이면 생성에 성공한다', async () => {
    categoryRepository.findCategoryById.mockResolvedValueOnce({ id: 1, user_id: 1, name: '업무' });
    todoRepository.createTodo.mockResolvedValueOnce(makeRow({ category_id: 1, cat_id: 1, cat_name: '업무' }));
    const result = await createTodo(1, { title: '보고서', categoryId: 1 });
    expect(result.categoryId).toBe(1);
    expect(result.category).toEqual({ id: 1, name: '업무' });
  });

  test('categoryId가 null이면 카테고리 조회를 하지 않는다', async () => {
    todoRepository.createTodo.mockResolvedValueOnce(makeRow());
    await createTodo(1, { title: '보고서', categoryId: null });
    expect(categoryRepository.findCategoryById).not.toHaveBeenCalled();
  });

  test('선택 필드가 repository에 전달된다', async () => {
    todoRepository.createTodo.mockResolvedValueOnce(makeRow());
    await createTodo(1, { title: '보고서', description: '설명', dueDate: '2026-04-30', categoryId: null });
    expect(todoRepository.createTodo).toHaveBeenCalledWith(1, '보고서', '설명', '2026-04-30', null);
  });
});

describe('getTodos', () => {
  test('userId로 Todo 목록을 조회하고 형식을 변환한다', async () => {
    const rows = [makeRow(), makeRow({ id: 2, title: '회의 준비' })];
    todoRepository.findTodosByUserId.mockResolvedValueOnce(rows);
    const result = await getTodos(1);
    expect(result).toHaveLength(2);
    expect(result[0].title).toBe('보고서 작성');
    expect(result[1].title).toBe('회의 준비');
    expect(todoRepository.findTodosByUserId).toHaveBeenCalledWith(1, {});
  });

  test('빈 목록이면 빈 배열을 반환한다', async () => {
    todoRepository.findTodosByUserId.mockResolvedValueOnce([]);
    const result = await getTodos(1);
    expect(result).toEqual([]);
  });
});

describe('updateTodo', () => {
  test('유효한 입력으로 Todo를 수정한다', async () => {
    const row = makeRow({ title: '수정된 제목', description: '수정된 설명' });
    todoRepository.findTodoById.mockResolvedValueOnce({ ...row, user_id: 1 });
    todoRepository.updateTodo.mockResolvedValueOnce(row);
    const result = await updateTodo(1, 1, { title: '수정된 제목', description: '수정된 설명' });
    expect(result.title).toBe('수정된 제목');
    expect(todoRepository.updateTodo).toHaveBeenCalledWith(1, '수정된 제목', '수정된 설명', undefined, undefined);
  });

  test('todo가 존재하지 않으면 NotFoundError를 던진다', async () => {
    todoRepository.findTodoById.mockResolvedValueOnce(null);
    await expect(updateTodo(1, 999, { title: '제목' })).rejects.toThrow(NotFoundError);
  });

  test('다른 사용자의 todo면 ForbiddenError를 던진다', async () => {
    todoRepository.findTodoById.mockResolvedValueOnce({ id: 1, user_id: 2, title: '타인 todo' });
    await expect(updateTodo(1, 1, { title: '제목' })).rejects.toThrow(ForbiddenError);
  });

  test('제목이 없으면 ValidationError를 던진다', async () => {
    todoRepository.findTodoById.mockResolvedValueOnce({ id: 1, user_id: 1, title: '기존 제목' });
    await expect(updateTodo(1, 1, { title: '' })).rejects.toThrow(ValidationError);
  });

  test('제목이 100자를 초과하면 ValidationError를 던진다', async () => {
    todoRepository.findTodoById.mockResolvedValueOnce({ id: 1, user_id: 1, title: '기존 제목' });
    await expect(updateTodo(1, 1, { title: 'a'.repeat(101) })).rejects.toThrow(ValidationError);
  });

  test('제목 없이其它 필드만 수정할 수 있다', async () => {
    const row = makeRow({ title: '기존 제목', description: '새 설명' });
    todoRepository.findTodoById.mockResolvedValueOnce({ ...row, user_id: 1 });
    todoRepository.updateTodo.mockResolvedValueOnce(row);
    const result = await updateTodo(1, 1, { description: '새 설명' });
    expect(result.description).toBe('새 설명');
    expect(todoRepository.updateTodo).toHaveBeenCalledWith(1, undefined, '새 설명', undefined, undefined);
  });

  test('categoryId가 존재하지 않으면 NotFoundError를 던진다', async () => {
    todoRepository.findTodoById.mockResolvedValueOnce({ id: 1, user_id: 1, title: '제목' });
    categoryRepository.findCategoryById.mockResolvedValueOnce(null);
    await expect(updateTodo(1, 1, { categoryId: 999 })).rejects.toThrow(NotFoundError);
  });

  test('categoryId가 타 사용자 것이면 ForbiddenError를 던진다', async () => {
    todoRepository.findTodoById.mockResolvedValueOnce({ id: 1, user_id: 1, title: '제목' });
    categoryRepository.findCategoryById.mockResolvedValueOnce({ id: 1, user_id: 2, name: '타인 카테고리' });
    await expect(updateTodo(1, 1, { categoryId: 1 })).rejects.toThrow(ForbiddenError);
  });

  test('categoryId가 본인 것이면 수정에 성공한다', async () => {
    const row = makeRow({ category_id: 2, cat_id: 2, cat_name: '업무' });
    todoRepository.findTodoById.mockResolvedValueOnce({ ...row, user_id: 1 });
    categoryRepository.findCategoryById.mockResolvedValueOnce({ id: 2, user_id: 1, name: '업무' });
    todoRepository.updateTodo.mockResolvedValueOnce(row);
    const result = await updateTodo(1, 1, { categoryId: 2 });
    expect(result.categoryId).toBe(2);
  });

  test('categoryId가 null이면 카테고리 조회를 하지 않는다', async () => {
    const row = makeRow({ category_id: null });
    todoRepository.findTodoById.mockResolvedValueOnce({ ...row, user_id: 1 });
    todoRepository.updateTodo.mockResolvedValueOnce(row);
    await updateTodo(1, 1, { categoryId: null });
    expect(categoryRepository.findCategoryById).not.toHaveBeenCalled();
  });
});

describe('deleteTodo', () => {
  test('본인 Todo를 삭제한다', async () => {
    todoRepository.findTodoById.mockResolvedValueOnce({ id: 1, user_id: 1, title: '할 일' });
    todoRepository.deleteTodo.mockResolvedValueOnce(true);
    await expect(deleteTodo(1, 1)).resolves.not.toThrow();
    expect(todoRepository.deleteTodo).toHaveBeenCalledWith(1);
  });

  test('todo가 존재하지 않으면 NotFoundError를 던진다', async () => {
    todoRepository.findTodoById.mockResolvedValueOnce(null);
    await expect(deleteTodo(1, 999)).rejects.toThrow(NotFoundError);
  });

  test('다른 사용자의 todo면 ForbiddenError를 던진다', async () => {
    todoRepository.findTodoById.mockResolvedValueOnce({ id: 1, user_id: 2, title: '타인 todo' });
    await expect(deleteTodo(1, 1)).rejects.toThrow(ForbiddenError);
  });
});

describe('updateTodoStatus', () => {
  test('done으로 변경하면 completedAt이 설정된다', async () => {
    const row = makeRow({ status: 'done', completed_at: new Date() });
    todoRepository.findTodoById.mockResolvedValueOnce({ ...row, user_id: 1 });
    todoRepository.updateTodoStatus.mockResolvedValueOnce(row);
    const result = await updateTodoStatus(1, 1, 'done');
    expect(result.status).toBe('done');
    expect(todoRepository.updateTodoStatus).toHaveBeenCalledWith(1, 'done');
  });

  test('in_progress로 변경하면 completedAt이 null이 된다', async () => {
    const row = makeRow({ status: 'in_progress', completed_at: null });
    todoRepository.findTodoById.mockResolvedValueOnce({ ...row, user_id: 1 });
    todoRepository.updateTodoStatus.mockResolvedValueOnce(row);
    const result = await updateTodoStatus(1, 1, 'in_progress');
    expect(result.status).toBe('in_progress');
  });

  test('todo가 없으면 NotFoundError를 던진다', async () => {
    todoRepository.findTodoById.mockResolvedValueOnce(null);
    await expect(updateTodoStatus(1, 999, 'done')).rejects.toThrow(NotFoundError);
  });

  test('다른 사용자의 todo면 ForbiddenError를 던진다', async () => {
    todoRepository.findTodoById.mockResolvedValueOnce({ id: 1, user_id: 2, title: '타인 todo' });
    await expect(updateTodoStatus(1, 1, 'done')).rejects.toThrow(ForbiddenError);
  });

  test('유효하지 않은 상태면 ValidationError를 던진다', async () => {
    await expect(updateTodoStatus(1, 1, 'invalid')).rejects.toThrow(ValidationError);
  });
});

describe('getTodos with filters', () => {
  test('필터 없이 조회', async () => {
    todoRepository.findTodosByUserId.mockResolvedValueOnce([makeRow()]);
    const result = await getTodos(1);
    expect(result).toHaveLength(1);
    expect(todoRepository.findTodosByUserId).toHaveBeenCalledWith(1, {});
  });

  test('status 필터 적용', async () => {
    todoRepository.findTodosByUserId.mockResolvedValueOnce([makeRow({ status: 'done' })]);
    const result = await getTodos(1, { status: 'done' });
    expect(result[0].status).toBe('done');
    expect(todoRepository.findTodosByUserId).toHaveBeenCalledWith(1, { status: 'done' });
  });

  test('categoryId 필터 적용', async () => {
    todoRepository.findTodosByUserId.mockResolvedValueOnce([makeRow({ category_id: 1 })]);
    const result = await getTodos(1, { categoryId: 1 });
    expect(result[0].categoryId).toBe(1);
  });

  test('uncategorized 필터 적용', async () => {
    todoRepository.findTodosByUserId.mockResolvedValueOnce([makeRow({ category_id: null })]);
    await getTodos(1, { uncategorized: true });
    expect(todoRepository.findTodosByUserId).toHaveBeenCalledWith(1, { uncategorized: true });
  });

  test('overdue 필터 적용', async () => {
    todoRepository.findTodosByUserId.mockResolvedValueOnce([makeRow({ due_date: '2020-01-01', status: 'in_progress' })]);
    await getTodos(1, { overdue: true });
    expect(todoRepository.findTodosByUserId).toHaveBeenCalledWith(1, { overdue: true });
  });

  test('status가 in_progress이면 overdue와 함께 사용할 수 있다', async () => {
    todoRepository.findTodosByUserId.mockResolvedValueOnce([makeRow({ due_date: '2020-01-01', status: 'in_progress' })]);
    await getTodos(1, { status: 'in_progress', overdue: true });
    expect(todoRepository.findTodosByUserId).toHaveBeenCalledWith(1, { status: 'in_progress', overdue: true });
  });

  test('status가 done이면 overdue와 함께 사용할 수 없다', async () => {
    await expect(getTodos(1, { status: 'done', overdue: true })).rejects.toThrow(ValidationError);
  });

  test('categoryId와 uncategorized 함께 사용하면 ValidationError', async () => {
    await expect(getTodos(1, { categoryId: 1, uncategorized: true })).rejects.toThrow(ValidationError);
  });

  test('유효하지 않은 status면 ValidationError', async () => {
    await expect(getTodos(1, { status: 'invalid' })).rejects.toThrow(ValidationError);
  });
});
