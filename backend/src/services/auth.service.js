'use strict';

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { ValidationError, ConflictError, UnauthorizedError } = require('../utils/errors');
const authRepository = require('../repositories/auth.repository');
const { AUTH } = require('../constants/auth');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const BCRYPT_ROUNDS = 10;

async function signup(email, password) {
  if (!email || !EMAIL_REGEX.test(email)) {
    throw new ValidationError('유효하지 않은 이메일 형식입니다.');
  }
  if (!password) {
    throw new ValidationError('비밀번호를 입력해주세요.');
  }

  const existing = await authRepository.findUserByEmail(email);
  if (existing) {
    throw new ConflictError('이미 사용 중인 이메일입니다.', 'DUPLICATE_EMAIL');
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const user = await authRepository.createUser(email, passwordHash);

  return {
    id: user.id,
    email: user.email,
    createdAt: user.created_at,
  };
}

async function login(email, password) {
  if (!email) {
    throw new ValidationError('이메일을 입력해주세요.');
  }
  if (!password) {
    throw new ValidationError('비밀번호를 입력해주세요.');
  }

  const user = await authRepository.findUserForAuth(email);
  if (!user) {
    throw new UnauthorizedError('이메일 또는 비밀번호가 올바르지 않습니다.', 'INVALID_CREDENTIALS');
  }

  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    throw new UnauthorizedError('이메일 또는 비밀번호가 올바르지 않습니다.', 'INVALID_CREDENTIALS');
  }

  const token = jwt.sign(
    { sub: user.id },
    process.env.JWT_SECRET,
    { algorithm: AUTH.JWT_ALGORITHM, expiresIn: process.env.JWT_EXPIRES_IN }
  );

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      createdAt: user.created_at,
    },
  };
}

module.exports = { signup, login };
