import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useAuth } from './hooks/useAuth'
import ProtectedRoute from './routes/ProtectedRoute'
import LandingPage from './pages/LandingPage'
import AuthPage from './pages/AuthPage'
import HomePage from './pages/HomePage'
import ProfilePage from './pages/ProfilePage'
import AdminPanel from './pages/AdminPanel'

const PageTransition = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -4 }}
    transition={{ duration: 0.2, ease: 'easeOut' }}
  >
    {children}
  </motion.div>
)

function App() {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-950">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.key}>

        {/* Public landing page — redirect logged-in users straight to their feed */}
        <Route
          path="/"
          element={
            user
              ? <Navigate to={user.isAdmin ? '/admin' : '/home'} replace />
              : <PageTransition><LandingPage /></PageTransition>
          }
        />

        {/* Auth page — redirect if already logged in */}
        <Route
          path="/auth"
          element={
            user
              ? <Navigate to={user.isAdmin ? '/admin' : '/home'} replace />
              : <PageTransition><AuthPage /></PageTransition>
          }
        />

        {/* Protected — regular users */}
        <Route element={<ProtectedRoute />}>
          <Route path="/home"               element={<PageTransition><HomePage /></PageTransition>} />
          <Route path="/profile/:username"  element={<PageTransition><ProfilePage /></PageTransition>} />
        </Route>

        {/* Protected — admin only */}
        <Route element={<ProtectedRoute adminOnly />}>
          <Route path="/admin" element={<PageTransition><AdminPanel /></PageTransition>} />
        </Route>

        {/* Catch-all */}
        <Route
          path="*"
          element={
            <Navigate to={user ? (user.isAdmin ? '/admin' : '/home') : '/'} replace />
          }
        />
      </Routes>
    </AnimatePresence>
  )
}

export default App
