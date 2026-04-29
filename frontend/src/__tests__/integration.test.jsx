/**
 * FE-15 프론트엔드 통합 검증
 * 회원가입→로그인→Category생성→Todo생성 흐름, 필터링/상태변경/수정/삭제 흐름,
 * 미인증 접근 차단, 유효성 검증, Category 삭제 후 미분류 처리를 검증한다.
 */
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { useAuthStore } from '../features/auth/store/auth-store';
import { useTodoStore } from '../features/todo/store/todo-store';
import { useCategoryStore } from '../features/category/store/category-store';

import { ProtectedRoute } from '../features/auth/components/ProtectedRoute';
import { PublicOnlyRoute } from '../features/auth/components/PublicOnlyRoute';
import LoginPage from '../pages/LoginPage';
import SignupPage from '../pages/SignupPage';
import TodoListPage from '../pages/TodoListPage';
import { TodoForm } from '../features/todo/components/TodoForm';
import { CategoryManageModal } from '../features/category/components/CategoryManageModal';
import { TodoItem } from '../features/todo/components/TodoItem';

// ─── API 모킹 ────────────────────────────────────────────────────────────────
vi.mock('../features/auth/api/auth-api', () => ({
  login: vi.fn(),
  signup: vi.fn(),
  getProfile: vi.fn(),
}));

vi.mock('../features/todo/api/todo-api', () => ({
  getTodos: vi.fn(),
  getTodo: vi.fn(),
  createTodo: vi.fn(),
  updateTodo: vi.fn(),
  deleteTodo: vi.fn(),
  updateTodoStatus: vi.fn(),
}));

vi.mock('../features/category/api/category-api', () => ({
  getCategories: vi.fn(),
  createCategory: vi.fn(),
  updateCategory: vi.fn(),
  deleteCategory: vi.fn(),
}));

import { login, signup } from '../features/auth/api/auth-api';
import { getTodos, getTodo, createTodo, updateTodo, deleteTodo, updateTodoStatus } from '../features/todo/api/todo-api';
import { getCategories, createCategory, deleteCategory } from '../features/category/api/category-api';

// ─── 테스트 유틸 ──────────────────────────────────────────────────────────────
function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
}

function renderWithProviders(ui, { initialPath = '/', queryClient } = {}) {
  const client = queryClient ?? makeQueryClient();
  return {
    queryClient: client,
    ...render(
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={[initialPath]}>
          {ui}
        </MemoryRouter>
      </QueryClientProvider>
    ),
  };
}

const SAMPLE_TODO = {
  id: 1,
  title: '주간 보고서 작성',
  description: '초안 작성',
  status: 'in_progress',
  dueDate: '2026-04-30',
  category: { id: 1, name: '업무' },
  isOverdue: false,
  createdAt: '2026-04-28T09:00:00Z',
  completedAt: null,
};

const SAMPLE_CATEGORIES = [{ id: 1, name: '업무' }, { id: 2, name: '개인' }];

beforeEach(() => {
  localStorage.clear();
  useAuthStore.setState({ token: null });
  useTodoStore.setState({
    selectedCategoryId: null,
    selectedStatusTab: 'all',
    showUncategorized: false,
    showOverdue: false,
    isCreateModalOpen: false,
    selectedTodoId: null,
  });
  useCategoryStore.setState({ isManageModalOpen: false, editingCategory: null });
  vi.clearAllMocks();
});

// ─── 1. 미인증 접근 차단 ────────────────────────────────────────────────────
describe('미인증 접근 시 로그인 이동', () => {
  test('/todos 접근 시 토큰이 없으면 /login으로 리다이렉트된다', () => {
    renderWithProviders(
      <Routes>
        <Route path="/login" element={<div>로그인 페이지</div>} />
        <Route
          path="/todos"
          element={
            <ProtectedRoute>
              <div>Todo 목록</div>
            </ProtectedRoute>
          }
        />
      </Routes>,
      { initialPath: '/todos' }
    );
    expect(screen.getByText('로그인 페이지')).toBeInTheDocument();
    expect(screen.queryByText('Todo 목록')).not.toBeInTheDocument();
  });

  test('로그인 상태에서 /login 접근 시 /todos로 리다이렉트된다', () => {
    useAuthStore.setState({ token: 'valid-token' });
    renderWithProviders(
      <Routes>
        <Route path="/todos" element={<div>Todo 목록</div>} />
        <Route
          path="/login"
          element={
            <PublicOnlyRoute>
              <div>로그인 페이지</div>
            </PublicOnlyRoute>
          }
        />
      </Routes>,
      { initialPath: '/login' }
    );
    expect(screen.getByText('Todo 목록')).toBeInTheDocument();
    expect(screen.queryByText('로그인 페이지')).not.toBeInTheDocument();
  });
});

