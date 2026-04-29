import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import { TodoList } from './TodoList';

const mockTodos = [
  {
    id: 1,
    title: '첫 번째 할일',
    description: null,
    status: 'in_progress',
    dueDate: null,
    category: null,
    isOverdue: false,
    completedAt: null,
  },
  {
    id: 2,
    title: '두 번째 할일',
    description: '설명',
    status: 'done',
    dueDate: '2026-04-29',
    category: { id: 1, name: '업무' },
    isOverdue: false,
    completedAt: '2026-04-29T10:00:00Z',
  },
];

describe('TodoList', () => {
  test('로딩 중일 때 로딩 표시를 한다', () => {
    render(<TodoList todos={[]} isLoading={true} isError={false} />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  test('오류 시 오류 메시지와 재시도 버튼을 표시한다', () => {
    const onRetry = vi.fn();
    render(<TodoList todos={[]} isLoading={false} isError={true} onRetry={onRetry} />);
    expect(screen.getByText(/목록을 불러오는 데 실패했습니다/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /재시도/ })).toBeInTheDocument();
  });

  test('재시도 버튼 클릭 시 onRetry가 호출된다', () => {
    const onRetry = vi.fn();
    render(<TodoList todos={[]} isLoading={false} isError={true} onRetry={onRetry} />);
    fireEvent.click(screen.getByRole('button', { name: /재시도/ }));
    expect(onRetry).toHaveBeenCalled();
  });

  test('빈 목록일 때 빈 상태 메시지를 표시한다', () => {
    render(<TodoList todos={[]} isLoading={false} isError={false} />);
    expect(screen.getByText(/아직 등록된 Todo가 없습니다/)).toBeInTheDocument();
  });

  test('Todo 목록을 렌더링한다', () => {
    render(<TodoList todos={mockTodos} isLoading={false} isError={false} />);
    expect(screen.getByText('첫 번째 할일')).toBeInTheDocument();
    expect(screen.getByText('두 번째 할일')).toBeInTheDocument();
  });

  test('Todo 항목 클릭 시 onSelectTodo가 호출된다', () => {
    const onSelectTodo = vi.fn();
    render(
      <TodoList todos={mockTodos} isLoading={false} isError={false} onSelectTodo={onSelectTodo} />
    );
    fireEvent.click(screen.getAllByRole('button')[0]);
    expect(onSelectTodo).toHaveBeenCalledWith(mockTodos[0]);
  });
});
