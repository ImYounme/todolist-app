import { useState } from 'react';
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from '../hooks/use-categories';
import { DeleteConfirmDialog } from '../../../components/DeleteConfirmDialog';
import { MAX_CATEGORY_NAME_LENGTH } from '../../../constants/validation';

function validate(name) {
  if (!name || !name.trim()) return { name: '카테고리 이름을 입력해주세요.' };
  if (name.length > MAX_CATEGORY_NAME_LENGTH) return { name: `이름은 ${MAX_CATEGORY_NAME_LENGTH}자 이하로 입력해주세요.` };
  return {};
}

export function CategoryManageModal({ isOpen, onClose }) {
  const { data: categories = [], isLoading, error } = useCategories();
  const { mutate: createCategory, isPending: isCreating, error: createError } = useCreateCategory();
  const { mutate: updateCategory, isPending: isUpdating, error: updateError } = useUpdateCategory();
  const { mutate: deleteCategory, isPending: isDeleting, error: deleteError } = useDeleteCategory();
  
  const [newCategoryName, setNewCategoryName] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  
  const serverError = createError?.response?.data?.message ?? updateError?.response?.data?.message ?? deleteError?.response?.data?.message ?? null;
  const isLoadingMutations = isCreating || isUpdating || isDeleting;
  
  const isAtLimit = categories.length >= 20;

  if (!isOpen) return null;

  function handleCreate(e) {
    e.preventDefault();
    const errors = validate(newCategoryName);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    createCategory({ name: newCategoryName.trim() }, {
      onSuccess: () => setNewCategoryName(''),
    });
  }

  function handleEditStart(category) {
    setEditingId(category.id);
    setEditingName(category.name);
  }

  function handleEditCancel() {
    setEditingId(null);
    setEditingName('');
  }

  function handleEditSave(e) {
    e.preventDefault();
    const errors = validate(editingName);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    updateCategory(
      { categoryId: editingId, data: { name: editingName.trim() } },
      { onSuccess: () => setEditingId(null) }
    );
  }

  function handleDeleteStart(category) {
    setDeleteConfirm(category);
  }

  function handleDeleteCancel() {
    setDeleteConfirm(null);
  }

  function handleDeleteConfirm() {
    deleteCategory(deleteConfirm.id, {
      onSuccess: () => {
        setDeleteConfirm(null);
      },
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden="true" />
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-lg p-6 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-text-primary">카테고리 관리</h2>
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

        <p className="text-xs text-text-muted mb-3">
          카테고리 {categories.length} / 20
        </p>
        {isAtLimit && (
          <p className="text-xs text-overdue mb-3">
            카테고리는 최대 20개까지 생성할 수 있습니다.
          </p>
        )}

        <form onSubmit={handleCreate} className="mb-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="새 카테고리 이름"
                disabled={isCreating || isAtLimit}
                maxLength={MAX_CATEGORY_NAME_LENGTH}
                className="w-full px-3 py-2 border border-border-gray rounded-lg text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-primary disabled:opacity-50"
              />
              {(fieldErrors.name || serverError) && (
                <p className="mt-1 text-xs text-overdue">{fieldErrors.name || serverError}</p>
              )}
            </div>
            <button
              type="submit"
              disabled={isCreating || isAtLimit}
              className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              추가
            </button>
          </div>
          <p className="mt-1 text-xs text-text-muted text-right">
            {newCategoryName.length} / {MAX_CATEGORY_NAME_LENGTH}
          </p>
        </form>

        {isLoading && (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {error && (
          <div className="text-center py-8">
            <p className="text-sm text-overdue">카테고리를 불러오지 못했습니다.</p>
            <button
              type="button"
              onClick={onClose}
              className="mt-2 text-sm text-primary hover:underline"
            >
              닫기
            </button>
          </div>
        )}

        {!isLoading && !error && categories.length === 0 && (
          <p className="text-sm text-text-secondary text-center py-8">
            아직 카테고리가 없습니다.
          </p>
        )}

        {deleteConfirm ? (
          <DeleteConfirmDialog
            title="카테고리를 삭제할까요?"
            message="소속 Todo는 삭제되지 않고 미분류로 전환됩니다."
            onConfirm={handleDeleteConfirm}
            onCancel={handleDeleteCancel}
            isLoading={isDeleting}
          />
        ) : (
          <ul className="space-y-2">
            {categories.map((category) => (
              <li key={category.id}>
                {editingId === category.id ? (
<form onSubmit={handleEditSave} className="flex gap-2 items-center">
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        disabled={isUpdating}
                        maxLength={MAX_CATEGORY_NAME_LENGTH}
                        className="flex-1 px-3 py-2 border border-border-gray rounded-lg text-sm text-text-primary focus:outline-none focus:border-primary disabled:opacity-50"
                        autoFocus
                      />
                      {fieldErrors.name && (
                        <p className="mt-1 text-xs text-overdue">{fieldErrors.name}</p>
                      )}
                      <button
                        type="button"
                        onClick={handleEditCancel}
                        disabled={isUpdating}
                        className="px-2 py-2 text-sm text-text-secondary hover:text-text-primary"
                      >
                        취소
                      </button>
                      <button
                        type="submit"
                        disabled={isUpdating}
                        className="px-2 py-2 text-sm text-primary hover:text-primary/80"
                      >
                        저장
                      </button>
                    </form>
                ) : (
                  <div className="flex items-center justify-between px-3 py-2 bg-bg-gray rounded-lg">
                    <span className="text-sm text-text-primary">{category.name}</span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleEditStart(category)}
                        className="text-xs text-text-secondary hover:text-text-primary"
                      >
                        수정
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteStart(category)}
                        className="text-xs text-overdue hover:text-overdue/80"
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}