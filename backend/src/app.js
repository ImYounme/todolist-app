'use strict';

const express = require('express');
const cors = require('cors');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const { errorHandler } = require('./middlewares/error.middleware');

const app = express();

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || origin === process.env.CORS_ORIGIN) {
      callback(null, true);
    } else {
      callback(null, false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());

app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`);
  });
  next();
});

app.get('/health', (req, res) => {
  res.json({ success: true, data: { status: 'ok' } });
});

// Swagger UI
const swaggerDocument = require('../../swagger/swagger.json');
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
  customCss: '.swagger-ui .top-bar { display: none }',
  customSiteTitle: 'TodoList API Docs',
  customfavicon: '/favicon.ico',
}));

// 도메인 라우터
app.use('/api/auth', require('./routes/auth.router'));
app.use('/api/profile', require('./routes/profile.router'));
app.use('/api/categories', require('./routes/category.router'));
app.use('/api/todos', require('./routes/todo.router'));

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: '요청한 리소스를 찾을 수 없습니다.',
    code: 'NOT_FOUND',
  });
});

app.use(errorHandler);

module.exports = app;
