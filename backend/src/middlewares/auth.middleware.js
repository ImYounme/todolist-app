'use strict';

const jwt = require('jsonwebtoken');
const { UnauthorizedError } = require('../utils/errors');
const { AUTH } = require('../constants/auth');

function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new UnauthorizedError('인증 토큰이 필요합니다.'));
  }

  const token = authHeader.slice(7);

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: [AUTH.JWT_ALGORITHM],
    });
    req.user = { id: decoded.sub };
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return next(new UnauthorizedError('토큰이 만료되었습니다.'));
    }
    return next(new UnauthorizedError('유효하지 않은 토큰입니다.'));
  }
}

module.exports = { authMiddleware };
