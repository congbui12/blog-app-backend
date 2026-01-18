import mongoose from 'mongoose';

const FavoritePostSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    post: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Post',
    },
  },
  { timestamps: true }
);

FavoritePostSchema.index({ user: 1, post: 1 }, { unique: true });

export default mongoose.model('FavoritePost', FavoritePostSchema);
