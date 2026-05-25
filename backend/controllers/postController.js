const Post = require('../models/Post')
const Comment = require('../models/Comment')
const ScheduledPost = require('../models/ScheduledPost')
const { uploadToCloudinary, deleteFromCloudinary } = require('../utils/cloudinary')
const publishDueScheduledPosts = require('../utils/publishScheduled')

const BLOG_CATEGORIES = ['educational', 'technology', 'programming', 'design', 'business', 'lifestyle', 'health', 'travel', 'food', 'others']
const CONTENT_TYPES   = ['post', 'blog', 'article']

// ── Shared helpers ────────────────────────────────────────────────────────────

// Extracts Cloudinary public_id from a Cloudinary URL
// e.g. https://res.cloudinary.com/<cloud>/image/upload/v123/blog-app/posts/abc.jpg
//      → blog-app/posts/abc
const extractPublicId = (url) => {
  try {
    const parts = url.split('/')
    const uploadIdx = parts.indexOf('upload')
    const pathParts = parts.slice(uploadIdx + 2) // skip version segment (v<timestamp>)
    const last = pathParts[pathParts.length - 1]
    pathParts[pathParts.length - 1] = last.split('.')[0] // strip extension
    return pathParts.join('/')
  } catch {
    return null
  }
}

// Detects resource type from Multer mimetype
const getResourceType = (mimetype) => (mimetype.startsWith('video/') ? 'video' : 'image')

// Standard population used across multiple queries
const feedPopulate = [
  { path: 'author', select: 'name username profilePicture' },
  { path: 'likes', select: 'name username profilePicture' },
  {
    path: 'comments',
    populate: { path: 'author', select: 'name username profilePicture' },
    options: { sort: { createdAt: 1 } },
  },
]

// ── Controllers ───────────────────────────────────────────────────────────────

