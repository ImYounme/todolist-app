import { Link } from 'react-router-dom';
import { SignupForm } from '../features/auth/components/SignupForm';
import { useSignup } from '../features/auth/hooks/use-auth';
import { useTranslation } from 'react-i18next';

export default function SignupPage() {
  const { t } = useTranslation();
  const { mutate: signup, isPending, error } = useSignup();

  const serverError = error?.response?.data?.message ?? null;

  function handleSubmit(email, password) {
    signup({ email, password });
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-gray">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm p-8">
        <Link
          to="/"
          className="block text-xl font-semibold text-text-primary mb-1 hover:text-primary transition-colors"
        >
          {t('app.name')}
        </Link>
        <p className="text-sm text-text-secondary mb-6">{t('auth.signup')}</p>
        <SignupForm
          onSubmit={handleSubmit}
          isLoading={isPending}
          serverError={serverError}
        />
      </div>
    </div>
  );
}
