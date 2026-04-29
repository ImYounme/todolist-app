'use strict';

const mockQuery = jest.fn();
jest.mock('../../src/db/pool', () => ({ query: mockQuery }));

const { findUserById } = require('../../src/repositories/user.repository');

beforeEach(() => mockQuery.mockReset());

describe('findUserById', () => {
  test('id로 유저를 조회한다', async () => {
    const row = { id: 1, email: 'a@b.com', created_at: new Date() };
    mockQuery.mockResolvedValueOnce({ rows: [row] });
    const result = await findUserById(1);
    expect(result).toEqual(row);
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('WHERE id = $1'),
      [1]
    );
  });

  test('유저가 없으면 null을 반환한다', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });
    const result = await findUserById(999);
    expect(result).toBeNull();
  });

  test('SELECT 쿼리에 password_hash가 포함되지 않는다', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });
    await findUserById(1);
    const sql = mockQuery.mock.calls[0][0];
    expect(sql).not.toMatch(/password_hash/);
  });
});
