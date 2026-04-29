'use strict';

const { VALIDATION } = require('../../src/constants/validation');
const { AUTH } = require('../../src/constants/auth');

describe('VALIDATION 상수', () => {
  test('MAX_TODO_TITLE_LENGTH는 100이다', () => {
    expect(VALIDATION.MAX_TODO_TITLE_LENGTH).toBe(100);
  });

  test('MAX_CATEGORY_NAME_LENGTH는 20이다', () => {
    expect(VALIDATION.MAX_CATEGORY_NAME_LENGTH).toBe(20);
  });

  test('MAX_CATEGORY_COUNT는 20이다', () => {
    expect(VALIDATION.MAX_CATEGORY_COUNT).toBe(20);
  });

  test('숫자 타입이다', () => {
    expect(typeof VALIDATION.MAX_TODO_TITLE_LENGTH).toBe('number');
    expect(typeof VALIDATION.MAX_CATEGORY_NAME_LENGTH).toBe('number');
    expect(typeof VALIDATION.MAX_CATEGORY_COUNT).toBe('number');
  });
});

describe('AUTH 상수', () => {
  test('JWT_ALGORITHM은 HS512이다', () => {
    expect(AUTH.JWT_ALGORITHM).toBe('HS512');
  });

  test('문자열 타입이다', () => {
    expect(typeof AUTH.JWT_ALGORITHM).toBe('string');
  });
});
