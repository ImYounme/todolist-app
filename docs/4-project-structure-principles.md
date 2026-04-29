# TodoList 애플리케이션 — 프로젝트 구조 설계 원칙

## 1. 문서 정보

**버전:** 1.1.0
**작성일:** 2026-04-28
**작성자:** Software Architect
**참조 문서:** 도메인 정의서 v1.1.0, PRD v1.1.0, 사용자 시나리오 v1.0.0

### 변경 이력

| 버전 | 날짜 | 변경 유형 | 변경 내용 | 작성자 |
|------|------|-----------|-----------|--------|
| 1.0.0 | 2026-04-28 | 최초 작성 | 프로젝트 구조 설계 원칙 초안 작성 | Software Architect |
| 1.1.0 | 2026-04-28 | 내용 추가 | ARCH-GEN-007 환경변수 분리 원칙 추가 | Software Architect |

---

## 2. 최상위 공통 원칙 (ARCH-GEN)

프론트엔드와 백엔드 모두에 동일하게 적용되는 기본 원칙이다.

---

### ARCH-GEN-001: 단일 책임 원칙 (Single Responsibility)

**규칙:** 하나의 파일 또는 모듈은 하나의 명확한 책임만 가진다. 하나의 이유로만 변경되어야 한다.

**Why:** 책임이 혼합된 파일은 변경 파급 범위를 예측하기 어렵게 만들어 버그 발생 확률을 높인다.

**적용 기준:**
- 백엔드: Router는 경로 정의만, Controller는 요청/응답 처리만, Service는 비즈니스 로직만 담당한다.
- 프론트엔드: 컴포넌트는 UI 렌더링만, 훅은 상태 및 부수 효과만, API 클라이언트는 서버 통신만 담당한다.

**위반 예시:**
```javascript
// 위반: Controller가 비즈니스 로직과 DB 쿼리를 모두 처리
async function createTodo(req, res) {
  const { title } = req.body;
  if (!title || title.length > 100) { // 비즈니스 로직이 Controller에 있음
    return res.status(400).json({ success: false, message: '제목은 1~100자여야 합니다.' });
  }
  const result = await pool.query( // DB 쿼리가 Controller에 있음
    'INSERT INTO todos (title, user_id) VALUES ($1, $2) RETURNING *',
    [title, req.user.id]
  );
  res.status(201).json({ success: true, data: result.rows[0] });
}
```

---

### ARCH-GEN-002: 도메인 기반 코드 구성

**규칙:** 모든 코드는 `auth`, `todo`, `category` 세 도메인을 기준으로 구성한다. 특정 도메인에만 속하는 코드는 해당 도메인 디렉토리 안에 배치한다.

**Why:** 기능 추가 또는 수정 시 관련 코드가 흩어져 있으면 변경 누락이 발생하고 유지보수 비용이 증가한다.

**적용 기준:**
- 백엔드: `routes/todo.router.js`, `services/todo.service.js` 등 도메인별 파일 분리
- 프론트엔드: `features/auth/`, `features/todo/`, `features/category/` 디렉토리 구조
- 두 개 이상의 도메인에서 공통으로 사용되는 코드는 `utils/` 또는 `lib/`에 배치한다.

---

### ARCH-GEN-003: 비밀값 하드코딩 금지

**규칙:** JWT 시크릿, DB 비밀번호, API 키 등 모든 비밀값은 반드시 환경 변수를 통해 주입한다. 소스 코드에 리터럴로 작성하는 것을 금지한다.

**Why:** 하드코딩된 비밀값은 버전 관리 시스템을 통해 외부에 노출될 경우 복구 불가능한 보안 사고로 이어진다.

**위반 예시:**
```javascript
// 위반: 시크릿을 코드에 직접 작성
const token = jwt.sign(payload, 'my-super-secret-key', { algorithm: 'HS512' });

// 올바른 방법:
const token = jwt.sign(payload, process.env.JWT_SECRET, { algorithm: 'HS512' });
```

**적용 기준:**
- `.env` 파일은 `.gitignore`에 반드시 추가한다.
- `.env.example` 파일에 필요한 변수 목록과 설명만 기재하고 실제 값은 작성하지 않는다.

---

### ARCH-GEN-004: JavaScript 전용 운용 및 타입 안전성 보완

**규칙:** 프론트엔드와 백엔드 모두 JavaScript(ES2022+)로만 작성한다. TypeScript를 도입하지 않는다.

**Why:** Phase 1의 3일 일정 내에 TypeScript 설정, 타입 정의, 컴파일 과정은 개발 속도를 저해한다. 대신 실용적인 보완 수단을 적용하여 타입 안전성을 확보한다.

**TypeScript 미사용 보완 방법:**

1. **JSDoc 주석:** 함수 시그니처, 파라미터, 반환값의 형태를 JSDoc으로 명시한다.
```javascript
/**
 * 할일을 생성한다.
 * @param {object} params
 * @param {string} params.title - 할일 제목 (최대 100자)
 * @param {string|null} params.description - 할일 설명
 * @param {string|null} params.dueDate - 종료일 (ISO 8601)
 * @param {number|null} params.categoryId - 카테고리 ID
 * @param {number} params.userId - 소유자 사용자 ID
 * @returns {Promise<{id: number, title: string, status: string, createdAt: string}>}
 */
async function createTodo(params) { /* ... */ }
```

2. **런타임 유효성 검증:** 서버 진입점(Controller)과 클라이언트 제출 시점에서 입력값의 타입과 형식을 명시적으로 검증한다.
```javascript
// 서버 측 유효성 검증 예시
function validateCreateTodoInput(body) {
  const { title } = body;
  if (typeof title !== 'string' || title.trim().length === 0) {
    throw new Error('제목은 필수 문자열입니다.');
  }
  if (title.length > 100) {
    throw new Error('제목은 최대 100자입니다.');
  }
}
```

3. **명시적 구조 정의:** 복잡한 객체 형태는 JSDoc `@typedef`로 한 곳에 정의하여 재사용한다.

---

### ARCH-GEN-005: 환경 변수 관리

**규칙:** 환경에 따라 달라지는 모든 값(포트, DB 연결 정보, JWT 시크릿, CORS 허용 출처 등)은 환경 변수로 관리한다.

**Why:** 환경별 설정이 코드에 혼재하면 개발/프로덕션 환경 분리가 불가능해지고 배포 오류가 빈번히 발생한다.

**규칙 세부 사항:**
- 프로젝트 루트(`backend/`, `frontend/`)에 `.env`, `.env.example` 파일을 각각 배치한다.
- 애플리케이션 시작 시 필수 환경 변수의 존재 여부를 검증하고, 누락된 경우 즉시 프로세스를 종료한다.

```javascript
// 애플리케이션 시작 시 필수 환경 변수 검증
const REQUIRED_ENV_VARS = ['DATABASE_URL', 'JWT_SECRET', 'PORT', 'CORS_ORIGIN'];

for (const varName of REQUIRED_ENV_VARS) {
  if (!process.env[varName]) {
    console.error(`필수 환경 변수 누락: ${varName}`);
    process.exit(1);
  }
}
```

---

### ARCH-GEN-006: 불필요한 주석 금지

