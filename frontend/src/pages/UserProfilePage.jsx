import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../features/auth/store/auth-store';
import { useProfile } from '../features/auth/hooks/use-auth';
import { Button } from '../components/ui/Button';
import { ROUTES } from '../constants/routes';

function ProfileShell({ title, backLabel, onBack, children }) {
  return (
    <div className="min-h-screen bg-bg-gray dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 border-b border-border-gray dark:border-gray-700 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-text-primary dark:text-white">{title}</h1>
        <Button variant="secondary" size="sm" onClick={onBack}>
          {backLabel}
        </Button>
      </header>
      <main className="max-w-3xl mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  );
}

export default function UserProfilePage() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const clearToken = useAuthStore((state) => state.clearToken);

  const { data: profile, isLoading, isError, error, refetch } = useProfile();

  function handleLogout() {
    clearToken();
    navigate(ROUTES.LOGIN);
  }

  const goBack = () => navigate(ROUTES.TODO_LIST);

  if (isLoading) {
    return (
      <ProfileShell title={t('profile.title')} backLabel={t('profile.back')} onBack={goBack}>
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </ProfileShell>
    );
  }

  if (isError) {
    return (
      <ProfileShell title={t('profile.title')} backLabel={t('profile.back')} onBack={goBack}>
        <div className="text-center py-12">
          <p className="text-sm text-overdue mb-4">
            {t('error.loadFailed')}
          </p>
          <p className="text-xs text-text-muted dark:text-gray-400 mb-4">
            {error?.response?.data?.message ?? t('error.unknown')}
          </p>
          <div className="flex gap-2 justify-center">
            <Button variant="secondary" size="sm" onClick={() => refetch()}>
              {t('error.retry')}
            </Button>
            <Button variant="secondary" size="sm" onClick={handleLogout}>
              {t('nav.logout')}
            </Button>
          </div>
        </div>
      </ProfileShell>
    );
  }

  return (
    <ProfileShell title={t('profile.title')} backLabel={t('profile.back')} onBack={goBack}>
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-border-gray dark:border-gray-700 p-6 shadow-sm">
        <h2 className="text-base font-semibold text-text-primary dark:text-white mb-4">
          {t('profile.accountInfo')}
        </h2>

        <dl className="space-y-4">
          <div>
            <dt className="text-xs text-text-muted dark:text-gray-400 mb-1">{t('profile.email')}</dt>
            <dd className="text-sm text-text-primary dark:text-gray-100">{profile?.email}</dd>
          </div>

          <div>
            <dt className="text-xs text-text-muted dark:text-gray-400 mb-1">{t('profile.joinedAt')}</dt>
            <dd className="text-sm text-text-primary dark:text-gray-100">
              {profile?.createdAt
                ? new Date(profile.createdAt).toLocaleDateString(i18n.resolvedLanguage || i18n.language, {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })
                : '-'}
            </dd>
          </div>
        </dl>

        <div className="mt-6 pt-6 border-t border-border-gray dark:border-gray-700">
          <Button variant="secondary" onClick={handleLogout}>
            {t('nav.logout')}
          </Button>
        </div>
      </div>
    </ProfileShell>
  );
}
