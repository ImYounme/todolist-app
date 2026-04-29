import { Link } from 'react-router-dom';
import { LoginForm } from '../features/auth/components/LoginForm';
import { useLogin } from '../features/auth/hooks/use-auth';
import { useTranslation } from 'react-i18next';

export default function LoginPage() {
  const { t } = useTranslation();
  const { mutate: login, isPending, error } = useLogin();

  const serverError = error?.response?.data?.message ?? null;

  function handleSubmit(email, password) {
    login({ email, password });
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-gray dark:bg-gray-900">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-8">
        <Link
          to="/"
          className="block text-xl font-semibold text-text-primary dark:text-white mb-1 hover:text-primary transition-colors"
        >
          {t('app.name')}
        </Link>
        <p className="text-sm text-text-secondary dark:text-gray-400 mb-6">{t('auth.login')}</p>
        <LoginForm
          onSubmit={handleSubmit}
          isLoading={isPending}
          serverError={serverError}
        />
      </div>
    </div>
  );
}