**규칙:** 코드가 수행하는 행위를 단순히 반복 설명하는 주석은 작성하지 않는다. 주석은 "왜(Why)" 이 결정을 내렸는지 또는 비즈니스 규칙 참조(예: `DR-CAT-001`)에만 사용한다.

**Why:** 코드와 주석이 분리되어 관리되면 주석이 오히려 혼란을 야기한다. 코드 자체가 의도를 표현해야 한다.

**위반 예시:**
```javascript
// 위반: 코드 내용을 그대로 반복하는 주석
// 사용자 ID와 카테고리 ID로 카테고리를 찾는다
const category = await categoryRepository.findByIdAndUserId(categoryId, userId);

// 올바른 예시: 비즈니스 규칙 명시 (DR-CAT-001: 카테고리 소유권 검증)
const category = await categoryRepository.findByIdAndUserId(categoryId, userId);
if (!category) {
  throw new ForbiddenError('해당 카테고리에 대한 접근 권한이 없습니다.');
}
```

---

### ARCH-GEN-007: 환경변수 분리 원칙

**규칙:** 환경 변수는 실행 환경(`development` / `production`)에 따라 파일을 분리하여 관리한다. 환경 간 변수가 혼재하거나 프로덕션 값을 개발 환경에서 사용하는 것을 금지한다.

**Why:** 환경별로 다른 DB, JWT 시크릿, CORS 허용 출처가 혼재하면 개발 중 실수로 프로덕션 데이터를 변경하거나, 개발용 낮은 보안 설정이 프로덕션에 적용되는 사고가 발생한다.

**파일 구조:**

```
backend/
├── .env               # 로컬 개발 실행값 (git 제외)
├── .env.example       # 변수 목록 및 설명만 기재 (git 포함)
└── .env.production    # 프로덕션 배포 시 서버에서 주입 (git 절대 포함 금지)

frontend/
├── .env               # 로컬 개발 실행값 (git 제외)
├── .env.example       # 변수 목록 및 설명만 기재 (git 포함)
└── .env.production    # 프로덕션 빌드 시 CI/CD에서 주입 (git 절대 포함 금지)
```

**환경별 변수 값 기준:**

| 변수 | development | production |
|------|-------------|------------|
| `NODE_ENV` | `development` | `production` |
| `DATABASE_URL` | 로컬 PostgreSQL | 프로덕션 DB |
| `JWT_SECRET` | 임의 개발용 문자열 | 충분한 엔트로피의 랜덤 시크릿 |
| `CORS_ORIGIN` | `http://localhost:5173` | 실제 서비스 도메인 |
| `VITE_API_BASE_URL` (FE) | `http://localhost:3000` | 실제 API 서버 URL |

**`.env.example` 작성 규칙:**

```dotenv
# 백엔드 .env.example
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://user:password@localhost:5432/todolist_dev
JWT_SECRET=your-jwt-secret-here
CORS_ORIGIN=http://localhost:5173
```

**금지 사항:**
- `.env`, `.env.production` 파일을 git에 커밋하는 것을 금지한다. (`.gitignore`에 반드시 포함)
- 개발 환경에서 프로덕션 DB URL 또는 JWT 시크릿을 사용하는 것을 금지한다.
- 프론트엔드 환경 변수에 서버 전용 비밀값(JWT 시크릿, DB 비밀번호)을 포함하는 것을 금지한다. (브라우저에 노출됨)
- `VITE_` 접두어가 없는 변수는 Vite 빌드 시 프론트엔드 번들에 포함되지 않는다. 프론트엔드 공개 변수에만 `VITE_` 접두어를 사용한다.

**관련 원칙:** ARCH-GEN-003 (비밀값 하드코딩 금지), ARCH-GEN-005 (환경 변수 관리), ARCH-SEC-006 (환경별 설정 분리)

---

## 3. 의존성 / 레이어 원칙 (ARCH-LAYER)

---

### ARCH-LAYER-001: 단방향 의존성 강제

**규칙:** 레이어 간 의존 방향은 단방향으로 고정된다. 하위 레이어는 상위 레이어를 참조하지 않는다.

**Why:** 양방향 또는 순환 의존성은 시스템 복잡도를 기하급수적으로 높이고 테스트를 불가능하게 만든다.

**의존 방향:**

```
[프론트엔드]
Page/View → Component → Hook → API Client
    (고수준)                        (저수준)

[백엔드]
Router → Controller → Service → Repository → DB
  (진입점)                                   (데이터)
```

- 상위 레이어는 하위 레이어를 호출할 수 있다.
- 하위 레이어는 상위 레이어를 절대 호출하지 않는다.
- 같은 레이어 내의 횡단 참조는 공통 모듈(`utils/`, `lib/`)을 경유한다.

---

### ARCH-LAYER-002: 백엔드 레이어 책임 분리

**규칙:** 백엔드는 4개 레이어로 구성하며, 각 레이어는 정해진 책임만 수행한다.

**Why:** 책임이 명확히 분리되어야 특정 레이어만 독립적으로 교체하거나 테스트할 수 있다.

| 레이어 | 파일 위치 | 책임 | 금지 사항 |
|--------|----------|------|----------|
| Router | `src/routes/` | URL 경로와 HTTP 메서드 정의, 미들웨어 적용, Controller 연결 | 비즈니스 로직, DB 쿼리 작성 |
| Controller | `src/controllers/` | 요청 파라미터 추출, 입력 유효성 검증, Service 호출, HTTP 응답 구성 | DB 쿼리 직접 작성, 비즈니스 규칙 판단 |
| Service | `src/services/` | 비즈니스 규칙 구현 (소유권 검증, 상태 전환 로직, 기한 초과 판단 등) | HTTP 요청/응답 객체 직접 접근, DB 쿼리 직접 작성 |
| Repository | `src/repositories/` | PostgreSQL 쿼리 실행, 결과 반환 | 비즈니스 로직, HTTP 객체 접근 |

**호출 흐름 예시:**
```
POST /api/todos
  → todo.router.js (경로 매핑, auth 미들웨어 적용)
    → todo.controller.js (body 파싱, 유효성 검증)
      → todo.service.js (DR-TODO-002 제목 길이 검증, 소유권 확인)
        → todo.repository.js (INSERT 쿼리 실행)
```

---

### ARCH-LAYER-003: 프론트엔드 레이어 책임 분리

**규칙:** 프론트엔드는 4개 레이어로 구성하며, 각 레이어는 정해진 책임만 수행한다.

**Why:** UI와 상태 로직이 혼합되면 컴포넌트 재사용이 불가능하고 테스트 작성이 어려워진다.

| 레이어 | 파일 위치 | 책임 | 금지 사항 |
|--------|----------|------|----------|
| Page/View | `src/pages/` | 라우트 단위 화면 구성, 레이아웃 조합 | 비즈니스 데이터 처리 로직, 직접 fetch 호출 |
| Component | `src/features/[domain]/components/`, `src/components/` | UI 렌더링, 사용자 이벤트 수신 | fetch/axios 직접 호출, 전역 상태 직접 조작 |
| Hook | `src/features/[domain]/hooks/` | TanStack Query를 통한 서버 상태 관리, Zustand 스토어 접근 | UI 렌더링 로직, fetch 직접 호출 |
| API Client | `src/features/[domain]/api/` | axios 인스턴스를 통한 서버 API 호출, 요청/응답 직렬화 | 상태 관리, UI 로직 |

