const express = require('express')
const router = express.Router()
const { protect, adminOnly } = require('../middlewares/authMiddleware')
const { getStats, getAllUsers, deleteUser } = require('../controllers/adminController')

// Every route in this file requires a valid JWT AND isAdmin: true
router.use(protect, adminOnly)

router.get('/stats',        getStats)
router.get('/users',        getAllUsers)
router.delete('/users/:id', deleteUser)

module.exports = router
