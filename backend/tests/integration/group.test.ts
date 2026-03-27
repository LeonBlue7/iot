// tests/integration/group.test.ts
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import groupRoutes from '../../src/routes/groupRoutes.js';
import { errorHandler } from '../../src/utils/response.js';

// Mock services - use jest.fn() directly in the mock callback
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

// Mock auth middleware
jest.mock('../../src/middleware/auth.js', () => ({
  authenticate: (req: any, _res: any, next: any) => {
    req.userId = 'test-user';
    next();
  },
}));

// Get mocked functions after mock is applied
import { groupService } from '../../src/services/index.js';
const mockFindAll = groupService.findAll as jest.Mock;
const mockFindById = groupService.findById as jest.Mock;
const mockCreate = groupService.create as jest.Mock;
const mockUpdate = groupService.update as jest.Mock;
const mockDelete = groupService.delete as jest.Mock;
const mockSetGroupDevices = groupService.setGroupDevices as jest.Mock;

const app = express();
app.use(express.json());
app.use('/api/groups', groupRoutes);
app.use(errorHandler);

describe('Group API Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/groups', () => {
    it('should return groups list', async () => {
      const mockGroups = [
        { id: 1, name: 'Group 1', description: null, sortOrder: 0, _count: { devices: 5 } },
        { id: 2, name: 'Group 2', description: 'Desc', sortOrder: 1, _count: { devices: 0 } },
      ];

      mockFindAll.mockResolvedValue(mockGroups);

      const response = await request(app).get('/api/groups');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0].name).toBe('Group 1');
    });
  });

  describe('GET /api/groups/:id', () => {
    it('should return group details', async () => {
      const mockGroup = {
        id: 1,
        name: 'Test Group',
        description: 'Test Description',
        sortOrder: 0,
        devices: [],
      };

      mockFindById.mockResolvedValue(mockGroup);

      const response = await request(app).get('/api/groups/1');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data.name).toBe('Test Group');
    });

    it('should return 404 for non-existent group', async () => {
      mockFindById.mockResolvedValue(null);

      const response = await request(app).get('/api/groups/999');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('POST /api/groups', () => {
    it('should create a new group', async () => {
      const mockCreated = {
        id: 1,
        name: 'New Group',
        description: 'New Description',
        sortOrder: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockCreate.mockResolvedValue(mockCreated);

      const response = await request(app)
        .post('/api/groups')
        .send({ name: 'New Group', description: 'New Description' });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data.name).toBe('New Group');
    });

    it('should reject invalid input', async () => {
      const response = await request(app)
        .post('/api/groups')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('PUT /api/groups/:id', () => {
    it('should update group', async () => {
      const mockUpdated = {
        id: 1,
        name: 'Updated Group',
        description: null,
        sortOrder: 0,
      };

      mockUpdate.mockResolvedValue(mockUpdated);

      const response = await request(app)
        .put('/api/groups/1')
        .send({ name: 'Updated Group' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data.name).toBe('Updated Group');
    });
  });

  describe('DELETE /api/groups/:id', () => {
    it('should delete group', async () => {
      mockDelete.mockResolvedValue(undefined);

      const response = await request(app).delete('/api/groups/1');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.message).toBe('Group deleted');
    });

    it('should return 400 when deleting group with devices', async () => {
      const { BadRequestError } = await import('../../src/utils/errors.js');
      mockDelete.mockRejectedValue(
        new BadRequestError('Cannot delete group with devices')
      );

      const response = await request(app).delete('/api/groups/1');

      expect(response.status).toBe(400);
    });
  });

  describe('PUT /api/groups/:id/devices', () => {
    it('should assign devices to group', async () => {
      const mockGroup = { id: 1, name: 'Test Group', devices: [] };
      mockFindById.mockResolvedValue(mockGroup);
      mockSetGroupDevices.mockResolvedValue(undefined);

      const response = await request(app)
        .put('/api/groups/1/devices')
        .send({ deviceIds: ['dev1', 'dev2'] });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
    });

    it('should return 404 for non-existent group', async () => {
      mockFindById.mockResolvedValue(null);

      const response = await request(app)
        .put('/api/groups/999/devices')
        .send({ deviceIds: ['dev1'] });

      expect(response.status).toBe(404);
    });

    it('should reject empty deviceIds', async () => {
      const mockGroup = { id: 1, name: 'Test Group', devices: [] };
      mockFindById.mockResolvedValue(mockGroup);

      const response = await request(app)
        .put('/api/groups/1/devices')
        .send({ deviceIds: [] });

      expect(response.status).toBe(400);
    });
  });
});