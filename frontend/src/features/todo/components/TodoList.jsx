import { Spinner } from '../../../components/ui/Spinner';
import { ErrorBanner } from '../../../components/ErrorBanner';
import { TodoItem } from './TodoItem';
import { useTranslation } from 'react-i18next';

export function TodoList({
  todos,
  isLoading,
  isError,
  onRetry,
  onSelectTodo,
  onAddTodo,
  showEmptyFilterMessage = false,
}) {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (isError) {
    return <ErrorBanner onRetry={onRetry} />;
  }

  if (!todos || todos.length === 0) {
    if (showEmptyFilterMessage) {
      return (
        <div className="flex flex-col items-center gap-2 py-12 text-center">
          <p className="text-sm text-text-secondary dark:text-gray-300">{t('todo.noResults')}</p>
          <button
            type="button"
            onClick={onAddTodo}
            className="mt-3 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-white shadow-md shadow-blue-200/70 transition-colors hover:bg-primary-hover dark:bg-white dark:text-primary dark:shadow-black/30 dark:hover:bg-slate-100"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-white dark:bg-slate-200 dark:text-primary">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </span>
            {t('todo.addHint')}
          </button>
        </div>
      );
    }
    
    return (
      <div className="flex flex-col items-center gap-2 py-12 text-center">
        <p className="text-sm text-text-secondary dark:text-gray-300">{t('todo.empty')}</p>
        <p className="text-xs text-text-muted dark:text-gray-400">{t('todo.emptyHint')}</p>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-2" role="list">
      {todos.map((todo) => (
        <li key={todo.id}>
          <TodoItem todo={todo} onSelect={onSelectTodo} />
        </li>
      ))}
    </ul>
  );
}
