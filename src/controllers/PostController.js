import postService from '../services/post-service.js';
import { StatusCodes } from 'http-status-codes';

class PostController {
  constructor() {}

  list = async (req, res, next) => {
    const currentUser = req.user;
    const query = req.query;
    try {
      const { posts, meta } = await postService.list(currentUser?._id, query);
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

  create = async (req, res, next) => {
    const userId = req.user._id;
    const { title, content, status } = req.body;
    try {
      const payload = await postService.add(userId, { title, content, status });

      return res.status(StatusCodes.CREATED).json({
        ok: true,
        message: 'Post created successfully',
        payload,
      });
    } catch (error) {
      return next(error);
    }
  };

  getDetails = async (req, res, next) => {
    const currentUser = req.user;
    const { slug } = req.params;

    try {
      const payload = await postService.getDetails(slug, currentUser);

      return res.status(StatusCodes.OK).json({
        ok: true,
        message: 'Post data fetched successfully',
        payload,
      });
    } catch (error) {
      return next(error);
    }
  };

  update = async (req, res, next) => {
    const { title, content, status } = req.body;
    const currentUser = req.user;
    const { slug } = req.params;

    try {
      const payload = await postService.edit(slug, currentUser, {
        title,
        content,
        status,
      });
      return res.status(StatusCodes.OK).json({
        ok: true,
        message: 'Post data updated successfully',
        payload,
      });
    } catch (error) {
      return next(error);
    }
  };

  delete = async (req, res, next) => {
    const { slug } = req.params;
    const currentUser = req.user;
    try {
      await postService.remove(slug, currentUser);
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
    const { slug } = req.params;
    const currentUser = req.user;

    try {
      const { favorited } = await postService.toggleFavorite(slug, currentUser);
      const message = favorited ? 'Post added to favorites' : 'Post removed from favorites';
      return res.status(StatusCodes.OK).json({
        ok: true,
        message,
        payload: { favorited },
      });
    } catch (error) {
      return next(error);
    }
  };
}

export default PostController;
