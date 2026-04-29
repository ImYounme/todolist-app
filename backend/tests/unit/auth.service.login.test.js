'use strict';

jest.mock('bcrypt');
jest.mock('jsonwebtoken');
jest.mock('../../src/repositories/auth.repository');

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const authRepository = require('../../src/repositories/auth.repository');
const { login } = require('../../src/services/auth.service');
const { ValidationError, UnauthorizedError } = require('../../src/utils/errors');

process.env.JWT_SECRET = 'test-secret';
process.env.JWT_EXPIRES_IN = '1h';

beforeEach(() => jest.clearAllMocks());

describe('login - 입력 검증', () => {
  test('email이 없으면 ValidationError를 던진다', async () => {
    await expect(login(undefined, 'pw')).rejects.toThrow(ValidationError);
  });

  test('email이 빈 문자열이면 ValidationError를 던진다', async () => {
    await expect(login('', 'pw')).rejects.toThrow(ValidationError);
  });

  test('password가 없으면 ValidationError를 던진다', async () => {
    await expect(login('a@b.com', undefined)).rejects.toThrow(ValidationError);
  });

  test('password가 빈 문자열이면 ValidationError를 던진다', async () => {
    await expect(login('a@b.com', '')).rejects.toThrow(ValidationError);
  });
});

describe('login - 인증 실패', () => {
  test('존재하지 않는 이메일이면 INVALID_CREDENTIALS를 던진다', async () => {
    authRepository.findUserForAuth.mockResolvedValueOnce(null);
    await expect(login('none@b.com', 'pw')).rejects.toMatchObject({
      code: 'INVALID_CREDENTIALS',
      status: 401,
    });
  });

  test('비밀번호가 틀리면 INVALID_CREDENTIALS를 던진다', async () => {
    authRepository.findUserForAuth.mockResolvedValueOnce({ id: 1, email: 'a@b.com', password_hash: '$2b$10$hash', created_at: new Date() });
    bcrypt.compare.mockResolvedValueOnce(false);
    await expect(login('a@b.com', 'wrongpw')).rejects.toMatchObject({
      code: 'INVALID_CREDENTIALS',
      status: 401,
    });
  });

  test('INVALID_CREDENTIALS 메시지가 정확하다', async () => {
    authRepository.findUserForAuth.mockResolvedValueOnce(null);
    await expect(login('a@b.com', 'pw')).rejects.toMatchObject({
      message: '이메일 또는 비밀번호가 올바르지 않습니다.',
    });
  });

  test('UnauthorizedError의 인스턴스이다', async () => {
    authRepository.findUserForAuth.mockResolvedValueOnce(null);
    await expect(login('a@b.com', 'pw')).rejects.toThrow(UnauthorizedError);
  });
});

describe('login - 성공', () => {
  const createdAt = new Date('2026-01-01');

  beforeEach(() => {
    authRepository.findUserForAuth.mockResolvedValue({
      id: 1,
      email: 'a@b.com',
      password_hash: '$2b$10$hash',
      created_at: createdAt,
    });
    bcrypt.compare.mockResolvedValue(true);
    jwt.sign.mockReturnValue('mock.jwt.token');
  });

  test('bcrypt.compare로 비밀번호를 검증한다', async () => {
    await login('a@b.com', 'plainpw');
    expect(bcrypt.compare).toHaveBeenCalledWith('plainpw', '$2b$10$hash');
  });

  test('HS512 알고리즘으로 JWT를 발급한다', async () => {
    await login('a@b.com', 'pw');
    expect(jwt.sign).toHaveBeenCalledWith(
      { sub: 1 },
      'test-secret',
      { algorithm: 'HS512', expiresIn: '1h' }
    );
  });

  test('JWT payload에 사용자 id(sub)가 포함된다', async () => {
    await login('a@b.com', 'pw');
    const payload = jwt.sign.mock.calls[0][0];
    expect(payload.sub).toBe(1);
  });

  test('반환 객체에 token과 user가 포함된다', async () => {
    const result = await login('a@b.com', 'pw');
    expect(result).toMatchObject({
      token: 'mock.jwt.token',
      user: { id: 1, email: 'a@b.com', createdAt },
    });
  });

  test('반환 user에 password_hash가 포함되지 않는다', async () => {
    const result = await login('a@b.com', 'pw');
    expect(result.user).not.toHaveProperty('password_hash');
    expect(result.user).not.toHaveProperty('password');
  });
});
