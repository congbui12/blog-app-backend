export const POST_STATUSES = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
};

export const POST_SORT_OPTIONS = {
  LIKE_COUNT: 'like-count',
  LATEST: 'latest',
  OLDEST: 'oldest',
};

export const POST_SORT_MAP = {
  [POST_SORT_OPTIONS.LIKE_COUNT]: { likeCount: -1 },
  [POST_SORT_OPTIONS.LATEST]: { createdAt: -1 },
  [POST_SORT_OPTIONS.OLDEST]: { createdAt: 1 },
};

export const DEFAULT_SORT = POST_SORT_OPTIONS.LATEST;
