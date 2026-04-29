'use strict';

process.env.NODE_ENV = 'test';
process.env.PORT = '3001';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.JWT_SECRET = 'test-secret-for-jest';
process.env.JWT_EXPIRES_IN = '1h';
process.env.CORS_ORIGIN = 'http://localhost:5173';

const request = require('supertest');
const express = require('express');
const app = require('../../app');
const { errorHandler } = require('../../src/middlewares/error.middleware');
const { AppError } = require('../../src/utils/errors');

describe('GET /health', () => {
  test('200과 { success: true, data: { status: "ok" } }를 반환한다', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, data: { status: 'ok' } });
  });
});

describe('404 핸들러', () => {
  test('존재하지 않는 경로에 GET 요청 시 404를 반환한다', async () => {
    const res = await request(app).get('/api/nonexistent');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe('NOT_FOUND');
    expect(res.body.message).toBe('요청한 리소스를 찾을 수 없습니다.');
  });

  test('존재하지 않는 경로에 POST 요청 시 404를 반환한다', async () => {
    const res = await request(app).post('/api/unknown');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  test('존재하지 않는 경로에 DELETE 요청 시 404를 반환한다', async () => {
    const res = await request(app).delete('/api/nonexistent/123');
    expect(res.status).toBe(404);
  });
});

describe('전역 에러 핸들러', () => {
  let testApp;

  beforeAll(() => {
    testApp = express();
    testApp.get('/test/app-error', (req, res, next) => {
      next(new AppError('의도된 에러', 422, 'TEST_ERROR'));
    });
    testApp.get('/test/unexpected-error', (req, res, next) => {
      next(new Error('예상치 못한 에러'));
    });
    testApp.use(errorHandler);
  });

  test('AppError는 해당 status와 code로 응답한다', async () => {
    const res = await request(testApp).get('/test/app-error');
    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe('TEST_ERROR');
    expect(res.body.message).toBe('의도된 에러');
  });

  test('예상치 못한 에러는 500으로 응답한다', async () => {
    const res = await request(testApp).get('/test/unexpected-error');
    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe('INTERNAL_ERROR');
    expect(res.body.message).toBe('서버 오류가 발생했습니다.');
  });

  test('test 환경에서 stack이 응답에 포함되지 않는다', async () => {
    const res = await request(testApp).get('/test/unexpected-error');
    expect(res.body.stack).toBeUndefined();
  });
});

describe('CORS 헤더', () => {
  test('허용된 출처에서 요청 시 CORS 헤더가 포함된다', async () => {
    const res = await request(app)
      .get('/health')
      .set('Origin', 'http://localhost:5173');
    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173');
  });

  test('허용되지 않은 출처에는 CORS 헤더가 포함되지 않는다', async () => {
    const res = await request(app)
      .get('/health')
      .set('Origin', 'http://evil.example.com');
    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });

  test('Origin 없는 요청(서버 간 통신)은 허용된다', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
  });

  test('OPTIONS 요청 시 Allow 메서드가 포함된다', async () => {
    const res = await request(app)
      .options('/health')
      .set('Origin', 'http://localhost:5173')
      .set('Access-Control-Request-Method', 'GET');
    expect(res.headers['access-control-allow-methods']).toBeDefined();
  });
});

describe('JSON 파서', () => {
  test('application/json 요청 본문을 파싱한다 (라우트 없어도 파싱 자체는 성공)', async () => {
    const res = await request(app)
      .post('/api/test-json-parse')
      .set('Content-Type', 'application/json')
      .send({ key: 'value' });
    expect(res.status).toBe(404);
  });

  test('잘못된 JSON 요청 시 400을 반환한다', async () => {
    const res = await request(app)
      .post('/api/test')
      .set('Content-Type', 'application/json')
      .send('{ invalid json }');
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });
});
