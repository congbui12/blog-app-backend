import mongoose from 'mongoose';
import { generateSlug } from '../../utils/helper.js';
import { POST_STATUSES } from '../../constants/post.js';

const PostSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    status: {
      type: String,
      required: true,
      enum: Object.values(POST_STATUSES),
      default: POST_STATUSES.DRAFT,
    },
    likeCount: {
      type: Number,
      default: 0,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
  },
  { timestamps: true }
);

PostSchema.pre('validate', function (next) {
  if (this.title && (this.isModified('title') || !this.slug)) {
    this.slug = generateSlug(this.title);
  }
  next();
});

export default mongoose.model('Post', PostSchema);
