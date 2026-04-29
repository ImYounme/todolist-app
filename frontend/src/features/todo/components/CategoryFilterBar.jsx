import { useTodoStore } from '../../todo/store/todo-store';
import { useTranslation } from 'react-i18next';

export function CategoryFilterBar({ categories = [] }) {
  const { t } = useTranslation();
  const { 
    selectedCategoryId, 
    showUncategorized,
    setSelectedCategoryId, 
    setShowUncategorized 
  } = useTodoStore();

  const buttonClass = (isSelected) => `px-3 py-1.5 text-xs rounded-md whitespace-nowrap border transition-colors ${
    isSelected
      ? 'bg-primary-light dark:bg-gray-800 border-primary text-primary dark:text-white dark:border-primary shadow-sm'
      : 'bg-white dark:bg-transparent border-gray-300 dark:border-gray-700 text-text-secondary dark:text-gray-300 hover:border-primary dark:hover:border-gray-500 hover:text-primary dark:hover:text-white'
  }`;

  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      <button
        type="button"
        onClick={() => {
          setSelectedCategoryId(null);
          setShowUncategorized(false);
        }}
        className={buttonClass(selectedCategoryId === null && !showUncategorized)}
      >
        {t('filter.all')}
      </button>
      <button
        type="button"
        onClick={() => setShowUncategorized(true)}
        className={buttonClass(showUncategorized)}
      >
        {t('filter.uncategorized')}
      </button>
      {categories.map((cat) => (
        <button
          key={cat.id}
          type="button"
          onClick={() => setSelectedCategoryId(cat.id)}
          className={buttonClass(selectedCategoryId === cat.id)}
        >
          {cat.name}
        </button>
      ))}
    </div>
  );
}
