import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import { TodoForm } from './TodoForm';

const mockCategories = [
  { id: 1, name: '업무' },
  { id: 2, name: '개인' },
];

function renderForm(props = {}) {
  const defaults = {
    onSubmit: vi.fn(),
    onCancel: vi.fn(),
    isLoading: false,
    serverError: null,
    categories: mockCategories,
  };
  return render(<TodoForm {...defaults} {...props} />);
}

describe('TodoForm', () => {
  describe('렌더링', () => {
    test('제목/설명/종료일/카테고리 필드를 렌더링한다', () => {
      renderForm();
      expect(screen.getByLabelText(/제목/)).toBeInTheDocument();
      expect(screen.getByLabelText(/설명/)).toBeInTheDocument();
      expect(screen.getByLabelText(/종료일/)).toBeInTheDocument();
      expect(screen.getByLabelText(/카테고리/)).toBeInTheDocument();
    });

    test('저장/취소 버튼을 렌더링한다', () => {
      renderForm();
      expect(screen.getByRole('button', { name: '저장' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '취소' })).toBeInTheDocument();
    });

    test('제목 글자 수를 0 / 100 형태로 표시한다', () => {
      renderForm();
      expect(screen.getByText('0 / 100')).toBeInTheDocument();
    });

    test('제목 입력 시 글자 수가 갱신된다', () => {
      renderForm();
      fireEvent.change(screen.getByLabelText(/제목/), { target: { value: '안녕하세요' } });
      expect(screen.getByText('5 / 100')).toBeInTheDocument();
    });

    test('카테고리 드롭다운에 미지정 옵션이 포함된다', () => {
      renderForm();
      expect(screen.getByRole('option', { name: '미지정' })).toBeInTheDocument();
    });

    test('카테고리 목록이 드롭다운에 표시된다', () => {
      renderForm();
      expect(screen.getByRole('option', { name: '업무' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: '개인' })).toBeInTheDocument();
    });

    test('isLoading이 true이면 저장 버튼이 비활성화된다', () => {
      renderForm({ isLoading: true });
      expect(screen.getByRole('button', { name: '저장 중...' })).toBeDisabled();
    });

    test('serverError가 있으면 표시한다', () => {
      renderForm({ serverError: '서버 오류가 발생했습니다.' });
      expect(screen.getByText('서버 오류가 발생했습니다.')).toBeInTheDocument();
    });
  });

  describe('유효성 검증', () => {
    test('제목 없이 제출하면 필수 오류를 표시한다', async () => {
      renderForm();
      fireEvent.click(screen.getByRole('button', { name: '저장' }));
      await waitFor(() => {
        expect(screen.getByText('제목을 입력해주세요.')).toBeInTheDocument();
      });
    });

    test('100자 초과 제목은 오류를 표시한다', async () => {
      renderForm();
      const longTitle = 'a'.repeat(101);
      fireEvent.change(screen.getByLabelText(/제목/), { target: { value: longTitle } });
      fireEvent.click(screen.getByRole('button', { name: '저장' }));
      await waitFor(() => {
        expect(screen.getByText(/100자 이하/)).toBeInTheDocument();
      });
    });

    test('유효성 오류 시 onSubmit이 호출되지 않는다', async () => {
      const onSubmit = vi.fn();
      renderForm({ onSubmit });
      fireEvent.click(screen.getByRole('button', { name: '저장' }));
      await waitFor(() => {
        expect(onSubmit).not.toHaveBeenCalled();
      });
    });
  });

  describe('제출', () => {
    test('제목만 입력해도 제출할 수 있다 (카테고리 없이)', async () => {
      const onSubmit = vi.fn();
      renderForm({ onSubmit });
      fireEvent.change(screen.getByLabelText(/제목/), { target: { value: '할일 제목' } });
      fireEvent.click(screen.getByRole('button', { name: '저장' }));
      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith(
          expect.objectContaining({ title: '할일 제목', categoryId: null })
        );
      });
    });

    test('모든 필드를 입력하면 onSubmit에 전체 데이터가 전달된다', async () => {
      const onSubmit = vi.fn();
      renderForm({ onSubmit });
      fireEvent.change(screen.getByLabelText(/제목/), { target: { value: '보고서 작성' } });
      fireEvent.change(screen.getByLabelText(/설명/), { target: { value: '상세 설명' } });
      fireEvent.change(screen.getByLabelText(/종료일/), { target: { value: '2026-04-30' } });
      fireEvent.change(screen.getByLabelText(/카테고리/), { target: { value: '1' } });
      fireEvent.click(screen.getByRole('button', { name: '저장' }));
      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith({
          title: '보고서 작성',
          description: '상세 설명',
          dueDate: '2026-04-30',
          categoryId: 1,
        });
      });
    });

    test('취소 버튼 클릭 시 onCancel이 호출된다', () => {
      const onCancel = vi.fn();
      renderForm({ onCancel });
      fireEvent.click(screen.getByRole('button', { name: '취소' }));
      expect(onCancel).toHaveBeenCalled();
    });
  });
});
