'use strict';

process.env.JWT_SECRET = 'test-secret';
process.env.JWT_EXPIRES_IN = '1h';

const jwt = require('jsonwebtoken');
const { authMiddleware } = require('../../src/middlewares/auth.middleware');
const { UnauthorizedError } = require('../../src/utils/errors');

function makeReqRes(authHeader) {
  return {
    req: { headers: authHeader ? { authorization: authHeader } : {} },
    res: {},
    next: jest.fn(),
  };
}

describe('authMiddleware - 토큰 누락', () => {
  test('Authorization 헤더가 없으면 401을 next로 전달한다', () => {
    const { req, res, next } = makeReqRes(null);
    authMiddleware(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    expect(next.mock.calls[0][0].status).toBe(401);
  });

  test('Bearer 접두어 없는 헤더는 401을 전달한다', () => {
    const { req, res, next } = makeReqRes('Token abc123');
    authMiddleware(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
  });

  test('Bearer만 있고 토큰이 없으면 401을 전달한다', () => {
    const { req, res, next } = makeReqRes('Bearer ');
    authMiddleware(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
  });
});

describe('authMiddleware - 유효하지 않은 토큰', () => {
  test('위조된 토큰은 401을 전달한다', () => {
    const { req, res, next } = makeReqRes('Bearer invalid.token.here');
    authMiddleware(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
  });

  test('만료된 토큰은 401을 전달한다', () => {
    const expiredToken = jwt.sign({ sub: 1 }, 'test-secret', {
      algorithm: 'HS512',
      expiresIn: -1,
    });
    const { req, res, next } = makeReqRes(`Bearer ${expiredToken}`);
    authMiddleware(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
  });

  test('다른 시크릿으로 서명된 토큰은 401을 전달한다', () => {
    const token = jwt.sign({ sub: 1 }, 'other-secret', { algorithm: 'HS512' });
    const { req, res, next } = makeReqRes(`Bearer ${token}`);
    authMiddleware(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
  });
});

describe('authMiddleware - 유효한 토큰', () => {
  test('유효한 토큰이면 req.user.id가 설정된다', () => {
    const token = jwt.sign({ sub: 42 }, 'test-secret', { algorithm: 'HS512' });
    const { req, res, next } = makeReqRes(`Bearer ${token}`);
    authMiddleware(req, res, next);
    expect(req.user).toEqual({ id: 42 });
    expect(next).toHaveBeenCalledWith();
  });

  test('next()가 에러 없이 호출된다', () => {
    const token = jwt.sign({ sub: 1 }, 'test-secret', { algorithm: 'HS512' });
    const { req, res, next } = makeReqRes(`Bearer ${token}`);
    authMiddleware(req, res, next);
    expect(next).toHaveBeenCalledWith();
    expect(next).not.toHaveBeenCalledWith(expect.any(Error));
  });
});
