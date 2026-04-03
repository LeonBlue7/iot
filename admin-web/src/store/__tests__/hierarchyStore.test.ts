// admin-web/src/store/__tests__/hierarchyStore.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { useHierarchyStore } from '../hierarchyStore'
import { act } from '@testing-library/react'

describe('HierarchyStore', () => {
  beforeEach(() => {
    // 重置store状态
    useHierarchyStore.setState({
      selectedNode: null,
      expandedKeys: [],
    })
  })

  describe('setSelection', () => {
    it('应该设置选中的节点', () => {
      const selection = { level: 'customer' as const, id: 1 }

      act(() => {
        useHierarchyStore.getState().setSelection(selection)
      })

      expect(useHierarchyStore.getState().selectedNode).toEqual(selection)
    })

    it('应该清除选中节点（传null）', () => {
      act(() => {
        useHierarchyStore.getState().setSelection({ level: 'customer', id: 1 })
      })

      act(() => {
        useHierarchyStore.getState().setSelection(null)
      })

      expect(useHierarchyStore.getState().selectedNode).toBeNull()
    })
  })

  describe('toggleExpand', () => {
    it('应该添加展开的key', () => {
      act(() => {
        useHierarchyStore.getState().toggleExpand('customer-1')
      })

      expect(useHierarchyStore.getState().expandedKeys).toContain('customer-1')
    })

    it('应该移除已展开的key', () => {
      act(() => {
        useHierarchyStore.getState().toggleExpand('customer-1')
      })

      act(() => {
        useHierarchyStore.getState().toggleExpand('customer-1')
      })

      expect(useHierarchyStore.getState().expandedKeys).not.toContain('customer-1')
    })

    it('应该支持多个展开的key', () => {
      act(() => {
        useHierarchyStore.getState().toggleExpand('customer-1')
        useHierarchyStore.getState().toggleExpand('zone-1')
      })

      expect(useHierarchyStore.getState().expandedKeys).toContain('customer-1')
      expect(useHierarchyStore.getState().expandedKeys).toContain('zone-1')
    })
  })

  describe('clearSelection', () => {
    it('应该清除选中节点和展开keys', () => {
      act(() => {
        useHierarchyStore.getState().setSelection({ level: 'customer', id: 1 })
        useHierarchyStore.getState().toggleExpand('customer-1')
      })

      act(() => {
        useHierarchyStore.getState().clearSelection()
      })

      expect(useHierarchyStore.getState().selectedNode).toBeNull()
      expect(useHierarchyStore.getState().expandedKeys).toHaveLength(0)
    })
  })
})