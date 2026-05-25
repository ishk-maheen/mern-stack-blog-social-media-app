const { validationResult } = require('express-validator')
const User = require('../models/User')
const generateToken = require('../utils/generateToken')
const { uploadToCloudinary } = require('../utils/cloudinary')
const publishDueScheduledPosts = require('../utils/publishScheduled')

// ── Helpers ───────────────────────────────────────────────────────────────────

const buildUserResponse = (user, overrides = {}) => ({
  _id: user._id,
  name: user.name,
  username: user.username,
  email: user.email,
  profilePicture: user.profilePicture,
  banner: user.banner,
  isAdmin: user.isAdmin,
  token: generateToken(user._id),
  ...overrides,
})

// ── Controllers ───────────────────────────────────────────────────────────────

// @desc    Register a new user
// @route   POST /api/auth/signup
// @access  Public
const signup = async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg })
    }

    const { name, username, email, password } = req.body

    // Prevent anyone from registering the reserved admin email
    if (email.toLowerCase().trim() === 'admin@gmail.com') {
      return res.status(400).json({ message: 'This email address cannot be used for signup' })
    }

    // Check uniqueness in parallel
    const [usernameExists, emailExists] = await Promise.all([
      User.findOne({ username: username.toLowerCase().trim() }),
      User.findOne({ email: email.toLowerCase().trim() }),
    ])

    if (usernameExists) {
      return res.status(400).json({ message: 'Username is already taken' })
    }
    if (emailExists) {
      return res.status(400).json({ message: 'Email is already registered' })
    }

    // Upload profile picture to Cloudinary if provided
    let profilePicture = ''
    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer, 'image', 'blog-app/profiles')
      profilePicture = result.secure_url
    }

    const user = await User.create({ name, username, email, password, profilePicture })

    res.status(201).json(buildUserResponse(user))
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// @desc    Login user or admin
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg })
    }

    const { email, password } = req.body

    // ── Admin hardcoded gate ────────────────────────────────────────────────
    if (email === 'admin@gmail.com' && password === 'admin@123') {
      // Auto-create admin user on first login so a real token ID exists
      let adminUser = await User.findOne({ email: 'admin@gmail.com' })
      if (!adminUser) {
        adminUser = await User.create({
          name: 'Admin',
          username: 'admin',
          email: 'admin@gmail.com',
          password: 'admin@123',
          isAdmin: true,
        })
      }
      return res.json(buildUserResponse(adminUser, { isAdmin: true }))
    }

    // ── Normal user login ───────────────────────────────────────────────────
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password')

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' })
    }

    if (user.isActive === false) {
      return res.status(403).json({
        message: 'Your account is deactivated.',
        code: 'ACCOUNT_DEACTIVATED',
      })
    }

    // Opportunistically publish any overdue scheduled posts on login
    await publishDueScheduledPosts().catch(() => {})

    res.json(buildUserResponse(user))
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// @desc    Reactivate a deactivated account using the owner's credentials
// @route   POST /api/auth/reactivate
// @access  Public
const reactivateAccount = async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' })
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password')

    // Use the same generic message for wrong credentials so we don't leak account existence
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' })
    }

    if (user.isActive !== false) {
      return res.status(400).json({ message: 'This account is already active. Please log in normally.' })
    }

    user.isActive = true
    await user.save()

    res.json(buildUserResponse(user))
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

module.exports = { signup, login, reactivateAccount }
