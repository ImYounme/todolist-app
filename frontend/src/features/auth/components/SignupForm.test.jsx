import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, test, vi, beforeEach } from 'vitest';
import { SignupForm } from './SignupForm';

function renderForm(props = {}) {
  const defaults = { onSubmit: vi.fn(), isLoading: false, serverError: null };
  return render(
    <MemoryRouter>
      <SignupForm {...defaults} {...props} />
    </MemoryRouter>
  );
}

describe('SignupForm', () => {
  describe('렌더링', () => {
    test('이메일, 비밀번호 입력 필드와 회원가입 버튼을 렌더링한다', () => {
      renderForm();
      expect(screen.getByLabelText('이메일')).toBeInTheDocument();
      expect(screen.getByLabelText('비밀번호')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '회원가입' })).toBeInTheDocument();
    });

    test('로그인 링크를 렌더링한다', () => {
      renderForm();
      expect(screen.getByRole('link', { name: '로그인' })).toBeInTheDocument();
    });

    test('isLoading이 true이면 버튼이 비활성화되고 처리 중으로 표시된다', () => {
      renderForm({ isLoading: true });
      expect(screen.getByRole('button', { name: '처리 중...' })).toBeDisabled();
    });

    test('isLoading이 true이면 입력 필드가 비활성화된다', () => {
      renderForm({ isLoading: true });
      expect(screen.getByLabelText('이메일')).toBeDisabled();
      expect(screen.getByLabelText('비밀번호')).toBeDisabled();
    });

    test('serverError가 있으면 서버 오류 메시지를 표시한다', () => {
      renderForm({ serverError: '이미 사용 중인 이메일입니다.' });
      expect(screen.getByText('이미 사용 중인 이메일입니다.')).toBeInTheDocument();
    });
  });

  describe('유효성 검증', () => {
    test('이메일 없이 제출하면 필수 오류를 표시한다', async () => {
      renderForm();
      fireEvent.click(screen.getByRole('button', { name: '회원가입' }));
      await waitFor(() => {
        expect(screen.getByText('이메일을 입력해주세요.')).toBeInTheDocument();
      });
    });

    test('유효하지 않은 이메일 형식으로 제출하면 형식 오류를 표시한다', async () => {
      renderForm();
      fireEvent.change(screen.getByLabelText('이메일'), { target: { value: 'invalid-email' } });
      fireEvent.click(screen.getByRole('button', { name: '회원가입' }));
      await waitFor(() => {
        expect(screen.getByText('유효하지 않은 이메일 형식입니다.')).toBeInTheDocument();
      });
    });

    test('비밀번호 없이 제출하면 필수 오류를 표시한다', async () => {
      renderForm();
      fireEvent.change(screen.getByLabelText('이메일'), { target: { value: 'test@example.com' } });
      fireEvent.click(screen.getByRole('button', { name: '회원가입' }));
      await waitFor(() => {
        expect(screen.getByText('비밀번호를 입력해주세요.')).toBeInTheDocument();
      });
    });

    test('8자 미만 비밀번호는 정책 오류를 표시한다', async () => {
      renderForm();
      fireEvent.change(screen.getByLabelText('이메일'), { target: { value: 'test@example.com' } });
      fireEvent.change(screen.getByLabelText('비밀번호'), { target: { value: 'short' } });
      fireEvent.click(screen.getByRole('button', { name: '회원가입' }));
      await waitFor(() => {
        expect(screen.getByText(/최소 8자 이상/)).toBeInTheDocument();
      });
    });

    test('유효성 오류가 있으면 onSubmit이 호출되지 않는다', async () => {
      const onSubmit = vi.fn();
      renderForm({ onSubmit });
      fireEvent.click(screen.getByRole('button', { name: '회원가입' }));
      await waitFor(() => {
        expect(onSubmit).not.toHaveBeenCalled();
      });
    });
  });

  describe('제출', () => {
    test('유효한 입력으로 제출하면 onSubmit을 이메일/비밀번호와 함께 호출한다', async () => {
      const onSubmit = vi.fn();
      renderForm({ onSubmit });
      fireEvent.change(screen.getByLabelText('이메일'), { target: { value: 'user@example.com' } });
      fireEvent.change(screen.getByLabelText('비밀번호'), { target: { value: 'password123' } });
      fireEvent.click(screen.getByRole('button', { name: '회원가입' }));
      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith('user@example.com', 'password123');
      });
    });

    test('유효한 제출 후 필드 오류가 사라진다', async () => {
      const onSubmit = vi.fn();
      renderForm({ onSubmit });
      fireEvent.click(screen.getByRole('button', { name: '회원가입' }));
      await waitFor(() => expect(screen.getByText('이메일을 입력해주세요.')).toBeInTheDocument());

      fireEvent.change(screen.getByLabelText('이메일'), { target: { value: 'user@example.com' } });
      fireEvent.change(screen.getByLabelText('비밀번호'), { target: { value: 'password123' } });
      fireEvent.click(screen.getByRole('button', { name: '회원가입' }));
      await waitFor(() => {
        expect(screen.queryByText('이메일을 입력해주세요.')).not.toBeInTheDocument();
      });
    });
  });
});
