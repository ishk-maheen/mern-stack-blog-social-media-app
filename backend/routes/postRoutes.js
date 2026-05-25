const express = require('express')
const router = express.Router()
const { protect } = require('../middlewares/authMiddleware')
const upload = require('../middlewares/uploadMiddleware')
const {
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
} = require('../controllers/postController')

// ── IMPORTANT: specific paths must come before /:id routes ───────────────────

// Manual trigger: publish any overdue scheduled posts (no auth — internal use only)
router.get('/publish-scheduled', publishScheduled)

// Scheduled posts (auth required)
router.get('/scheduled',          protect, getMyScheduledPosts)
router.post('/schedule',          protect, upload.single('media'), createScheduledPost)
router.put('/scheduled/:id',      protect, upload.single('media'), editScheduledPost)
router.delete('/scheduled/:id',   protect, deleteScheduledPost)

// Feed & create
router.get('/',    protect, getFeed)
router.post('/',   protect, upload.single('media'), createPost)

// Post interactions
router.put('/:id/like',     protect, likeUnlikePost)
router.post('/:id/comment', protect, addComment)
router.put('/:id/view',     protect, viewPost)

// Comment edit / delete
router.put('/:postId/comment/:commentId',    protect, editComment)
router.delete('/:postId/comment/:commentId', protect, deleteComment)

// Edit / Delete published post
router.put('/:id',    protect, upload.single('media'), editPost)
router.delete('/:id', protect, deletePost)

module.exports = router
