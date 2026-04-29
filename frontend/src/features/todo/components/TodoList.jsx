import { Spinner } from '../../../components/ui/Spinner';
import { ErrorBanner } from '../../../components/ErrorBanner';
import { TodoItem } from './TodoItem';
import { useTranslation } from 'react-i18next';

export function TodoList({ todos, isLoading, isError, onRetry, onSelectTodo, showEmptyFilterMessage = false }) {
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
          <p className="text-sm text-text-secondary">{t('todo.noResults')}</p>
        </div>
      );
    }
    
    return (
      <div className="flex flex-col items-center gap-2 py-12 text-center">
        <p className="text-sm text-text-secondary">{t('todo.empty')}</p>
        <p className="text-xs text-text-muted">{t('todo.emptyHint')}</p>
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
