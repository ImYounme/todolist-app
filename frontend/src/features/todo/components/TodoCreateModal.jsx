import { useCreateTodo } from '../hooks/use-todos';
import { useCategories } from '../../category/hooks/use-categories';
import { TodoForm } from './TodoForm';

export function TodoCreateModal({ isOpen, onClose }) {
  const { mutate: createTodo, isPending, error } = useCreateTodo();
  const { data: categories = [] } = useCategories();

  if (!isOpen) return null;

  const serverError = error?.response?.data?.message ?? null;

  function handleSubmit(formData) {
    createTodo(formData, { onSuccess: onClose });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden="true" />
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-text-primary">새 할일 추가</h2>
          <button
            type="button"
            aria-label="닫기"
            onClick={onClose}
            className="text-text-muted hover:text-text-secondary transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <TodoForm
          onSubmit={handleSubmit}
          onCancel={onClose}
          isLoading={isPending}
          serverError={serverError}
          categories={categories}
        />
      </div>
    </div>
  );
}
