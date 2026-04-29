import { useTranslation } from 'react-i18next';

export function DeleteConfirmDialog({ title, message, onConfirm, onCancel, isLoading }) {
  const { t } = useTranslation();

  return (
    <div className="py-2">
      <h3 className="text-sm font-semibold text-text-primary mb-2">{title}</h3>
      <p className="text-sm text-text-secondary mb-4">{message}</p>
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="px-4 py-2 text-sm font-medium text-text-primary hover:text-text-secondary transition-colors disabled:opacity-50"
        >
          {t('common.cancel')}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={isLoading}
          className="px-4 py-2 text-sm font-medium bg-overdue text-white rounded-lg hover:bg-overdue/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? t('common.deleting') : t('category.delete')}
        </button>
      </div>
    </div>
  );
}
