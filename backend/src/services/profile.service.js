'use strict';

const userRepository = require('../repositories/user.repository');
const { NotFoundError } = require('../utils/errors');

async function getProfile(userId) {
  const user = await userRepository.findUserById(userId);
  if (!user) {
    throw new NotFoundError('사용자를 찾을 수 없습니다.');
  }
  return {
    id: user.id,
    email: user.email,
    createdAt: user.created_at,
  };
}

module.exports = { getProfile };
