import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import { TodoStatusControl } from './TodoStatusControl';
import { TODO_STATUS } from '../../../constants/todo';

describe('TodoStatusControl', () => {
  test('진행 중 상태일 때 완료로 변경 버튼이 표시된다', () => {
    const onStatusChange = vi.fn();
    render(
      <TodoStatusControl
        status={TODO_STATUS.IN_PROGRESS}
        isOverdue={false}
        onStatusChange={onStatusChange}
        isLoading={false}
      />
    );
    expect(screen.getByRole('button', { name: /완료로 변경/ })).toBeInTheDocument();
  });

  test('완료 상태일 때 진행 중으로 변경 버튼이 표시된다', () => {
    const onStatusChange = vi.fn();
    render(
      <TodoStatusControl
        status={TODO_STATUS.DONE}
        isOverdue={false}
        onStatusChange={onStatusChange}
        isLoading={false}
      />
    );
    expect(screen.getByRole('button', { name: /진행 중으로 변경/ })).toBeInTheDocument();
  });

  test('버튼 클릭 시 onStatusChange가 호출된다', () => {
    const onStatusChange = vi.fn();
    render(
      <TodoStatusControl
        status={TODO_STATUS.IN_PROGRESS}
        isOverdue={false}
        onStatusChange={onStatusChange}
        isLoading={false}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /완료로 변경/ }));
    expect(onStatusChange).toHaveBeenCalledWith(TODO_STATUS.DONE);
  });

  test('로딩 중일 때 버튼이 비활성화된다', () => {
    const onStatusChange = vi.fn();
    render(
      <TodoStatusControl
        status={TODO_STATUS.IN_PROGRESS}
        isOverdue={false}
        onStatusChange={onStatusChange}
        isLoading={true}
      />
    );
    expect(screen.getByRole('button', { name: /완료로 변경/ })).toBeDisabled();
  });

  test('기한 초과이고 진행 중일 때 기한 초과 배지가 표시된다', () => {
    const onStatusChange = vi.fn();
    render(
      <TodoStatusControl
        status={TODO_STATUS.IN_PROGRESS}
        isOverdue={true}
        onStatusChange={onStatusChange}
        isLoading={false}
      />
    );
    expect(screen.getByText(/기한 초과/)).toBeInTheDocument();
  });

  test('완료 상태일 때 완료일시가 표시된다', () => {
    const onStatusChange = vi.fn();
    const completedAt = '2026-04-29T10:00:00Z';
    render(
      <TodoStatusControl
        status={TODO_STATUS.DONE}
        isOverdue={false}
        completedAt={completedAt}
        onStatusChange={onStatusChange}
        isLoading={false}
      />
    );
    expect(screen.getByText(/완료일:/)).toBeInTheDocument();
  });

  test('진행 중일 때 완료일시가 표시되지 않는다', () => {
    const onStatusChange = vi.fn();
    const completedAt = '2026-04-29T10:00:00Z';
    render(
      <TodoStatusControl
        status={TODO_STATUS.IN_PROGRESS}
        isOverdue={false}
        completedAt={completedAt}
        onStatusChange={onStatusChange}
        isLoading={false}
      />
    );
    expect(screen.queryByText(/완료일:/)).not.toBeInTheDocument();
  });
});