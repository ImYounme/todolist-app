'use strict';

process.env.NODE_ENV = 'test';
process.env.PORT = '3001';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.JWT_SECRET = 'test-secret';
process.env.JWT_EXPIRES_IN = '1h';
process.env.CORS_ORIGIN = 'http://localhost:5173';

jest.mock('../../src/services/todo.service');
jest.mock('../../src/services/category.service');

const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../../app');
const todoService = require('../../src/services/todo.service');
const { ValidationError, NotFoundError, ForbiddenError } = require('../../src/utils/errors');

function makeToken(userId = 1) {
  return jwt.sign({ sub: userId }, 'test-secret', { algorithm: 'HS512' });
}

const makeTodo = (overrides = {}) => ({
  id: 1,
  title: '보고서 작성',
  description: null,
  status: 'in_progress',
  dueDate: null,
  categoryId: null,
  category: null,
  isOverdue: false,
  createdAt: new Date(),
  completedAt: null,
  ...overrides,
});

beforeEach(() => jest.clearAllMocks());

describe('GET /api/todos', () => {
  test('인증 없으면 401을 반환한다', async () => {
    const res = await request(app).get('/api/todos');
    expect(res.status).toBe(401);
  });

  test('본인 Todo 목록을 반환한다', async () => {
    todoService.getTodos.mockResolvedValueOnce([makeTodo(), makeTodo({ id: 2, title: '회의 준비' })]);
    const res = await request(app)
      .get('/api/todos')
      .set('Authorization', `Bearer ${makeToken()}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(2);
  });

  test('Todo가 없으면 빈 배열을 반환한다', async () => {
    todoService.getTodos.mockResolvedValueOnce([]);
    const res = await request(app)
      .get('/api/todos')
      .set('Authorization', `Bearer ${makeToken()}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });

  test('getTodos에 인증된 userId가 전달된다', async () => {
    todoService.getTodos.mockResolvedValueOnce([]);
    await request(app)
      .get('/api/todos')
      .set('Authorization', `Bearer ${makeToken(5)}`);
    expect(todoService.getTodos).toHaveBeenCalledWith(5, { status: undefined, categoryId: undefined, uncategorized: false, overdue: false });
  });
});

describe('POST /api/todos', () => {
  test('인증 없으면 401을 반환한다', async () => {
    const res = await request(app).post('/api/todos').send({ title: '보고서 작성' });
    expect(res.status).toBe(401);
  });

  test('Todo를 생성하고 201을 반환한다', async () => {
    todoService.createTodo.mockResolvedValueOnce(makeTodo({ title: '보고서 작성' }));
    const res = await request(app)
      .post('/api/todos')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ title: '보고서 작성' });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe('보고서 작성');
  });

  test('선택 필드가 포함된 경우 서비스에 전달된다', async () => {
    todoService.createTodo.mockResolvedValueOnce(makeTodo({
      title: '보고서', description: '초안 작성', dueDate: '2026-04-30', categoryId: 1,
    }));
    await request(app)
      .post('/api/todos')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ title: '보고서', description: '초안 작성', dueDate: '2026-04-30', categoryId: 1 });
    expect(todoService.createTodo).toHaveBeenCalledWith(
      1,
      { title: '보고서', description: '초안 작성', dueDate: '2026-04-30', categoryId: 1 }
    );
  });

  test('ValidationError 발생 시 400을 반환한다', async () => {
    todoService.createTodo.mockRejectedValueOnce(new ValidationError('할 일 제목을 입력해주세요.'));
    const res = await request(app)
      .post('/api/todos')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ title: '' });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });

  test('NotFoundError 발생 시 404를 반환한다', async () => {
    todoService.createTodo.mockRejectedValueOnce(new NotFoundError('카테고리를 찾을 수 없습니다.'));
    const res = await request(app)
      .post('/api/todos')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ title: '보고서', categoryId: 999 });
    expect(res.status).toBe(404);
  });

  test('ForbiddenError 발생 시 403을 반환한다', async () => {
    todoService.createTodo.mockRejectedValueOnce(new ForbiddenError());
    const res = await request(app)
      .post('/api/todos')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ title: '보고서', categoryId: 2 });
    expect(res.status).toBe(403);
  });

  test('isOverdue 필드가 응답에 포함된다', async () => {
    todoService.createTodo.mockResolvedValueOnce(makeTodo({ isOverdue: false }));
    const res = await request(app)
      .post('/api/todos')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ title: '보고서' });
    expect(res.body.data).toHaveProperty('isOverdue');
  });

  test('status와 completedAt이 응답에 포함된다', async () => {
    todoService.createTodo.mockResolvedValueOnce(makeTodo({ status: 'in_progress', completedAt: null }));
    const res = await request(app)
      .post('/api/todos')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ title: '보고서' });
    expect(res.body.data.status).toBe('in_progress');
    expect(res.body.data.completedAt).toBeNull();
  });
});

