const User = require('../models/User')
const Post = require('../models/Post')
const Comment = require('../models/Comment')
const ScheduledPost = require('../models/ScheduledPost')

// @desc    Get dashboard stats — total users, posts, pending scheduled posts
// @route   GET /api/admin/stats
// @access  Admin only
const getStats = async (req, res) => {
  try {
    const [totalUsers, totalPosts, pendingScheduled] = await Promise.all([
      User.countDocuments({ isAdmin: false }),
      Post.countDocuments(),
      ScheduledPost.countDocuments({ published: false }),
    ])

    res.json({ totalUsers, totalPosts, pendingScheduled })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// @desc    Get paginated list of all registered (non-admin) users
// @route   GET /api/admin/users?page=1&limit=20&search=
// @access  Admin only
const getAllUsers = async (req, res) => {
  try {
    const page   = Math.max(parseInt(req.query.page)  || 1, 1)
    const limit  = Math.min(parseInt(req.query.limit) || 20, 100)
    const skip   = (page - 1) * limit
    const search = req.query.search?.trim() || ''

    const filter = { isAdmin: false }
    if (search) {
      filter.$or = [
        { name:     { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } },
        { email:    { $regex: search, $options: 'i' } },
      ]
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments(filter),
    ])

    res.json({
      users,
      page,
      totalPages: Math.ceil(total / limit),
      total,
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// @desc    Delete a user and all their content (posts, comments, scheduled posts)
// @route   DELETE /api/admin/users/:id
// @access  Admin only
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
    if (!user)          return res.status(404).json({ message: 'User not found' })
    if (user.isAdmin)   return res.status(400).json({ message: 'Cannot delete an admin account' })

    // Collect post IDs so we can wipe their comments too
    const userPosts = await Post.find({ author: user._id }).select('_id')
    const postIds   = userPosts.map((p) => p._id)

    await Promise.all([
      // Delete comments the user wrote AND comments on the user's posts
      Comment.deleteMany({ $or: [{ author: user._id }, { post: { $in: postIds } }] }),
      // Delete all published posts
      Post.deleteMany({ author: user._id }),
      // Delete all scheduled posts
      ScheduledPost.deleteMany({ author: user._id }),
      // Pull user's ID out of other posts' likes arrays
      Post.updateMany({ likes: user._id }, { $pull: { likes: user._id } }),
    ])

    await user.deleteOne()
    res.json({ message: `User @${user.username} and all their content have been deleted` })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

module.exports = { getStats, getAllUsers, deleteUser }