---

### ARCH-LAYER-004: 레이어 간 직접 호출 금지

**규칙:** 레이어를 건너뛰는 직접 호출은 금지한다. 반드시 인접한 레이어를 통해서만 접근한다.

**Why:** 레이어를 건너뛰면 해당 레이어가 제공하는 검증, 캐싱, 에러 처리 로직이 우회되어 일관성이 깨진다.

**위반 예시:**
```javascript
// 위반: Component에서 API 직접 호출 (Hook 레이어 우회)
function TodoItem({ todoId }) {
  const handleDelete = async () => {
    await axios.delete(`/api/todos/${todoId}`); // 금지
  };
  return <button onClick={handleDelete}>삭제</button>;
}

// 올바른 방법: Hook을 경유
function TodoItem({ todoId }) {
  const { deleteTodo } = useDeleteTodo();
  return <button onClick={() => deleteTodo(todoId)}>삭제</button>;
}
```

---

### ARCH-LAYER-005: 순환 참조 금지

**규칙:** 모듈 간 순환 의존(A → B → A)을 금지한다.

**Why:** 순환 참조는 Node.js 모듈 시스템에서 `undefined` 참조 오류를 유발하며, 런타임에서 디버깅이 극히 어렵다.

**적용 기준:**
- 도메인 간 순환 참조를 금지한다. (`todo` 서비스가 `category` 서비스를 직접 참조하고, `category` 서비스가 `todo` 서비스를 다시 참조하는 구조 금지)
- 공유 로직은 `utils/` 또는 `constants/`로 추출하여 양쪽에서 단방향 참조하도록 구성한다.

---

## 4. 코드 / 네이밍 원칙 (ARCH-NAMING)

---

### ARCH-NAMING-001: 파일명 케이싱 규칙

**규칙:** 모든 JavaScript 파일은 `kebab-case`를 사용한다. React 컴포넌트 파일(`*.jsx`)만 예외적으로 `PascalCase`를 사용한다.

**Why:** 파일 시스템 대소문자 처리 방식이 OS마다 다르며(macOS는 case-insensitive, Linux는 case-sensitive), `kebab-case`는 모든 환경에서 일관되게 동작한다. 컴포넌트 파일의 `PascalCase`는 React 생태계의 확립된 관례를 따른다.

| 파일 유형 | 케이싱 규칙 | 예시 |
|----------|-----------|------|
| 백엔드 JS 파일 | kebab-case | `todo-service.js`, `auth-middleware.js` |
| 프론트엔드 유틸/훅/API | kebab-case | `use-todos.js`, `todo-api.js` |
| React 컴포넌트 | PascalCase | `TodoItem.jsx`, `CategoryFilter.jsx` |
| 페이지 컴포넌트 | PascalCase + Page 접미어 | `TodoListPage.jsx`, `LoginPage.jsx` |

---

### ARCH-NAMING-002: 식별자 네이밍 규칙

**규칙:** 코드 내 식별자는 역할에 따라 정해진 케이싱을 사용한다.

**Why:** 일관된 네이밍은 코드 리뷰 속도를 높이고 식별자의 의미를 즉시 파악하게 한다.

| 식별자 유형 | 규칙 | 예시 |
|-----------|------|------|
| 변수, 함수, 파라미터 | camelCase | `userId`, `createTodo`, `dueDate` |
| 클래스 | PascalCase | `TodoService`, `ApiError` |
| 상수 (변경 불가 값) | UPPER_SNAKE_CASE | `MAX_CATEGORY_COUNT`, `JWT_ALGORITHM` |
| React 컴포넌트 함수 | PascalCase | `TodoItem`, `CategoryFilter` |
| 커스텀 훅 함수 | camelCase + use 접두어 | `useTodos`, `useDeleteCategory` |

---

### ARCH-NAMING-003: 의미 있는 이름 사용

**규칙:** 약어, 단일 문자 변수, 의미 불명확한 이름을 지양한다. 이름만으로 역할과 데이터 형태를 파악할 수 있어야 한다.

**Why:** TypeScript의 타입 추론 없이 JavaScript를 사용하므로, 변수명이 데이터의 형태와 의도를 표현하는 유일한 수단이 된다.

**위반 예시:**
```javascript
// 위반: 의미 불명확한 이름
const d = new Date();
const fn = async (u, t) => { ... };
const res = await repo.get(id);

// 올바른 예시:
const currentDate = new Date();
const updateTodoStatus = async (userId, todoId) => { ... };
const todo = await todoRepository.findByIdAndUserId(todoId, userId);
```

---

### ARCH-NAMING-004: 백엔드 파일 네이밍 패턴

**규칙:** 백엔드 각 레이어의 파일명은 `[domain].[layer].js` 패턴을 따른다.

**Why:** 파일명만으로 도메인과 레이어를 즉시 파악하여 탐색 비용을 줄인다.

| 레이어 | 패턴 | 예시 |
|--------|------|------|
| Router | `[domain].router.js` | `todo.router.js`, `auth.router.js`, `category.router.js` |
| Controller | `[domain].controller.js` | `todo.controller.js`, `auth.controller.js` |
| Service | `[domain].service.js` | `todo.service.js`, `category.service.js` |
| Repository | `[domain].repository.js` | `todo.repository.js`, `user.repository.js` |
| Middleware | `[name].middleware.js` | `auth.middleware.js`, `error.middleware.js` |

---

### ARCH-NAMING-005: 프론트엔드 파일 네이밍 패턴

**규칙:** 프론트엔드 각 레이어의 파일명은 역할을 명시하는 패턴을 따른다.

**Why:** 파일명만으로 파일의 역할과 위치를 예측할 수 있어 탐색 속도가 향상된다.

| 유형 | 패턴 | 예시 |
|------|------|------|
| 컴포넌트 | `[ComponentName].jsx` | `TodoItem.jsx`, `CategoryFilter.jsx`, `TodoForm.jsx` |
| 페이지 | `[PageName]Page.jsx` | `TodoListPage.jsx`, `LoginPage.jsx`, `SignupPage.jsx` |
| 커스텀 훅 | `use-[name].js` | `use-todos.js`, `use-auth.js`, `use-categories.js` |
| Zustand 스토어 | `[domain]-store.js` | `auth-store.js`, `todo-store.js` |
| API 클라이언트 | `[domain]-api.js` | `todo-api.js`, `auth-api.js`, `category-api.js` |

---

## 5. 테스트 / 품질 원칙 (ARCH-QUALITY)

---

### ARCH-QUALITY-001: 클라이언트 + 서버 이중 유효성 검증

**규칙:** 모든 사용자 입력은 클라이언트와 서버 양쪽에서 독립적으로 검증한다. 클라이언트 검증을 서버 검증의 대체재로 사용하지 않는다.

**Why:** 클라이언트 측 검증은 사용자 경험 개선용이며 쉽게 우회 가능하다. 서버 측 검증만이 실제 보안 경계를 형성한다 (SC-10 참조: 클라이언트 검증 우회 후 API 직접 요청 시나리오).

