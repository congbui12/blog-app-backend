import { Router } from "express";
import checkLogin from "../middleware/checkLogin.js";
import validateRequest from "../middleware/validateRequest.js";
import { commentLimiter } from "../middleware/rateLimit.js";
import commentValidator from "../validator/commentValidator.js";
import CommentController from "../controller/CommentController.js";

const commentRouter = Router();

const commentController = new CommentController();

commentRouter.get(
    "/:postSlug",
    commentController.list_comments_of_post.bind(commentController)
);

commentRouter.post(
    "/:postSlug",
    commentLimiter,
    checkLogin('add a new comment'),
    validateRequest(commentValidator.addCommentSchema),
    commentController.add.bind(commentController)
);

commentRouter.patch(
    "/:id",
    checkLogin('edit this comment'),
    validateRequest(commentValidator.editCommentSchema),
    commentController.edit.bind(commentController)
);

commentRouter.delete(
    "/:id",
    checkLogin('delete this comment'),
    commentController.remove.bind(commentController)
);

export default commentRouter;