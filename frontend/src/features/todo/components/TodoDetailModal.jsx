import { useUpdateTodo, useDeleteTodo, useUpdateTodoStatus, useTodo } from '../hooks/use-todos';
import { useCategories } from '../../category/hooks/use-categories';
import { TodoForm } from './TodoForm';
import { TodoStatusControl } from './TodoStatusControl';
import { DeleteConfirmDialog } from '../../../components/DeleteConfirmDialog';
import { useState } from 'react';

export function TodoDetailModal({ todoId, isOpen, onClose }) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const { data: todo, isLoading: isFetching } = useTodo(todoId);
  const { mutate: updateTodo, isPending: isUpdating, error: updateError } = useUpdateTodo();
  const { mutate: deleteTodo, isPending: isDeleting, error: deleteError } = useDeleteTodo();
  const { mutate: updateStatus, isPending: isStatusChanging } = useUpdateTodoStatus();
  const { data: categories = [] } = useCategories();

  if (!isOpen) return null;

  const serverError = updateError?.response?.data?.message ?? deleteError?.response?.data?.message ?? null;
  const isLoading = isFetching || isUpdating || isDeleting || isStatusChanging;

  function handleStatusChange(newStatus) {
    updateStatus(
      { todoId, status: newStatus },
      { onSuccess: () => {} }
    );
  }

  function handleSubmit(formData) {
    updateTodo(
      { todoId, data: formData },
      { onSuccess: onClose }
    );
  }

  function handleDelete() {
    deleteTodo(todoId, { onSuccess: onClose });
  }

  if (isFetching) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden="true" />
        <div className="relative w-full max-w-md bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  if (!todo) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden="true" />
        <div className="relative w-full max-w-md bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-semibold text-text-primary">할일 상세</h2>
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
          <p className="text-text-secondary text-sm py-4">할일을 찾을 수 없습니다.</p>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-text-primary hover:text-text-secondary transition-colors"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden="true" />
        <div className="relative w-full max-w-md bg-white rounded-2xl shadow-lg p-6 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-semibold text-text-primary">할일 상세</h2>
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

          {showDeleteConfirm ? (
            <DeleteConfirmDialog
              title="할일을 삭제할까요?"
              message="삭제한 할일은 목록에서 제거됩니다."
              onConfirm={handleDelete}
              onCancel={() => setShowDeleteConfirm(false)}
              isLoading={isDeleting}
            />
          ) : (
            <>
              <TodoStatusControl
                status={todo.status}
                isOverdue={todo.isOverdue}
                completedAt={todo.completedAt}
                onStatusChange={handleStatusChange}
                isLoading={isStatusChanging}
              />
              
              <TodoForm
                initialData={todo}
                onSubmit={handleSubmit}
                onCancel={onClose}
                isLoading={isUpdating}
                serverError={serverError}
                categories={categories}
                isEditMode
              />

              <div className="mt-4 flex justify-start">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="text-sm text-overdue hover:text-overdue/80 transition-colors"
                  disabled={isLoading}
                >
                  삭제
                </button>
              </div>

              <div className="mt-2 text-xs text-text-muted">
                <p>생성일: {new Date(todo.createdAt).toLocaleDateString('ko-KR')}</p>
                {todo.completedAt && (
                  <p>완료일: {new Date(todo.completedAt).toLocaleDateString('ko-KR')}</p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}