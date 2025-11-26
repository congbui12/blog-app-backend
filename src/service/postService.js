import Post from "../model/Post.js";
import Comment from "../model/Comment.js";
import { generateSlug } from "../lib/utils.js";
import AppError from "../lib/AppError.js";
import FavoritePost from "../model/FavoritePost.js";

class PostService {
    constructor() { }

    async list(userId, query) {
        const SORT_OPTIONS = {
            likeCount: { likeCount: -1 },
            createdAt: { createdAt: -1 },
        };
        let filter = {};
        const { sortedBy, page, limit, search } = query;
        if (userId) {
            filter.writer = userId;
        }
        if (search && search.trim()) {
            const escapedSearch = search.replace(/[.*+?^=!:${}()|\[\]\/\\]/g, "\\$&");
            const regex = new RegExp(escapedSearch, "i");
            filter.$or = [
                { title: regex },
                { content: regex }
            ];
        }
        const sortQuery = SORT_OPTIONS[sortedBy] || SORT_OPTIONS.createdAt;
        const currentPage = parseInt(page) || 1;
        const postsPerPage = parseInt(limit) || 5;
        const postSkip = (currentPage - 1) * postsPerPage;

        const [postCount, posts] = await Promise.all([
            Post.countDocuments(filter),
            Post.find(filter)
                .populate('writer', 'username')
                .sort(sortQuery)
                .skip(postSkip)
                .limit(postsPerPage)
                .lean(),
        ]);

        const message = postCount > 0 ? "Posts fetched successfully" : "No posts available";
        const totalPages = Math.ceil(postCount / postsPerPage);
        const hasMore = (currentPage * postsPerPage) < postCount;

        const meta = {
            postCount,
            totalPages,
            hasMore,
        }
        return {
            message,
            posts,
            meta
        }
    }

    async create(userId, body) {
        const { title, content } = body;
        const slug = generateSlug(title);
        const newPost = new Post({
            title: title,
            content: content,
            slug: slug,
            writer: userId
        });
        await newPost.save();
        return newPost;
    }

    async view(slug) {
        const post = await Post.findOne({ slug: slug }).populate("writer", "username").lean();
        if (!post) {
            throw new AppError("Post not found", 400, null);
        }
        const [commentCount, comments] = await Promise.all([
            Comment.countDocuments({ post: post._id }),
            Comment.find({ post: post._id }).populate("user", "username").sort({ createdAt: -1 }).lean()
        ]);
        return { post, commentCount, comments };
    }

    async update(slug, userId, body) {
        const { newTitle, newContent } = body;
        let isPostModified = false;
        const post = await Post.findOne({ slug: slug });
        if (!post) {
            throw new AppError("Post not found", 400, null);
        }
        if (userId.toString() !== post.writer.toString()) {
            throw new AppError("Access denied. You are not allowed to modify this post", 403, null);
        }

        if (newTitle && newTitle !== post.title) {
            post.title = newTitle;
            post.slug = generateSlug(newTitle);
            isPostModified = true;
        }
        if (newContent && newContent !== post.content) {
            post.content = newContent;
            isPostModified = true;
        }
        if (isPostModified) {
            await post.save();
        }
        return post;
    }

    async delete(slug, userId) {
        const post = await Post.findOne({ slug: slug });
        if (!post) {
            throw new AppError("Post not found", 400, null);
        }
        if (userId.toString() !== post.writer.toString()) {
            throw new AppError("Access denied. You are not allowed to delete this post", 403, null);
        }

        await Post.deleteOne({ _id: post._id });
    }

    async add_to_favorites(slug, userId) {
        const post = await Post.findOne({ slug: slug });
        if (!post) {
            throw new AppError("Post not found", 400, null);
        }
        const favoritePostExists = await FavoritePost.findOne({
            user: userId,
            post: post._id
        });
        if (favoritePostExists) {
            throw new AppError("This post is already in your favorites", 400, null);
        }

        const newFavoritePost = new FavoritePost({
            post: post._id,
            user: userId
        });
        await newFavoritePost.save();
        await Post.findByIdAndUpdate(post._id, { $inc: { likeCount: 1 } }, { timestamps: false });
        return newFavoritePost;
    }

    async remove_from_favorites(slug, userId) {
        const post = await Post.findOne({ slug: slug });
        if (!post) {
            throw new AppError("Post not found", 400, null);
        }
        const favoritePostExists = await FavoritePost.findOne({
            user: userId,
            post: post._id
        });
        if (!favoritePostExists) {
            throw new AppError("This post is no longer in your favorites", 400, null);
        }

        await FavoritePost.deleteOne({ _id: favoritePostExists._id });
        await Post.findByIdAndUpdate(post._id, { $inc: { likeCount: -1 } }, { timestamps: false });
    }
}

export default new PostService();