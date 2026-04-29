import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth-store';
import { ROUTES } from '../../../constants/routes';

export function PublicOnlyRoute({ children }) {
  const token = useAuthStore((state) => state.token);
  if (token) {
    return <Navigate to={ROUTES.TODO_LIST} replace />;
  }
  return children;
}
