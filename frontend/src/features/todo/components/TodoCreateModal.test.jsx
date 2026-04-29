import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import { TodoCreateModal } from './TodoCreateModal';

vi.mock('../hooks/use-todos', () => ({
  useCreateTodo: () => ({
    mutate: vi.fn(),
    isPending: false,
    error: null,
  }),
}));

vi.mock('../../category/hooks/use-categories', () => ({
  useCategories: () => ({
    data: [{ id: 1, name: '업무' }],
  }),
}));

describe('TodoCreateModal', () => {
  test('isOpen이 false이면 렌더링하지 않는다', () => {
    render(<TodoCreateModal isOpen={false} onClose={vi.fn()} />);
    expect(screen.queryByText('새 할일 추가')).not.toBeInTheDocument();
  });

  test('isOpen이 true이면 모달 제목과 폼을 표시한다', () => {
    render(<TodoCreateModal isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByText('새 할일 추가')).toBeInTheDocument();
    expect(screen.getByLabelText(/제목/)).toBeInTheDocument();
  });

  test('취소 버튼 클릭 시 onClose가 호출된다', () => {
    const onClose = vi.fn();
    render(<TodoCreateModal isOpen={true} onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: '취소' }));
    expect(onClose).toHaveBeenCalled();
  });

  test('닫기(X) 버튼 클릭 시 onClose가 호출된다', () => {
    const onClose = vi.fn();
    render(<TodoCreateModal isOpen={true} onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: '닫기' }));
    expect(onClose).toHaveBeenCalled();
  });

  test('카테고리 목록이 드롭다운에 표시된다', () => {
    render(<TodoCreateModal isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByRole('option', { name: '업무' })).toBeInTheDocument();
  });
});
