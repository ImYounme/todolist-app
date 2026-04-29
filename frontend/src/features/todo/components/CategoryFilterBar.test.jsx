import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import { CategoryFilterBar } from './CategoryFilterBar';
import { useTodoStore } from '../../todo/store/todo-store';

const mockCategories = [
  { id: 1, name: '업무' },
  { id: 2, name: '개인' },
];

describe('CategoryFilterBar', () => {
  beforeEach(() => {
    useTodoStore.setState({
      selectedCategoryId: null,
      showUncategorized: false,
    });
  });

  test('전체, 미지정, 카테고리 버튼이 표시된다', () => {
    render(<CategoryFilterBar categories={mockCategories} />);
    expect(screen.getByText('전체')).toBeInTheDocument();
    expect(screen.getByText('미지정')).toBeInTheDocument();
    expect(screen.getByText('업무')).toBeInTheDocument();
    expect(screen.getByText('개인')).toBeInTheDocument();
  });

  test('전체 버튼을 클릭하면 selectedCategoryId가 null이 된다', () => {
    useTodoStore.setState({ selectedCategoryId: 1 });
    render(<CategoryFilterBar categories={mockCategories} />);
    fireEvent.click(screen.getByText('전체'));
    expect(useTodoStore.getState().selectedCategoryId).toBeNull();
    expect(useTodoStore.getState().showUncategorized).toBe(false);
  });

  test('미지정 버튼을 클릭하면 showUncategorized가 true가 된다', () => {
    render(<CategoryFilterBar categories={mockCategories} />);
    fireEvent.click(screen.getByText('미지정'));
    expect(useTodoStore.getState().showUncategorized).toBe(true);
  });

  test('카테고리 버튼을 클릭하면 해당 카테고리가 선택된다', () => {
    render(<CategoryFilterBar categories={mockCategories} />);
    fireEvent.click(screen.getByText('업무'));
    expect(useTodoStore.getState().selectedCategoryId).toBe(1);
    expect(useTodoStore.getState().showUncategorized).toBe(false);
  });

  test('선택된 카테고리가 강조된다', () => {
    useTodoStore.setState({ selectedCategoryId: 1 });
    render(<CategoryFilterBar categories={mockCategories} />);
    const 업무Button = screen.getByText('업무');
    expect(업무Button.className).toContain('bg-primary');
  });
});