'use strict';

require('dotenv').config();
const request = require('supertest');
const app = require('./app');

async function smokeTest() {
  const email = `test-${Date.now()}@example.com`;
  const password = 'password1234';

  try {
    console.log(`[SmokeTest] Step 1: Signup with ${email}`);
    const signupRes = await request(app)
      .post('/api/auth/signup')
      .send({ email, password });
    
    if (signupRes.status !== 201) {
      console.error('[SmokeTest] Signup failed:', signupRes.body);
      process.exit(1);
    }
    console.log('[SmokeTest] Signup successful');

    console.log('[SmokeTest] Step 2: Login');
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email, password });

    if (loginRes.status !== 200) {
      console.error('[SmokeTest] Login failed:', loginRes.body);
      process.exit(1);
    }
    console.log('[SmokeTest] Login successful');
    console.log('[SmokeTest] Token:', loginRes.body.data.token.substring(0, 20) + '...');
    
    console.log('[SmokeTest] All clear!');
  } catch (err) {
    console.error('[SmokeTest] Error during smoke test:', err);
    process.exit(1);
  } finally {
    // Note: process.exit is needed because the pool might keep the process alive
    process.exit(0);
  }
}

smokeTest();
