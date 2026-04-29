import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, test, vi } from 'vitest';
import { LoginForm } from './LoginForm';

function renderForm(props = {}) {
  const defaults = { onSubmit: vi.fn(), isLoading: false, serverError: null };
  return render(
    <MemoryRouter>
      <LoginForm {...defaults} {...props} />
    </MemoryRouter>
  );
}

describe('LoginForm', () => {
  describe('렌더링', () => {
    test('이메일, 비밀번호 입력 필드와 로그인 버튼을 렌더링한다', () => {
      renderForm();
      expect(screen.getByLabelText('이메일')).toBeInTheDocument();
      expect(screen.getByLabelText('비밀번호')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '로그인' })).toBeInTheDocument();
    });

    test('회원가입 링크를 렌더링한다', () => {
      renderForm();
      expect(screen.getByRole('link', { name: '회원가입' })).toBeInTheDocument();
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

    test('serverError가 있으면 인증 실패 메시지를 표시한다', () => {
      renderForm({ serverError: '이메일 또는 비밀번호가 올바르지 않습니다.' });
      const alerts = screen.getAllByRole('alert');
      const serverAlert = alerts.find((el) =>
        el.textContent.includes('이메일 또는 비밀번호가 올바르지 않습니다.')
      );
      expect(serverAlert).toBeInTheDocument();
    });

    test('serverError가 없으면 오류 메시지를 표시하지 않는다', () => {
      renderForm();
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  describe('유효성 검증', () => {
    test('이메일 없이 제출하면 필수 오류를 표시한다', async () => {
      renderForm();
      fireEvent.click(screen.getByRole('button', { name: '로그인' }));
      await waitFor(() => {
        expect(screen.getByText('이메일을 입력해주세요.')).toBeInTheDocument();
      });
    });

    test('유효하지 않은 이메일 형식으로 제출하면 형식 오류를 표시한다', async () => {
      renderForm();
      fireEvent.change(screen.getByLabelText('이메일'), { target: { value: 'not-an-email' } });
      fireEvent.click(screen.getByRole('button', { name: '로그인' }));
      await waitFor(() => {
        expect(screen.getByText('유효하지 않은 이메일 형식입니다.')).toBeInTheDocument();
      });
    });

    test('비밀번호 없이 제출하면 필수 오류를 표시한다', async () => {
      renderForm();
      fireEvent.change(screen.getByLabelText('이메일'), { target: { value: 'user@example.com' } });
      fireEvent.click(screen.getByRole('button', { name: '로그인' }));
      await waitFor(() => {
        expect(screen.getByText('비밀번호를 입력해주세요.')).toBeInTheDocument();
      });
    });

    test('유효성 오류가 있으면 onSubmit이 호출되지 않는다', async () => {
      const onSubmit = vi.fn();
      renderForm({ onSubmit });
      fireEvent.click(screen.getByRole('button', { name: '로그인' }));
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
      fireEvent.click(screen.getByRole('button', { name: '로그인' }));
      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith('user@example.com', 'password123');
      });
    });

    test('유효한 제출 후 필드 오류가 사라진다', async () => {
      const onSubmit = vi.fn();
      renderForm({ onSubmit });
      fireEvent.click(screen.getByRole('button', { name: '로그인' }));
      await waitFor(() => expect(screen.getByText('이메일을 입력해주세요.')).toBeInTheDocument());

      fireEvent.change(screen.getByLabelText('이메일'), { target: { value: 'user@example.com' } });
      fireEvent.change(screen.getByLabelText('비밀번호'), { target: { value: 'password123' } });
      fireEvent.click(screen.getByRole('button', { name: '로그인' }));
      await waitFor(() => {
        expect(screen.queryByText('이메일을 입력해주세요.')).not.toBeInTheDocument();
      });
    });
  });
});
