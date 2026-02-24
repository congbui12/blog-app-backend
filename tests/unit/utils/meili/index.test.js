import { vi, describe, beforeEach, it, expect } from 'vitest';
import { syncToMeili, updateInMeili, removeFromMeili } from '../../../../src/utils/meili/index.js';
import logger from '../../../../src/utils/logger/index.js';
import { createMockClient } from '../../../helpers/integration-helper.js';

vi.mock('../../../../src/utils/logger/index.js', () => ({
  default: {
    error: vi.fn(),
    info: vi.fn(),
  },
}));

describe('Meilisearch Utils Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('syncToMeili()', () => {
    it('should transform and send data to Meilisearch', async () => {
      const { mockClient, mockIndex, mockWaitForTask } = createMockClient();
      const mockDate = new Date('2026-01-01T00:00:00Z');
      const mockDoc = {
        _id: {
          toString: vi.fn().mockReturnValue('123'),
        },
        title: 'title',
        textContent: 'Hello world',
        status: 'published',
        likeCount: 10,
        author: {
          toString: vi.fn().mockReturnValue('456'),
        },
        createdAt: mockDate,
        updatedAt: mockDate,
      };

      await syncToMeili('posts', mockDoc, mockClient);

      expect(mockClient.index).toHaveBeenCalledWith('posts');
      expect(mockIndex.addDocuments).toHaveBeenCalledWith([
        {
          id: '123',
          title: 'title',
          textContent: 'Hello world',
          status: 'published',
          likeCount: 10,
          author: '456',
          createdAt: mockDate.getTime(),
          updatedAt: mockDate.getTime(),
        },
      ]);
      expect(mockWaitForTask).toBeCalledTimes(1);
      expect(logger.error).not.toHaveBeenCalled();
    });

    it('should return early if doc is missing', async () => {
      const { mockClient } = createMockClient();

      await syncToMeili('posts', null, mockClient);

      expect(mockClient.index).not.toHaveBeenCalled();
    });

    it('should return early if client is missing', async () => {
      const mockDoc = { _id: { toString: () => '123' } };

      await syncToMeili('posts', mockDoc, null);

      expect(logger.error).not.toHaveBeenCalled();
    });

    it('should log error if addDocuments throws', async () => {
      const error = new Error('Add failed');

      const { mockClient } = createMockClient({
        addImpl: vi.fn(() => {
          throw error;
        }),
      });

      const mockDoc = { _id: { toString: () => '123' } };

      await syncToMeili('posts', mockDoc, mockClient);

      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('updateInMeili()', () => {
    it('should call updateDocuments with string ID and updated data', async () => {
      const { mockClient, mockIndex, mockWaitForTask } = createMockClient();
      const mockId = { toString: () => '456' };

      await updateInMeili('posts', mockId, { likeCount: 1 }, mockClient);

      expect(mockClient.index).toHaveBeenCalledWith('posts');
      expect(mockIndex.updateDocuments).toHaveBeenCalledWith([{ id: '456', likeCount: 1 }]);
      expect(mockWaitForTask).toHaveBeenCalledTimes(1);
      expect(logger.error).not.toHaveBeenCalled();
    });

    it('should return early if updated data is missing', async () => {
      const { mockClient } = createMockClient();

      await updateInMeili('posts', { toString: () => '456' }, null, mockClient);

      expect(mockClient.index).not.toHaveBeenCalled();
    });

    it('should return early if id is missing', async () => {
      const { mockClient } = createMockClient();

      await updateInMeili('posts', null, { likeCount: 1 }, mockClient);

      expect(mockClient.index).not.toHaveBeenCalled();
    });

    it('should log error if updateDocuments throws', async () => {
      const error = new Error('Update failed');

      const { mockClient } = createMockClient({
        updateImpl: vi.fn(() => {
          throw error;
        }),
      });

      await updateInMeili('posts', { toString: () => '456' }, { likeCount: 1 }, mockClient);

      expect(logger.error).toHaveBeenCalledOnce();
    });
  });

  describe('removeFromMeili()', () => {
    it('should call deleteDocument with string ID', async () => {
      const { mockClient, mockIndex, mockWaitForTask } = createMockClient();
      const mockId = { toString: () => '789' };

      await removeFromMeili('posts', mockId, mockClient);

      expect(mockClient.index).toHaveBeenCalledWith('posts');
      expect(mockIndex.deleteDocument).toHaveBeenCalledWith('789');
      expect(mockWaitForTask).toHaveBeenCalledTimes(1);
      expect(logger.error).not.toHaveBeenCalled();
    });

    it('should return early if indexName is missing', async () => {
      const { mockClient } = createMockClient();

      await removeFromMeili(null, { toString: () => '789' }, mockClient);

      expect(mockClient.index).not.toHaveBeenCalled();
    });

    it('should return early if id is missing', async () => {
      const { mockClient } = createMockClient();

      await removeFromMeili('posts', null, mockClient);

      expect(mockClient.index).not.toHaveBeenCalled();
    });

    it('should log error if deleteDocument throws', async () => {
      const error = new Error('Delete failed');

      const { mockClient } = createMockClient({
        deleteImpl: vi.fn(() => {
          throw error;
        }),
      });

      await removeFromMeili('posts', { toString: () => '789' }, mockClient);

      expect(logger.error).toHaveBeenCalledOnce();
    });
  });
});
