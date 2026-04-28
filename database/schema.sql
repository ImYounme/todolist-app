-- =============================================================
-- TodoList Database Schema
-- Version  : 1.0.0
-- Date     : 2026-04-28
-- Database : PostgreSQL
-- Ref      : docs/6-erd.md v1.0.0
-- =============================================================


-- =============================================================
-- 0. 초기화 (재실행 안전)
-- =============================================================

DROP TABLE IF EXISTS todo CASCADE;
DROP TABLE IF EXISTS category CASCADE;
DROP TABLE IF EXISTS "user" CASCADE;
DROP TYPE IF EXISTS todo_status;


-- =============================================================
-- 1. ENUM 타입
-- =============================================================

CREATE TYPE todo_status AS ENUM ('in_progress', 'done');


-- =============================================================
-- 2. USER 테이블
-- =============================================================

CREATE TABLE "user" (
    id           SERIAL        PRIMARY KEY,
    email        VARCHAR(255)  NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_user_email UNIQUE (email)
);

COMMENT ON TABLE  "user"              IS '애플리케이션 사용자';
COMMENT ON COLUMN "user".id           IS '사용자 고유 식별자';
COMMENT ON COLUMN "user".email        IS '로그인 이메일 (시스템 전체 고유)';
COMMENT ON COLUMN "user".password_hash IS 'bcrypt 암호화 비밀번호';
COMMENT ON COLUMN "user".created_at   IS '계정 생성 일시';


-- =============================================================
-- 3. CATEGORY 테이블
-- =============================================================

CREATE TABLE category (
    id         SERIAL       PRIMARY KEY,
    user_id    INT          NOT NULL,
    name       VARCHAR(20)  NOT NULL,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_category_user
        FOREIGN KEY (user_id) REFERENCES "user" (id)
        ON DELETE CASCADE ON UPDATE CASCADE,

    -- DR-CAT-001: 카테고리 이름은 동일 사용자 내에서 고유
    CONSTRAINT uq_category_user_name UNIQUE (user_id, name),

    CONSTRAINT chk_category_name_length
        CHECK (char_length(name) >= 1 AND char_length(name) <= 20)
);

COMMENT ON TABLE  category            IS '사용자 정의 할일 분류';
COMMENT ON COLUMN category.id         IS '카테고리 고유 식별자';
COMMENT ON COLUMN category.user_id    IS '소유 사용자 (user.id 참조)';
COMMENT ON COLUMN category.name       IS '카테고리 이름 (사용자 내 고유, 최대 20자)';
COMMENT ON COLUMN category.created_at IS '카테고리 생성 일시';


-- =============================================================
-- 4. TODO 테이블
-- =============================================================

CREATE TABLE todo (
    id           SERIAL       PRIMARY KEY,
    user_id      INT          NOT NULL,
    category_id  INT          NULL,
    title        VARCHAR(100) NOT NULL,
    description  TEXT         NULL,
    status       todo_status  NOT NULL DEFAULT 'in_progress',
    due_date     DATE         NULL,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ  NULL,

    CONSTRAINT fk_todo_user
        FOREIGN KEY (user_id) REFERENCES "user" (id)
        ON DELETE CASCADE ON UPDATE CASCADE,

    -- DR-CAT-003: 카테고리 삭제 시 할일은 보존, category_id = NULL 로 전환
    CONSTRAINT fk_todo_category
        FOREIGN KEY (category_id) REFERENCES category (id)
        ON DELETE SET NULL ON UPDATE CASCADE,

    CONSTRAINT chk_todo_title_length
        CHECK (char_length(title) >= 1 AND char_length(title) <= 100),

    -- DR-TODO-005: completed_at 은 status = 'done' 일 때만 값을 가진다
    CONSTRAINT chk_todo_completed_at
        CHECK (
            (status = 'done' AND completed_at IS NOT NULL) OR
            (status = 'in_progress' AND completed_at IS NULL)
        )
);

COMMENT ON TABLE  todo              IS '사용자 할일';
COMMENT ON COLUMN todo.id           IS '할일 고유 식별자';
COMMENT ON COLUMN todo.user_id      IS '소유 사용자 (user.id 참조)';
COMMENT ON COLUMN todo.category_id  IS '소속 카테고리 (category.id 참조, nullable — 카테고리 미지정 또는 카테고리 삭제 시 NULL)';
COMMENT ON COLUMN todo.title        IS '할일 제목 (필수, 최대 100자)';
COMMENT ON COLUMN todo.description  IS '할일 상세 내용 (선택)';
COMMENT ON COLUMN todo.status       IS '진행 상태: in_progress(진행 중) | done(완료)';
COMMENT ON COLUMN todo.due_date     IS '할일 종료 목표일 (선택)';
COMMENT ON COLUMN todo.created_at   IS '할일 생성 일시';
COMMENT ON COLUMN todo.completed_at IS '완료 처리 일시 (완료 시 기록, 진행 중 전환 시 NULL 초기화)';


-- =============================================================
-- 5. 인덱스
-- =============================================================

-- 사용자별 할일 조회 (가장 빈번한 쿼리)
CREATE INDEX idx_todo_user_id ON todo (user_id);

-- 카테고리 기준 필터링 (FR-FILTER-001)
CREATE INDEX idx_todo_category_id ON todo (category_id);

-- 상태 기준 필터링 (FR-FILTER-002)
CREATE INDEX idx_todo_user_status ON todo (user_id, status);

-- 기한 초과 조회: user_id + status + due_date 복합 (FR-FILTER-003)
CREATE INDEX idx_todo_due_date ON todo (user_id, due_date) WHERE status = 'in_progress';

-- 사용자별 카테고리 조회
CREATE INDEX idx_category_user_id ON category (user_id);
