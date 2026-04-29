import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth-store';
import { ROUTES } from '../../../constants/routes';

export function ProtectedRoute({ children }) {
  const token = useAuthStore((state) => state.token);
  if (!token) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }
  return children;
}
