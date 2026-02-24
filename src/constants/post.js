export const POST_STATUSES = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
};

export const POST_SORT_OPTIONS = {
  NEWEST: 'newest',
  OLDEST: 'oldest',
  MOST_LIKED: 'most-liked',
};

export const POST_SORT_MAP = {
  [POST_SORT_OPTIONS.NEWEST]: { createdAt: -1 },
  [POST_SORT_OPTIONS.OLDEST]: { createdAt: 1 },
  [POST_SORT_OPTIONS.MOST_LIKED]: { likeCount: -1 },
};

export const DEFAULT_POST_SORT = POST_SORT_OPTIONS.NEWEST;

export const MEILI_SORT_MAP = {
  [POST_SORT_OPTIONS.NEWEST]: 'createdAt:desc',
  [POST_SORT_OPTIONS.OLDEST]: 'createdAt:asc',
  [POST_SORT_OPTIONS.MOST_LIKED]: 'likeCount:desc',
};