**적용 규칙:**
- 클라이언트: 폼 제출 전 실시간 인라인 오류 메시지 표시 (NFR-UX-002)
- 서버: Controller에서 입력값 검증 후, 통과한 경우만 Service로 전달
- 검증 규칙은 양쪽에서 동일하게 유지한다 (예: 제목 최대 100자는 프론트와 백엔드 모두 동일 기준 적용)

---

### ARCH-QUALITY-002: 표준화된 오류 처리

**규칙:** 오류 처리는 레이어별로 정해진 형식을 따른다.

**Why:** 일관되지 않은 오류 응답은 클라이언트 오류 처리 로직을 복잡하게 만들고 디버깅 시간을 증가시킨다.

**서버 오류 응답 형식:**
```json
{
  "success": false,
  "message": "사람이 읽을 수 있는 오류 설명",
  "code": "ERROR_CODE"
}
```

**클라이언트 오류 표시 규칙:**
- 폼 필드 유효성 오류: 해당 입력 필드 바로 아래 인라인 메시지로 표시
- API 요청 실패: 토스트 또는 화면 상단 배너로 표시
- 인증 만료(401): 로그인 화면으로 자동 리다이렉트

**오류 코드 목록 예시:**
| 코드 | 의미 |
|------|------|
| `VALIDATION_ERROR` | 입력값 유효성 검증 실패 |
| `DUPLICATE_EMAIL` | 이미 존재하는 이메일 |
| `UNAUTHORIZED` | 인증 토큰 없음 또는 만료 |
| `FORBIDDEN` | 리소스 소유권 없음 |
| `NOT_FOUND` | 리소스를 찾을 수 없음 |
| `CATEGORY_LIMIT_EXCEEDED` | 카테고리 20개 한도 초과 |
| `DUPLICATE_CATEGORY_NAME` | 동일 사용자 내 중복 카테고리 이름 |
| `INTERNAL_ERROR` | 서버 내부 오류 |

---

### ARCH-QUALITY-003: 표준화된 성공 응답 형식

**규칙:** 모든 API 성공 응답은 다음 형식을 따른다.

**Why:** 일관된 응답 형식은 프론트엔드에서 응답을 파싱하는 코드를 단순화하고, 추후 미들웨어를 통한 로깅/모니터링을 용이하게 한다.

**단일 리소스 응답:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "주간 보고서 작성",
    "status": "in_progress",
    "createdAt": "2026-04-28T09:00:00Z"
  }
}
```

**목록 응답:**
```json
{
  "success": true,
  "data": [
    { "id": 1, "title": "주간 보고서 작성" }
  ]
}
```

**생성/삭제 등 데이터 없는 성공 응답:**
```json
{
  "success": true,
  "data": null
}
```

---

### ARCH-QUALITY-004: Phase 1 테스트 전략

**규칙:** Phase 1(3일 일정)에서는 단위 테스트 작성을 최소화하고, API 엔드투엔드 통합 검증을 우선한다.

**Why:** 3일의 촉박한 일정에서 모든 단위 테스트를 작성하면 핵심 기능 구현 시간이 부족해진다. 사용자 시나리오 기반 통합 검증이 실제 결함 발견에 더 효과적이다.

**Phase 1 검증 우선순위:**
1. 인증 흐름 전체 (회원가입 → 로그인 → 보호 API 접근)
2. 할일 CRUD 전 과정 (생성/조회/수정/삭제/상태 변경)
3. 카테고리 CRUD 및 삭제 시 할일 미지정 전환
4. 소유권 검증 (403 응답)
5. 미인증 접근 차단 (401 응답)
6. 입력 유효성 검증 (100자 초과, 빈 제목, 카테고리 한도)

**Phase 2 목표:** Service 레이어 단위 테스트, Repository 레이어 DB 통합 테스트

---

## 6. 설정 / 보안 / 운영 원칙 (ARCH-SEC)

---

### ARCH-SEC-001: JWT 알고리즘 고정

**규칙:** JWT 서명 알고리즘은 반드시 `HS512`를 사용한다. 다른 알고리즘(HS256, RS256 등)으로의 변경을 금지한다.

**Why:** PRD NFR-SEC-001에서 HS-512로 명시 확정되었으며, HS512는 256비트 대비 높은 보안 강도를 제공한다.

```javascript
// 올바른 JWT 발급
const token = jwt.sign(
  { userId: user.id, email: user.email },
  process.env.JWT_SECRET,
  { algorithm: 'HS512', expiresIn: process.env.JWT_EXPIRES_IN }
);

// JWT 검증
const decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS512'] });
```

---

### ARCH-SEC-002: 비밀번호 bcrypt 해시 필수 적용

**규칙:** 사용자 비밀번호는 반드시 bcrypt로 단방향 해시 처리하여 저장한다. 평문, 가역 암호화, MD5/SHA 단순 해시는 절대 사용하지 않는다.

**Why:** 평문 또는 약한 해시로 저장된 비밀번호는 DB 유출 시 모든 사용자 계정이 즉시 탈취된다 (DR-AUTH-004).

```javascript
const bcrypt = require('bcrypt');
const BCRYPT_ROUNDS = 12;

// 회원가입: 해시 생성
const hashedPassword = await bcrypt.hash(plainPassword, BCRYPT_ROUNDS);

// 로그인: 해시 비교
const isMatch = await bcrypt.compare(plainPassword, hashedPassword);
```

---

### ARCH-SEC-003: 서버 측 소유권 검증 필수

**규칙:** 할일 및 카테고리의 수정/삭제/조회 API에서 요청자가 해당 리소스의 소유자임을 반드시 서버에서 검증한다. 클라이언트가 전달한 소유자 정보를 신뢰하지 않는다.

**Why:** 클라이언트 측 소유권 검증은 HTTP 요청을 직접 조작하면 쉽게 우회된다. 서버만이 신뢰할 수 있는 검증 주체이다 (DR-TODO-006, NFR-SEC-003).

```javascript
// todo.service.js 예시
async function updateTodo(todoId, userId, updateData) {
  const todo = await todoRepository.findById(todoId);

  if (!todo) {
    throw new NotFoundError('할일을 찾을 수 없습니다.');
  }

  // 소유권 검증: JWT에서 추출한 userId와 리소스 소유자 비교
  if (todo.userId !== userId) {
    throw new ForbiddenError('해당 할일에 대한 권한이 없습니다.');
  }

  return todoRepository.update(todoId, updateData);
}
```

---

### ARCH-SEC-004: CORS 설정 — 허용 출처 명시 필수

**규칙:** CORS 허용 출처는 환경 변수에서 읽어 명시적으로 지정한다. 와일드카드(`*`) 사용을 금지한다.

**Why:** 와일드카드 CORS 설정은 모든 출처에서의 인증된 요청을 허용하여 CSRF 공격 표면을 넓힌다.

```javascript
// app.js
const cors = require('cors');

