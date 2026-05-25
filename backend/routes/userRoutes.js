const express = require('express')
const router = express.Router()
const { protect } = require('../middlewares/authMiddleware')
const upload = require('../middlewares/uploadMiddleware')
const {
  getMyProfile,
  getUserProfile,
  getUserPosts,
  updateProfile,
  updateProfilePicture,
  updateBanner,
  deactivateAccount,
  deleteAccount,
} = require('../controllers/userController')

// ── IMPORTANT: static paths must come before /:username ─────────────────────

router.get('/me',                                        protect, getMyProfile)
router.put('/profile',                                   protect, updateProfile)
router.put('/profile-picture', protect, upload.single('profilePicture'), updateProfilePicture)
router.put('/banner',          protect, upload.single('banner'),         updateBanner)
router.put('/deactivate',      protect, deactivateAccount)
router.delete('/account',      protect, deleteAccount)

// ── Dynamic username routes ───────────────────────────────────────────────────
router.get('/:username',       protect, getUserProfile)
router.get('/:username/posts', protect, getUserPosts)

module.exports = router
