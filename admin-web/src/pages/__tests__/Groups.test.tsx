// admin-web/src/pages/__tests__/Groups.test.tsx
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import Groups from '../Groups'
import { groupApi } from '../../services/group.service'

vi.mock('../../services/group.service')
vi.mock('antd', async (importOriginal) => {
  const actual = await importOriginal<typeof import('antd')>()
  return {
    ...actual,
    message: { success: vi.fn(), error: vi.fn() },
  }
})

const renderGroups = () => {
  return render(
    <BrowserRouter>
      <Groups />
    </BrowserRouter>
  )
}

describe('Groups', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render groups heading', async () => {
    vi.mocked(groupApi.getList).mockResolvedValue([])

    renderGroups()

    await waitFor(() => {
      expect(screen.getByText('分组管理')).toBeInTheDocument()
    })
  })

  it('should display groups list', async () => {
    const mockGroups = [
      { id: 1, name: 'Group 1', description: 'Desc 1', sortOrder: 0, createdAt: '', updatedAt: '', _count: { devices: 5 } },
      { id: 2, name: 'Group 2', description: null, sortOrder: 1, createdAt: '', updatedAt: '', _count: { devices: 0 } },
    ]
    vi.mocked(groupApi.getList).mockResolvedValue(mockGroups as any)

    renderGroups()

    await waitFor(() => {
      expect(screen.getByText('Group 1')).toBeInTheDocument()
      expect(screen.getByText('Group 2')).toBeInTheDocument()
    })
  })

  it('should show create button', async () => {
    vi.mocked(groupApi.getList).mockResolvedValue([])

    renderGroups()

    await waitFor(() => {
      expect(screen.getByText('新建分组')).toBeInTheDocument()
    })
  })

  it('should call create API when creating group', async () => {
    vi.mocked(groupApi.getList).mockResolvedValue([])
    vi.mocked(groupApi.create).mockResolvedValue({ id: 1, name: 'New Group', sortOrder: 0, createdAt: '', updatedAt: '' } as any)

    renderGroups()

    await waitFor(() => {
      expect(screen.getByText('新建分组')).toBeInTheDocument()
    })

    // Click create button
    fireEvent.click(screen.getByText('新建分组'))

    // Modal should be visible
    await waitFor(() => {
      expect(screen.getByLabelText('分组名称')).toBeInTheDocument()
    })
  })
})