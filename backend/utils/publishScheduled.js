const Post = require('../models/Post')
const ScheduledPost = require('../models/ScheduledPost')

// Finds every ScheduledPost whose publishAt has passed and promotes it to a
// live Post. Safe to call on any request — returns the number published.
const publishDueScheduledPosts = async () => {
  const due = await ScheduledPost.find({
    publishAt: { $lte: new Date() },
    published: false,
  })

  if (due.length === 0) return 0

  await Post.insertMany(
    due.map((sp) => ({
      author:      sp.author,
      title:       sp.title,
      description: sp.description,
      mediaUrl:    sp.mediaUrl,
      mediaType:   sp.mediaType,
      contentType: sp.contentType || 'post',
      ...(sp.contentType === 'blog' && sp.category ? { category: sp.category } : {}),
    }))
  )

  await ScheduledPost.updateMany(
    { _id: { $in: due.map((sp) => sp._id) } },
    { published: true }
  )

  return due.length
}

module.exports = publishDueScheduledPosts