// ─── 2. 회원가입 흐름 ────────────────────────────────────────────────────────
describe('회원가입 흐름', () => {
  test('유효한 이메일/비밀번호로 회원가입하면 /login으로 이동한다', async () => {
    signup.mockResolvedValueOnce({ id: 1, email: 'user@example.com' });

    renderWithProviders(
      <Routes>
        <Route path="/signup" element={<PublicOnlyRoute><SignupPage /></PublicOnlyRoute>} />
        <Route path="/login" element={<div>로그인 화면</div>} />
      </Routes>,
      { initialPath: '/signup' }
    );

    fireEvent.change(screen.getByLabelText('이메일'), { target: { value: 'user@example.com' } });
    fireEvent.change(screen.getByLabelText('비밀번호'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: '회원가입' }));

    await waitFor(() => {
      expect(screen.getByText('로그인 화면')).toBeInTheDocument();
    });
  });

  test('중복 이메일 회원가입 시 서버 오류 메시지가 표시된다', async () => {
    signup.mockRejectedValueOnce({
      response: { data: { message: '이미 사용 중인 이메일입니다.' } },
    });

    renderWithProviders(
      <Routes>
        <Route path="/signup" element={<PublicOnlyRoute><SignupPage /></PublicOnlyRoute>} />
        <Route path="/login" element={<div>로그인 화면</div>} />
      </Routes>,
      { initialPath: '/signup' }
    );

    fireEvent.change(screen.getByLabelText('이메일'), { target: { value: 'dup@example.com' } });
    fireEvent.change(screen.getByLabelText('비밀번호'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: '회원가입' }));

    await waitFor(() => {
      expect(screen.getByText('이미 사용 중인 이메일입니다.')).toBeInTheDocument();
    });
  });
});

// ─── 3. 로그인 흐름 ────────────────────────────────────────────────────────
describe('로그인 흐름', () => {
  test('이메일/비밀번호 일치 시 JWT가 저장되고 /todos로 이동한다', async () => {
    login.mockResolvedValueOnce({ token: 'jwt-token-xyz', user: { id: 1, email: 'user@example.com' } });
    getTodos.mockResolvedValueOnce([]);
    getCategories.mockResolvedValueOnce([]);

    renderWithProviders(
      <Routes>
        <Route path="/login" element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
        <Route path="/todos" element={<ProtectedRoute><div>Todo 목록 화면</div></ProtectedRoute>} />
      </Routes>,
      { initialPath: '/login' }
    );

    fireEvent.change(screen.getByLabelText('이메일'), { target: { value: 'user@example.com' } });
    fireEvent.change(screen.getByLabelText('비밀번호'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: '로그인' }));

    await waitFor(() => {
      expect(useAuthStore.getState().token).toBe('jwt-token-xyz');
      expect(screen.getByText('Todo 목록 화면')).toBeInTheDocument();
    });
  });

  test('잘못된 자격증명 시 인증 실패 메시지가 표시된다', async () => {
    login.mockRejectedValueOnce({
      response: { data: { message: '이메일 또는 비밀번호가 올바르지 않습니다.' } },
    });

    renderWithProviders(
      <Routes>
        <Route path="/login" element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
      </Routes>,
      { initialPath: '/login' }
    );

    fireEvent.change(screen.getByLabelText('이메일'), { target: { value: 'user@example.com' } });
    fireEvent.change(screen.getByLabelText('비밀번호'), { target: { value: 'wrongpassword' } });
    fireEvent.click(screen.getByRole('button', { name: '로그인' }));

    await waitFor(() => {
      expect(screen.getByText('이메일 또는 비밀번호가 올바르지 않습니다.')).toBeInTheDocument();
    });
  });
});

