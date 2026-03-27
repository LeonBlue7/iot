// tests/controllers/group.test.ts
import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Mock the re-exported service module
jest.mock('../../src/services/index.js', () => ({
  groupService: {
    findAll: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    setGroupDevices: jest.fn(),
  },
}));

// Import after mock
import { groupService } from '../../src/services/index.js';

// Get mocked functions
const mockFindAll = groupService.findAll as jest.Mock;
const mockFindById = groupService.findById as jest.Mock;
const mockCreate = groupService.create as jest.Mock;
const mockUpdate = groupService.update as jest.Mock;
const mockDelete = groupService.delete as jest.Mock;
const mockSetGroupDevices = groupService.setGroupDevices as jest.Mock;

// Helper to wait for async handler to complete
function waitForAsync(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

describe('Group Controller', () => {
  let mockRequest: any;
  let mockResponse: any;
  let mockNext: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockRequest = {
      params: {},
      query: {},
      body: {},
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    mockNext = jest.fn();
  });

  describe('getGroups', () => {
    it('should return all groups with success response', async () => {
      const mockGroups = [
        { id: 1, name: 'Group 1', _count: { devices: 5 } },
        { id: 2, name: 'Group 2', _count: { devices: 0 } },
      ];

      mockFindAll.mockResolvedValue(mockGroups);

      // Import controller inline to get fresh module after mock
      const { getGroups } = require('../../src/controllers/groupController.js');
      getGroups(mockRequest, mockResponse, mockNext);
      await waitForAsync();

      expect(mockFindAll).toHaveBeenCalled();
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockGroups,
        })
      );
    });
  });

  describe('getGroupById', () => {
    it('should return group by id', async () => {
      const mockGroup = {
        id: 1,
        name: 'Test Group',
        description: 'Test Description',
        devices: [],
      };

      mockRequest.params.id = '1';
      mockFindById.mockResolvedValue(mockGroup);

      const { getGroupById } = require('../../src/controllers/groupController.js');
      getGroupById(mockRequest, mockResponse, mockNext);
      await waitForAsync();

      expect(mockFindById).toHaveBeenCalledWith(1);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockGroup,
        })
      );
    });

    it('should call next with NotFoundError for invalid id', async () => {
      mockRequest.params.id = 'invalid';

      const { getGroupById } = require('../../src/controllers/groupController.js');
      getGroupById(mockRequest, mockResponse, mockNext);
      await waitForAsync();

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('createGroup', () => {
    it('should create a new group', async () => {
      const mockCreated = {
        id: 1,
        name: 'New Group',
        description: 'Description',
        sortOrder: 0,
      };

      mockRequest.body = { name: 'New Group', description: 'Description' };
      mockCreate.mockResolvedValue(mockCreated);

      const { createGroup } = require('../../src/controllers/groupController.js');
      createGroup(mockRequest, mockResponse, mockNext);
      await waitForAsync();

      expect(mockCreate).toHaveBeenCalledWith({
        name: 'New Group',
        description: 'Description',
      });
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockCreated,
          message: 'Group created',
        })
      );
    });

    it('should call next with ZodError for invalid input', async () => {
      mockRequest.body = {}; // missing name

      const { createGroup } = require('../../src/controllers/groupController.js');
      createGroup(mockRequest, mockResponse, mockNext);
      await waitForAsync();

      expect(mockNext).toHaveBeenCalled();
      expect(mockNext.mock.calls[0][0].name).toBe('ZodError');
    });

    it('should call next with ZodError for name longer than 100 characters', async () => {
      mockRequest.body = { name: 'a'.repeat(101) };

      const { createGroup } = require('../../src/controllers/groupController.js');
      createGroup(mockRequest, mockResponse, mockNext);
      await waitForAsync();

      expect(mockNext).toHaveBeenCalled();
      expect(mockNext.mock.calls[0][0].name).toBe('ZodError');
    });
  });

  describe('updateGroup', () => {
    it('should update group', async () => {
      const mockUpdated = { id: 1, name: 'Updated Name' };

      mockRequest.params.id = '1';
      mockRequest.body = { name: 'Updated Name' };
      mockUpdate.mockResolvedValue(mockUpdated);

      const { updateGroup } = require('../../src/controllers/groupController.js');
      updateGroup(mockRequest, mockResponse, mockNext);
      await waitForAsync();

      expect(mockUpdate).toHaveBeenCalledWith(1, { name: 'Updated Name' });
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockUpdated,
          message: 'Group updated',
        })
      );
    });
  });

  describe('deleteGroup', () => {
    it('should delete group', async () => {
      mockRequest.params.id = '1';
      mockDelete.mockResolvedValue(undefined);

      const { deleteGroup } = require('../../src/controllers/groupController.js');
      deleteGroup(mockRequest, mockResponse, mockNext);
      await waitForAsync();

      expect(mockDelete).toHaveBeenCalledWith(1);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Group deleted',
        })
      );
    });
  });

  describe('setGroupDevices', () => {
    it('should assign devices to group', async () => {
      const mockGroup = { id: 1, name: 'Test Group', devices: [] };
      mockRequest.params.id = '1';
      mockRequest.body = { deviceIds: ['dev1', 'dev2'] };
      mockFindById.mockResolvedValue(mockGroup);
      mockSetGroupDevices.mockResolvedValue(undefined);

      const { setGroupDevices } = require('../../src/controllers/groupController.js');
      setGroupDevices(mockRequest, mockResponse, mockNext);
      await waitForAsync();

      expect(mockFindById).toHaveBeenCalledWith(1);
      expect(mockSetGroupDevices).toHaveBeenCalledWith(1, ['dev1', 'dev2']);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Devices assigned to group',
        })
      );
    });

    it('should call next with NotFoundError for invalid id', async () => {
      mockRequest.params.id = 'invalid';
      mockRequest.body = { deviceIds: ['dev1'] };

      const { setGroupDevices } = require('../../src/controllers/groupController.js');
      setGroupDevices(mockRequest, mockResponse, mockNext);
      await waitForAsync();

      expect(mockNext).toHaveBeenCalled();
    });

    it('should call next with NotFoundError for non-existent group', async () => {
      mockRequest.params.id = '999';
      mockRequest.body = { deviceIds: ['dev1'] };
      mockFindById.mockResolvedValue(null);

      const { setGroupDevices } = require('../../src/controllers/groupController.js');
      setGroupDevices(mockRequest, mockResponse, mockNext);
      await waitForAsync();

      expect(mockNext).toHaveBeenCalled();
    });

    it('should call next with ZodError for empty deviceIds', async () => {
      const mockGroup = { id: 1, name: 'Test Group', devices: [] };
      mockRequest.params.id = '1';
      mockRequest.body = { deviceIds: [] };
      mockFindById.mockResolvedValue(mockGroup);

      const { setGroupDevices } = require('../../src/controllers/groupController.js');
      setGroupDevices(mockRequest, mockResponse, mockNext);
      await waitForAsync();

      expect(mockNext).toHaveBeenCalled();
      expect(mockNext.mock.calls[0][0].name).toBe('ZodError');
    });

    it('should call next with ZodError for missing deviceIds', async () => {
      const mockGroup = { id: 1, name: 'Test Group', devices: [] };
      mockRequest.params.id = '1';
      mockRequest.body = {};
      mockFindById.mockResolvedValue(mockGroup);

      const { setGroupDevices } = require('../../src/controllers/groupController.js');
      setGroupDevices(mockRequest, mockResponse, mockNext);
      await waitForAsync();

      expect(mockNext).toHaveBeenCalled();
      expect(mockNext.mock.calls[0][0].name).toBe('ZodError');
    });
  });
});