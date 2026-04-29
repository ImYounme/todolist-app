import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import { TodoStatusTabs } from './TodoStatusTabs';
import { useTodoStore } from '../../todo/store/todo-store';
import { TODO_STATUS } from '../../../constants/todo';

describe('TodoStatusTabs', () => {
  beforeEach(() => {
    useTodoStore.setState({
      selectedStatusTab: 'all',
    });
  });

  test('전체, 진행 중, 완료 탭이 표시된다', () => {
    render(<TodoStatusTabs />);
    expect(screen.getByText('전체')).toBeInTheDocument();
    expect(screen.getByText('진행 중')).toBeInTheDocument();
    expect(screen.getByText('완료')).toBeInTheDocument();
  });

  test('탭을 클릭하면 상태가 변경된다', () => {
    render(<TodoStatusTabs />);
    fireEvent.click(screen.getByText('진행 중'));
    expect(useTodoStore.getState().selectedStatusTab).toBe(TODO_STATUS.IN_PROGRESS);
  });

  test('초기 상태는 all이다', () => {
    render(<TodoStatusTabs />);
    expect(useTodoStore.getState().selectedStatusTab).toBe('all');
  });
});