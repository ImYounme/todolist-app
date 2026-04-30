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
    <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-gray-950 px-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-gray-700 shadow-xl shadow-slate-200/70 dark:shadow-black/30 p-8">
        <div className="mb-7 text-center">
          <Link
            to="/"
            className="inline-block text-2xl font-semibold text-text-primary dark:text-white hover:text-primary transition-colors"
          >
            {t('app.name')}
          </Link>
          <p className="mt-2 text-sm text-text-secondary dark:text-gray-400">{t('auth.signup')}</p>
        </div>
        <SignupForm
          onSubmit={handleSubmit}
          isLoading={isPending}
          serverError={serverError}
        />
      </div>
    </div>
  );
}
