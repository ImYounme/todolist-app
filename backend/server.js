'use strict';

require('dotenv').config();

const REQUIRED_ENV_VARS = [
  'NODE_ENV',
  'PORT',
  'DATABASE_URL',
  'JWT_SECRET',
  'JWT_EXPIRES_IN',
  'CORS_ORIGIN',
];

for (const varName of REQUIRED_ENV_VARS) {
  if (!process.env[varName]) {
    console.error(`[server] 필수 환경 변수 누락: ${varName}`);
    process.exit(1);
  }
}

const app = require('./app');

const PORT = process.env.PORT;

const httpServer = app.listen(PORT, () => {
  console.log(`[server] 서버 실행 중 — port ${PORT}, env ${process.env.NODE_ENV}`);
});

process.on('unhandledRejection', (reason) => {
  console.error('[server] unhandledRejection:', reason);
  httpServer.close(() => process.exit(1));
});

module.exports = httpServer;
 