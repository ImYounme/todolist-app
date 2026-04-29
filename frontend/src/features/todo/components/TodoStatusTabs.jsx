import { useTodoStore } from '../../todo/store/todo-store';
import { TODO_STATUS } from '../../../constants/todo';
import { useTranslation } from 'react-i18next';

export function TodoStatusTabs() {
  const { t } = useTranslation();
  const { selectedStatusTab, setSelectedStatusTab } = useTodoStore();
  const statusLabels = {
    all: t('filter.all'),
    [TODO_STATUS.IN_PROGRESS]: t('filter.inProgress'),
    [TODO_STATUS.DONE]: t('filter.done'),
  };

  return (
    <div className="flex gap-1">
      {Object.keys(statusLabels).map((tab) => (
        <button
          key={tab}
          type="button"
          onClick={() => setSelectedStatusTab(tab)}
          className={`px-3 py-1.5 text-xs rounded-full whitespace-nowrap transition-colors ${
            selectedStatusTab === tab
              ? 'bg-primary dark:bg-primary text-white shadow-sm'
              : 'bg-bg-gray dark:bg-transparent text-text-secondary dark:text-gray-300 hover:bg-primary-light dark:hover:bg-gray-700 hover:text-primary dark:hover:text-white'
          }`}
        >
          {statusLabels[tab]}
        </button>
      ))}
    </div>
  );
}
