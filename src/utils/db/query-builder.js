import {
  POST_STATUSES,
  POST_SORT_MAP,
  DEFAULT_POST_SORT,
  MEILI_SORT_MAP,
} from '../../constants/post.js';
import mongoose from 'mongoose';

export const buildPaginationQuery = ({ page = 1, limit = 5 }) => {
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

export const buildFilterPostQuery = (currentUserId, { author, status }) => {
  const filters = [];

  const isLookingAtSelf = Boolean(
    currentUserId && author && currentUserId.toString() === author.toString()
  );

  if (author) {
    filters.push({ author });
  }

  let finalStatus;

  if (isLookingAtSelf) {
    // If looking at self, use requested status or show all (undefined)
    finalStatus = status;
  } else {
    // If viewing others or public feed, only show PUBLISHED posts
    if (!status || status === POST_STATUSES.PUBLISHED) {
      finalStatus = POST_STATUSES.PUBLISHED;
    } else {
      // Attempting to see DRAFTS of others, return nothing
      finalStatus = null;
    }
  }

  if (finalStatus !== undefined) {
    filters.push({ status: finalStatus });
  }

  if (filters.length === 0) return {};
  return filters.length === 1 ? filters[0] : { $and: filters };
};

export const buildSortQuery = (sortKey) => {
  return POST_SORT_MAP[sortKey] || POST_SORT_MAP[DEFAULT_POST_SORT];
};

export const buildLazyQuery = ({ cursor, limit = 3, sortOrder = 'desc' }) => {
  const operator = sortOrder === 'desc' ? '$lt' : '$gt';
  const isCursorValid = cursor && mongoose.Types.ObjectId.isValid(cursor);
  return {
    limit,
    filter: isCursorValid ? { _id: { [operator]: cursor } } : {},
    sort: { _id: sortOrder === 'desc' ? -1 : 1 },
  };
};

export const buildMeiliSort = (sortKey) => {
  return MEILI_SORT_MAP[sortKey] || MEILI_SORT_MAP[DEFAULT_POST_SORT];
};
