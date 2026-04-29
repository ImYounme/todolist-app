import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { TODO_STATUS } from '../../../constants/todo';

function hasDueDate(todo) {
  return Boolean(todo.dueDate ?? todo.due_date);
}

export function TodoSummaryPanel({ todos = [] }) {
  const { t } = useTranslation();

  const summary = useMemo(() => {
    return todos.reduce(
      (acc, todo) => {
        acc.total += 1;
        if (todo.status === TODO_STATUS.DONE) acc.done += 1;
        if (todo.status === TODO_STATUS.IN_PROGRESS) acc.inProgress += 1;
        if (todo.isOverdue) acc.overdue += 1;
        if (!hasDueDate(todo)) acc.noDate += 1;
        return acc;
      },
      { total: 0, inProgress: 0, done: 0, overdue: 0, noDate: 0 }
    );
  }, [todos]);

  const doneRate = summary.total > 0 ? Math.round((summary.done / summary.total) * 100) : 0;
  const items = [
    { label: t('summary.total'), value: summary.total, className: 'text-text-primary dark:text-white' },
    { label: t('todo.inProgress'), value: summary.inProgress, className: 'text-primary' },
    { label: t('todo.done'), value: summary.done, className: 'text-text-secondary dark:text-gray-300' },
    { label: t('todo.overdue'), value: summary.overdue, className: 'text-overdue' },
    { label: t('summary.noDate'), value: summary.noDate, className: 'text-text-muted dark:text-gray-400' },
  ];

  return (
    <aside className="hidden xl:block w-64 flex-shrink-0">
      <div className="sticky top-6 space-y-3">
        <section className="rounded-lg border border-border-gray dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-text-primary dark:text-white mb-3">{t('summary.title')}</h2>
          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.label} className="flex items-center justify-between gap-3">
                <span className="text-xs text-text-secondary dark:text-gray-300">{item.label}</span>
                <span className={`text-sm font-semibold ${item.className}`}>{item.value}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-border-gray dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm">
          <div className="flex items-end justify-between gap-3 mb-2">
            <span className="text-xs text-text-secondary dark:text-gray-300">{t('summary.doneRate')}</span>
            <span className="text-2xl font-semibold text-text-primary dark:text-white">{doneRate}%</span>
          </div>
          <div className="h-2 rounded-full bg-bg-gray dark:bg-gray-700 overflow-hidden">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${doneRate}%` }} />
          </div>
        </section>
      </div>
    </aside>
  );
}
