import { Router } from 'express';
import authRouter from '../modules/auth/auth-route.js';
import userRouter from '../modules/user/user-route.js';
import postRouter from '../modules/post/post-route.js';
import commentRouter from '../modules/comment/comment-route.js';

const router = Router();

router.use('/auth', authRouter);
router.use('/users', userRouter);
router.use('/posts', postRouter);
router.use('/comments', commentRouter);

export default router;
