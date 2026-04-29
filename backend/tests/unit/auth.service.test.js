'use strict';

jest.mock('bcrypt');
jest.mock('../../src/repositories/auth.repository');

const bcrypt = require('bcrypt');
const authRepository = require('../../src/repositories/auth.repository');
const { signup } = require('../../src/services/auth.service');
const { ValidationError, ConflictError } = require('../../src/utils/errors');

beforeEach(() => jest.clearAllMocks());

describe('signup - 이메일 검증', () => {
  test('email이 undefined이면 ValidationError를 던진다', async () => {
    await expect(signup(undefined, 'pw')).rejects.toThrow(ValidationError);
  });

  test('email이 빈 문자열이면 ValidationError를 던진다', async () => {
    await expect(signup('', 'pw')).rejects.toThrow(ValidationError);
  });

  test('email 형식이 잘못되면 ValidationError를 던진다', async () => {
    await expect(signup('not-an-email', 'pw')).rejects.toThrow(ValidationError);
  });

  test('@가 없는 email → ValidationError', async () => {
    await expect(signup('noemail.com', 'pw')).rejects.toThrow(ValidationError);
  });

  test('ValidationError는 code VALIDATION_ERROR를 가진다', async () => {
    await expect(signup('', 'pw')).rejects.toMatchObject({ code: 'VALIDATION_ERROR' });
  });
});

describe('signup - 비밀번호 검증', () => {
  test('password가 undefined이면 ValidationError를 던진다', async () => {
    await expect(signup('a@b.com', undefined)).rejects.toThrow(ValidationError);
  });

  test('password가 빈 문자열이면 ValidationError를 던진다', async () => {
    await expect(signup('a@b.com', '')).rejects.toThrow(ValidationError);
  });

  test('ValidationError는 code VALIDATION_ERROR를 가진다', async () => {
    await expect(signup('a@b.com', '')).rejects.toMatchObject({ code: 'VALIDATION_ERROR' });
  });
});

describe('signup - 중복 이메일', () => {
  test('이미 존재하는 이메일이면 ConflictError를 던진다', async () => {
    authRepository.findUserByEmail.mockResolvedValueOnce({ id: 1, email: 'a@b.com' });
    await expect(signup('a@b.com', 'pw')).rejects.toThrow(ConflictError);
  });

  test('ConflictError는 code DUPLICATE_EMAIL을 가진다', async () => {
    authRepository.findUserByEmail.mockResolvedValueOnce({ id: 1 });
    await expect(signup('a@b.com', 'pw')).rejects.toMatchObject({
      code: 'DUPLICATE_EMAIL',
      status: 409,
    });
  });

  test('ConflictError 메시지는 "이미 사용 중인 이메일입니다."이다', async () => {
    authRepository.findUserByEmail.mockResolvedValueOnce({ id: 1 });
    await expect(signup('a@b.com', 'pw')).rejects.toMatchObject({
      message: '이미 사용 중인 이메일입니다.',
    });
  });
});

describe('signup - 성공', () => {
  const createdAt = new Date('2026-01-01');

  beforeEach(() => {
    authRepository.findUserByEmail.mockResolvedValue(null);
    bcrypt.hash.mockResolvedValue('$2b$10$hashed');
    authRepository.createUser.mockResolvedValue({
      id: 1,
      email: 'a@b.com',
      created_at: createdAt,
    });
  });

  test('password를 bcrypt로 해시한다', async () => {
    await signup('a@b.com', 'plainpw');
    expect(bcrypt.hash).toHaveBeenCalledWith('plainpw', 10);
  });

  test('createUser를 해시된 비밀번호로 호출한다', async () => {
    await signup('a@b.com', 'plainpw');
    expect(authRepository.createUser).toHaveBeenCalledWith('a@b.com', '$2b$10$hashed');
  });

  test('반환 객체에 id, email, createdAt이 포함된다', async () => {
    const result = await signup('a@b.com', 'pw');
    expect(result).toEqual({ id: 1, email: 'a@b.com', createdAt });
  });

  test('반환 객체에 password_hash가 포함되지 않는다', async () => {
    const result = await signup('a@b.com', 'pw');
    expect(result).not.toHaveProperty('password_hash');
    expect(result).not.toHaveProperty('passwordHash');
  });

  test('created_at이 createdAt으로 변환된다', async () => {
    const result = await signup('a@b.com', 'pw');
    expect(result.createdAt).toBe(createdAt);
    expect(result).not.toHaveProperty('created_at');
  });
});
