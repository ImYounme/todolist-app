import { beforeEach, describe, expect, test } from 'vitest';
import { useAuthStore, getAuthToken, clearAuthToken } from './auth-store';

beforeEach(() => {
  localStorage.clear();
  useAuthStore.setState({ token: null });
});

describe('useAuthStore', () => {
  describe('setToken', () => {
    test('token을 state에 저장한다', () => {
      const { setToken } = useAuthStore.getState();
      setToken('test-jwt-token');
      expect(useAuthStore.getState().token).toBe('test-jwt-token');
    });

    test('token을 localStorage에 저장한다', () => {
      const { setToken } = useAuthStore.getState();
      setToken('test-jwt-token');
      expect(localStorage.getItem('auth_token')).toBe('test-jwt-token');
    });
  });

  describe('clearToken', () => {
    test('state의 token을 null로 초기화한다', () => {
      useAuthStore.setState({ token: 'existing-token' });
      localStorage.setItem('auth_token', 'existing-token');
      const { clearToken } = useAuthStore.getState();
      clearToken();
      expect(useAuthStore.getState().token).toBeNull();
    });

    test('localStorage에서 token을 제거한다', () => {
      useAuthStore.setState({ token: 'existing-token' });
      localStorage.setItem('auth_token', 'existing-token');
      const { clearToken } = useAuthStore.getState();
      clearToken();
      expect(localStorage.getItem('auth_token')).toBeNull();
    });
  });
});

describe('getAuthToken', () => {
  test('localStorage에 토큰이 있으면 반환한다', () => {
    localStorage.setItem('auth_token', 'my-token');
    expect(getAuthToken()).toBe('my-token');
  });

  test('localStorage에 토큰이 없으면 null을 반환한다', () => {
    expect(getAuthToken()).toBeNull();
  });
});

describe('clearAuthToken', () => {
  test('localStorage에서 토큰을 제거한다', () => {
    localStorage.setItem('auth_token', 'some-token');
    clearAuthToken();
    expect(localStorage.getItem('auth_token')).toBeNull();
  });

  test('토큰이 없어도 오류 없이 동작한다', () => {
    expect(() => clearAuthToken()).not.toThrow();
  });
});
