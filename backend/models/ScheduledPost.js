const mongoose = require('mongoose')

const scheduledPostSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },
    mediaUrl: {
      type: String,
      default: '',
    },
    mediaType: {
      type: String,
      enum: ['image', 'video', 'none'],
      default: 'none',
    },
    publishAt: {
      type: Date,
      required: [true, 'Scheduled publish time is required'],
    },
    contentType: {
      type: String,
      enum: ['post', 'blog', 'article'],
      default: 'post',
    },
    category: {
      type: String,
      enum: ['educational', 'technology', 'programming', 'design', 'business', 'lifestyle', 'health', 'travel', 'food', 'others'],
      default: null,
    },
    published: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
)

// Compound index so the cron query (unpublished + due) is fast
scheduledPostSchema.index({ publishAt: 1, published: 1 })

module.exports = mongoose.model('ScheduledPost', scheduledPostSchema)
