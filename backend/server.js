const express = require('express')
const cors = require('cors')
const dotenv = require('dotenv')
const connectDB = require('./config/db')

dotenv.config()

const app = express()

// Connect to MongoDB (cached for Vercel serverless)
connectDB()

// ── Middleware ──────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
}))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// ── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/auth',  require('./routes/authRoutes'))
app.use('/api/posts', require('./routes/postRoutes'))
app.use('/api/users', require('./routes/userRoutes'))
app.use('/api/admin', require('./routes/adminRoutes'))

// Health check
app.get('/api', (req, res) => {
  res.json({ message: 'Blog App API is running' })
})

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' })
})

// ── Error Middleware (must be last, after all routes) ────────────────────────
app.use(require('./middlewares/errorMiddleware'))

// ── Local Development Server ─────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000
  app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`))
}

module.exports = app