app.use(cors({
  origin: process.env.CORS_ORIGIN, // 예: 'http://localhost:5173'
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
```

**`.env.example`에 명시:**
```
CORS_ORIGIN=http://localhost:5173
```

---

### ARCH-SEC-005: SQL Injection 방지 — 파라미터화 쿼리 강제

**규칙:** `pg` 라이브러리를 사용하는 모든 DB 쿼리는 파라미터화된 쿼리(`$1, $2, ...`)를 사용한다. 문자열 템플릿 리터럴로 쿼리를 조합하는 것을 금지한다.

**Why:** 문자열 연결 방식의 쿼리는 SQL Injection 공격에 직접적으로 취약하다.

```javascript
// 위반: SQL Injection 취약
const query = `SELECT * FROM todos WHERE user_id = ${userId}`; // 금지

// 올바른 방법: 파라미터화 쿼리
const { rows } = await pool.query(
  'SELECT * FROM todos WHERE user_id = $1 AND id = $2',
  [userId, todoId]
);
```

---

### ARCH-SEC-006: 환경별 설정 분리

**규칙:** `development`와 `production` 환경은 별도의 설정 값을 사용한다.

**Why:** 개발 환경 설정(낮은 bcrypt 라운드, 상세 에러 노출 등)이 프로덕션에 그대로 사용되면 성능 저하 또는 보안 취약점이 발생한다.

**환경별 차이 기준:**

| 설정 항목 | Development | Production |
|----------|-------------|-----------|
| `NODE_ENV` | `development` | `production` |
| bcrypt 라운드 | 10 (빠른 개발용) | 12 이상 |
| 에러 응답 상세 | 스택 트레이스 포함 가능 | 메시지만 반환 |
| HTTPS | 불필요 | 필수 (NFR-SEC-004) |
| 로그 레벨 | `debug` | `warn` 이상 |

```javascript
// 에러 핸들러 미들웨어 환경별 처리
app.use((err, req, res, next) => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  res.status(err.status || 500).json({
    success: false,
    message: err.message || '서버 오류가 발생했습니다.',
    code: err.code || 'INTERNAL_ERROR',
    ...(isDevelopment && { stack: err.stack }), // 개발 환경에서만 스택 노출
  });
});
```

---

### ARCH-SEC-007: 로그에 민감 정보 출력 금지

**규칙:** 로그에 비밀번호, JWT 토큰, DB 연결 문자열 등 민감 정보를 출력하지 않는다.

**Why:** 로그는 다수의 인원이 접근 가능한 저장소에 수집되며, 민감 정보 유출의 주요 경로가 된다.

```javascript
// 위반: 민감 정보 로그 출력
console.log('로그인 요청:', { email, password }); // 금지
console.log('JWT 발급:', token); // 금지

// 올바른 예시: 민감 정보 제외
console.log('로그인 요청:', { email }); // 이메일만 (비밀번호 제외)
console.log('JWT 발급 완료. userId:', user.id); // 토큰 값 미출력
```

---

## 7. 프론트엔드 디렉토리 구조 (ARCH-FE-DIR)

```
frontend/
├── public/
├── src/
│   ├── assets/
│   ├── components/
│   │   └── ui/
│   ├── features/
│   │   ├── auth/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── store/
│   │   │   └── api/
│   │   ├── todo/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── store/
│   │   │   └── api/
│   │   └── category/
│   │       ├── components/
│   │       ├── hooks/
│   │       ├── store/
│   │       └── api/
│   ├── pages/
│   ├── lib/
│   ├── hooks/
│   └── constants/
├── .env
├── .env.example
└── package.json
```

---

### ARCH-FE-DIR-001: `public/`

**역할:** 빌드 도구가 처리하지 않고 그대로 서빙되는 정적 파일을 배치한다.

**배치 기준:** `favicon.ico`, `robots.txt`, `manifest.json` 등 HTML에서 직접 참조하거나 URL로 접근하는 파일.

**금지 사항:** JavaScript 모듈, 컴포넌트, 스타일 파일. (이미지/폰트는 `src/assets/`로 배치)

---

### ARCH-FE-DIR-002: `src/assets/`

**역할:** 빌드 파이프라인에 포함되는 정적 리소스를 관리한다.

**배치 기준:** 컴포넌트에서 `import`로 참조하는 이미지 파일, SVG 아이콘, 폰트 파일.

**금지 사항:** JavaScript 코드, 비즈니스 로직.

---

### ARCH-FE-DIR-003: `src/components/`

**역할:** 도메인에 종속되지 않는 공통 재사용 UI 컴포넌트를 관리한다.

**배치 기준:** 2개 이상의 도메인 또는 페이지에서 재사용되는 컴포넌트. `LoadingSpinner.jsx`, `Modal.jsx`, `ConfirmDialog.jsx` 등.

**금지 사항:**
- 특정 도메인의 비즈니스 데이터에 의존하는 컴포넌트 (예: `TodoItem.jsx`는 이곳에 배치 불가)
- 도메인별 상태(Zustand 스토어, TanStack Query 훅) 직접 참조

---

### ARCH-FE-DIR-004: `src/components/ui/`

**역할:** 디자인 시스템의 원자 단위 컴포넌트(Atomic Component)를 관리한다.

**배치 기준:** `Button.jsx`, `Input.jsx`, `Label.jsx`, `Badge.jsx`, `Spinner.jsx` 등 HTML 요소를 Tailwind CSS로 추상화한 기본 컴포넌트.

**금지 사항:**
- 비즈니스 로직 또는 상태 관리
- `features/` 내의 훅이나 스토어 참조
- 2개 이상의 원자 컴포넌트를 조합한 복합 컴포넌트 (복합 컴포넌트는 `components/`에 배치)

---

### ARCH-FE-DIR-005: `src/features/`

**역할:** 도메인별 기능 모듈을 관리한다. `auth`, `todo`, `category` 3개 도메인으로 구성된다.

**배치 기준:** 특정 도메인에만 속하는 모든 코드. 해당 도메인의 컴포넌트, 훅, 스토어, API 클라이언트를 포함한다.

**금지 사항:** 도메인 간 직접 import. (예: `features/todo/`가 `features/category/store/`를 직접 import하는 것은 허용하지 않는다. 공유 데이터는 `hooks/` 또는 `lib/`를 경유한다)

---

### ARCH-FE-DIR-006: `src/features/[domain]/components/`

**역할:** 해당 도메인에 특화된 UI 컴포넌트를 관리한다.

**배치 기준:**
- `todo/components/`: `TodoItem.jsx`, `TodoList.jsx`, `TodoForm.jsx`, `TodoStatusBadge.jsx`
- `auth/components/`: `LoginForm.jsx`, `SignupForm.jsx`
- `category/components/`: `CategoryList.jsx`, `CategoryForm.jsx`, `CategoryFilterBar.jsx`

**금지 사항:** fetch/axios 직접 호출, 다른 도메인의 API 클라이언트 직접 참조.

---

### ARCH-FE-DIR-007: `src/features/[domain]/hooks/`

**역할:** 해당 도메인의 서버 상태 관리(TanStack Query)와 클라이언트 상태 접근 로직을 담당하는 커스텀 훅을 관리한다.

**배치 기준:**
- `todo/hooks/use-todos.js`: 할일 목록 조회 (`useQuery`)
- `todo/hooks/use-create-todo.js`: 할일 생성 (`useMutation`)
- `todo/hooks/use-delete-todo.js`: 할일 삭제 (`useMutation`)
- `auth/hooks/use-auth.js`: 인증 상태 관리

**금지 사항:** JSX 반환, UI 렌더링 로직, fetch/axios 직접 호출 (반드시 `api/` 레이어를 통해 호출).

---

### ARCH-FE-DIR-008: `src/features/[domain]/store/`

**규칙:** 해당 도메인의 클라이언트 전역 상태(Zustand 스토어)를 관리한다.

**배치 기준:**
- `auth/store/auth-store.js`: 인증 토큰, 로그인 사용자 정보 등 클라이언트 인증 상태
- `todo/store/todo-store.js`: 필터 상태(선택된 카테고리, 상태 탭 등) 등 서버와 무관한 UI 상태

**금지 사항:**
- 서버에서 가져오는 데이터를 Zustand에 저장 (서버 데이터는 TanStack Query가 관리)
- 비즈니스 로직 또는 API 호출

---

### ARCH-FE-DIR-009: `src/features/[domain]/api/`

**역할:** 해당 도메인의 서버 API 호출 함수를 관리한다. axios 인스턴스를 사용하여 HTTP 요청을 수행한다.

**배치 기준:**
- `todo/api/todo-api.js`: `getTodos`, `createTodo`, `updateTodo`, `deleteTodo`, `toggleTodoStatus`
- `auth/api/auth-api.js`: `login`, `signup`
- `category/api/category-api.js`: `getCategories`, `createCategory`, `updateCategory`, `deleteCategory`

**파일 구조 예시:**
```javascript
// todo/api/todo-api.js
import { apiClient } from '../../../lib/api-client';

export async function getTodos(filters) {
  const { data } = await apiClient.get('/todos', { params: filters });
  return data.data;
}

export async function createTodo(todoData) {
  const { data } = await apiClient.post('/todos', todoData);
  return data.data;
}
```

**금지 사항:** 상태 관리(Zustand, useState), UI 로직, 직접 `axios` 인스턴스 생성 (반드시 `lib/api-client.js`의 공통 인스턴스 사용).

---

### ARCH-FE-DIR-010: `src/pages/`

**역할:** React Router의 라우트와 1:1로 매핑되는 페이지 컴포넌트를 관리한다.

**배치 기준:** `LoginPage.jsx`, `SignupPage.jsx`, `TodoListPage.jsx`, `UserProfilePage.jsx` 등 URL 경로에 대응하는 최상위 화면 컴포넌트.

**금지 사항:**
- 세부 비즈니스 로직 직접 구현 (훅으로 위임)
- fetch/axios 직접 호출
- 특정 도메인의 API 클라이언트 직접 참조

---

### ARCH-FE-DIR-011: `src/lib/`

**역할:** 공통으로 사용되는 유틸리티와 axios 인스턴스를 관리한다.

**배치 기준:**
- `api-client.js`: JWT 토큰 자동 첨부, 401 응답 처리, 기본 URL 설정이 구성된 axios 인스턴스
- `date-utils.js`: 날짜 포맷, 기한 초과 판단 등 날짜 관련 공통 함수

**`api-client.js` 핵심 설정:**
```javascript
// lib/api-client.js
import axios from 'axios';
import { getAuthToken, clearAuthToken } from '../features/auth/store/auth-store';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

// 요청 인터셉터: JWT 토큰 자동 첨부
apiClient.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 응답 인터셉터: 401 자동 처리
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearAuthToken();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export { apiClient };
```

**금지 사항:** 도메인 비즈니스 로직, JSX 컴포넌트.

---

### ARCH-FE-DIR-012: `src/hooks/`

**역할:** 특정 도메인에 속하지 않는 전역 공통 커스텀 훅을 관리한다.

**배치 기준:** `use-window-size.js` (반응형 감지), `use-debounce.js`, `use-local-storage.js` 등 도메인 무관 범용 훅.

**금지 사항:** 특정 도메인의 비즈니스 데이터를 처리하는 훅 (도메인 훅은 `features/[domain]/hooks/`에 배치).

---

### ARCH-FE-DIR-013: `src/constants/`

**역할:** 전역 상수를 관리한다.

**배치 기준:**
```javascript
// constants/todo.js
export const TODO_STATUS = {
  IN_PROGRESS: 'in_progress',
  DONE: 'done',
};

// constants/validation.js
export const MAX_TODO_TITLE_LENGTH = 100;
export const MAX_CATEGORY_NAME_LENGTH = 20;
export const MAX_CATEGORY_COUNT = 20;

// constants/routes.js
export const ROUTES = {
  LOGIN: '/login',
  SIGNUP: '/signup',
  TODO_LIST: '/',
};
```

**금지 사항:** 함수 로직, 컴포넌트, 상태.

---

## 8. 백엔드 디렉토리 구조 (ARCH-BE-DIR)

```
backend/
├── src/
│   ├── routes/
│   ├── controllers/
│   ├── services/
│   ├── repositories/
│   ├── middlewares/
│   ├── db/
│   ├── utils/
│   └── constants/
├── app.js
├── server.js
├── .env
├── .env.example
└── package.json
```

---

### ARCH-BE-DIR-001: `src/routes/`

**역할:** Express 라우터를 정의하고, URL 경로와 HTTP 메서드를 Controller 함수에 매핑한다. 미들웨어 적용 지점이다.

**배치 기준:**
- `auth.router.js`: `POST /api/auth/signup`, `POST /api/auth/login`
- `todo.router.js`: `GET /api/todos`, `POST /api/todos`, `PATCH /api/todos/:id`, `DELETE /api/todos/:id`
- `category.router.js`: `GET /api/categories`, `POST /api/categories`, 등

**배치 규칙:**
```javascript
// routes/todo.router.js
const express = require('express');
const router = express.Router();
const todoController = require('../controllers/todo.controller');
const { authenticate } = require('../middlewares/auth.middleware');

router.use(authenticate); // 모든 할일 라우트에 인증 미들웨어 적용

router.get('/', todoController.getTodos);
router.post('/', todoController.createTodo);
router.patch('/:id', todoController.updateTodo);
router.delete('/:id', todoController.deleteTodo);

module.exports = router;
```

**금지 사항:** 비즈니스 로직, DB 쿼리, 응답 데이터 가공.

**호출 방향:** `app.js` → Router → Controller (단방향)

---

### ARCH-BE-DIR-002: `src/controllers/`

**역할:** HTTP 요청을 처리하고 응답을 반환한다. 요청 파라미터 추출, 입력 유효성 검증, Service 호출, 표준 형식으로 응답 구성을 담당한다.

**배치 기준:**
- `auth.controller.js`: `signup`, `login` 핸들러
- `todo.controller.js`: `getTodos`, `createTodo`, `updateTodo`, `deleteTodo`, `toggleStatus` 핸들러
- `category.controller.js`: `getCategories`, `createCategory`, `updateCategory`, `deleteCategory` 핸들러

**배치 규칙:**
```javascript
// controllers/todo.controller.js
const todoService = require('../services/todo.service');

async function createTodo(req, res, next) {
  try {
    const { title, description, dueDate, categoryId } = req.body;
    const userId = req.user.id; // auth 미들웨어에서 설정된 인증 정보

    // 입력 유효성 검증 (Controller 책임)
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: '제목은 필수입니다.',
        code: 'VALIDATION_ERROR',
      });
    }

    const todo = await todoService.createTodo({ title: title.trim(), description, dueDate, categoryId, userId });

    res.status(201).json({ success: true, data: todo });
  } catch (error) {
    next(error); // 에러 핸들링 미들웨어로 전달
  }
}

