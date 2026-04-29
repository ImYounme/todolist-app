'use strict';

const { AppError } = require('../utils/errors');

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (err instanceof AppError) {
    return res.status(err.status).json({
      success: false,
      message: err.message,
      code: err.code,
    });
  }

  // body-parser JSON 파싱 실패
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      success: false,
      message: '잘못된 JSON 형식입니다.',
      code: 'VALIDATION_ERROR',
    });
  }

  const isDevelopment = process.env.NODE_ENV === 'development';

  console.error('[error]', err);

  res.status(500).json({
    success: false,
    message: '서버 오류가 발생했습니다.',
    code: 'INTERNAL_ERROR',
    ...(isDevelopment && { stack: err.stack }),
  });
}

module.exports = { errorHandler };
