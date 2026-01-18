import { describe, it, expect } from 'vitest';
import {
  buildPaginationQuery,
  buildFilterPostQuery,
  buildSortQuery,
  buildLazyQuery,
} from '../../../src/utils/query-builder.js';
import { genObjectId } from '../../utils/unit-helper.js';
import { POST_STATUSES, POST_SORT_MAP, DEFAULT_SORT } from '../../../src/constants/post.js';

describe('Query Builder Unit Tests', () => {
  describe('buildPaginationQuery()', () => {
    it('should calculate skip correctly with default values', () => {
      const result = buildPaginationQuery({});
      expect(result).toEqual({ page: 1, limit: 5, skip: 0 });
    });

    it('should calculate skip correctly for page 2', () => {
      const result = buildPaginationQuery({ page: 2, limit: 10 });
      expect(result).toEqual({ page: 2, limit: 10, skip: 10 });
    });
  });

  describe('buildFilterPostQuery()', () => {
    const loggedInUserId = genObjectId();
    const otherUserId = genObjectId();

    describe('Unauthenticated (Guest) Access', () => {
      it('should default to PUBLISHED posts for a general feed', () => {
        const result = buildFilterPostQuery(null, {});

        expect(result).toEqual({ status: POST_STATUSES.PUBLISHED });
      });

      it('should allow viewing another users public posts', () => {
        const result = buildFilterPostQuery(null, { author: otherUserId });

        expect(result.$and).toContainEqual({ author: otherUserId });
        expect(result.$and).toContainEqual({ status: POST_STATUSES.PUBLISHED });
      });

      it('should nullify the query if a guest tries to filter by DRAFT status', () => {
        const result = buildFilterPostQuery(null, { status: POST_STATUSES.DRAFT });

        expect(result).toEqual({ status: null });
      });
    });

    describe('Authenticated Access', () => {
      it('should allow filtering by DRAFT when viewing own posts', () => {
        const result = buildFilterPostQuery(loggedInUserId, {
          author: loggedInUserId,
          status: POST_STATUSES.DRAFT,
        });

        expect(result.$and).toContainEqual({ author: loggedInUserId });
        expect(result.$and).toContainEqual({ status: POST_STATUSES.DRAFT });
      });

      it('should fallback to default status (undefined) when viewing own posts without specific status', () => {
        const result = buildFilterPostQuery(loggedInUserId, { author: loggedInUserId });

        expect(result).toEqual({ author: loggedInUserId });
      });

      it('should force PUBLISHED status when viewing general feed', () => {
        const result = buildFilterPostQuery(loggedInUserId, {});

        expect(result).toEqual({ status: POST_STATUSES.PUBLISHED });
      });

      it('should block an auth user from seeing DRAFTS of other people', () => {
        const result = buildFilterPostQuery(loggedInUserId, {
          author: otherUserId,
          status: POST_STATUSES.DRAFT,
        });

        expect(result.$and).toContainEqual({ author: otherUserId });
        expect(result.$and).toContainEqual({ status: null });
      });
    });

    describe('Search Functionality', () => {
      it('should handle search queries with regex', () => {
        const result = buildFilterPostQuery(null, { search: 'hello?' });

        expect(result.$and).toContainEqual({ status: POST_STATUSES.PUBLISHED });
        expect(result.$and).toContainEqual({
          $or: [
            { title: { $regex: 'hello\\?', $options: 'i' } },
            { content: { $regex: 'hello\\?', $options: 'i' } },
          ],
        });
      });

      it('should ignore empty search strings', () => {
        const result = buildFilterPostQuery(null, { search: '   ' });

        expect(result).toEqual({ status: POST_STATUSES.PUBLISHED });
      });
    });
  });

  describe('buildSortQuery()', () => {
    it('should return correct sort map for a valid key', () => {
      const result = buildSortQuery('like-count');
      expect(result).toEqual(POST_SORT_MAP['like-count']);
    });

    it('should return default sort for invalid key', () => {
      const result = buildSortQuery('invalid');
      expect(result).toEqual(POST_SORT_MAP[DEFAULT_SORT]);
    });
  });

  describe('buildLazyQuery()', () => {
    const mockId = genObjectId().toString();

    it('should return default limit and sort by _id desc for an empty query object', () => {
      const result = buildLazyQuery({});
      expect(result.limit).toEqual(3);
      expect(result.filter).toEqual({});
      expect(result.sort).toEqual({ _id: -1 });
    });

    it('should return empty filter and sort by _id desc when no cursor is provided', () => {
      const result = buildLazyQuery({ limit: 10, sortOrder: 'desc' });
      expect(result.filter).toEqual({});
      expect(result.sort).toEqual({ _id: -1 });
    });

    it('should use $lt for desc sort with cursor', () => {
      const result = buildLazyQuery({
        cursor: mockId,
        limit: 10,
        sortOrder: 'desc',
      });
      expect(typeof result.filter._id.$lt).toBe('string');
      expect(result.filter._id.$lt.toString()).toBe(mockId);
      expect(result.sort).toEqual({ _id: -1 });
    });

    it('should use $gt for asc sort with cursor', () => {
      const result = buildLazyQuery({
        cursor: mockId,
        limit: 10,
        sortOrder: 'asc',
      });
      expect(result.filter._id.$gt.toString()).toBe(mockId);
      expect(result.sort).toEqual({ _id: 1 });
    });
  });
});