// ─── 4. Todo 제목 유효성 검증 ────────────────────────────────────────────────
describe('Todo 제목 유효성 검증', () => {
  test('제목 없이 제출하면 필수 오류가 표시된다', async () => {
    render(<TodoForm onSubmit={vi.fn()} onCancel={vi.fn()} categories={[]} />);
    fireEvent.click(screen.getByRole('button', { name: '저장' }));
    await waitFor(() => {
      expect(screen.getByText('제목을 입력해주세요.')).toBeInTheDocument();
    });
  });

  test('제목 100자 초과 시 오류가 표시된다', async () => {
    render(<TodoForm onSubmit={vi.fn()} onCancel={vi.fn()} categories={[]} />);
    fireEvent.change(screen.getByLabelText(/제목/), { target: { value: 'a'.repeat(101) } });
    fireEvent.click(screen.getByRole('button', { name: '저장' }));
    await waitFor(() => {
      expect(screen.getByText(/100자 이하/)).toBeInTheDocument();
    });
  });

  test('제목 100자는 허용된다', async () => {
    const onSubmit = vi.fn();
    render(<TodoForm onSubmit={onSubmit} onCancel={vi.fn()} categories={[]} />);
    fireEvent.change(screen.getByLabelText(/제목/), { target: { value: 'a'.repeat(100) } });
    fireEvent.click(screen.getByRole('button', { name: '저장' }));
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalled();
    });
  });

  test('글자 수가 실시간으로 표시된다', () => {
    render(<TodoForm onSubmit={vi.fn()} onCancel={vi.fn()} categories={[]} />);
    expect(screen.getByText('0 / 100')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/제목/), { target: { value: '안녕하세요 할일' } });
    expect(screen.getByText('8 / 100')).toBeInTheDocument();
  });
});

// ─── 5. Category 유효성 검증 및 생성 한도 ───────────────────────────────────
describe('Category 유효성 검증', () => {
  function renderCategoryModal(categories = []) {
    const queryClient = makeQueryClient();
    queryClient.setQueryData(['categories'], categories);
    getCategories.mockResolvedValue(categories);
    createCategory.mockResolvedValue({ id: 99, name: '새 카테고리' });
    return renderWithProviders(
      <CategoryManageModal isOpen={true} onClose={vi.fn()} />,
      { queryClient }
    );
  }

  test('이름 없이 추가하면 필수 오류가 표시된다', async () => {
    renderCategoryModal();
    await waitFor(() => screen.getByRole('button', { name: '추가' }));
    fireEvent.click(screen.getByRole('button', { name: '추가' }));
    await waitFor(() => {
      expect(screen.getByText('카테고리 이름을 입력해주세요.')).toBeInTheDocument();
    });
  });

  test('이름 20자 초과 시 오류가 표시된다', async () => {
    renderCategoryModal();
    await waitFor(() => screen.getByPlaceholderText('새 카테고리 이름'));
    fireEvent.change(screen.getByPlaceholderText('새 카테고리 이름'), {
      target: { value: 'a'.repeat(21) },
    });
    fireEvent.click(screen.getByRole('button', { name: '추가' }));
    await waitFor(() => {
      expect(screen.getByText(/20자 이하/)).toBeInTheDocument();
    });
  });

  test('카테고리 20개 도달 시 추가 버튼이 비활성화된다', async () => {
    const twentyCategories = Array.from({ length: 20 }, (_, i) => ({
      id: i + 1,
      name: `카테고리${i + 1}`,
    }));
    renderCategoryModal(twentyCategories);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: '추가' })).toBeDisabled();
    });
  });

  test('카테고리 20개 도달 시 카운트 안내가 표시된다', async () => {
    const twentyCategories = Array.from({ length: 20 }, (_, i) => ({
      id: i + 1,
      name: `카테고리${i + 1}`,
    }));
    renderCategoryModal(twentyCategories);
    await waitFor(() => {
      expect(screen.getByText('카테고리 20 / 20')).toBeInTheDocument();
    });
  });

  test('카테고리를 성공적으로 생성하면 입력창이 초기화된다', async () => {
    renderCategoryModal(SAMPLE_CATEGORIES);
    await waitFor(() => screen.getByPlaceholderText('새 카테고리 이름'));
    fireEvent.change(screen.getByPlaceholderText('새 카테고리 이름'), {
      target: { value: '새 카테고리' },
    });
    fireEvent.click(screen.getByRole('button', { name: '추가' }));
    await waitFor(() => {
      expect(createCategory).toHaveBeenCalled();
      expect(createCategory.mock.calls[0][0]).toEqual({ name: '새 카테고리' });
    });
  });
});

