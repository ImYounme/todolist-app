'use strict';

class AppError extends Error {
  constructor(message, status, code) {
    super(message);
    this.name = this.constructor.name;
    this.status = status;
    this.code = code;
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message, code = 'VALIDATION_ERROR') {
    super(message, 400, code);
  }
}

class UnauthorizedError extends AppError {
  constructor(message = '인증이 필요합니다.', code = 'UNAUTHORIZED') {
    super(message, 401, code);
  }
}

class ForbiddenError extends AppError {
  constructor(message = '권한이 없습니다.') {
    super(message, 403, 'FORBIDDEN');
  }
}

class NotFoundError extends AppError {
  constructor(message = '리소스를 찾을 수 없습니다.') {
    super(message, 404, 'NOT_FOUND');
  }
}

class ConflictError extends AppError {
  constructor(message, code = 'CONFLICT') {
    super(message, 409, code);
  }
}

module.exports = {
  AppError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
};
