# TodoList 기술 아키텍처 다이어그램

**버전:** 1.0.0  
**작성일:** 2026-04-28  
**참조 문서:** PRD v1.0.0, 프로젝트 구조 설계 원칙 v1.1.0

---

## 변경 이력
| 버전 | 날짜 | 변경 유형 | 변경 내용 | 작성자 |
|------|------|-----------|-----------|--------|
| 1.0.0 | 2026-04-28 | 최초 작성 | 아키텍처 다이어그램 초안 작성 | Software Architect |

---

## 1. 시스템 전체 구조

```mermaid
flowchart LR
    A["Browser"] -->|HTTP/HTTPS| B["Frontend<br/>React 19<br/>Zustand<br/>TanStack Query"]
    B -->|REST API| C["Backend API<br/>Express 5<br/>pg"]
    C -->|Query/Command| D["PostgreSQL<br/>Database"]
    
    style A fill:#e1f5ff
    style B fill:#c8e6c9
    style C fill:#ffe0b2
    style D fill:#f0f4c3
```

---

## 2. 백엔드 레이어 구조

```mermaid
flowchart TD
    subgraph auth["Auth Domain"]
        R1["Router<br/>POST /auth/login<br/>POST /auth/register"]
        C1["Controller<br/>회원가입/로그인<br/>요청 처리"]
        S1["Service<br/>JWT 생성<br/>비즈니스 로직"]
        P1["Repository<br/>사용자 조회/저장<br/>DB 상호작용"]
    end
    
    subgraph todo["Todo Domain"]
        R2["Router<br/>GET/POST/PUT/DELETE<br>/todos"]
        C2["Controller<br/>CRUD 요청<br/>응답 처리"]
        S2["Service<br/>필터링<br/>상태 관리"]
        P2["Repository<br/>쿼리 실행<br/>DB 상호작용"]
    end
    
    subgraph category["Category Domain"]
        R3["Router<br/>GET/POST/PUT/DELETE<br/>/categories"]
        C3["Controller<br/>CRUD 요청<br/>응답 처리"]
        S3["Service<br/>권한 검증<br/>비즈니스 로직"]
        P3["Repository<br/>쿼리 실행<br/>DB 상호작용"]
    end
    
    DB[("PostgreSQL<br/>Database")]
    
    R1 --> C1 --> S1 --> P1 --> DB
    R2 --> C2 --> S2 --> P2 --> DB
    R3 --> C3 --> S3 --> P3 --> DB
    
    style R1 fill:#ffccbc
    style C1 fill:#ffccbc
    style S1 fill:#ffccbc
    style P1 fill:#ffccbc
    
    style R2 fill:#c8e6c9
    style C2 fill:#c8e6c9
    style S2 fill:#c8e6c9
    style P2 fill:#c8e6c9
    
    style R3 fill:#bbdefb
    style C3 fill:#bbdefb
    style S3 fill:#bbdefb
    style P3 fill:#bbdefb
    
    style DB fill:#f0f4c3
```

---

## 3. 프론트엔드 레이어 구조

```mermaid
flowchart TD
    P["Pages<br/>로그인, 할일 목록,<br/>카테고리"]
    
    Comp["Components<br/>TodoCard, CategorySelect,<br/>AuthForm"]
    
    Hook["Hooks<br/>useTodos, useAuth,<br/>useCategory"]
    
    subgraph state["상태 관리"]
        Zustand["Zustand Store<br/>전역 UI 상태"]
        TQ["TanStack Query<br/>서버 상태<br/>캐싱"]
    end
    
    API["API Client<br/>axios/fetch<br/>요청 생성"]
    
    Backend["Backend API<br/>Node.js + Express"]
    
    P --> Comp --> Hook
    Hook --> state
    Zustand -.->|상태 읽기| Comp
    TQ -.->|데이터 구독| Hook
    Hook --> API
    API -->|HTTP REST| Backend
    
    style P fill:#c8e6c9
    style Comp fill:#c8e6c9
    style Hook fill:#c8e6c9
    style Zustand fill:#fff9c4
    style TQ fill:#fff9c4
    style API fill:#ffe0b2
    style Backend fill:#ffccbc
```

---

## 4. 인증 흐름

```mermaid
sequenceDiagram
    participant Client as Client
    participant API as Backend API
    participant Auth as Auth Middleware
    participant DB as Database
    
    rect rgb(200, 230, 201)
    Note over Client,DB: 로그인 흐름
    Client->>API: POST /auth/login<br/>{email, password}
    API->>DB: 사용자 조회
    DB-->>API: 사용자 데이터
    API->>API: 비밀번호 검증
    alt 검증 성공
        API->>API: JWT 생성 (HS-512)
        API-->>Client: {token, user}
        Client->>Client: localStorage 저장
    else 검증 실패
        API-->>Client: 401 Unauthorized
    end
    end
    
    rect rgb(187, 222, 251)
    Note over Client,Auth: 인증 요청 흐름
    Client->>API: GET /todos<br/>Authorization: Bearer {JWT}
    API->>Auth: JWT 검증
    alt 토큰 유효
        Auth->>Auth: 페이로드 파싱
        Auth->>API: userId 추출
        API->>DB: 사용자의 할일 조회
        DB-->>API: 데이터
        API-->>Client: 200 OK {todos}
    else 토큰 무효/만료
        Auth-->>Client: 401 Unauthorized
    end
    end
```

---

## 기술 스택 요약

| 계층 | 기술 | 버전 | 역할 |
|------|------|------|------|
| **Frontend** | React | 19 | UI 렌더링 |
| | Zustand | - | 전역 UI 상태 관리 |
| | TanStack Query | - | 서버 상태 캐싱 |
| | Tailwind CSS | - | 반응형 스타일링 |
| **Backend** | Node.js | 24 | 런타임 |
| | Express | 5 | HTTP 서버 |
| | pg | - | PostgreSQL 드라이버 |
| **Database** | PostgreSQL | - | 데이터 저장소 |
| **보안** | JWT | HS-512 | 인증 토큰 |

---

## 주요 설계 원칙

1. **3-Tier 아키텍처**: Frontend / Backend / Database 명확한 분리
2. **단방향 의존성**: 각 레이어 간 단방향 흐름으로 복잡도 최소화
3. **도메인 분리**: Auth / Todo / Category 독립적 관리
4. **상태 분리**:
   - **Zustand**: UI 상태 (팝업, 로딩 중 표시 등)
   - **TanStack Query**: 서버 상태 (API 데이터)
5. **JWT 기반 인증**: Stateless 인증으로 확장성 확보
