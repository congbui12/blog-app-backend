import { vi, describe, beforeEach, it, expect } from 'vitest';
import { performPostSearch } from '../../../src/search/post-search.js';
import { createMockClient } from '../../helpers/integration-helper.js';

describe('Post Search Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call meili search with correct params', async () => {
    const { mockClient, mockIndex } = createMockClient();
    await performPostSearch(
      mockClient,
      { term: 'hello', sortedBy: 'most-liked' },
      { limit: 5, skip: 10 }
    );

    expect(mockClient.index).toHaveBeenCalledWith('posts');
    expect(mockIndex.search).toHaveBeenCalledWith('hello', {
      limit: 5,
      offset: 10,
      filter: `status = "published"`,
      sort: ['likeCount:desc'],
      attributesToHighlight: ['title'],
      highlightPreTag: '<mark>',
      highlightPostTag: '</mark>',
    });
  });

  it('should call meili search with default sort params when no sortedBy provided', async () => {
    const { mockClient, mockIndex } = createMockClient();
    await performPostSearch(mockClient, { term: 'hello' }, { limit: 5, skip: 10 });

    expect(mockClient.index).toHaveBeenCalledWith('posts');
    expect(mockIndex.search).toHaveBeenCalledWith('hello', {
      limit: 5,
      offset: 10,
      filter: `status = "published"`,
      sort: ['createdAt:desc'],
      attributesToHighlight: ['title'],
      highlightPreTag: '<mark>',
      highlightPostTag: '</mark>',
    });
  });

  it('should throw error if meili search is not initialized', () => {
    expect(() =>
      performPostSearch(null, { term: 'hello', sortedBy: 'most-liked' }, { limit: 5, skip: 10 })
    ).toThrow('Meilisearch not initialized');
  });
});
