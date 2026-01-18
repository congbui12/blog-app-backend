import mongoose from 'mongoose';
import { escapeRegex } from './helper.js';
import { POST_STATUSES, POST_SORT_MAP, DEFAULT_SORT } from '../constants/post.js';

export const buildPaginationQuery = ({ page = 1, limit = 5 }) => {
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

export const buildFilterPostQuery = (currentUserId, { search, author, status }) => {
  const filters = [];

  if (search?.trim()) {
    const escaped = escapeRegex(search);
    const regex = { $regex: escaped, $options: 'i' };

    filters.push({
      $or: [{ title: regex }, { content: regex }],
    });
  }

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
  return POST_SORT_MAP[sortKey] || POST_SORT_MAP[DEFAULT_SORT];
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
