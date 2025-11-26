import { Router } from "express";
import checkLogin from "../middleware/checkLogin.js";
import validateRequest from "../middleware/validateRequest.js";
import postValidator from "../validator/postValidator.js";
import PostController from "../controller/PostController.js";

const postRouter = Router();

const postController = new PostController();

postRouter.get(
    "/",
    postController.list.bind(postController)
);

postRouter.post(
    "/",
    checkLogin("create a post"),
    validateRequest(postValidator.createPostSchema),
    postController.create.bind(postController)
);

postRouter.get(
    "/:slug",
    postController.view.bind(postController)
);

postRouter.patch(
    "/:slug",
    checkLogin("edit this post"),
    validateRequest(postValidator.updatePostSchema),
    postController.update.bind(postController)
);

postRouter.delete(
    "/:slug",
    checkLogin("delete this post"),
    postController.delete.bind(postController)
);

postRouter.post(
    "/favorites/:slug",
    checkLogin('add this post to your favorites'),
    postController.add_to_favorites.bind(postController)
);

postRouter.delete(
    "/favorites/:slug",
    checkLogin("remove this post from your favorites"),
    postController.remove_from_favorites.bind(postController)
);

export default postRouter;