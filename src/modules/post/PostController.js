import postService from './post-service.js';
import { StatusCodes } from 'http-status-codes';

class PostController {
  constructor() {}

  list = async (req, res, next) => {
    const userId = req?.user?._id;
    const query = req.query;
    try {
      const { posts, meta } = await postService.list(userId, query);
      const message = meta.postCount > 0 ? 'Posts fetched successfully' : 'No posts available';
      return res.status(StatusCodes.OK).json({
        ok: true,
        message,
        payload: posts,
        meta,
      });
    } catch (error) {
      return next(error);
    }
  };

  search = async (req, res, next) => {
    const userId = req?.user?._id;
    const query = req.query;
    try {
      const { posts, meta } = await postService.search(userId, query, req.searchClient);
      const message =
        meta.postCount > 0
          ? `About ${meta.postCount} results for ${query.term}`
          : `No results found for ${query.term}`;
      return res.status(StatusCodes.OK).json({
        ok: true,
        message,
        payload: posts,
        meta,
      });
    } catch (error) {
      return next(error);
    }
  };

  create = async (req, res, next) => {
    const userId = req.user._id;
    const { title, content, status } = req.body;
    try {
      const payload = await postService.add(userId, { title, content, status }, req.searchClient);

      return res.status(StatusCodes.CREATED).json({
        ok: true,
        message: 'Post created successfully',
        payload,
      });
    } catch (error) {
      return next(error);
    }
  };

  get = async (req, res, next) => {
    const currentUser = req.user;
    const { postId } = req.params;

    try {
      const payload = await postService.get(postId, currentUser);

      return res.status(StatusCodes.OK).json({
        ok: true,
        message: 'Post fetched successfully',
        payload,
      });
    } catch (error) {
      return next(error);
    }
  };

  update = async (req, res, next) => {
    const { title, content, status } = req.body;
    const currentUser = req.user;
    const { postId } = req.params;

    try {
      const payload = await postService.edit(
        postId,
        currentUser,
        {
          title,
          content,
          status,
        },
        req.searchClient
      );
      return res.status(StatusCodes.OK).json({
        ok: true,
        message: 'Post updated successfully',
        payload,
      });
    } catch (error) {
      return next(error);
    }
  };

  delete = async (req, res, next) => {
    const { postId } = req.params;
    const currentUser = req.user;
    try {
      await postService.remove(postId, currentUser, req.searchClient);
      return res.sendStatus(StatusCodes.NO_CONTENT);
    } catch (error) {
      return next(error);
    }
  };

  listFavorites = async (req, res, next) => {
    const userId = req.user._id;
    const query = req.query;

    try {
      const { posts, meta } = await postService.listFavorites(userId, query);
      const message =
        meta.favoriteCount > 0 ? 'Favorites fetched successfully' : 'No posts available';
      return res.status(StatusCodes.OK).json({
        ok: true,
        message,
        payload: posts,
        meta,
      });
    } catch (error) {
      return next(error);
    }
  };

  toggleFavorite = async (req, res, next) => {
    const { postId } = req.params;
    const currentUser = req.user;

    try {
      const payload = await postService.toggleFavorite(postId, currentUser, req.searchClient);
      const message = payload.isFavorited
        ? 'Post added to favorites'
        : 'Post removed from favorites';
      return res.status(StatusCodes.OK).json({
        ok: true,
        message,
        payload,
      });
    } catch (error) {
      return next(error);
    }
  };
}

export default PostController;
