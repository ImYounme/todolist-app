import { useTranslation } from 'react-i18next';

export function ErrorBanner({ message, onRetry }) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center gap-3 py-8 text-center">
      <p className="text-sm text-overdue">{message || t('error.loadFailed')}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="text-sm text-primary hover:underline"
        >
          {t('error.retry')}
        </button>
      )}
    </div>
  );
}
