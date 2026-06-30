import { create } from 'zustand'

interface AppState {
  selectedCategory: string
  setSelectedCategory: (category: string) => void
  selectedDays: number
  setSelectedDays: (days: number) => void
  sidebarCollapsed: boolean
  toggleSidebar: () => void
}

export const useAppStore = create<AppState>((set) => ({
  selectedCategory: '外三元',
  setSelectedCategory: (category) => set({ selectedCategory: category }),
  selectedDays: 30,
  setSelectedDays: (days) => set({ selectedDays: days }),
  sidebarCollapsed: false,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
}))