// ─── 6. Category 삭제 후 Todo 미분류 표시 ──────────────────────────────────
describe('Category 삭제 후 Todo 미분류 표시', () => {
  test('category가 있는 Todo는 카테고리 이름을 표시한다', () => {
    render(<TodoItem todo={SAMPLE_TODO} />);
    expect(screen.getByText('업무')).toBeInTheDocument();
    expect(screen.queryByText('미지정')).not.toBeInTheDocument();
  });

  test('category가 null인 Todo는 미지정을 표시한다', () => {
    render(<TodoItem todo={{ ...SAMPLE_TODO, category: null, categoryId: null }} />);
    expect(screen.getByText('미지정')).toBeInTheDocument();
    expect(screen.queryByText('업무')).not.toBeInTheDocument();
  });

  test('Category 삭제 모달에서 미분류 전환 안내 메시지가 표시된다', async () => {
    const categories = [{ id: 1, name: '업무' }];
    const queryClient = makeQueryClient();
    queryClient.setQueryData(['categories'], categories);
    getCategories.mockResolvedValue(categories);
    deleteCategory.mockResolvedValue({});

    renderWithProviders(
      <CategoryManageModal isOpen={true} onClose={vi.fn()} />,
      { queryClient }
    );

    await waitFor(() => screen.getByText('업무'));
    fireEvent.click(screen.getByRole('button', { name: '삭제' }));

    await waitFor(() => {
      expect(screen.getByText('소속 Todo는 삭제되지 않고 미분류로 전환됩니다.')).toBeInTheDocument();
    });
  });
});

// ─── 7. Todo 생성 흐름 ────────────────────────────────────────────────────
describe('Todo 생성 흐름', () => {
  test('카테고리 없이 제목만으로 Todo를 생성할 수 있다', async () => {
    const onSubmit = vi.fn();
    render(<TodoForm onSubmit={onSubmit} onCancel={vi.fn()} categories={[]} />);
    fireEvent.change(screen.getByLabelText(/제목/), { target: { value: '카테고리 없는 할일' } });
    fireEvent.click(screen.getByRole('button', { name: '저장' }));
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ title: '카테고리 없는 할일', categoryId: null })
      );
    });
  });

  test('모든 필드를 입력하면 onSubmit에 전체 데이터가 전달된다', async () => {
    const onSubmit = vi.fn();
    render(<TodoForm onSubmit={onSubmit} onCancel={vi.fn()} categories={SAMPLE_CATEGORIES} />);
    fireEvent.change(screen.getByLabelText(/제목/), { target: { value: '보고서 작성' } });
    fireEvent.change(screen.getByLabelText(/설명/), { target: { value: '초안 작성' } });
    fireEvent.change(screen.getByLabelText(/종료일/), { target: { value: '2026-04-30' } });
    fireEvent.change(screen.getByLabelText(/카테고리/), { target: { value: '1' } });
    fireEvent.click(screen.getByRole('button', { name: '저장' }));
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        title: '보고서 작성',
        description: '초안 작성',
        dueDate: '2026-04-30',
        categoryId: 1,
      });
    });
  });
});

// ─── 8. overdue 표시 ────────────────────────────────────────────────────────
describe('Todo overdue 표시', () => {
  test('isOverdue가 true이고 status가 in_progress이면 기한 초과가 표시된다', () => {
    render(<TodoItem todo={{ ...SAMPLE_TODO, isOverdue: true }} />);
    expect(screen.getByText('기한 초과')).toBeInTheDocument();
  });

  test('isOverdue가 true여도 status가 done이면 기한 초과 스타일 없이 완료가 표시된다', () => {
    render(
      <TodoItem
        todo={{ ...SAMPLE_TODO, status: 'done', isOverdue: false, completedAt: '2026-04-28T10:00:00Z' }}
      />
    );
    expect(screen.getByText('완료')).toBeInTheDocument();
    expect(screen.queryByText('기한 초과')).not.toBeInTheDocument();
  });
});

// ─── 9. Phase 1 제외 범위 확인 ──────────────────────────────────────────────
describe('Phase 1 제외 범위', () => {
  test('알림(notification) UI가 존재하지 않는다', () => {
    const { container } = render(<TodoItem todo={SAMPLE_TODO} />);
    expect(container.querySelector('[data-notification]')).toBeNull();
  });

  test('Todo 목록 화면에 소셜 로그인 버튼이 존재하지 않는다', () => {
    renderWithProviders(
      <Routes>
        <Route path="/login" element={<LoginPage />} />
      </Routes>,
      { initialPath: '/login' }
    );
    expect(screen.queryByText(/Google/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/GitHub/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/카카오/i)).not.toBeInTheDocument();
  });
});
