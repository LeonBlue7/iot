// admin-web/src/services/__tests__/group.service.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { groupApi } from '../group.service'

const mockAxios = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
}))

vi.mock('../../utils/axios', () => ({
  default: mockAxios,
}))

describe('groupApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getList', () => {
    it('should return group list', async () => {
      const mockGroups = [
        { id: 1, name: 'Group 1', _count: { devices: 5 } },
        { id: 2, name: 'Group 2', _count: { devices: 0 } },
      ]
      mockAxios.get.mockResolvedValue({ data: { success: true, data: mockGroups } })

      const result = await groupApi.getList()

      expect(mockAxios.get).toHaveBeenCalledWith('/api/groups')
      expect(result).toEqual(mockGroups)
    })

    it('should throw error on failed request', async () => {
      mockAxios.get.mockResolvedValue({ data: { success: false, error: 'Not found' } })

      await expect(groupApi.getList()).rejects.toThrow('Not found')
    })
  })

  describe('getById', () => {
    it('should return group details', async () => {
      const mockGroup = { id: 1, name: 'Test Group', devices: [] }
      mockAxios.get.mockResolvedValue({ data: { success: true, data: mockGroup } })

      const result = await groupApi.getById(1)

      expect(mockAxios.get).toHaveBeenCalledWith('/api/groups/1')
      expect(result).toEqual(mockGroup)
    })
  })

  describe('create', () => {
    it('should create group', async () => {
      const input = { name: 'New Group' }
      const mockCreated = { id: 1, ...input, sortOrder: 0 }
      mockAxios.post.mockResolvedValue({ data: { success: true, data: mockCreated } })

      const result = await groupApi.create(input)

      expect(mockAxios.post).toHaveBeenCalledWith('/api/groups', input)
      expect(result).toEqual(mockCreated)
    })
  })

  describe('update', () => {
    it('should update group', async () => {
      const mockUpdated = { id: 1, name: 'Updated' }
      mockAxios.put.mockResolvedValue({ data: { success: true, data: mockUpdated } })

      const result = await groupApi.update(1, { name: 'Updated' })

      expect(mockAxios.put).toHaveBeenCalledWith('/api/groups/1', { name: 'Updated' })
      expect(result).toEqual(mockUpdated)
    })
  })

  describe('delete', () => {
    it('should delete group', async () => {
      mockAxios.delete.mockResolvedValue({ data: { success: true } })

      await groupApi.delete(1)

      expect(mockAxios.delete).toHaveBeenCalledWith('/api/groups/1')
    })
  })

  describe('setDevices', () => {
    it('should assign devices to group', async () => {
      mockAxios.put.mockResolvedValue({ data: { success: true } })

      await groupApi.setDevices(1, ['dev1', 'dev2'])

      expect(mockAxios.put).toHaveBeenCalledWith('/api/groups/1/devices', {
        deviceIds: ['dev1', 'dev2'],
      })
    })
  })
})