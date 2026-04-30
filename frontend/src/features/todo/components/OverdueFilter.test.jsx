import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, test, beforeEach } from 'vitest';
import { OverdueFilter } from './OverdueFilter';
import { useTodoStore } from '../../todo/store/todo-store';

describe('OverdueFilter', () => {
  beforeEach(() => {
    useTodoStore.setState({
      showOverdue: false,
      selectedStatusTab: 'all',
    });
  });

  test('기한 초과 버튼이 표시된다', () => {
    render(<OverdueFilter />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  test('전체 상태에서 기한 초과 필터를 토글할 수 있다', () => {
    render(<OverdueFilter />);
    fireEvent.click(screen.getByRole('button'));
    expect(useTodoStore.getState().showOverdue).toBe(true);
  });

  test('진행 중 상태에서 기한 초과 필터를 토글할 수 있다', () => {
    useTodoStore.setState({ selectedStatusTab: 'in_progress' });
    render(<OverdueFilter />);
    fireEvent.click(screen.getByRole('button'));
    expect(useTodoStore.getState().showOverdue).toBe(true);
  });

  test('완료 상태에서는 비활성화된다', () => {
    useTodoStore.setState({ selectedStatusTab: 'done' });
    render(<OverdueFilter />);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  test('활성화 시 aria-pressed가 true가 된다', () => {
    useTodoStore.setState({ showOverdue: true, selectedStatusTab: 'all' });
    render(<OverdueFilter />);
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true');
  });

  test('비활성화 시 aria-pressed가 false가 된다', () => {
    render(<OverdueFilter />);
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'false');
  });
});
