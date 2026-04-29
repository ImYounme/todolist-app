'use strict';

require('dotenv').config();
const request = require('supertest');
const app = require('./app');
const { pool } = require('./src/db/pool');

async function runTests() {
  const timestamp = Date.now();
  const cheolsu = {
    email: `cheolsu.${timestamp}@example.com`,
    password: 'password1234',
    token: null,
    categories: {},
    todos: []
  };
  const soyoung = {
    email: `soyoung.${timestamp}@example.com`,
    password: 'password1234',
    token: null,
    categories: {},
    todos: []
  };

  try {
    console.log('--- SC-01: 신규 사용자 회원가입 (김철수) ---');
    const signupRes = await request(app)
      .post('/api/auth/signup')
      .send({ email: cheolsu.email, password: cheolsu.password });
    console.log(`Signup Status: ${signupRes.status}`);
    if (signupRes.status !== 201) {
      console.error('Signup Failed:', signupRes.body);
      throw new Error('SC-01 Failed');
    }
    console.log('김철수 회원가입 완료');

    console.log('\n--- SC-02: 로그인 및 로그아웃 (김철수) ---');
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: cheolsu.email, password: cheolsu.password });
    console.log(`Login Status: ${loginRes.status}`);
    if (loginRes.status !== 200) {
      console.error('Login Failed:', loginRes.body);
      throw new Error('SC-02 Failed');
    }
    cheolsu.token = loginRes.body.data.token;
    console.log('JWT 토큰 확인됨 (응답에 포함)');

    console.log('\n--- SC-08: 중복 이메일 회원가입 시도 (409) ---');
    const dupSignupRes = await request(app)
      .post('/api/auth/signup')
      .send({ email: cheolsu.email, password: 'differentPassword' });
    console.log(`Duplicate Signup Status: ${dupSignupRes.status}`);
    console.log(`Error Message: ${dupSignupRes.body.message}`);
    if (dupSignupRes.status !== 409) throw new Error('SC-08 Failed');

    console.log('\n--- SC-09: 미인증 상태로 할일 접근 시도 (401) ---');
    const unauthorizedRes = await request(app).get('/api/todos');
    console.log(`Unauthorized Access Status: ${unauthorizedRes.status}`);
    if (unauthorizedRes.status !== 401) throw new Error('SC-09 Failed');

    console.log('\n--- SC-03: 카테고리 생성 및 할일 등록 (김철수) ---');
    // Create categories
    const workCatRes = await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${cheolsu.token}`)
      .send({ name: '업무' });
    cheolsu.categories.work = workCatRes.body.data.id;
    console.log(`카테고리 "업무" 생성 완료: ID ${cheolsu.categories.work}`);

    const personalCatRes = await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${cheolsu.token}`)
      .send({ name: '개인' });
    cheolsu.categories.personal = personalCatRes.body.data.id;
    console.log(`카테고리 "개인" 생성 완료: ID ${cheolsu.categories.personal}`);

    // Create todos
    const todo1Res = await request(app)
      .post('/api/todos')
      .set('Authorization', `Bearer ${cheolsu.token}`)
      .send({
        title: '주간 보고서 작성',
        due_date: '2026-04-29',
        category_id: cheolsu.categories.work
      });
    console.log(`할일 "주간 보고서 작성" 생성 완료: ID ${todo1Res.body.data.id}, 상태: ${todo1Res.body.data.status}`);

    const todo2Res = await request(app)
      .post('/api/todos')
      .set('Authorization', `Bearer ${cheolsu.token}`)
      .send({
        title: '헬스장 등록',
        category_id: cheolsu.categories.personal
      });
    console.log(`할일 "헬스장 등록" 생성 완료: ID ${todo2Res.body.data.id}, 상태: ${todo2Res.body.data.status}`);

    console.log('\n--- SC-10: 할일 제목 100자 초과 입력 시도 (400) ---');
    const longTitle = 'a'.repeat(101);
    const longTitleRes = await request(app)
      .post('/api/todos')
      .set('Authorization', `Bearer ${cheolsu.token}`)
      .send({ title: longTitle });
    console.log(`제목 101자 할일 등록 시도 상태: ${longTitleRes.status}`);
    console.log(`오류 메시지: ${longTitleRes.body.message}`);
    if (longTitleRes.status !== 400) throw new Error('SC-10 Failed');

    console.log('\n--- SC-04: 할일 완료 처리 (박소영) ---');
    // Signup and login Soyoung
    await request(app).post('/api/auth/signup').send({ email: soyoung.email, password: soyoung.password });
    const soyoungLoginRes = await request(app).post('/api/auth/login').send({ email: soyoung.email, password: soyoung.password });
    soyoung.token = soyoungLoginRes.body.data.token;

    const houseCatRes = await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${soyoung.token}`)
      .send({ name: '가사' });
    soyoung.categories.house = houseCatRes.body.data.id;

    const vacuumTodoRes = await request(app)
      .post('/api/todos')
      .set('Authorization', `Bearer ${soyoung.token}`)
      .send({
        title: '청소기 돌리기',
        category_id: soyoung.categories.house
      });
    const vacuumTodoId = vacuumTodoRes.body.data.id;
    console.log(`할일 "청소기 돌리기" 생성 완료: ID ${vacuumTodoId}, 초기 상태: ${vacuumTodoRes.body.data.status}`);

    // Mark as done
    const doneRes = await request(app)
      .patch(`/api/todos/${vacuumTodoId}/status`)
      .set('Authorization', `Bearer ${soyoung.token}`)
      .send({ status: 'done' });
    console.log(`상태 변경: ${doneRes.body.data.status}, 완료일시: ${doneRes.body.data.completed_at}`);
    if (doneRes.body.data.status !== 'done' || !doneRes.body.data.completed_at) throw new Error('SC-04 진행 중 -> 완료 실패');

    // Revert to in_progress
    const revertRes = await request(app)
      .patch(`/api/todos/${vacuumTodoId}/status`)
      .set('Authorization', `Bearer ${soyoung.token}`)
      .send({ status: 'in_progress' });
    console.log(`상태 복구: ${revertRes.body.data.status}, 완료일시: ${revertRes.body.data.completed_at}`);
    if (revertRes.body.data.status !== 'in_progress' || revertRes.body.data.completed_at !== null) throw new Error('SC-04 완료 -> 진행 중 실패');

    console.log('\n--- SC-05 & SC-06: 필터링 및 기한 초과 확인 ---');
    // Create an overdue todo for Cheolsu
    // Today is assumed by CURRENT_DATE in DB.
    // Let's set due_date to yesterday.
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const overdueTodoRes = await request(app)
      .post('/api/todos')
      .set('Authorization', `Bearer ${cheolsu.token}`)
      .send({
        title: '분기 보고서 제출',
        due_date: yesterdayStr,
        category_id: cheolsu.categories.work
      });
    const overdueTodoId = overdueTodoRes.body.data.id;
    console.log(`기한 초과 할일 생성 완료: ID ${overdueTodoId}, 종료일: ${yesterdayStr}`);

    // Filter by overdue
    const filterOverdueRes = await request(app)
      .get('/api/todos?overdue=true')
      .set('Authorization', `Bearer ${cheolsu.token}`);
    console.log(`기한 초과 할일 필터링 결과 개수: ${filterOverdueRes.body.data.length}`);
    const isPresent = filterOverdueRes.body.data.some(t => t.id === overdueTodoId);
    console.log(`기한 초과 목록에 "분기 보고서 제출"이 포함되어 있는가? ${isPresent}`);
    if (!isPresent) throw new Error('SC-06 필터링 실패');

    // SC-06: Update due date to tomorrow to resolve overdue
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    await request(app)
      .patch(`/api/todos/${overdueTodoId}`)
      .set('Authorization', `Bearer ${cheolsu.token}`)
      .send({ due_date: tomorrowStr });
    console.log(`종료일을 내일(${tomorrowStr})로 수정함`);
    
    const filterOverdueRes2 = await request(app)
      .get('/api/todos?overdue=true')
      .set('Authorization', `Bearer ${cheolsu.token}`);
    const isPresentAfterUpdate = filterOverdueRes2.body.data.some(t => t.id === overdueTodoId);
    console.log(`수정 후 기한 초과 목록에 "분기 보고서 제출"이 포함되어 있는가? ${isPresentAfterUpdate}`);
    if (isPresentAfterUpdate) throw new Error('SC-06 기한 초과 해제 실패');

    console.log('\n--- SC-07: 카테고리 삭제 및 할일 미지정 전환 확인 ---');
    const tempCatRes = await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${soyoung.token}`)
      .send({ name: '임시' });
    const tempCatId = tempCatRes.body.data.id;

    const tempTodoRes = await request(app)
      .post('/api/todos')
      .set('Authorization', `Bearer ${soyoung.token}`)
      .send({ title: '도서관 반납', category_id: tempCatId });
    const tempTodoId = tempTodoRes.body.data.id;
    console.log(`"임시" 카테고리에 할일 "도서관 반납" 생성 완료`);

    await request(app)
      .delete(`/api/categories/${tempCatId}`)
      .set('Authorization', `Bearer ${soyoung.token}`);
    console.log(`카테고리 "임시" 삭제 완료`);

    const updatedTodoRes = await request(app)
      .get(`/api/todos`)
      .set('Authorization', `Bearer ${soyoung.token}`);
    const updatedTodo = updatedTodoRes.body.data.find(t => t.id === tempTodoId);
    console.log(`카테고리 삭제 후 할일 "도서관 반납"의 category_id: ${updatedTodo.category_id}`);
    if (updatedTodo.category_id !== null) throw new Error('SC-07 미지정 전환 실패');

    console.log('\n--- SC-11: 카테고리 20개 한도 초과 시도 ---');
    console.log('박소영 사용자의 카테고리 19개를 추가로 생성 중 (현재 1개 있음)...');
    for (let i = 1; i <= 19; i++) {
      await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${soyoung.token}`)
        .send({ name: `Cat ${i}` });
    }
    const extraCatRes = await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${soyoung.token}`)
      .send({ name: '21번째 카테고리' });
    console.log(`21번째 카테고리 생성 시도 상태: ${extraCatRes.status}`);
    console.log(`오류 메시지: ${extraCatRes.body.message}`);
    if (extraCatRes.status < 400) throw new Error('SC-11 한도 초과 생성 성공 오류');

    console.log('\n=========================================');
    console.log('모든 시나리오 테스트가 성공적으로 완료되었습니다.');
    console.log('=========================================');

  } catch (err) {
    console.error('\n!!! 테스트 중 오류 발생 !!!');
    console.error(err);
    process.exit(1);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

runTests();
