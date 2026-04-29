'use strict';

const { Router } = require('express');
const { authMiddleware } = require('../middlewares/auth.middleware');
const todoController = require('../controllers/todo.controller');

const router = Router();

router.use(authMiddleware);

router.get('/', todoController.list);
router.post('/', todoController.create);
router.get('/:todoId', todoController.get);
router.patch('/:todoId', todoController.update);
router.delete('/:todoId', todoController.remove);
router.patch('/:todoId/status', todoController.updateStatus);

module.exports = router;
