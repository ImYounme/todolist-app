'use strict';

jest.mock('../../src/repositories/user.repository');

const userRepository = require('../../src/repositories/user.repository');
const { getProfile } = require('../../src/services/profile.service');
const { NotFoundError } = require('../../src/utils/errors');

beforeEach(() => jest.clearAllMocks());

describe('getProfile', () => {
  test('userId로 유저를 조회한다', async () => {
    userRepository.findUserById.mockResolvedValueOnce({ id: 1, email: 'a@b.com', created_at: new Date() });
    await getProfile(1);
    expect(userRepository.findUserById).toHaveBeenCalledWith(1);
  });

  test('유저가 없으면 NotFoundError를 던진다', async () => {
    userRepository.findUserById.mockResolvedValueOnce(null);
    await expect(getProfile(999)).rejects.toThrow(NotFoundError);
  });

  test('id, email, createdAt을 반환한다', async () => {
    const createdAt = new Date('2026-01-01');
    userRepository.findUserById.mockResolvedValueOnce({ id: 1, email: 'a@b.com', created_at: createdAt });
    const result = await getProfile(1);
    expect(result).toEqual({ id: 1, email: 'a@b.com', createdAt });
  });

  test('응답에 password_hash가 포함되지 않는다', async () => {
    userRepository.findUserById.mockResolvedValueOnce({ id: 1, email: 'a@b.com', created_at: new Date() });
    const result = await getProfile(1);
    expect(result).not.toHaveProperty('password_hash');
  });
});
