import { TODO_STATUS } from '../../../constants/todo';
import { useTranslation } from 'react-i18next';

export function TodoItem({ todo, onSelect }) {
  const { t } = useTranslation();
  const { title, description, status, dueDate, category, isOverdue } = todo;
  const isDone = status === TODO_STATUS.DONE;

  return (
    <button
      type="button"
      onClick={() => onSelect?.(todo)}
      className="w-full text-left bg-white rounded-xl border border-border-gray p-4 hover:border-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1"
    >
      <div className="flex items-start gap-3">
        <span
          className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-full border-2 ${
            isDone
              ? 'bg-primary border-primary'
              : 'border-text-muted'
          }`}
          aria-hidden="true"
        />
        <div className="flex-1 min-w-0">
          <p
            className={`text-sm font-medium ${
              isDone ? 'line-through text-text-secondary' : 'text-text-primary'
            }`}
          >
            {title}
          </p>
          {description && (
            <p className="mt-0.5 text-xs text-text-secondary truncate">{description}</p>
          )}
          <div className="mt-2 flex flex-wrap gap-1.5 items-center">
            <span className="text-xs px-2 py-0.5 rounded-full bg-primary-light text-primary">
              {category ? category.name : t('todo.noCategory')}
            </span>
            {dueDate && (
              <span className="text-xs text-text-secondary">{dueDate}</span>
            )}
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${
                isDone
                  ? 'bg-bg-gray text-text-secondary'
                  : 'bg-bg-gray text-text-primary'
              }`}
            >
              {isDone ? t('todo.done') : t('todo.inProgress')}
            </span>
            {isOverdue && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-overdue text-white">
                {t('todo.overdue')}
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}
