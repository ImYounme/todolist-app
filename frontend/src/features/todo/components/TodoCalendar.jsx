import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TODO_STATUS } from '../../../constants/todo';

function parseDate(value) {
  if (!value) return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  const [year, month, day] = String(value).split('-').map(Number);
  if (year && month && day) {
    return new Date(year, month - 1, day);
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

function getTodoDueDate(todo) {
  return todo.dueDate ?? todo.due_date ?? null;
}

function isSameMonth(left, right) {
  return left.getFullYear() === right.getFullYear() && left.getMonth() === right.getMonth();
}

function getFirstDueDate(todos) {
  const dates = todos
    .map((todo) => parseDate(getTodoDueDate(todo)))
    .filter(Boolean)
    .sort((a, b) => a.getTime() - b.getTime());

  return dates[0] ?? null;
}

function toDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function buildCalendarDays(currentMonth) {
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1);
  const start = new Date(year, month, 1 - firstDay.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return {
      date,
      key: toDateKey(date),
      isCurrentMonth: date.getMonth() === month,
      isToday: toDateKey(date) === toDateKey(new Date()),
    };
  });
}

export function TodoCalendar({ todos = [], onSelectTodo }) {
  const { t, i18n } = useTranslation();
  const [lastTodoSignature, setLastTodoSignature] = useState('');
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);
  const [pickerYear, setPickerYear] = useState(() => new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const monthLabel = new Intl.DateTimeFormat(i18n.resolvedLanguage || i18n.language, {
    year: 'numeric',
    month: 'long',
  }).format(currentMonth);

  const weekdayLabels = useMemo(() => {
    const base = new Date(2026, 3, 26);
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(base);
      date.setDate(base.getDate() + index);
      return new Intl.DateTimeFormat(i18n.resolvedLanguage || i18n.language, {
        weekday: 'short',
      }).format(date);
    });
  }, [i18n.language, i18n.resolvedLanguage]);

  const monthOptions = useMemo(() => {
    return Array.from({ length: 12 }, (_, month) => ({
      value: month,
      label: new Intl.DateTimeFormat(i18n.resolvedLanguage || i18n.language, {
        month: 'long',
      }).format(new Date(2026, month, 1)),
    }));
  }, [i18n.language, i18n.resolvedLanguage]);

  const todosByDate = useMemo(() => {
    return todos.reduce((acc, todo) => {
      const dueDate = parseDate(getTodoDueDate(todo));
      if (!dueDate) return acc;
      const dateKey = toDateKey(dueDate);
      acc[dateKey] = acc[dateKey] || [];
      acc[dateKey].push(todo);
      return acc;
    }, {});
  }, [todos]);

  const undatedTodos = useMemo(() => todos.filter((todo) => !parseDate(getTodoDueDate(todo))), [todos]);
  const calendarDays = useMemo(() => buildCalendarDays(currentMonth), [currentMonth]);
  const todoSignature = useMemo(() => {
    return todos
      .map((todo) => `${todo.id}:${getTodoDueDate(todo) ?? ''}:${todo.status}:${todo.isOverdue ? '1' : '0'}`)
      .join('|');
  }, [todos]);

  useEffect(() => {
    if (todoSignature === lastTodoSignature) return;
    setLastTodoSignature(todoSignature);
    const firstDueDate = getFirstDueDate(todos);
    if (!firstDueDate) return;
    if (!isSameMonth(firstDueDate, currentMonth)) {
      setCurrentMonth(new Date(firstDueDate.getFullYear(), firstDueDate.getMonth(), 1));
      setPickerYear(firstDueDate.getFullYear());
    }
  }, [currentMonth, lastTodoSignature, todoSignature, todos]);

  function moveMonth(offset) {
    setCurrentMonth((prev) => {
      const next = new Date(prev.getFullYear(), prev.getMonth() + offset, 1);
      setPickerYear(next.getFullYear());
      return next;
    });
  }

  function moveToday() {
    const now = new Date();
    setCurrentMonth(new Date(now.getFullYear(), now.getMonth(), 1));
    setPickerYear(now.getFullYear());
    setIsMonthPickerOpen(false);
  }

  function selectMonth(month) {
    setCurrentMonth(new Date(pickerYear, month, 1));
    setIsMonthPickerOpen(false);
  }

  return (
    <div className="space-y-4">
      <section className="bg-white dark:bg-gray-800 border border-border-gray dark:border-gray-700 rounded-lg shadow-sm overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3 border-b border-border-gray dark:border-gray-700">
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setPickerYear(currentMonth.getFullYear());
                setIsMonthPickerOpen((open) => !open);
              }}
              className="rounded-md px-2 py-1 text-base font-semibold text-text-primary dark:text-white hover:bg-bg-gray dark:hover:bg-gray-700 transition-colors"
              aria-expanded={isMonthPickerOpen}
            >
              <span className="inline-flex items-center gap-2">
                {monthLabel}
                <svg className="h-4 w-4 text-text-secondary dark:text-gray-300" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M7 3v3M17 3v3M4 9h16M6 5h12a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </button>
            {isMonthPickerOpen && (
              <div className="absolute left-0 top-full z-20 mt-2 w-72 rounded-lg border border-border-gray dark:border-gray-700 bg-white dark:bg-gray-800 p-3 shadow-lg">
                <div className="mb-3 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setPickerYear((year) => year - 1)}
                    className="h-8 px-3 rounded-md border border-border-gray dark:border-gray-600 text-sm text-text-secondary dark:text-gray-300 hover:border-primary hover:text-primary dark:hover:text-white"
                  >
                    {t('calendar.prev')}
                  </button>
                  <span className="text-sm font-semibold text-text-primary dark:text-white">{pickerYear}</span>
                  <button
                    type="button"
                    onClick={() => setPickerYear((year) => year + 1)}
                    className="h-8 px-3 rounded-md border border-border-gray dark:border-gray-600 text-sm text-text-secondary dark:text-gray-300 hover:border-primary hover:text-primary dark:hover:text-white"
                  >
                    {t('calendar.next')}
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {monthOptions.map((month) => {
                    const isSelected = currentMonth.getFullYear() === pickerYear && currentMonth.getMonth() === month.value;
                    return (
                      <button
                        key={month.value}
                        type="button"
                        onClick={() => selectMonth(month.value)}
                        className={`rounded-md px-2 py-2 text-sm transition-colors ${
                          isSelected
                            ? 'bg-primary text-white'
                            : 'bg-bg-gray dark:bg-gray-700 text-text-secondary dark:text-gray-200 hover:text-primary dark:hover:text-white'
                        }`}
                      >
                        {month.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-1">
            <button
              type="button"
              onClick={() => moveMonth(-1)}
              className="h-8 px-3 rounded-md border border-border-gray dark:border-gray-600 text-sm text-text-secondary dark:text-gray-300 hover:border-primary hover:text-primary dark:hover:text-white"
            >
              {t('calendar.prev')}
            </button>
            <button
              type="button"
              onClick={moveToday}
              className="h-8 px-3 rounded-md border border-border-gray dark:border-gray-600 text-sm text-text-secondary dark:text-gray-300 hover:border-primary hover:text-primary dark:hover:text-white"
            >
              {t('calendar.today')}
            </button>
            <button
              type="button"
              onClick={() => moveMonth(1)}
              className="h-8 px-3 rounded-md border border-border-gray dark:border-gray-600 text-sm text-text-secondary dark:text-gray-300 hover:border-primary hover:text-primary dark:hover:text-white"
            >
              {t('calendar.next')}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 border-b border-border-gray dark:border-gray-700 bg-bg-gray dark:bg-gray-900">
          {weekdayLabels.map((label) => (
            <div key={label} className="px-2 py-2 text-center text-xs font-medium text-text-secondary dark:text-gray-300">
              {label}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {calendarDays.map((day) => {
            const dayTodos = todosByDate[day.key] || [];
            return (
              <div
                key={day.key}
                className={`min-h-24 sm:min-h-32 border-r border-b border-border-gray dark:border-gray-700 p-1.5 ${
                  day.isCurrentMonth ? 'bg-white dark:bg-gray-800' : 'bg-bg-gray dark:bg-gray-900'
                }`}
              >
                <div
                  className={`mb-1 inline-flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-xs ${
                    day.isToday
                      ? 'bg-primary text-white'
                      : day.isCurrentMonth
                        ? 'text-text-primary dark:text-white'
                        : 'text-text-muted dark:text-gray-500'
                  }`}
                >
                  {day.date.getDate()}
                </div>

                <div className="space-y-1">
                  {dayTodos.slice(0, 3).map((todo) => {
                    const isDone = todo.status === TODO_STATUS.DONE;
                    return (
                      <button
                        key={todo.id}
                        type="button"
                        onClick={() => onSelectTodo?.(todo)}
                        className={`block w-full truncate rounded px-1.5 py-1 text-left text-[11px] leading-tight transition-colors ${
                          todo.isOverdue
                            ? 'bg-red-50 dark:bg-red-950/40 text-overdue'
                            : isDone
                              ? 'bg-bg-gray dark:bg-gray-700 text-text-secondary dark:text-gray-300 line-through'
                              : 'bg-primary-light dark:bg-blue-950/40 text-primary dark:text-blue-200'
                        }`}
                      >
                        {todo.title}
                      </button>
                    );
                  })}
                  {dayTodos.length > 3 && (
                    <span className="block text-[11px] text-text-muted dark:text-gray-400">
                      +{dayTodos.length - 3}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {undatedTodos.length > 0 && (
        <section className="bg-white dark:bg-gray-800 border border-border-gray dark:border-gray-700 rounded-lg shadow-sm p-4">
          <h3 className="text-sm font-semibold text-text-primary dark:text-white mb-3">
            {t('calendar.noDueDate')}
          </h3>
          <div className="flex flex-col gap-2">
            {undatedTodos.map((todo) => {
              const isDone = todo.status === TODO_STATUS.DONE;
              return (
                <button
                  key={todo.id}
                  type="button"
                  onClick={() => onSelectTodo?.(todo)}
                  className={`w-full rounded-md border px-3 py-2 text-left text-sm transition-colors ${
                    isDone
                      ? 'border-border-gray dark:border-gray-700 bg-bg-gray dark:bg-gray-700 text-text-secondary dark:text-gray-300 line-through'
                      : 'border-border-gray dark:border-gray-700 bg-white dark:bg-gray-800 text-text-primary dark:text-white hover:border-primary'
                  }`}
                >
                  {todo.title}
                </button>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