describe('PATCH /api/todos/:todoId', () => {
  test('인증 없으면 401을 반환한다', async () => {
    const res = await request(app).patch('/api/todos/1').send({ title: '수정됨' });
    expect(res.status).toBe(401);
  });

  test('Todo를 수정하고 200을 반환한다', async () => {
    todoService.updateTodo.mockResolvedValueOnce(makeTodo({ title: '수정된 제목' }));
    const res = await request(app)
      .patch('/api/todos/1')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ title: '수정된 제목' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe('수정된 제목');
  });

  test('todoId와 수정이 서비스에 전달된다', async () => {
    todoService.updateTodo.mockResolvedValueOnce(makeTodo({ title: '수정됨' }));
    await request(app)
      .patch('/api/todos/5')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ title: '수정됨', description: '설명' });
    expect(todoService.updateTodo).toHaveBeenCalledWith(1, 5, { title: '수정됨', description: '설명' });
  });

  test('ValidationError 발생 시 400을 반환한다', async () => {
    todoService.updateTodo.mockRejectedValueOnce(new ValidationError('제목은 100자 이하여야 합니다.'));
    const res = await request(app)
      .patch('/api/todos/1')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ title: '' });
    expect(res.status).toBe(400);
  });

  test('NotFoundError 발생 시 404를 반환한다', async () => {
    todoService.updateTodo.mockRejectedValueOnce(new NotFoundError('할 일을 찾을 수 없습니다.'));
    const res = await request(app)
      .patch('/api/todos/999')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ title: '수정' });
    expect(res.status).toBe(404);
  });

  test('ForbiddenError 발생 시 403을 반환한다', async () => {
    todoService.updateTodo.mockRejectedValueOnce(new ForbiddenError());
    const res = await request(app)
      .patch('/api/todos/1')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ title: '수정' });
    expect(res.status).toBe(403);
  });
});

