const express = require('express')
const router = express.Router()
const { body } = require('express-validator')
const { signup, login, reactivateAccount } = require('../controllers/authController')
const upload = require('../middlewares/uploadMiddleware')

const signupValidators = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required'),
  body('username')
    .trim()
    .notEmpty().withMessage('Username is required')
    .isLength({ min: 3 }).withMessage('Username must be at least 3 characters')
    .matches(/^[a-zA-Z0-9_]+$/).withMessage('Username can only contain letters, numbers, and underscores'),
  body('email')
    .isEmail().withMessage('Valid email is required')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
]

const loginValidators = [
  body('email')
    .isEmail().withMessage('Valid email is required')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required'),
]

// upload.single('profilePicture') handles optional file — passes buffer via req.file
router.post('/signup', upload.single('profilePicture'), signupValidators, signup)
router.post('/login',      loginValidators, login)
router.post('/reactivate', loginValidators, reactivateAccount)

module.exports = router
