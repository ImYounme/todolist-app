import { useState } from 'react';
import { MAX_TODO_TITLE_LENGTH } from '../../../constants/validation';

function validate(title) {
  if (!title || !title.trim()) return { title: '제목을 입력해주세요.' };
  if (title.length > MAX_TODO_TITLE_LENGTH) return { title: `제목은 ${MAX_TODO_TITLE_LENGTH}자 이하로 입력해주세요.` };
  return {};
}

export function TodoForm({ initialData, onSubmit, onCancel, isLoading, serverError, categories = [], isEditMode = false }) {
  const [title, setTitle] = useState(initialData?.title ?? '');
  const [description, setDescription] = useState(initialData?.description ?? '');
  const [dueDate, setDueDate] = useState(initialData?.dueDate ?? '');
  const [categoryId, setCategoryId] = useState(initialData?.category?.id?.toString() ?? '');
  const [fieldErrors, setFieldErrors] = useState({});

  function handleSubmit(e) {
    e.preventDefault();
    const errors = validate(title);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    onSubmit({
      title: title.trim(),
      description: description.trim() || null,
      dueDate: dueDate || null,
      categoryId: categoryId ? Number(categoryId) : null,
    });
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="mb-4">
        <label className="block text-sm font-medium text-text-primary mb-1" htmlFor="todo-title">
          제목 <span className="text-overdue">*</span>
        </label>
        <input
          id="todo-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="할일 제목을 입력하세요"
          disabled={isLoading}
          className="w-full px-3 py-2 border border-border-gray rounded-lg text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-primary disabled:opacity-50"
        />
        <div className="flex justify-between mt-1">
          {fieldErrors.title ? (
            <p role="alert" className="text-xs text-overdue">{fieldErrors.title}</p>
          ) : (
            <span />
          )}
          <span className="text-xs text-text-muted">{title.length} / {MAX_TODO_TITLE_LENGTH}</span>
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-text-primary mb-1" htmlFor="todo-description">
          설명
        </label>
        <textarea
          id="todo-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="상세 설명 입력 (선택)"
          rows={3}
          disabled={isLoading}
          className="w-full px-3 py-2 border border-border-gray rounded-lg text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-primary disabled:opacity-50 resize-none"
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-text-primary mb-1" htmlFor="todo-due-date">
          종료일
        </label>
        <input
          id="todo-due-date"
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          disabled={isLoading}
          className="w-full px-3 py-2 border border-border-gray rounded-lg text-sm text-text-primary focus:outline-none focus:border-primary disabled:opacity-50"
        />
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-text-primary mb-1" htmlFor="todo-category">
          카테고리
        </label>
        <select
          id="todo-category"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          disabled={isLoading}
          className="w-full px-3 py-2 border border-border-gray rounded-lg text-sm text-text-primary focus:outline-none focus:border-primary disabled:opacity-50 bg-white"
        >
          <option value="">미지정</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      {serverError && (
        <p role="alert" className="mb-4 text-sm text-overdue text-center">
          {serverError}
        </p>
      )}

      <div className="flex gap-2 justify-end">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="px-4 py-2 text-sm text-text-secondary border border-border-gray rounded-full hover:bg-bg-gray disabled:opacity-50 transition-colors"
        >
          취소
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 text-sm text-white bg-primary rounded-full hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? '저장 중...' : '저장'}
        </button>
      </div>
    </form>
  );
}
