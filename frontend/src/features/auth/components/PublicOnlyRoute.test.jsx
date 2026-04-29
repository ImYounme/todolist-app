import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { beforeEach, describe, expect, test } from 'vitest';
import { PublicOnlyRoute } from './PublicOnlyRoute';
import { useAuthStore } from '../store/auth-store';

beforeEach(() => {
  localStorage.clear();
  useAuthStore.setState({ token: null });
});

function renderWithRouter(token, initialPath = '/login') {
  if (token) useAuthStore.setState({ token });

  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/todos" element={<div>Todo 목록 페이지</div>} />
        <Route
          path="/login"
          element={
            <PublicOnlyRoute>
              <div>공개 콘텐츠</div>
            </PublicOnlyRoute>
          }
        />
      </Routes>
    </MemoryRouter>
  );
}

describe('PublicOnlyRoute', () => {
  test('토큰이 없으면 자녀 컴포넌트를 렌더링한다', () => {
    renderWithRouter(null);
    expect(screen.getByText('공개 콘텐츠')).toBeInTheDocument();
    expect(screen.queryByText('Todo 목록 페이지')).not.toBeInTheDocument();
  });

  test('토큰이 있으면 /todos로 리다이렉트한다', () => {
    renderWithRouter('valid-token');
    expect(screen.getByText('Todo 목록 페이지')).toBeInTheDocument();
    expect(screen.queryByText('공개 콘텐츠')).not.toBeInTheDocument();
  });
});
