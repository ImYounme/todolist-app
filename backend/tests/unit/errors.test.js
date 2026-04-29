'use strict';

const {
  AppError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
} = require('../../src/utils/errors');

describe('AppError', () => {
  test('message, status, code를 올바르게 저장한다', () => {
    const err = new AppError('테스트 오류', 418, 'TEST_CODE');
    expect(err.message).toBe('테스트 오류');
    expect(err.status).toBe(418);
    expect(err.code).toBe('TEST_CODE');
  });

  test('Error의 인스턴스이다', () => {
    expect(new AppError('msg', 500, 'CODE')).toBeInstanceOf(Error);
  });

  test('name이 클래스명으로 설정된다', () => {
    expect(new AppError('msg', 500, 'CODE').name).toBe('AppError');
  });

  test('스택 트레이스가 존재한다', () => {
    const err = new AppError('msg', 500, 'CODE');
    expect(err.stack).toBeDefined();
  });
});

describe('ValidationError', () => {
  test('status 400, code VALIDATION_ERROR로 생성된다', () => {
    const err = new ValidationError('제목이 너무 깁니다.');
    expect(err.status).toBe(400);
    expect(err.code).toBe('VALIDATION_ERROR');
    expect(err.message).toBe('제목이 너무 깁니다.');
  });

  test('AppError의 인스턴스이다', () => {
    expect(new ValidationError('msg')).toBeInstanceOf(AppError);
  });

  test('Error의 인스턴스이다', () => {
    expect(new ValidationError('msg')).toBeInstanceOf(Error);
  });
});

describe('UnauthorizedError', () => {
  test('status 401, code UNAUTHORIZED로 생성된다', () => {
    const err = new UnauthorizedError();
    expect(err.status).toBe(401);
    expect(err.code).toBe('UNAUTHORIZED');
  });

  test('기본 메시지가 설정된다', () => {
    const err = new UnauthorizedError();
    expect(err.message).toBe('인증이 필요합니다.');
  });

  test('메시지를 커스터마이즈할 수 있다', () => {
    const err = new UnauthorizedError('토큰이 만료되었습니다.');
    expect(err.message).toBe('토큰이 만료되었습니다.');
  });

  test('AppError의 인스턴스이다', () => {
    expect(new UnauthorizedError()).toBeInstanceOf(AppError);
  });
});

describe('ForbiddenError', () => {
  test('status 403, code FORBIDDEN으로 생성된다', () => {
    const err = new ForbiddenError();
    expect(err.status).toBe(403);
    expect(err.code).toBe('FORBIDDEN');
  });

  test('기본 메시지가 설정된다', () => {
    const err = new ForbiddenError();
    expect(err.message).toBe('권한이 없습니다.');
  });

  test('메시지를 커스터마이즈할 수 있다', () => {
    const err = new ForbiddenError('접근 불가');
    expect(err.message).toBe('접근 불가');
  });

  test('AppError의 인스턴스이다', () => {
    expect(new ForbiddenError()).toBeInstanceOf(AppError);
  });
});

describe('NotFoundError', () => {
  test('status 404, code NOT_FOUND로 생성된다', () => {
    const err = new NotFoundError();
    expect(err.status).toBe(404);
    expect(err.code).toBe('NOT_FOUND');
  });

  test('기본 메시지가 설정된다', () => {
    const err = new NotFoundError();
    expect(err.message).toBe('리소스를 찾을 수 없습니다.');
  });

  test('AppError의 인스턴스이다', () => {
    expect(new NotFoundError()).toBeInstanceOf(AppError);
  });
});

describe('ConflictError', () => {
  test('status 409, code CONFLICT로 생성된다', () => {
    const err = new ConflictError('이미 존재하는 이메일입니다.');
    expect(err.status).toBe(409);
    expect(err.code).toBe('CONFLICT');
    expect(err.message).toBe('이미 존재하는 이메일입니다.');
  });

  test('AppError의 인스턴스이다', () => {
    expect(new ConflictError('중복')).toBeInstanceOf(AppError);
  });
});