module.exports = { createTodo };
```

**금지 사항:** DB 쿼리 직접 작성, 비즈니스 규칙 판단 로직 (소유권 검증, 기한 초과 판단 등).

**호출 방향:** Router → Controller → Service (단방향)

---

### ARCH-BE-DIR-003: `src/services/`

**역할:** 애플리케이션의 핵심 비즈니스 로직을 구현한다. 도메인 규칙 적용, 소유권 검증, 상태 전환 로직 등을 처리한다.

**배치 기준:**
- `auth.service.js`: 이메일 중복 검증, bcrypt 해시 생성/비교, JWT 발급
- `todo.service.js`: 소유권 검증, 기한 초과 판단, 상태 전환 시 완료일시 처리 (DR-TODO-004, DR-TODO-005, DR-TODO-006)
- `category.service.js`: 사용자별 중복 이름 검증, 20개 한도 검증, 삭제 시 소속 할일 미지정 처리 (DR-CAT-001, DR-CAT-003)

**배치 규칙:**
```javascript
// services/todo.service.js
const todoRepository = require('../repositories/todo.repository');
const { ForbiddenError, NotFoundError } = require('../utils/errors');

async function toggleTodoStatus(todoId, userId) {
  const todo = await todoRepository.findById(todoId);

  if (!todo) {
    throw new NotFoundError('할일을 찾을 수 없습니다.');
  }

  // DR-TODO-006: 소유권 검증
  if (todo.userId !== userId) {
    throw new ForbiddenError('해당 할일에 대한 권한이 없습니다.');
  }

  // DR-TODO-005: 상태 전환 및 완료일시 처리
  const newStatus = todo.status === 'in_progress' ? 'done' : 'in_progress';
  const completedAt = newStatus === 'done' ? new Date() : null;

  return todoRepository.updateStatus(todoId, newStatus, completedAt);
}

