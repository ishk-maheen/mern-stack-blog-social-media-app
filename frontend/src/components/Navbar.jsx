import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { useAuth } from '../hooks/useAuth'
import { useTheme } from '../hooks/useTheme'
import Avatar from './Avatar'
import FeedoraIcon from './Logo'

const Navbar = () => {
  const { user, logout }      = useAuth()
  const { dark, toggleTheme } = useTheme()
  const navigate              = useNavigate()
  const [open, setOpen]       = useState(false)
  const menuRef               = useRef(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleLogout = () => {
    logout()
    setOpen(false)
    toast.success('Logged out')
    navigate('/', { replace: true })
  }

  const goTo = (path) => {
    navigate(path)
    setOpen(false)
  }

  return (
    <nav className="fixed top-0 inset-x-0 z-40 h-14
      bg-white/80 dark:bg-gray-900/80 backdrop-blur-md
      border-b border-gray-200 dark:border-gray-800 shadow-sm">

      <div className="max-w-5xl mx-auto h-full px-4 flex items-center justify-between gap-4">

        {/* ── Logo ── */}
        <Link to="/home" className="flex items-center gap-2 shrink-0">
          <FeedoraIcon size={28} />
          <span className="font-bold text-lg hidden sm:block tracking-tight
            bg-gradient-to-r from-brand-600 to-purple-600 bg-clip-text text-transparent">
            Feedora
          </span>
        </Link>

        {/* ── Right controls ── */}
        <div className="flex items-center gap-2">

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="p-2 rounded-lg text-gray-500 dark:text-gray-400
              hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            {dark ? <SunIcon /> : <MoonIcon />}
          </button>

          {/* User menu */}
          <div ref={menuRef} className="relative">
            <button
              onClick={() => setOpen((o) => !o)}
              aria-label="User menu"
              className="flex items-center gap-2 rounded-full
                focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-1
                dark:focus:ring-offset-gray-900 transition-all"
            >
              <Avatar src={user?.profilePicture} username={user?.username} size={9} />
            </button>

            <AnimatePresence>
              {open && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -6 }}
                  animate={{ opacity: 1, scale: 1,    y: 0  }}
                  exit={  { opacity: 0, scale: 0.95, y: -6 }}
                  transition={{ duration: 0.15, ease: 'easeOut' }}
                  className="absolute right-0 mt-2 w-56
                    bg-white dark:bg-gray-800
                    border border-gray-100 dark:border-gray-700
                    rounded-2xl shadow-xl overflow-hidden z-50"
                >
                  {/* User identity */}
                  <div className="flex items-center gap-3 px-4 py-3
                    border-b border-gray-100 dark:border-gray-700">
                    <Avatar src={user?.profilePicture} username={user?.username} size={10} />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                        {user?.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        @{user?.username}
                      </p>
                    </div>
                  </div>

                  {/* Menu items */}
                  <div className="py-1">
                    <MenuItem
                      icon={<ProfileIcon />}
                      label="My Profile"
                      onClick={() => goTo(`/profile/${user?.username}`)}
                    />

                    {user?.isAdmin && (
                      <MenuItem
                        icon={<ShieldIcon />}
                        label="Admin Panel"
                        onClick={() => goTo('/admin')}
                      />
                    )}

                    <div className="my-1 border-t border-gray-100 dark:border-gray-700" />

                    <MenuItem
                      icon={<LogoutIcon />}
                      label="Logout"
                      onClick={handleLogout}
                      danger
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </nav>
  )
}

// ── Local sub-components ───────────────────────────────────────────────────────

const MenuItem = ({ icon, label, onClick, danger = false }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors
      ${danger
        ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'
        : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
      }`}
  >
    <span className="w-4 h-4 shrink-0">{icon}</span>
    {label}
  </button>
)

// ── Icons ──────────────────────────────────────────────────────────────────────
const SunIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
  </svg>
)
const MoonIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1111.21 3a7 7 0 009.79 9.79z" />
  </svg>
)
const ProfileIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
)
const ShieldIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
)
const LogoutIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
)

export default Navbar
