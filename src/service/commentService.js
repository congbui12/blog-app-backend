import Post from "../model/Post.js";
import Comment from "../model/Comment.js";
import AppError from "../lib/AppError.js";

class CommentService {
    constructor() { }

    async create(postSlug, userId, body) {
        const { text } = body;
        const post = await Post.findOne({ slug: postSlug });
        if (!post) {
            throw new AppError("Post not found", 400, null);
        }
        const newComment = new Comment({
            text: text,
            post: post._id,
            user: userId
        });
        await newComment.save();
        const payload = await Comment.findById(newComment._id).populate("user", "username").populate("post", "title").lean();
        return payload;
    }

    async update(commentId, userId, body) {
        const { newText } = body;
        const comment = await Comment.findById(commentId);
        if (!comment) {
            throw new AppError("Comment not found", 400, null);
        }
        if (comment.user.toString() !== userId.toString()) {
            throw new AppError("Access denied. You are not allowed to modify this comment", 403, null);
        }
        if (newText && newText !== comment.text) {
            comment.text = newText;
            await comment.save();
        }
        const payload = await Comment.findById(comment._id).populate("user", "username").populate("post", "title").lean();
        return payload;
    }

    async delete(commentId, userId) {
        const comment = await Comment.findById(commentId);
        if (!comment) {
            throw new AppError("Comment not found", 400, null);
        }
        if (comment.user.toString() !== userId.toString()) {
            throw new AppError("Access denied. You are not allowed to delete this comment", 403, null);
        }

        await Comment.deleteOne({ _id: comment._id });
    }
}

export default new CommentService();