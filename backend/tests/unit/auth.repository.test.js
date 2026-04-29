'use strict';

const mockQuery = jest.fn();
jest.mock('../../src/db/pool', () => ({ query: mockQuery }));

const { findUserByEmail, createUser } = require('../../src/repositories/auth.repository');

beforeEach(() => mockQuery.mockReset());

describe('findUserByEmail', () => {
  test('유저가 존재하면 해당 유저를 반환한다', async () => {
    const fakeUser = { id: 1, email: 'a@b.com', created_at: new Date() };
    mockQuery.mockResolvedValueOnce({ rows: [fakeUser] });
    const result = await findUserByEmail('a@b.com');
    expect(result).toEqual(fakeUser);
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('WHERE email = $1'),
      ['a@b.com']
    );
  });

  test('유저가 없으면 null을 반환한다', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });
    const result = await findUserByEmail('none@b.com');
    expect(result).toBeNull();
  });

  test('SELECT 쿼리에 password_hash가 포함되지 않는다', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });
    await findUserByEmail('a@b.com');
    const sql = mockQuery.mock.calls[0][0];
    expect(sql).not.toMatch(/password_hash/);
  });
});

describe('createUser', () => {
  test('생성된 유저 행을 반환한다', async () => {
    const fakeUser = { id: 1, email: 'a@b.com', created_at: new Date() };
    mockQuery.mockResolvedValueOnce({ rows: [fakeUser] });
    const result = await createUser('a@b.com', 'hashed_pw');
    expect(result).toEqual(fakeUser);
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('RETURNING'),
      ['a@b.com', 'hashed_pw']
    );
  });

  test('email과 password_hash를 INSERT한다', async () => {
    const fakeUser = { id: 2, email: 'test@test.com', created_at: new Date() };
    mockQuery.mockResolvedValueOnce({ rows: [fakeUser] });
    await createUser('test@test.com', '$2b$10$hash');
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO "user"'),
      ['test@test.com', '$2b$10$hash']
    );
  });
});
