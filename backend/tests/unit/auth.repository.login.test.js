'use strict';

const mockQuery = jest.fn();
jest.mock('../../src/db/pool', () => ({ query: mockQuery }));

const { findUserForAuth } = require('../../src/repositories/auth.repository');

beforeEach(() => mockQuery.mockReset());

describe('findUserForAuth', () => {
  test('유저가 존재하면 password_hash 포함 유저를 반환한다', async () => {
    const fakeUser = { id: 1, email: 'a@b.com', password_hash: '$2b$10$hash', created_at: new Date() };
    mockQuery.mockResolvedValueOnce({ rows: [fakeUser] });
    const result = await findUserForAuth('a@b.com');
    expect(result).toEqual(fakeUser);
    expect(result.password_hash).toBeDefined();
  });

  test('유저가 없으면 null을 반환한다', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });
    const result = await findUserForAuth('none@b.com');
    expect(result).toBeNull();
  });

  test('SELECT 쿼리에 password_hash가 포함된다', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });
    await findUserForAuth('a@b.com');
    const sql = mockQuery.mock.calls[0][0];
    expect(sql).toMatch(/password_hash/);
  });

  test('WHERE email = $1 조건으로 조회한다', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });
    await findUserForAuth('test@test.com');
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('WHERE email = $1'),
      ['test@test.com']
    );
  });
});
