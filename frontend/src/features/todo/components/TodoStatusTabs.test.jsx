import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, test, beforeEach } from 'vitest';
import { TodoStatusTabs } from './TodoStatusTabs';
import { useTodoStore } from '../../todo/store/todo-store';
import { TODO_STATUS } from '../../../constants/todo';

describe('TodoStatusTabs', () => {
  beforeEach(() => {
    useTodoStore.setState({
      selectedStatusTab: 'all',
      showOverdue: false,
    });
  });

  test('전체, 진행 중, 완료 탭이 표시된다', () => {
    render(<TodoStatusTabs />);
    expect(screen.getAllByRole('button')).toHaveLength(3);
  });

  test('탭을 클릭하면 상태가 변경된다', () => {
    render(<TodoStatusTabs />);
    // 두 번째 버튼이 진행 중(in_progress)
    fireEvent.click(screen.getAllByRole('button')[1]);
    expect(useTodoStore.getState().selectedStatusTab).toBe(TODO_STATUS.IN_PROGRESS);
  });

  test('초기 상태는 all이다', () => {
    render(<TodoStatusTabs />);
    expect(useTodoStore.getState().selectedStatusTab).toBe('all');
  });

  test('탭 전환 시 showOverdue가 초기화된다', () => {
    useTodoStore.setState({ showOverdue: true });
    render(<TodoStatusTabs />);
    // 두 번째 버튼(진행 중) 클릭
    fireEvent.click(screen.getAllByRole('button')[1]);
    expect(useTodoStore.getState().showOverdue).toBe(false);
  });
});
