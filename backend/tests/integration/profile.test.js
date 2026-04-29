'use strict';

process.env.NODE_ENV = 'test';
process.env.PORT = '3001';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.JWT_SECRET = 'test-secret';
process.env.JWT_EXPIRES_IN = '1h';
process.env.CORS_ORIGIN = 'http://localhost:5173';

jest.mock('../../src/services/profile.service');

const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../../app');
const profileService = require('../../src/services/profile.service');
const { NotFoundError } = require('../../src/utils/errors');

function makeToken(userId = 1) {
  return jwt.sign({ sub: userId }, 'test-secret', { algorithm: 'HS512' });
}

beforeEach(() => jest.clearAllMocks());

describe('GET /api/profile', () => {
  test('인증 토큰 없으면 401을 반환한다', async () => {
    const res = await request(app).get('/api/profile');
    expect(res.status).toBe(401);
  });

  test('유효한 토큰으로 프로필을 조회한다', async () => {
    profileService.getProfile.mockResolvedValueOnce({
      id: 1, email: 'a@b.com', createdAt: new Date('2026-01-01'),
    });
    const res = await request(app)
      .get('/api/profile')
      .set('Authorization', `Bearer ${makeToken(1)}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toMatchObject({ id: 1, email: 'a@b.com' });
  });

  test('응답에 password_hash가 포함되지 않는다', async () => {
    profileService.getProfile.mockResolvedValueOnce({
      id: 1, email: 'a@b.com', createdAt: new Date(),
    });
    const res = await request(app)
      .get('/api/profile')
      .set('Authorization', `Bearer ${makeToken(1)}`);
    expect(res.body.data).not.toHaveProperty('password_hash');
  });

  test('서비스에서 NotFoundError 발생 시 404를 반환한다', async () => {
    profileService.getProfile.mockRejectedValueOnce(new NotFoundError('사용자를 찾을 수 없습니다.'));
    const res = await request(app)
      .get('/api/profile')
      .set('Authorization', `Bearer ${makeToken(99)}`);
    expect(res.status).toBe(404);
  });
});
