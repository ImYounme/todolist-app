import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../store/auth-store';
import { login, signup, getProfile } from '../api/auth-api';
import { ROUTES } from '../../../constants/routes';

export function useLogin() {
  const setToken = useAuthStore((state) => state.setToken);
  const navigate = useNavigate();

  return useMutation({
    mutationFn: login,
    onSuccess: ({ token }) => {
      setToken(token);
      navigate(ROUTES.TODO_LIST);
    },
  });
}

export function useSignup() {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: signup,
    onSuccess: () => {
      navigate(ROUTES.LOGIN);
    },
  });
}

export function useLogout() {
  const clearToken = useAuthStore((state) => state.clearToken);
  const navigate = useNavigate();

  return () => {
    clearToken();
    navigate(ROUTES.LOGIN);
  };
}

export function useProfile() {
  return useQuery({
    queryKey: ['profile'],
    queryFn: getProfile,
    staleTime: Infinity,
  });
}
