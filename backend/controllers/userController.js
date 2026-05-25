const User = require('../models/User')
const Post = require('../models/Post')
const Comment = require('../models/Comment')
const ScheduledPost = require('../models/ScheduledPost')
const { uploadToCloudinary, deleteFromCloudinary } = require('../utils/cloudinary')

// ── Helpers ───────────────────────────────────────────────────────────────────

// Same URL parser as postController — extracts Cloudinary public_id from a URL
const extractPublicId = (url) => {
  try {
    const parts = url.split('/')
    const uploadIdx = parts.indexOf('upload')
    const pathParts = parts.slice(uploadIdx + 2) // skip version segment
    const last = pathParts[pathParts.length - 1]
    pathParts[pathParts.length - 1] = last.split('.')[0] // strip file extension
    return pathParts.join('/')
  } catch {
    return null
  }
}

// Consistent user payload shape returned to the client
const buildUserPayload = (user) => ({
  _id: user._id,
  name: user.name,
  username: user.username,
  email: user.email,
  profilePicture: user.profilePicture,
  banner: user.banner,
  isAdmin: user.isAdmin,
  createdAt: user.createdAt,
})

// Population config reused for user post queries
const postPopulate = [
  { path: 'author', select: 'name username profilePicture' },
  { path: 'likes', select: 'name username profilePicture' },
  {
    path: 'comments',
    populate: { path: 'author', select: 'name username profilePicture' },
    options: { sort: { createdAt: 1 } },
  },
]

// ── Controllers ───────────────────────────────────────────────────────────────

// @desc    Get the currently logged-in user's profile
// @route   GET /api/users/me
// @access  Protected
const getMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
    if (!user) return res.status(404).json({ message: 'User not found' })
    res.json(buildUserPayload(user))
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// @desc    Get any user's public profile by username
// @route   GET /api/users/:username
// @access  Protected
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username.toLowerCase().trim() })
    if (!user) return res.status(404).json({ message: 'User not found' })
    res.json(buildUserPayload(user))
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// @desc    Get all published posts by a specific user
// @route   GET /api/users/:username/posts
// @access  Protected
const getUserPosts = async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username.toLowerCase().trim() })
    if (!user) return res.status(404).json({ message: 'User not found' })

    const posts = await Post.find({ author: user._id })
      .sort({ createdAt: -1 })
      .populate(postPopulate)

    res.json(posts)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// @desc    Update profile name
// @route   PUT /api/users/profile
// @access  Protected
const updateProfile = async (req, res) => {
  try {
    const { name } = req.body
    if (!name?.trim()) {
      return res.status(400).json({ message: 'Name is required' })
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name: name.trim() },
      { new: true, runValidators: true }
    )

    res.json(buildUserPayload(user))
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// @desc    Update profile picture — old image deleted from Cloudinary automatically
// @route   PUT /api/users/profile-picture
// @access  Protected
const updateProfilePicture = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' })
    }

    const user = await User.findById(req.user._id)

    // Remove old profile picture from Cloudinary before uploading new one
    if (user.profilePicture) {
      const publicId = extractPublicId(user.profilePicture)
      if (publicId) await deleteFromCloudinary(publicId, 'image').catch(() => {})
    }

    const result = await uploadToCloudinary(req.file.buffer, 'image', 'blog-app/profiles')
    user.profilePicture = result.secure_url
    await user.save()

    // Because all posts populate author from the User document, the new picture
    // is already reflected everywhere — no post updates needed.
    res.json(buildUserPayload(user))
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// @desc    Update profile banner — old banner deleted from Cloudinary automatically
// @route   PUT /api/users/banner
// @access  Protected
const updateBanner = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' })
    }

    const user = await User.findById(req.user._id)

    // Remove old banner from Cloudinary before uploading new one
    if (user.banner) {
      const publicId = extractPublicId(user.banner)
      if (publicId) await deleteFromCloudinary(publicId, 'image').catch(() => {})
    }

    const result = await uploadToCloudinary(req.file.buffer, 'image', 'blog-app/banners')
    user.banner = result.secure_url
    await user.save()

    res.json(buildUserPayload(user))
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// @desc    Deactivate the logged-in user's account (prevents login until manually reactivated)
// @route   PUT /api/users/deactivate
// @access  Protected
const deactivateAccount = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { isActive: false })
    res.json({ message: 'Account deactivated' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// @desc    Permanently delete the logged-in user's account and all associated data
// @route   DELETE /api/users/account
// @access  Protected
const deleteAccount = async (req, res) => {
  try {
    const userId = req.user._id

    // Collect and delete Cloudinary media for all the user's posts
    const userPosts = await Post.find({ author: userId })
    for (const post of userPosts) {
      if (post.mediaUrl) {
        const publicId = extractPublicId(post.mediaUrl)
        if (publicId) {
          await deleteFromCloudinary(publicId, post.mediaType === 'video' ? 'video' : 'image').catch(() => {})
        }
      }
    }

    // Delete all comments on the user's posts
    const userPostIds = userPosts.map((p) => p._id)
    await Comment.deleteMany({ post: { $in: userPostIds } })

    // Delete all of the user's posts
    await Post.deleteMany({ author: userId })

    // Delete all scheduled posts by this user (with Cloudinary cleanup)
    const userScheduled = await ScheduledPost.find({ author: userId })
    for (const sp of userScheduled) {
      if (sp.mediaUrl) {
        const publicId = extractPublicId(sp.mediaUrl)
        if (publicId) {
          await deleteFromCloudinary(publicId, sp.mediaType === 'video' ? 'video' : 'image').catch(() => {})
        }
      }
    }
    await ScheduledPost.deleteMany({ author: userId })

    // Delete all comments the user left on other people's posts, and remove them from parent post arrays
    const otherComments = await Comment.find({ author: userId })
    for (const c of otherComments) {
      await Post.updateOne({ _id: c.post }, { $pull: { comments: c._id } })
    }
    await Comment.deleteMany({ author: userId })

    // Remove user from all likes and viewedBy arrays
    await Post.updateMany({ likes: userId },     { $pull: { likes:     userId } })
    await Post.updateMany({ viewedBy: userId },  { $pull: { viewedBy:  userId } })

    // Delete profile picture and banner from Cloudinary
    const user = await User.findById(userId)
    if (user) {
      if (user.profilePicture) {
        const publicId = extractPublicId(user.profilePicture)
        if (publicId) await deleteFromCloudinary(publicId, 'image').catch(() => {})
      }
      if (user.banner) {
        const publicId = extractPublicId(user.banner)
        if (publicId) await deleteFromCloudinary(publicId, 'image').catch(() => {})
      }
      await user.deleteOne()
    }

    res.json({ message: 'Account permanently deleted' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

module.exports = {
  getMyProfile,
  getUserProfile,
  getUserPosts,
  updateProfile,
  updateProfilePicture,
  updateBanner,
  deactivateAccount,
  deleteAccount,
}