// @desc    Create a post and publish it immediately
// @route   POST /api/posts
// @access  Protected
const createPost = async (req, res) => {
  try {
    await publishDueScheduledPosts().catch(() => {})

    const { title, description, contentType = 'post', category } = req.body

    if (!title?.trim() || !description?.trim()) {
      return res.status(400).json({ message: 'Title and description are required' })
    }
    if (!CONTENT_TYPES.includes(contentType)) {
      return res.status(400).json({ message: 'Invalid content type' })
    }
    if (contentType === 'blog') {
      if (!category || !BLOG_CATEGORIES.includes(category)) {
        return res.status(400).json({ message: 'A valid category is required for blogs' })
      }
    }

    let mediaUrl = ''
    let mediaType = 'none'

    if (req.file) {
      const resourceType = getResourceType(req.file.mimetype)
      const result = await uploadToCloudinary(req.file.buffer, resourceType, 'blog-app/posts')
      mediaUrl = result.secure_url
      mediaType = resourceType
    }

    const postData = {
      author: req.user._id,
      title: title.trim(),
      description: description.trim(),
      mediaUrl,
      mediaType,
      contentType,
    }
    if (contentType === 'blog') postData.category = category

    const post = await Post.create(postData)
    await post.populate(feedPopulate)
    res.status(201).json(post)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// @desc    Get all posts (newest first) with fallback scheduled-post publisher
// @route   GET /api/posts
// @access  Protected
const getFeed = async (req, res) => {
  try {
    // Fallback: auto-publish any due scheduled posts on every feed load
    await publishDueScheduledPosts()

    const page  = Math.max(parseInt(req.query.page)  || 1, 1)
    const limit = Math.min(parseInt(req.query.limit) || 10, 50)
    const skip  = (page - 1) * limit

    const filter = {}
    if (req.query.contentType && CONTENT_TYPES.includes(req.query.contentType)) {
      filter.contentType = req.query.contentType
    }
    if (req.query.category && filter.contentType === 'blog' && BLOG_CATEGORIES.includes(req.query.category)) {
      filter.category = req.query.category
    }

    const [posts, total] = await Promise.all([
      Post.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate(feedPopulate),
      Post.countDocuments(filter),
    ])

    res.json({
      posts,
      page,
      totalPages: Math.ceil(total / limit),
      total,
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// @desc    Toggle like / unlike on a post
// @route   PUT /api/posts/:id/like
// @access  Protected
const likeUnlikePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
    if (!post) return res.status(404).json({ message: 'Blog not found' })

    const userId = req.user._id.toString()
    const alreadyLiked = post.likes.some((id) => id.toString() === userId)

    if (alreadyLiked) {
      post.likes = post.likes.filter((id) => id.toString() !== userId)
    } else {
      post.likes.push(req.user._id)
    }

    await post.save()
    await post.populate('likes', 'name username profilePicture')

    res.json({ likes: post.likes, liked: !alreadyLiked })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// @desc    Add a comment to a post
// @route   POST /api/posts/:id/comment
// @access  Protected
const addComment = async (req, res) => {
  try {
    const { text } = req.body
    if (!text?.trim()) {
      return res.status(400).json({ message: 'Comment text is required' })
    }

    const post = await Post.findById(req.params.id)
    if (!post) return res.status(404).json({ message: 'Blog not found' })

    const comment = await Comment.create({
      post: post._id,
      author: req.user._id,
      text: text.trim(),
    })

    post.comments.push(comment._id)
    await post.save()

    await comment.populate('author', 'name username profilePicture')
    res.status(201).json(comment)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// @desc    Record a unique view for the logged-in user
// @route   PUT /api/posts/:id/view
// @access  Protected
const viewPost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
    if (!post) return res.status(404).json({ message: 'Blog not found' })

    const userId = req.user._id.toString()
    const alreadyViewed = post.viewedBy.some((id) => id.toString() === userId)

    if (!alreadyViewed) {
      post.viewedBy.push(req.user._id)
      await post.save()
    }

    res.json({ views: post.viewedBy.length })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// @desc    Schedule a post for future publishing
// @route   POST /api/posts/schedule
// @access  Protected
const createScheduledPost = async (req, res) => {
  try {
    const { title, description, publishAt, contentType = 'post', category } = req.body

    if (!title?.trim() || !description?.trim() || !publishAt) {
      return res.status(400).json({ message: 'Title, description, and publish time are required' })
    }
    if (!CONTENT_TYPES.includes(contentType)) {
      return res.status(400).json({ message: 'Invalid content type' })
    }
    if (contentType === 'blog') {
      if (!category || !BLOG_CATEGORIES.includes(category)) {
        return res.status(400).json({ message: 'A valid category is required for blogs' })
      }
    }

    const publishDate = new Date(publishAt)
    if (isNaN(publishDate.getTime())) {
      return res.status(400).json({ message: 'Invalid publish date' })
    }
    if (publishDate <= new Date()) {
      return res.status(400).json({ message: 'Scheduled time must be in the future' })
    }

    let mediaUrl = ''
    let mediaType = 'none'

    if (req.file) {
      const resourceType = getResourceType(req.file.mimetype)
      const result = await uploadToCloudinary(req.file.buffer, resourceType, 'blog-app/posts')
      mediaUrl = result.secure_url
      mediaType = resourceType
    }

    const spData = {
      author: req.user._id,
      title: title.trim(),
      description: description.trim(),
      mediaUrl,
      mediaType,
      publishAt: publishDate,
      contentType,
    }
    if (contentType === 'blog') spData.category = category

    const scheduledPost = await ScheduledPost.create(spData)
    await scheduledPost.populate('author', 'name username profilePicture')
    res.status(201).json(scheduledPost)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// @desc    Get the logged-in user's unpublished scheduled posts
// @route   GET /api/posts/scheduled
// @access  Protected
const getMyScheduledPosts = async (req, res) => {
  try {
    const scheduledPosts = await ScheduledPost.find({
      author: req.user._id,
      published: false,
    })
      .sort({ publishAt: 1 })
      .populate('author', 'name username profilePicture')

    res.json(scheduledPosts)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// @desc    Cancel (delete) a scheduled post before it publishes
// @route   DELETE /api/posts/scheduled/:id
// @access  Protected
const deleteScheduledPost = async (req, res) => {
  try {
    const sp = await ScheduledPost.findById(req.params.id)
    if (!sp) return res.status(404).json({ message: 'Scheduled blog not found' })

    if (sp.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' })
    }

    if (sp.mediaUrl) {
      const publicId = extractPublicId(sp.mediaUrl)
      if (publicId) {
        await deleteFromCloudinary(publicId, sp.mediaType === 'video' ? 'video' : 'image').catch(() => {})
      }
    }

    await sp.deleteOne()
    res.json({ message: 'Scheduled blog cancelled' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// @desc    Delete a published post (author only)
// @route   DELETE /api/posts/:id
// @access  Protected
const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
    if (!post) return res.status(404).json({ message: 'Blog not found' })

    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this blog' })
    }

    if (post.mediaUrl) {
      const publicId = extractPublicId(post.mediaUrl)
      if (publicId) {
        await deleteFromCloudinary(publicId, post.mediaType === 'video' ? 'video' : 'image').catch(() => {})
      }
    }

    await Comment.deleteMany({ post: post._id })
    await post.deleteOne()

    res.json({ message: 'Blog deleted' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// @desc    Edit a published post (owner only)
// @route   PUT /api/posts/:id
// @access  Protected
const editPost = async (req, res) => {
  try {
    await publishDueScheduledPosts().catch(() => {})

    const post = await Post.findById(req.params.id)
    if (!post) return res.status(404).json({ message: 'Blog not found' })

    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to edit this blog' })
    }

    const { title, description, removeMedia, contentType, category } = req.body

    if (title !== undefined) {
      if (!title.trim()) return res.status(400).json({ message: 'Title cannot be empty' })
      post.title = title.trim()
    }
    if (description !== undefined) {
      if (!description.trim()) return res.status(400).json({ message: 'Description cannot be empty' })
      post.description = description.trim()
    }
    if (contentType !== undefined) {
      if (!CONTENT_TYPES.includes(contentType)) return res.status(400).json({ message: 'Invalid content type' })
      post.contentType = contentType
      if (contentType === 'blog') {
        if (!category || !BLOG_CATEGORIES.includes(category)) {
          return res.status(400).json({ message: 'A valid category is required for blogs' })
        }
        post.category = category
      } else {
        post.category = null
      }
    }

    if (req.file) {
      // Replace media: delete old, upload new
      if (post.mediaUrl) {
        const publicId = extractPublicId(post.mediaUrl)
        if (publicId) await deleteFromCloudinary(publicId, post.mediaType === 'video' ? 'video' : 'image').catch(() => {})
      }
      const resourceType = getResourceType(req.file.mimetype)
      const result = await uploadToCloudinary(req.file.buffer, resourceType, 'blog-app/posts')
      post.mediaUrl  = result.secure_url
      post.mediaType = resourceType
    } else if (removeMedia === 'true') {
      if (post.mediaUrl) {
        const publicId = extractPublicId(post.mediaUrl)
        if (publicId) await deleteFromCloudinary(publicId, post.mediaType === 'video' ? 'video' : 'image').catch(() => {})
      }
      post.mediaUrl  = ''
      post.mediaType = 'none'
    }

    post.isEdited = true
    post.editedAt = new Date()
    await post.save()
    await post.populate(feedPopulate)
    res.json(post)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// @desc    Edit a scheduled post before it publishes (owner only)
// @route   PUT /api/posts/scheduled/:id
// @access  Protected
const editScheduledPost = async (req, res) => {
  try {
    const sp = await ScheduledPost.findById(req.params.id)
    if (!sp) return res.status(404).json({ message: 'Scheduled blog not found' })

    if (sp.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to edit this blog' })
    }

    if (sp.published) {
      return res.status(400).json({ message: 'Cannot edit a blog that has already been published' })
    }

    const { title, description, publishAt, removeMedia, contentType, category } = req.body

    if (title !== undefined) {
      if (!title.trim()) return res.status(400).json({ message: 'Title cannot be empty' })
      sp.title = title.trim()
    }
    if (description !== undefined) {
      if (!description.trim()) return res.status(400).json({ message: 'Description cannot be empty' })
      sp.description = description.trim()
    }
    if (publishAt) {
      const publishDate = new Date(publishAt)
      if (isNaN(publishDate.getTime())) return res.status(400).json({ message: 'Invalid publish date' })
      if (publishDate <= new Date()) return res.status(400).json({ message: 'Scheduled time must be in the future' })
      sp.publishAt = publishDate
    }
    if (contentType !== undefined) {
      if (!CONTENT_TYPES.includes(contentType)) return res.status(400).json({ message: 'Invalid content type' })
      sp.contentType = contentType
      if (contentType === 'blog') {
        if (!category || !BLOG_CATEGORIES.includes(category)) {
          return res.status(400).json({ message: 'A valid category is required for blogs' })
        }
        sp.category = category
      } else {
        sp.category = null
      }
    }

    if (req.file) {
      if (sp.mediaUrl) {
        const publicId = extractPublicId(sp.mediaUrl)
        if (publicId) await deleteFromCloudinary(publicId, sp.mediaType === 'video' ? 'video' : 'image').catch(() => {})
      }
      const resourceType = getResourceType(req.file.mimetype)
      const result = await uploadToCloudinary(req.file.buffer, resourceType, 'blog-app/posts')
      sp.mediaUrl  = result.secure_url
      sp.mediaType = resourceType
    } else if (removeMedia === 'true') {
      if (sp.mediaUrl) {
        const publicId = extractPublicId(sp.mediaUrl)
        if (publicId) await deleteFromCloudinary(publicId, sp.mediaType === 'video' ? 'video' : 'image').catch(() => {})
      }
      sp.mediaUrl  = ''
      sp.mediaType = 'none'
    }

    await sp.save()
    await sp.populate('author', 'name username profilePicture')
    res.json(sp)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// @desc    Manual trigger — publish all due scheduled posts
// @route   GET /api/posts/publish-scheduled
// @access  Public
const publishScheduled = async (req, res) => {
  try {
    const count = await publishDueScheduledPosts()
    res.json({ message: `${count} scheduled blog(s) published` })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// @desc    Edit a comment (owner only)
// @route   PUT /api/posts/:postId/comment/:commentId
// @access  Protected
const editComment = async (req, res) => {
  try {
    const { text } = req.body
    if (!text?.trim()) {
      return res.status(400).json({ message: 'Comment text is required' })
    }

    const comment = await Comment.findById(req.params.commentId)
    if (!comment) return res.status(404).json({ message: 'Comment not found' })

    if (comment.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to edit this comment' })
    }

    comment.text     = text.trim()
    comment.isEdited = true
    comment.editedAt = new Date()
    await comment.save()
    await comment.populate('author', 'name username profilePicture')
    res.json(comment)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// @desc    Delete a comment (owner only)
// @route   DELETE /api/posts/:postId/comment/:commentId
// @access  Protected
const deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.commentId)
    if (!comment) return res.status(404).json({ message: 'Comment not found' })

    if (comment.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this comment' })
    }

    await Post.findByIdAndUpdate(req.params.postId, {
      $pull: { comments: comment._id },
    })

    await comment.deleteOne()
    res.json({ message: 'Comment deleted' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

module.exports = {
  createPost,
  getFeed,
  likeUnlikePost,
  addComment,
  editComment,
  deleteComment,
  viewPost,
  createScheduledPost,
  getMyScheduledPosts,
  deleteScheduledPost,
  editPost,
  editScheduledPost,
  deletePost,
  publishScheduled,
}
