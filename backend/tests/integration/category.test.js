'use strict';

process.env.NODE_ENV = 'test';
process.env.PORT = '3001';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.JWT_SECRET = 'test-secret';
process.env.JWT_EXPIRES_IN = '1h';
process.env.CORS_ORIGIN = 'http://localhost:5173';

jest.mock('../../src/services/category.service');

const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../../app');
const categoryService = require('../../src/services/category.service');
const { ValidationError, ConflictError, NotFoundError, ForbiddenError } = require('../../src/utils/errors');

function makeToken(userId = 1) {
  return jwt.sign({ sub: userId }, 'test-secret', { algorithm: 'HS512' });
}

beforeEach(() => jest.clearAllMocks());

describe('GET /api/categories', () => {
  test('인증 없으면 401을 반환한다', async () => {
    const res = await request(app).get('/api/categories');
    expect(res.status).toBe(401);
  });

  test('카테고리 목록을 반환한다', async () => {
    categoryService.getCategories.mockResolvedValueOnce([
      { id: 1, name: '업무', createdAt: new Date() },
    ]);
    const res = await request(app)
      .get('/api/categories')
      .set('Authorization', `Bearer ${makeToken()}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(1);
  });
});

describe('POST /api/categories', () => {
  test('인증 없으면 401을 반환한다', async () => {
    const res = await request(app).post('/api/categories').send({ name: '업무' });
    expect(res.status).toBe(401);
  });

  test('카테고리를 생성하고 201을 반환한다', async () => {
    categoryService.createCategory.mockResolvedValueOnce({ id: 1, name: '업무', createdAt: new Date() });
    const res = await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ name: '업무' });
    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe('업무');
  });

  test('ValidationError 발생 시 400을 반환한다', async () => {
    categoryService.createCategory.mockRejectedValueOnce(new ValidationError('이름을 입력해주세요.'));
    const res = await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ name: '' });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });

  test('CATEGORY_LIMIT_EXCEEDED 발생 시 400을 반환한다', async () => {
    categoryService.createCategory.mockRejectedValueOnce(
      new ValidationError('최대 20개', 'CATEGORY_LIMIT_EXCEEDED')
    );
    const res = await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ name: '새카테고리' });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('CATEGORY_LIMIT_EXCEEDED');
  });

  test('DUPLICATE_CATEGORY_NAME 발생 시 409를 반환한다', async () => {
    categoryService.createCategory.mockRejectedValueOnce(
      new ConflictError('이미 존재하는 카테고리 이름입니다.', 'DUPLICATE_CATEGORY_NAME')
    );
    const res = await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ name: '업무' });
    expect(res.status).toBe(409);
    expect(res.body.code).toBe('DUPLICATE_CATEGORY_NAME');
  });
});

describe('PATCH /api/categories/:categoryId', () => {
  test('카테고리를 수정하고 200을 반환한다', async () => {
    categoryService.updateCategory.mockResolvedValueOnce({ id: 1, name: '개인', createdAt: new Date() });
    const res = await request(app)
      .patch('/api/categories/1')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ name: '개인' });
    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('개인');
  });

  test('NotFoundError 발생 시 404를 반환한다', async () => {
    categoryService.updateCategory.mockRejectedValueOnce(new NotFoundError());
    const res = await request(app)
      .patch('/api/categories/99')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ name: '개인' });
    expect(res.status).toBe(404);
  });

  test('ForbiddenError 발생 시 403을 반환한다', async () => {
    categoryService.updateCategory.mockRejectedValueOnce(new ForbiddenError());
    const res = await request(app)
      .patch('/api/categories/1')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ name: '개인' });
    expect(res.status).toBe(403);
  });
});

describe('DELETE /api/categories/:categoryId', () => {
  test('카테고리를 삭제하고 결과를 반환한다', async () => {
    categoryService.deleteCategory.mockResolvedValueOnce({ deletedCategoryId: 1, uncategorizedTodoCount: 2 });
    const res = await request(app)
      .delete('/api/categories/1')
      .set('Authorization', `Bearer ${makeToken()}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ deletedCategoryId: 1, uncategorizedTodoCount: 2 });
  });

  test('NotFoundError 발생 시 404를 반환한다', async () => {
    categoryService.deleteCategory.mockRejectedValueOnce(new NotFoundError());
    const res = await request(app)
      .delete('/api/categories/99')
      .set('Authorization', `Bearer ${makeToken()}`);
    expect(res.status).toBe(404);
  });

  test('ForbiddenError 발생 시 403을 반환한다', async () => {
    categoryService.deleteCategory.mockRejectedValueOnce(new ForbiddenError());
    const res = await request(app)
      .delete('/api/categories/1')
      .set('Authorization', `Bearer ${makeToken()}`);
    expect(res.status).toBe(403);
  });
});
