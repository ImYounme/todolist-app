import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { beforeEach, describe, expect, test } from 'vitest';
import { ProtectedRoute } from './ProtectedRoute';
import { useAuthStore } from '../store/auth-store';

beforeEach(() => {
  localStorage.clear();
  useAuthStore.setState({ token: null });
});

function renderWithRouter(token, initialPath = '/todos') {
  if (token) useAuthStore.setState({ token });

  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/login" element={<div>로그인 페이지</div>} />
        <Route
          path="/todos"
          element={
            <ProtectedRoute>
              <div>보호된 콘텐츠</div>
            </ProtectedRoute>
          }
        />
      </Routes>
    </MemoryRouter>
  );
}

describe('ProtectedRoute', () => {
  test('토큰이 없으면 /login으로 리다이렉트한다', () => {
    renderWithRouter(null);
    expect(screen.getByText('로그인 페이지')).toBeInTheDocument();
    expect(screen.queryByText('보호된 콘텐츠')).not.toBeInTheDocument();
  });

  test('유효한 토큰이 있으면 자녀 컴포넌트를 렌더링한다', () => {
    renderWithRouter('valid-token');
    expect(screen.getByText('보호된 콘텐츠')).toBeInTheDocument();
    expect(screen.queryByText('로그인 페이지')).not.toBeInTheDocument();
  });

  test('빈 문자열 토큰은 비인증으로 처리한다', () => {
    useAuthStore.setState({ token: '' });
    renderWithRouter(null);
    expect(screen.getByText('로그인 페이지')).toBeInTheDocument();
  });
});
