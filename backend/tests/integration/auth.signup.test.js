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
const { ValidationError, ConflictError } = require('../../src/utils/errors');

beforeEach(() => jest.clearAllMocks());

describe('POST /api/auth/signup', () => {
  describe('201 성공', () => {
    test('유효한 요청에 201과 유저 정보를 반환한다', async () => {
      authService.signup.mockResolvedValueOnce({
        id: 1,
        email: 'a@b.com',
        createdAt: new Date('2026-01-01'),
      });

      const res = await request(app)
        .post('/api/auth/signup')
        .send({ email: 'a@b.com', password: 'secret' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toMatchObject({ id: 1, email: 'a@b.com' });
    });

    test('응답 본문에 password_hash가 포함되지 않는다', async () => {
      authService.signup.mockResolvedValueOnce({ id: 1, email: 'a@b.com', createdAt: new Date() });

      const res = await request(app)
        .post('/api/auth/signup')
        .send({ email: 'a@b.com', password: 'pw' });

      expect(res.body.data).not.toHaveProperty('password_hash');
    });

    test('서비스에 email과 password를 전달한다', async () => {
      authService.signup.mockResolvedValueOnce({ id: 1, email: 'a@b.com', createdAt: new Date() });

      await request(app)
        .post('/api/auth/signup')
        .send({ email: 'a@b.com', password: 'mypassword' });

      expect(authService.signup).toHaveBeenCalledWith('a@b.com', 'mypassword');
    });
  });

  describe('400 검증 오류', () => {
    test('ValidationError 발생 시 400과 VALIDATION_ERROR 코드를 반환한다', async () => {
      authService.signup.mockRejectedValueOnce(new ValidationError('유효하지 않은 이메일'));

      const res = await request(app)
        .post('/api/auth/signup')
        .send({ email: 'bad', password: 'pw' });

      expect(res.status).toBe(400);
      expect(res.body).toMatchObject({ success: false, code: 'VALIDATION_ERROR' });
    });
  });

  describe('409 중복 이메일', () => {
    test('DUPLICATE_EMAIL ConflictError 발생 시 409를 반환한다', async () => {
      authService.signup.mockRejectedValueOnce(
        new ConflictError('이미 사용 중인 이메일입니다.', 'DUPLICATE_EMAIL')
      );

      const res = await request(app)
        .post('/api/auth/signup')
        .send({ email: 'dup@b.com', password: 'pw' });

      expect(res.status).toBe(409);
      expect(res.body).toMatchObject({
        success: false,
        code: 'DUPLICATE_EMAIL',
        message: '이미 사용 중인 이메일입니다.',
      });
    });
  });

  describe('엣지 케이스', () => {
    test('잘못된 JSON은 400을 반환한다', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .set('Content-Type', 'application/json')
        .send('{ bad json }');

      expect(res.status).toBe(400);
    });
  });
});
