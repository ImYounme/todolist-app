'use strict';

const { Router } = require('express');
const { authMiddleware } = require('../middlewares/auth.middleware');
const profileController = require('../controllers/profile.controller');

const router = Router();

router.get('/', authMiddleware, profileController.getProfile);

module.exports = router;
