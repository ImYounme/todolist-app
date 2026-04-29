import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { TODO_STATUS } from '../../../constants/todo';

function hasDueDate(todo) {
  return Boolean(todo.dueDate ?? todo.due_date);
}

export function TodoSummaryPanel({ todos = [], onAddTodo }) {
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
        <section className="rounded-lg border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-lg shadow-slate-200/70 dark:shadow-black/30">
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

        <section className="rounded-lg border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-lg shadow-slate-200/70 dark:shadow-black/30">
          <div className="flex items-end justify-between gap-3 mb-2">
            <span className="text-xs text-text-secondary dark:text-gray-300">{t('summary.doneRate')}</span>
            <span className="text-2xl font-semibold text-text-primary dark:text-white">{doneRate}%</span>
          </div>
          <div className="h-2 rounded-full bg-bg-gray dark:bg-gray-700 overflow-hidden">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${doneRate}%` }} />
          </div>
        </section>

        <button
          type="button"
          onClick={onAddTodo}
          className="group flex w-full items-center gap-3 rounded-lg border border-primary bg-primary px-4 py-4 text-left text-white shadow-lg shadow-blue-200/70 transition-colors hover:bg-primary-hover dark:border-white dark:bg-white dark:text-primary dark:shadow-black/30 dark:hover:bg-slate-100"
        >
          <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-white/20 text-white transition-colors group-hover:bg-white/25 dark:bg-slate-200 dark:text-primary dark:group-hover:bg-slate-300">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-semibold">{t('todo.add')}</span>
            <span className="mt-0.5 block text-xs text-white/80 dark:text-primary/70">{t('todo.create')}</span>
          </span>
        </button>
      </div>
    </aside>
  );
}
