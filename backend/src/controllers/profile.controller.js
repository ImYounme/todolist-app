'use strict';

const profileService = require('../services/profile.service');

async function getProfile(req, res, next) {
  try {
    const user = await profileService.getProfile(req.user.id);
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
}

module.exports = { getProfile };
