import { create } from 'zustand';

export const useTodoStore = create((set) => ({
  selectedCategoryId: null,
  selectedStatusTab: 'all',
  showUncategorized: false,
  showOverdue: false,
  isCreateModalOpen: false,
  selectedTodoId: null,
  setSelectedCategoryId: (id) => set({ selectedCategoryId: id, showUncategorized: false }),
  setSelectedStatusTab: (tab) => set({
    selectedStatusTab: tab,
    showOverdue: false,
  }),
  setShowUncategorized: (value) => set({ showUncategorized: value, selectedCategoryId: null }),
  setShowOverdue: (value) => set({ showOverdue: value }),
  setIsCreateModalOpen: (open) => set({ isCreateModalOpen: open }),
  setSelectedTodoId: (id) => set({ selectedTodoId: id }),
  resetFilters: () =>
    set({
      selectedCategoryId: null,
      selectedStatusTab: 'all',
      showUncategorized: false,
      showOverdue: false,
    }),
}));
