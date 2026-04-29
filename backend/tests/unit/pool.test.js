'use strict';

// pg를 모킹한 뒤 pool 모듈을 로드해야 모킹이 적용된다
const mockOn = jest.fn();
const mockQuery = jest.fn();

jest.mock('pg', () => {
  return {
    Pool: jest.fn().mockImplementation(() => ({
      on: mockOn,
      query: mockQuery,
    })),
  };
});

// 환경변수는 pool 모듈 로드 전에 설정해야 한다
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/testdb';

const { Pool } = require('pg');

// 모듈 캐시를 초기화해 매 테스트마다 새로 로드되지 않도록 한다
// pool.js는 모듈 수준에서 Pool 인스턴스를 생성하므로 한 번만 로드된다
const { pool, query } = require('../../src/db/pool');

describe('pool 모듈', () => {
  test('Pool이 DATABASE_URL로 생성된다', () => {
    expect(Pool).toHaveBeenCalledWith({
      connectionString: 'postgresql://test:test@localhost:5432/testdb',
    });
  });

  test('Pool 생성자가 정확히 1번 호출된다 (싱글톤)', () => {
    // 동일 모듈 재사용 시 Pool이 추가로 생성되지 않음
    require('../../src/db/pool');
    expect(Pool).toHaveBeenCalledTimes(1);
  });

  test('pool.on("error", ...)이 등록된다', () => {
    expect(mockOn).toHaveBeenCalledWith('error', expect.any(Function));
  });

  test('pool 객체가 export된다', () => {
    expect(pool).toBeDefined();
    expect(typeof pool.query).toBe('function');
  });

  test('query 함수가 export된다', () => {
    expect(typeof query).toBe('function');
  });

  test('query(text, params)가 pool.query를 호출한다', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 1 }] });
    const result = await query('SELECT 1', []);
    expect(mockQuery).toHaveBeenCalledWith('SELECT 1', []);
    expect(result).toEqual({ rows: [{ id: 1 }] });
  });

  test('query(text)가 params 없이 pool.query를 호출한다', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });
    const result = await query('SELECT NOW()');
    expect(mockQuery).toHaveBeenCalledWith('SELECT NOW()', undefined);
    expect(result).toEqual({ rows: [] });
  });

  test('pool.on error 핸들러가 console.error를 호출한다', () => {
    const errorHandler = mockOn.mock.calls.find(([event]) => event === 'error')?.[1];
    expect(errorHandler).toBeDefined();

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const fakeErr = new Error('connection lost');
    errorHandler(fakeErr);
    expect(consoleSpy).toHaveBeenCalledWith('[db] 유휴 클라이언트 오류:', fakeErr);
    consoleSpy.mockRestore();
  });
});
