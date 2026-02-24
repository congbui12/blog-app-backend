export const POST_ITEM_SELECT = {
  _id: 1,
  title: 1,
  status: 1,
  likeCount: 1,
  author: 1,
  createdAt: 1,
  updatedAt: 1,
};

export const POST_DATA_SELECT = {
  ...POST_ITEM_SELECT,
  content: 1,
  textContent: 1,
};

export const POST_AUTHOR_POPULATE = {
  path: 'author',
  select: 'username',
};