module.exports = { toggleTodoStatus };
```

**금지 사항:** `req`, `res` 객체 직접 접근, HTTP 상태 코드 설정, DB 쿼리 직접 작성.

**호출 방향:** Controller → Service → Repository (단방향)

---

### ARCH-BE-DIR-004: `src/repositories/`

**역할:** PostgreSQL 데이터베이스와의 모든 상호작용을 담당한다. `pg` 라이브러리를 사용하여 SQL 쿼리를 실행하고 결과를 반환한다.

**배치 기준:**
- `todo.repository.js`: 할일 CRUD 쿼리
- `user.repository.js`: 사용자 조회/생성 쿼리
- `category.repository.js`: 카테고리 CRUD 쿼리

**배치 규칙:**
```javascript
// repositories/todo.repository.js
const { pool } = require('../db/pool');

async function findByUserId(userId, filters = {}) {
  let query = 'SELECT * FROM todos WHERE user_id = $1';
  const params = [userId];
  let paramIndex = 2;

  if (filters.categoryId) {
    query += ` AND category_id = $${paramIndex++}`;
    params.push(filters.categoryId);
  }

  if (filters.status) {
    query += ` AND status = $${paramIndex++}`;
    params.push(filters.status);
  }

  query += ' ORDER BY created_at DESC';

  const { rows } = await pool.query(query, params);
  return rows;
}

module.exports = { findByUserId };
```

**금지 사항:** 비즈니스 로직, HTTP 객체 접근, 문자열 연결 방식의 쿼리 작성.

**호출 방향:** Service → Repository → DB (단방향)

---

### ARCH-BE-DIR-005: `src/middlewares/`

**역할:** Express 미들웨어를 관리한다. 요청 전처리, 인증, 전역 에러 처리 등을 담당한다.

**배치 기준:**
- `auth.middleware.js`: JWT 토큰 검증, `req.user` 설정
- `error.middleware.js`: 전역 에러 핸들러 (표준 오류 응답 형식 구성)

**`auth.middleware.js` 핵심 구현:**
```javascript
// middlewares/auth.middleware.js
const jwt = require('jsonwebtoken');

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: '인증 토큰이 필요합니다.',
      code: 'UNAUTHORIZED',
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS512'] });
    req.user = decoded; // Controller와 Service에서 req.user.id로 접근
    next();
  } catch {
    return res.status(401).json({
      success: false,
      message: '유효하지 않은 토큰입니다.',
      code: 'UNAUTHORIZED',
    });
  }
}

module.exports = { authenticate };
```

**금지 사항:** 비즈니스 로직, DB 쿼리 직접 작성.

---

### ARCH-BE-DIR-006: `src/db/`

**역할:** 데이터베이스 연결 풀 설정, 스키마 정의, 마이그레이션 스크립트를 관리한다.

**배치 기준:**
- `pool.js`: `pg.Pool` 인스턴스 생성 및 내보내기
- `schema.sql`: 테이블 생성 DDL
- `migrations/`: 스키마 변경 마이그레이션 스크립트 (순번 접두어 사용: `001-create-users.sql`)

**`pool.js` 구조:**
```javascript
// db/pool.js
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,             // 최대 연결 수
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  console.error('DB 연결 오류:', err.message);
});

