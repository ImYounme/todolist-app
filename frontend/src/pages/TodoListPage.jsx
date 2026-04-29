import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../features/auth/store/auth-store';
import { useTodoStore } from '../features/todo/store/todo-store';
import { useCategoryStore } from '../features/category/store/category-store';
import { useTodos } from '../features/todo/hooks/use-todos';
import { useCategories } from '../features/category/hooks/use-categories';
import { TodoList } from '../features/todo/components/TodoList';
import { TodoCalendar } from '../features/todo/components/TodoCalendar';
import { TodoSummaryPanel } from '../features/todo/components/TodoSummaryPanel';
import { TodoCreateModal } from '../features/todo/components/TodoCreateModal';
import { TodoDetailModal } from '../features/todo/components/TodoDetailModal';
import { CategoryManageModal } from '../features/category/components/CategoryManageModal';
import { CategoryFilterBar } from '../features/todo/components/CategoryFilterBar';
import { TodoStatusTabs } from '../features/todo/components/TodoStatusTabs';
import { OverdueFilter } from '../features/todo/components/OverdueFilter';
import { Button } from '../components/ui/Button';
import { LanguageSelector } from '../components/LanguageSelector';
import { DarkModeToggle } from '../components/DarkModeToggle';
import { ROUTES } from '../constants/routes';

export default function TodoListPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [viewMode, setViewMode] = useState('list');
  const clearToken = useAuthStore((state) => state.clearToken);
  const { 
    isCreateModalOpen, 
    setIsCreateModalOpen, 
    selectedTodoId, 
    setSelectedTodoId,
    selectedCategoryId,
    selectedStatusTab,
    showUncategorized,
    showOverdue
  } = useTodoStore();
  const { isManageModalOpen, setIsManageModalOpen } = useCategoryStore();

  const filters = {
    status: selectedStatusTab !== 'all' ? selectedStatusTab : undefined,
    categoryId: selectedCategoryId,
    uncategorized: showUncategorized || undefined,
    overdue: showOverdue || undefined,
  };

  const { data: todos = [], isLoading, isError, refetch } = useTodos(filters);
  const { data: categories = [] } = useCategories();

  function handleLogout() {
    clearToken();
    navigate(ROUTES.LOGIN);
  }

  function handleSelectTodo(todo) {
    setSelectedTodoId(todo.id);
  }

  function handleCloseDetail() {
    setSelectedTodoId(null);
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-gray-950">
      <header className="bg-white dark:bg-gray-800 border-b border-slate-200 dark:border-gray-700 shadow-sm px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
        <Link
          to="/"
          className="text-lg sm:text-xl font-semibold text-text-primary dark:text-white hover:text-primary transition-colors"
        >
          {t('app.name')}
        </Link>
        <div className="flex gap-2 items-center flex-wrap justify-end">
          <LanguageSelector />
          <DarkModeToggle />
          <Button variant="secondary" size="sm" onClick={() => navigate(ROUTES.PROFILE)}>
            {t('nav.profile')}
          </Button>
          <Button variant="secondary" size="sm" onClick={handleLogout}>
            {t('nav.logout')}
          </Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div className="flex gap-2">
            <Button size="sm" onClick={() => setIsCreateModalOpen(true)}>
              + {t('todo.add')}
            </Button>
            <Button size="sm" onClick={() => setIsManageModalOpen(true)}>
              {t('nav.manageCategories')}
            </Button>
          </div>
          <div className="inline-flex w-fit items-center gap-1 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-full p-1 shadow-md shadow-slate-200/60 dark:shadow-black/20">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 text-xs rounded-full transition-colors ${
                viewMode === 'list'
                  ? 'bg-primary text-white'
                  : 'bg-bg-gray dark:bg-transparent text-text-secondary dark:text-gray-300 hover:text-primary dark:hover:text-white'
              }`}
            >
              {t('view.list')}
            </button>
            <button
              type="button"
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-1.5 text-xs rounded-full transition-colors ${
                viewMode === 'calendar'
                  ? 'bg-primary text-white'
                  : 'bg-bg-gray dark:bg-transparent text-text-secondary dark:text-gray-300 hover:text-primary dark:hover:text-white'
              }`}
            >
              {t('view.calendar')}
            </button>
          </div>
        </div>

        <div className="space-y-3 mb-6">
          <CategoryFilterBar categories={categories} />
          <div className="inline-flex max-w-full items-center gap-1 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-full p-1 shadow-md shadow-slate-200/60 dark:shadow-black/20 overflow-x-auto">
            <TodoStatusTabs />
            <OverdueFilter />
          </div>
        </div>

        <div className="flex items-start gap-6">
          <div className="min-w-0 flex-1">
            {viewMode === 'calendar' && !isLoading && !isError ? (
              <TodoCalendar todos={todos} onSelectTodo={handleSelectTodo} />
            ) : (
              <TodoList
                todos={todos}
                isLoading={isLoading}
                isError={isError}
                onRetry={refetch}
                onSelectTodo={handleSelectTodo}
                onAddTodo={() => setIsCreateModalOpen(true)}
                showEmptyFilterMessage={
                  selectedCategoryId || selectedStatusTab !== 'all' || showUncategorized || showOverdue
                }
              />
            )}
          </div>
          {!isLoading && !isError && (
            <TodoSummaryPanel
              todos={todos}
              onAddTodo={() => setIsCreateModalOpen(true)}
            />
          )}
        </div>
      </main>

      <TodoCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      <TodoDetailModal
        todoId={selectedTodoId}
        isOpen={!!selectedTodoId}
        onClose={handleCloseDetail}
      />

      <CategoryManageModal
        isOpen={isManageModalOpen}
        onClose={() => setIsManageModalOpen(false)}
      />
    </div>
  );
}
