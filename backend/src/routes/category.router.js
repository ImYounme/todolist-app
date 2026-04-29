'use strict';

const { Router } = require('express');
const { authMiddleware } = require('../middlewares/auth.middleware');
const categoryController = require('../controllers/category.controller');

const router = Router();

router.use(authMiddleware);

router.get('/', categoryController.list);
router.post('/', categoryController.create);
router.patch('/:categoryId', categoryController.update);
router.delete('/:categoryId', categoryController.remove);

module.exports = router;
