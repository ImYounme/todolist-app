import { TODO_STATUS } from '../../../constants/todo';
import { useTranslation } from 'react-i18next';

export function TodoStatusControl({ status, isOverdue, completedAt, onStatusChange, isLoading }) {
  const { t, i18n } = useTranslation();
  const isDone = status === TODO_STATUS.DONE;

  return (
    <div className="mb-4 p-4 bg-bg-gray rounded-xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-text-primary">{t('todo.status')}</span>
          {isOverdue && !isDone && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-overdue text-white">
              {t('todo.overdue')}
            </span>
          )}
        </div>
        {isDone ? (
          <button
            type="button"
            onClick={() => onStatusChange(TODO_STATUS.IN_PROGRESS)}
            disabled={isLoading}
            className="text-sm px-3 py-1.5 rounded-full bg-primary text-white hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t('todo.reopen')}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onStatusChange(TODO_STATUS.DONE)}
            disabled={isLoading}
            className="text-sm px-3 py-1.5 rounded-full bg-primary text-white hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t('todo.complete')}
          </button>
        )}
      </div>
      {completedAt && isDone && (
        <p className="mt-2 text-xs text-text-muted">
          {t('todo.completedAt')}: {new Date(completedAt).toLocaleDateString(i18n.resolvedLanguage || i18n.language)}
        </p>
      )}
    </div>
  );
}
