import mongoose from 'mongoose';
import { POST_STATUSES } from '../../constants/post.js';
import { extractText } from '../../utils/helper/index.js';

const PostSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    textContent: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      required: true,
      enum: Object.values(POST_STATUSES),
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

// Hook for .create() and .save()
PostSchema.pre('save', function (next) {
  if (this.isModified('content')) {
    this.textContent = extractText(this.content?.root).replace(/\s+/g, ' ').trim();
  }
  next();
});

// Hook for .findOneAndUpdate(), .updateOne() and .updateMany()
PostSchema.pre(['findOneAndUpdate', 'updateOne', 'updateMany'], function (next) {
  const update = this.getUpdate();

  if (!update) {
    return next();
  }
  // Handle both { $set: { content: ... } } and direct { content: ... }
  const content = update.content ?? (update.$set && update.$set.content);

  if (content?.root) {
    const plainText = extractText(content.root).replace(/\s+/g, ' ').trim();

    if (!update.$set) {
      update.$set = {};
    }

    // Inject textContent into the update operation
    update.$set.textContent = plainText;
  }
  next();
});

export default mongoose.model('Post', PostSchema);
