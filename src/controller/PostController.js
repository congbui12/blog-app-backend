import postService from "../service/postService.js";
import logger from "../lib/logger.js";
import FavoritePost from "../model/FavoritePost.js";

class PostController {
    constructor() { }

    async list(req, res, next) {
        const query = req.query;
        try {
            const { message, posts, meta } = await postService.list(null, query);
            return res.status(200).json({
                ok: true,
                message,
                payload: posts,
                meta
            })
        } catch (error) {
            logger.error("Failed to fetch posts", {
                error: error.stack
            })
            return next(error);
        }
    }

    async create(req, res, next) {
        const userId = req.user._id;
        const body = req.body;
        try {
            const payload = await postService.create(userId, body);

            return res.status(201).json({
                ok: true,
                message: "Post created successfully",
                payload
            })
        } catch (error) {
            logger.error("Failed to create new post", {
                error: error.stack
            });
            return next(error);
        }
    }

    async view(req, res, next) {
        const { slug } = req.params;
        let isFavorited = false;

        try {
            const { post, ...rest } = await postService.view(slug);
            // Check if user is logged in
            if (req.isAuthenticated()) {
                const favoritePost = await FavoritePost.findOne({
                    user: req.user._id,
                    post: post._id
                });

                if (favoritePost) {
                    isFavorited = true;
                }
            }
            post.isFavorited = isFavorited;

            return res.status(200).json({
                ok: true,
                message: "Fetch post data successfully",
                payload: post,
            })
        } catch (error) {
            logger.error("Failed to fetch post data", {
                error: error.stack
            });
            return next(error);
        }
    }

    async update(req, res, next) {
        const body = req.body;
        const userId = req.user._id;
        const { slug } = req.params;

        try {
            const payload = await postService.update(slug, userId, body);
            return res.status(200).json({
                ok: true,
                message: "Post data updated successfully",
                payload
            })
        } catch (error) {
            logger.error("Failed to update post data", {
                error: error.stack
            });
            return next(error);
        }
    }

    async delete(req, res, next) {
        const { slug } = req.params;
        const userId = req.user._id;
        try {
            await postService.delete(slug, userId);
            return res.status(204).json({
                ok: true,
                message: "Post deleted successfully"
            })
        } catch (error) {
            logger.error("Failed to delete post", {
                error: error.stack
            });
            return next(error);
        }
    }

    async add_to_favorites(req, res, next) {
        const { slug } = req.params;
        const userId = req.user._id;

        try {
            const payload = await postService.add_to_favorites(slug, userId);
            return res.status(200).json({
                ok: true,
                message: "Post added to favorites",
                payload
            });
        } catch (error) {
            logger.error("Failed to add post to favorites", {
                error: error.stack
            });
            return next(error);
        }
    }

    async remove_from_favorites(req, res, next) {
        const { slug } = req.params;
        const userId = req.user._id;

        try {
            await postService.remove_from_favorites(slug, userId);
            return res.status(204).json({
                ok: true,
                message: "Post removed from favorites"
            })
        } catch (error) {
            logger.error("Failed to remove post from favorites", {
                error: error.stack
            });
            return next(error);
        }

    }
}

export default PostController;
