'use strict';

process.env.NODE_ENV = 'test';
process.env.PORT = '3001';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.JWT_SECRET = 'test-secret';
process.env.JWT_EXPIRES_IN = '1h';
process.env.CORS_ORIGIN = 'http://localhost:5173';

jest.mock('../../src/services/auth.service');

const request = require('supertest');
const app = require('../../app');
const authService = require('../../src/services/auth.service');
const { ValidationError, UnauthorizedError } = require('../../src/utils/errors');

beforeEach(() => jest.clearAllMocks());

describe('POST /api/auth/login', () => {
  describe('200 성공', () => {
    test('유효한 요청에 200과 token, user를 반환한다', async () => {
      authService.login.mockResolvedValueOnce({
        token: 'mock.jwt.token',
        user: { id: 1, email: 'a@b.com', createdAt: new Date('2026-01-01') },
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'a@b.com', password: 'secret' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBe('mock.jwt.token');
      expect(res.body.data.user).toMatchObject({ id: 1, email: 'a@b.com' });
    });

    test('응답 user에 password_hash가 포함되지 않는다', async () => {
      authService.login.mockResolvedValueOnce({
        token: 'tok',
        user: { id: 1, email: 'a@b.com', createdAt: new Date() },
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'a@b.com', password: 'pw' });

      expect(res.body.data.user).not.toHaveProperty('password_hash');
    });
  });

  describe('400 검증 오류', () => {
    test('ValidationError 발생 시 400을 반환한다', async () => {
      authService.login.mockRejectedValueOnce(new ValidationError('이메일을 입력해주세요.'));

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: '', password: 'pw' });

      expect(res.status).toBe(400);
      expect(res.body).toMatchObject({ success: false, code: 'VALIDATION_ERROR' });
    });
  });

  describe('401 인증 실패', () => {
    test('INVALID_CREDENTIALS 발생 시 401을 반환한다', async () => {
      authService.login.mockRejectedValueOnce(
        new UnauthorizedError('이메일 또는 비밀번호가 올바르지 않습니다.', 'INVALID_CREDENTIALS')
      );

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'a@b.com', password: 'wrong' });

      expect(res.status).toBe(401);
      expect(res.body).toMatchObject({
        success: false,
        code: 'INVALID_CREDENTIALS',
        message: '이메일 또는 비밀번호가 올바르지 않습니다.',
      });
    });
  });
});
