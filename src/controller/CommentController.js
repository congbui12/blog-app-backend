import postService from "../service/postService.js";
import commentService from "../service/commentService.js";
import logger from "../lib/logger.js";

class CommentController {
    constructor() { }

    async list_comments_of_post(req, res, next) {
        const { postSlug } = req.params;
        try {
            const { commentCount, comments, post } = await postService.view(postSlug);
            return res.status(200).json({
                ok: true,
                message: "Comments fetched successfully",
                payload: comments,
                meta: {
                    commentCount
                }
            });
        } catch (error) {
            logger.error("Failed to fetch comments of post", {
                error: error.stack
            });
            return next(error);
        }
    }

    async add(req, res, next) {
        const { postSlug } = req.params;
        const userId = req.user._id;
        const body = req.body;

        try {
            const payload = await commentService.create(postSlug, userId, body);
            return res.status(201).json({
                ok: true,
                message: "Comment added successfully",
                payload
            })
        } catch (error) {
            logger.error("Failed to add comment", {
                error: error.stack
            });
            return next(error);
        }
    }

    async edit(req, res, next) {
        const { id } = req.params;
        const userId = req.user._id;
        const body = req.body;

        try {
            const payload = await commentService.update(id, userId, body);
            return res.status(200).json({
                ok: true,
                message: "Comment updated successfully",
                payload
            })
        } catch (error) {
            logger.error("Failed to edit comment", {
                error: error.stack
            });
            return next(error);
        }
    }

    async remove(req, res, next) {
        const { id } = req.params;
        const userId = req.user._id;

        try {
            await commentService.delete(id, userId);
            return res.status(204).json({
                ok: true,
                message: "Comment removed successfully"
            });
        } catch (error) {
            logger.error("Failed to remove comment", {
                error: error.stack
            });
            return next(error);
        }
    }
}


export default CommentController;