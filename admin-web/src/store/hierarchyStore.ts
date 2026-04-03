// admin-web/src/store/hierarchyStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { HierarchySelection } from '../types/hierarchy'

interface HierarchyState {
  selectedNode: HierarchySelection | null
  expandedKeys: string[]
  setSelection: (selection: HierarchySelection | null) => void
  toggleExpand: (key: string) => void
  setExpandedKeys: (keys: string[]) => void
  clearSelection: () => void
}

export const useHierarchyStore = create<HierarchyState>()(
  persist(
    (set) => ({
      selectedNode: null,
      expandedKeys: [],

      setSelection: (selection) =>
        set(() => ({
          selectedNode: selection,
        })),

      toggleExpand: (key) =>
        set((state) => {
          const isExpanded = state.expandedKeys.includes(key)
          return {
            expandedKeys: isExpanded
              ? state.expandedKeys.filter((k) => k !== key)
              : [...state.expandedKeys, key],
          }
        }),

      setExpandedKeys: (keys) =>
        set(() => ({
          expandedKeys: keys,
        })),

      clearSelection: () =>
        set(() => ({
          selectedNode: null,
          expandedKeys: [],
        })),
    }),
    {
      name: 'hierarchy-storage',
      partialize: (state) => ({
        selectedNode: state.selectedNode,
        expandedKeys: state.expandedKeys,
      }),
    }
  )
)