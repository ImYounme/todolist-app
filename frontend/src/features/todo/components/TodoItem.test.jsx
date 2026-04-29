import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import { TodoItem } from './TodoItem';

const baseTodo = {
  id: 1,
  title: '주간 보고서 작성',
  description: '금요일 회의 전까지 초안 작성',
  status: 'in_progress',
  dueDate: '2026-04-29',
  category: { id: 1, name: '업무' },
  isOverdue: false,
  completedAt: null,
};

describe('TodoItem', () => {
  test('제목을 렌더링한다', () => {
    render(<TodoItem todo={baseTodo} />);
    expect(screen.getByText('주간 보고서 작성')).toBeInTheDocument();
  });

  test('설명을 렌더링한다', () => {
    render(<TodoItem todo={baseTodo} />);
    expect(screen.getByText('금요일 회의 전까지 초안 작성')).toBeInTheDocument();
  });

  test('설명이 없으면 설명 영역을 표시하지 않는다', () => {
    render(<TodoItem todo={{ ...baseTodo, description: null }} />);
    expect(screen.queryByText('금요일 회의 전까지 초안 작성')).not.toBeInTheDocument();
  });

  test('카테고리 이름을 표시한다', () => {
    render(<TodoItem todo={baseTodo} />);
    expect(screen.getByText('업무')).toBeInTheDocument();
  });

  test('카테고리가 없으면 미지정을 표시한다', () => {
    render(<TodoItem todo={{ ...baseTodo, category: null }} />);
    expect(screen.getByText('미지정')).toBeInTheDocument();
  });

  test('종료일을 표시한다', () => {
    render(<TodoItem todo={baseTodo} />);
    expect(screen.getByText('2026-04-29')).toBeInTheDocument();
  });

  test('종료일이 없으면 종료일 영역을 표시하지 않는다', () => {
    render(<TodoItem todo={{ ...baseTodo, dueDate: null }} />);
    expect(screen.queryByText('2026-04-29')).not.toBeInTheDocument();
  });

  test('진행 중 상태를 표시한다', () => {
    render(<TodoItem todo={baseTodo} />);
    expect(screen.getByText('진행 중')).toBeInTheDocument();
  });

  test('완료 상태를 표시한다', () => {
    render(<TodoItem todo={{ ...baseTodo, status: 'done' }} />);
    expect(screen.getByText('완료')).toBeInTheDocument();
  });

  test('isOverdue가 true이면 기한 초과 표시를 한다', () => {
    render(<TodoItem todo={{ ...baseTodo, isOverdue: true }} />);
    expect(screen.getByText('기한 초과')).toBeInTheDocument();
  });

  test('isOverdue가 false이면 기한 초과 표시를 하지 않는다', () => {
    render(<TodoItem todo={baseTodo} />);
    expect(screen.queryByText('기한 초과')).not.toBeInTheDocument();
  });

  test('클릭하면 onSelect가 todo와 함께 호출된다', () => {
    const onSelect = vi.fn();
    render(<TodoItem todo={baseTodo} onSelect={onSelect} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onSelect).toHaveBeenCalledWith(baseTodo);
  });

  test('onSelect가 없어도 클릭 시 오류가 발생하지 않는다', () => {
    render(<TodoItem todo={baseTodo} />);
    expect(() => fireEvent.click(screen.getByRole('button'))).not.toThrow();
  });
});
