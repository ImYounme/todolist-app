import { useTodoStore } from '../../todo/store/todo-store';
import { useTranslation } from 'react-i18next';

export function OverdueFilter() {
  const { t } = useTranslation();
  const { showOverdue, setShowOverdue, selectedStatusTab } = useTodoStore();

  const isDisabled = selectedStatusTab !== 'all' && selectedStatusTab !== 'in_progress';

  return (
    <button
      type="button"
      onClick={() => !isDisabled && setShowOverdue(!showOverdue)}
      disabled={isDisabled}
      aria-pressed={!isDisabled && showOverdue}
      className={`px-3 py-1.5 text-xs rounded-full whitespace-nowrap transition-colors ${
        isDisabled
          ? 'opacity-50 cursor-not-allowed bg-bg-gray dark:bg-transparent text-text-muted dark:text-gray-500'
          : showOverdue
            ? 'bg-overdue text-white'
            : 'bg-bg-gray dark:bg-transparent text-text-secondary dark:text-gray-300 hover:bg-red-50 dark:hover:bg-gray-700 hover:text-overdue dark:hover:text-white'
      }`}
    >
      {t('filter.overdue')}
    </button>
  );
}
