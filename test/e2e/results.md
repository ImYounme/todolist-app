# E2E Integration Test Results

**Date:** 2026-04-29
**Environment:** 
- Frontend: http://localhost:5173
- Backend: http://localhost:3000

## 1. Scenario Results

| ID | Scenario Name | Status | Notes |
|:---|:---|:---:|:---|
| **SC-01** | 신규 사용자 회원가입 | **PASS** | `cheolsu.1777451278193@example.com` 계정 생성 확인 |
| **SC-02** | 로그인 및 로그아웃 | **PASS** | JWT 토큰 발급 및 세션 종료 확인 |
| **SC-03** | 카테고리 생성 및 할일 등록 | **PASS** | '업무', '개인' 카테고리 및 할일 등록 확인 |
| **SC-04** | 할일 완료 처리 | **PASS** | 진행 중 ↔ 완료 상태 전환 및 완료일시 기록 확인 |
| **SC-05** | 카테고리 필터링으로 할일 조회 | **PASS** | 카테고리 및 상태 필터 연동 확인 |
| **SC-06** | 기한 초과 할일 확인 및 수정 | **PASS** | 기한 초과 자동 감지 및 수정 후 해소 확인 |
| **SC-07** | 카테고리 삭제 및 미지정 전환 | **PASS** | 카테고리 삭제 시 소속 할일이 '미분류'로 전환됨 확인 |
| **SC-08** | 중복 이메일 회원가입 시도 | **PASS** | 동일 이메일 가입 시 오류 메시지 출력 확인 |
| **SC-09** | 미인증 상태 접근 차단 | **PASS** | 토큰 없이 접근 시 로그인 페이지로 리다이렉트 확인 |
| **SC-10** | 할일 제목 100자 초과 입력 | **PASS** | 클라이언트 측 유효성 검증 메시지 확인 |
| **SC-11** | 카테고리 20개 한도 초과 시도 | **PASS** | 20개 도달 시 추가 버튼 비활성화 확인 |

## 2. Findings & Recommendations

- **SC-11 가이드 문구 누락:** `ko.json`에는 `limitReached` 문구가 정의되어 있으나, `CategoryManageModal.jsx` UI에서 해당 문구가 노출되지 않고 버튼만 비활성화됨. 사용자 경험 향상을 위해 안내 문구 노출 권장.
- **실시간 검증:** `NFR-UX-002`는 실시간 피드백을 요구하나, 현재 할일 등록 폼(`TodoForm.jsx`)은 제출(`handleSubmit`) 시점에 검증을 수행함. 입력 시 즉시 피드백을 주도록 개선 필요.
- **다크 모드 지원:** 스타일 가이드에 다크 모드 색상이 정의되어 있으며, 실제 앱에서도 정상적으로 토글되는 것을 확인(테스트 과정 중 시각적 확인).

## 3. Test Evidence
Test evidence is stored in the local Playwright MCP environment and session snapshots.