describe('DELETE /api/todos/:todoId', () => {
  test('인증 없으면 401을 반환한다', async () => {
    const res = await request(app).delete('/api/todos/1');
    expect(res.status).toBe(401);
  });

  test('Todo를 삭제하고 200을 반환한다', async () => {
    todoService.deleteTodo.mockResolvedValueOnce(undefined);
    const res = await request(app)
      .delete('/api/todos/1')
      .set('Authorization', `Bearer ${makeToken()}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeNull();
  });

  test('todoId가 서비스에 전달된다', async () => {
    todoService.deleteTodo.mockResolvedValueOnce(undefined);
    await request(app)
      .delete('/api/todos/7')
      .set('Authorization', `Bearer ${makeToken()}`);
    expect(todoService.deleteTodo).toHaveBeenCalledWith(1, 7);
  });

  test('NotFoundError 발생 시 404를 반환한다', async () => {
    todoService.deleteTodo.mockRejectedValueOnce(new NotFoundError('할 일을 찾을 수 없습니다.'));
    const res = await request(app)
      .delete('/api/todos/999')
      .set('Authorization', `Bearer ${makeToken()}`);
    expect(res.status).toBe(404);
  });

  test('ForbiddenError 발생 시 403을 반환한다', async () => {
    todoService.deleteTodo.mockRejectedValueOnce(new ForbiddenError());
    const res = await request(app)
      .delete('/api/todos/1')
      .set('Authorization', `Bearer ${makeToken()}`);
    expect(res.status).toBe(403);
  });
});

describe('PATCH /api/todos/:todoId/status', () => {
  test('상태를 done으로 변경한다', async () => {
    todoService.updateTodoStatus.mockResolvedValueOnce(makeTodo({ status: 'done', completedAt: new Date() }));
    const res = await request(app)
      .patch('/api/todos/1/status')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ status: 'done' });
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('done');
  });

  test('상태를 in_progress로 변경한다', async () => {
    todoService.updateTodoStatus.mockResolvedValueOnce(makeTodo({ status: 'in_progress', completedAt: null }));
    const res = await request(app)
      .patch('/api/todos/1/status')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ status: 'in_progress' });
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('in_progress');
  });

  test('todoId와 status가 서비스에 전달된다', async () => {
    todoService.updateTodoStatus.mockResolvedValueOnce(makeTodo());
    await request(app)
      .patch('/api/todos/5/status')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ status: 'done' });
    expect(todoService.updateTodoStatus).toHaveBeenCalledWith(1, 5, 'done');
  });

  test('ValidationError 발생 시 400을 반환한다', async () => {
    todoService.updateTodoStatus.mockRejectedValueOnce(new ValidationError('상태는 in_progress 또는 done이어야 합니다.'));
    const res = await request(app)
      .patch('/api/todos/1/status')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ status: 'invalid' });
    expect(res.status).toBe(400);
  });

  test('NotFoundError 발생 시 404를 반환한다', async () => {
    todoService.updateTodoStatus.mockRejectedValueOnce(new NotFoundError('할 일을 찾을 수 없습니다.'));
    const res = await request(app)
      .patch('/api/todos/999/status')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ status: 'done' });
    expect(res.status).toBe(404);
  });

  test('ForbiddenError 발생 시 403을 반환한다', async () => {
    todoService.updateTodoStatus.mockRejectedValueOnce(new ForbiddenError());
    const res = await request(app)
      .patch('/api/todos/1/status')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ status: 'done' });
    expect(res.status).toBe(403);
  });
});

describe('GET /api/todos with filters', () => {
  test('status 필터 적용', async () => {
    todoService.getTodos.mockResolvedValueOnce([makeTodo({ status: 'done' })]);
    const res = await request(app)
      .get('/api/todos?status=done')
      .set('Authorization', `Bearer ${makeToken()}`);
    expect(res.status).toBe(200);
    expect(todoService.getTodos).toHaveBeenCalledWith(1, { status: 'done', categoryId: undefined, uncategorized: false, overdue: false });
  });

  test('categoryId 필터 적용', async () => {
    todoService.getTodos.mockResolvedValueOnce([makeTodo({ categoryId: 1 })]);
    const res = await request(app)
      .get('/api/todos?categoryId=1')
      .set('Authorization', `Bearer ${makeToken()}`);
    expect(res.status).toBe(200);
    expect(todoService.getTodos).toHaveBeenCalledWith(1, { status: undefined, categoryId: 1, uncategorized: false, overdue: false });
  });

  test('uncategorized 필터 적용', async () => {
    todoService.getTodos.mockResolvedValueOnce([makeTodo({ categoryId: null })]);
    const res = await request(app)
      .get('/api/todos?uncategorized=true')
      .set('Authorization', `Bearer ${makeToken()}`);
    expect(res.status).toBe(200);
  });

  test('overdue 필터 적용', async () => {
    todoService.getTodos.mockResolvedValueOnce([makeTodo({ isOverdue: true })]);
    const res = await request(app)
      .get('/api/todos?overdue=true')
      .set('Authorization', `Bearer ${makeToken()}`);
    expect(res.status).toBe(200);
  });

  test('status=in_progress와 overdue를 함께 전달할 수 있다', async () => {
    todoService.getTodos.mockResolvedValueOnce([makeTodo({ isOverdue: true })]);
    const res = await request(app)
      .get('/api/todos?status=in_progress&overdue=true')
      .set('Authorization', `Bearer ${makeToken()}`);
    expect(res.status).toBe(200);
    expect(todoService.getTodos).toHaveBeenCalledWith(1, {
      status: 'in_progress',
      categoryId: undefined,
      uncategorized: false,
      overdue: true,
    });
  });

  test('status=done과 overdue를 함께 사용하면 400을 반환한다', async () => {
    todoService.getTodos.mockRejectedValueOnce(new ValidationError('완료 상태와 기한 초과 필터는 함께 사용할 수 없습니다.'));
    const res = await request(app)
      .get('/api/todos?status=done&overdue=true')
      .set('Authorization', `Bearer ${makeToken()}`);
    expect(res.status).toBe(400);
  });
});