module.exports = { pool };
```

**금지 사항:** 비즈니스 로직, 응용 코드.

---

### ARCH-BE-DIR-007: `src/utils/`

**역할:** 특정 레이어에 속하지 않는 공통 유틸리티를 관리한다.

**배치 기준:**
- `errors.js`: 커스텀 에러 클래스 정의 (`NotFoundError`, `ForbiddenError`, `ValidationError` 등)
- `date-utils.js`: 날짜 관련 공통 함수

**커스텀 에러 클래스 예시:**
```javascript
// utils/errors.js
class AppError extends Error {
  constructor(message, status, code) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

class NotFoundError extends AppError {
  constructor(message = '리소스를 찾을 수 없습니다.') {
    super(message, 404, 'NOT_FOUND');
  }
}

class ForbiddenError extends AppError {
  constructor(message = '권한이 없습니다.') {
    super(message, 403, 'FORBIDDEN');
  }
}

class ValidationError extends AppError {
  constructor(message) {
    super(message, 400, 'VALIDATION_ERROR');
  }
}

module.exports = { AppError, NotFoundError, ForbiddenError, ValidationError };
```

**금지 사항:** 도메인 비즈니스 로직, DB 쿼리.

---

### ARCH-BE-DIR-008: `src/constants/`

**역할:** 백엔드 전역 상수를 관리한다.

**배치 기준:**
```javascript
// constants/todo.js
const TODO_STATUS = {
  IN_PROGRESS: 'in_progress',
  DONE: 'done',
};

// constants/validation.js
const MAX_TODO_TITLE_LENGTH = 100;
const MAX_CATEGORY_NAME_LENGTH = 20;
const MAX_CATEGORY_COUNT = 20; // DR-CAT-001

const JWT_ALGORITHM = 'HS512'; // NFR-SEC-001
```

**금지 사항:** 환경 변수를 상수로 재할당하는 것. (환경 변수는 `process.env`로 직접 참조)

---

### ARCH-BE-DIR-009: `app.js`

**역할:** Express 애플리케이션 인스턴스를 생성하고 전역 미들웨어와 라우터를 등록한다.

**배치 기준:** CORS 설정, JSON 파서 등록, 라우터 마운트, 전역 에러 핸들러 등록.

**금지 사항:** 서버 시작(`listen`) 로직. (서버 시작은 `server.js` 전담)

---

### ARCH-BE-DIR-010: `server.js`

**역할:** 서버 진입점. `app.js`를 가져와 지정 포트에서 HTTP 서버를 시작한다.

**배치 기준:** 환경 변수 유효성 검증, `app.listen()` 호출, 시작 로그 출력.

**금지 사항:** Express 앱 설정, 미들웨어 등록 (이는 `app.js` 담당).

---

## 9. 금지 패턴 목록 (Anti-patterns)

다음은 각 레이어에서 절대 하지 말아야 할 패턴이다. 코드 리뷰 시 이 패턴이 발견되면 즉시 수정해야 한다.

---

### AP-001: Controller에서 DB 쿼리 직접 작성

**위반:**
```javascript
// controllers/todo.controller.js — 위반
async function getTodos(req, res) {
  const { rows } = await pool.query( // DB 쿼리가 Controller에 있음
    'SELECT * FROM todos WHERE user_id = $1',
    [req.user.id]
  );
  res.json({ success: true, data: rows });
}
```

**올바른 패턴:**
```javascript
// controllers/todo.controller.js
async function getTodos(req, res, next) {
  try {
    const todos = await todoService.getTodosByUser(req.user.id, req.query);
    res.json({ success: true, data: todos });
  } catch (error) {
    next(error);
  }
}
```

---

### AP-002: React 컴포넌트에서 fetch/axios 직접 호출

**위반:**
```javascript
// features/todo/components/TodoList.jsx — 위반
function TodoList() {
  const [todos, setTodos] = useState([]);

  useEffect(() => {
    axios.get('/api/todos').then(res => setTodos(res.data.data)); // 직접 호출 금지
  }, []);
}
```

**올바른 패턴:**
```javascript
// features/todo/components/TodoList.jsx
function TodoList() {
  const { data: todos, isLoading } = useTodos(); // Hook을 통해 접근
  if (isLoading) return <Spinner />;
  return todos.map(todo => <TodoItem key={todo.id} todo={todo} />);
}
```

---

### AP-003: 비밀값 하드코딩

**위반:**
```javascript
// 어떤 파일이든 — 위반
const pool = new Pool({ password: 'postgres1234' }); // 하드코딩 금지
const token = jwt.sign(payload, 'hardcoded-secret'); // 하드코딩 금지
```

**올바른 패턴:**
```javascript
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const token = jwt.sign(payload, process.env.JWT_SECRET, { algorithm: 'HS512' });
```

---

### AP-004: 클라이언트 측 소유권 검증만 신뢰

**위반:**
```javascript
// features/todo/hooks/use-delete-todo.js — 위반
function useDeleteTodo() {
  return useMutation(async (todoId) => {
    const currentUserId = authStore.getState().userId;
    const todo = queryClient.getQueryData(['todos']).find(t => t.id === todoId);

    if (todo.userId !== currentUserId) { // 클라이언트 검증만으로 소유권 판단 — 위반
      throw new Error('권한 없음');
    }
    await todoApi.deleteTodo(todoId);
  });
}
```

**올바른 패턴:** 클라이언트 검증은 UX 목적으로만 사용하고, 실제 소유권 검증은 서버(Service 레이어)에서 수행한다. 서버는 항상 JWT에서 추출한 `userId`와 리소스 소유자를 비교한다.

---

### AP-005: Service 레이어에서 HTTP 객체 직접 접근

**위반:**
```javascript
// services/todo.service.js — 위반
async function createTodo(req) { // req 객체를 Service로 전달 — 위반
  const { title } = req.body;
  const userId = req.user.id;
  // ...
}
```

**올바른 패턴:**
```javascript
// Controller가 필요한 값만 추출하여 Service에 전달
// controllers/todo.controller.js
async function createTodo(req, res, next) {
  const { title, description, dueDate, categoryId } = req.body;
  const userId = req.user.id;
  const todo = await todoService.createTodo({ title, description, dueDate, categoryId, userId });
  res.status(201).json({ success: true, data: todo });
}

// services/todo.service.js
async function createTodo({ title, description, dueDate, categoryId, userId }) {
  // req, res 없음. 순수한 비즈니스 로직만
}
```

---

### AP-006: 환경 변수 없이 환경별 분기 처리

**위반:**
```javascript
// 위반: 코드에 환경별 설정 직접 작성
const DB_HOST = process.env.NODE_ENV === 'production'
  ? 'prod-db.internal'   // 프로덕션 DB 주소 하드코딩 — 위반
  : 'localhost';
```

**올바른 패턴:**
```javascript
// .env.production, .env.development 파일에서 관리
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
// DATABASE_URL은 환경마다 다른 값으로 주입
```

---

### AP-007: Zustand 스토어에 서버 데이터 저장

**위반:**
```javascript
// features/todo/store/todo-store.js — 위반
const useTodoStore = create((set) => ({
  todos: [], // 서버 데이터를 Zustand에 저장 — 위반
  setTodos: (todos) => set({ todos }),
}));
```

**올바른 패턴:** 서버에서 가져오는 데이터(할일 목록, 카테고리 목록 등)는 TanStack Query가 캐시로 관리한다. Zustand는 서버와 무관한 클라이언트 전용 UI 상태(필터 선택값, 모달 열림 여부 등)만 담당한다.

```javascript
// features/todo/store/todo-store.js — 올바른 사용
const useTodoStore = create((set) => ({
  selectedCategoryId: null,      // UI 필터 상태
  selectedStatusTab: 'all',      // UI 탭 상태
  isCreateModalOpen: false,      // 모달 상태
  setSelectedCategoryId: (id) => set({ selectedCategoryId: id }),
}));
```

---

### AP-008: SQL 쿼리 문자열 연결

**위반:**
```javascript
// repositories/todo.repository.js — 위반
const query = `SELECT * FROM todos WHERE user_id = ${userId}`; // SQL Injection 위험
const { rows } = await pool.query(query);
```

**올바른 패턴:**
```javascript
const { rows } = await pool.query(
  'SELECT * FROM todos WHERE user_id = $1',
  [userId] // 파라미터화 쿼리 강제 (ARCH-SEC-005)
);
```

---

*본 문서는 PRD v1.1.0, 도메인 정의서 v1.1.0, 사용자 시나리오 v1.0.0을 기반으로 작성되었다. 기술 스택 변경 또는 아키텍처 결정 변경 시 본 문서를 최우선으로 갱신해야 한다.*
