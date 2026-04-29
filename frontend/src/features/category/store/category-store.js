import { create } from 'zustand';

export const useCategoryStore = create((set) => ({
  isManageModalOpen: false,
  editingCategory: null,
  setIsManageModalOpen: (open) => set({ isManageModalOpen: open }),
  setEditingCategory: (category) => set({ editingCategory: category }),
  closeModal: () => set({ isManageModalOpen: false, editingCategory: null }),
}));
