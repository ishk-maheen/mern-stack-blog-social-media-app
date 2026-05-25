import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import Avatar from '../components/Avatar'
import { useAuth } from '../hooks/useAuth'
import { useTheme } from '../hooks/useTheme'
import { getAdminStats, getAdminUsers, deleteAdminUser } from '../services/api'
import FeedoraIcon from '../components/Logo'

// ── AdminPanel ─────────────────────────────────────────────────────────────────

const AdminPanel = () => {
  const { logout }            = useAuth()
  const { dark, toggleTheme } = useTheme()
  const navigate              = useNavigate()

  const [stats,        setStats]        = useState(null)
  const [statsLoading, setStatsLoading] = useState(true)
  const [users,        setUsers]        = useState([])
  const [usersLoading, setUsersLoading] = useState(true)
  const [total,        setTotal]        = useState(0)
  const [totalPages,   setTotalPages]   = useState(1)
  const [page,         setPage]         = useState(1)
  const [search,       setSearch]       = useState('')
  const [searchInput,  setSearchInput]  = useState('')
  const [confirmId,    setConfirmId]    = useState(null)
  const [deleting,     setDeleting]     = useState(null)

  // ── Fetch stats ───────────────────────────────────────────────────────────────
  useEffect(() => {
    getAdminStats()
      .then(({ data }) => setStats(data))
      .catch(() => toast.error('Failed to load stats'))
      .finally(() => setStatsLoading(false))
  }, [])

  // ── Fetch users (re-runs on page or search change) ────────────────────────────
  const fetchUsers = useCallback(async (pg, q) => {
    setUsersLoading(true)
    try {
      const { data } = await getAdminUsers(pg, q)
      setUsers(data.users)
      setTotal(data.total)
      setTotalPages(data.totalPages)
    } catch {
      toast.error('Failed to load users')
    } finally {
      setUsersLoading(false)
    }
  }, [])

  useEffect(() => { fetchUsers(page, search) }, [page, search, fetchUsers])

  // ── Debounce search input (400 ms) ────────────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1) }, 400)
    return () => clearTimeout(t)
  }, [searchInput])

  // ── Delete user ───────────────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    if (confirmId !== id) { setConfirmId(id); return }

    setDeleting(id)
    try {
      await deleteAdminUser(id)
      setUsers((prev) => prev.filter((u) => u._id !== id))
      setTotal((n) => n - 1)
      setStats((s) => s ? { ...s, totalUsers: s.totalUsers - 1 } : s)
      toast.success('User deleted successfully')
    } catch {
      toast.error('Failed to delete user')
    } finally {
      setDeleting(null)
      setConfirmId(null)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/auth', { replace: true })
    toast.success('Logged out')
  }

  // ── Pagination page numbers ───────────────────────────────────────────────────
  const pageNumbers = () => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1)
    if (page <= 3)                   return [1, 2, 3, 4, 5]
    if (page >= totalPages - 2)      return [totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages]
    return [page - 2, page - 1, page, page + 1, page + 2]
  }

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">

      {/* ── Admin Navbar ── */}
      <nav className="fixed top-0 inset-x-0 z-40 h-14
        bg-white/80 dark:bg-gray-900/80 backdrop-blur-md
        border-b border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="max-w-5xl mx-auto h-full px-4 flex items-center justify-between gap-4">

          {/* Brand + badge */}
          <div className="flex items-center gap-2.5">
            <FeedoraIcon size={28} />
            <span className="font-bold text-lg text-brand-600 tracking-tight">Feedora</span>
            <span className="bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300
              text-xs font-bold px-2 py-0.5 rounded-full">
              Admin
            </span>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="p-2 rounded-lg text-gray-500 dark:text-gray-400
                hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              {dark ? <SunIcon /> : <MoonIcon />}
            </button>
            <Link
              to="/home"
              className="hidden sm:flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400
                hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
            >
              <ArrowLeftIcon />
              Back to feed
            </Link>
            <button
              onClick={handleLogout}
              className="text-sm font-medium text-red-500 hover:text-red-600 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* ── Main ── */}
      <main className="max-w-5xl mx-auto px-4 pt-20 pb-16">

        {/* Page title */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-7"
        >
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage registered users and monitor platform activity
          </p>
        </motion.div>

        {/* ── Stats cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <StatCard
            icon="👥" label="Registered Users"
            value={statsLoading ? null : stats?.totalUsers ?? 0}
            color="blue"   delay={0}
          />
          <StatCard
            icon="📝" label="Published Blogs"
            value={statsLoading ? null : stats?.totalPosts ?? 0}
            color="green"  delay={0.07}
          />
          <StatCard
            icon="📅" label="Pending Scheduled"
            value={statsLoading ? null : stats?.pendingScheduled ?? 0}
            color="purple" delay={0.14}
          />
        </div>

        {/* ── Users table card ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm
            border border-gray-100 dark:border-gray-800 overflow-hidden"
        >
          {/* Header row */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3
            px-5 py-4 border-b border-gray-100 dark:border-gray-800">
            <div>
              <h2 className="font-bold text-gray-900 dark:text-white">Registered Users</h2>
              {!usersLoading && (
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                  {total} {total === 1 ? 'user' : 'users'} total
                </p>
              )}
            </div>

            {/* Search */}
            <div className="sm:ml-auto relative">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search name, username, email…"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full sm:w-64 pl-9 pr-4 py-2 rounded-xl text-sm
                  border border-gray-200 dark:border-gray-700
                  bg-gray-50 dark:bg-gray-800
                  text-gray-900 dark:text-white
                  placeholder-gray-400 dark:placeholder-gray-500
                  focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
              />
              {searchInput && (
                <button
                  onClick={() => setSearchInput('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2
                    text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                >
                  <XSmallIcon />
                </button>
              )}
            </div>
          </div>

          {/* Column headers (desktop) */}
          <div className="hidden sm:grid grid-cols-[1fr_1.5fr_auto_auto] gap-4
            px-5 py-2.5 bg-gray-50 dark:bg-gray-800/50
            border-b border-gray-100 dark:border-gray-800
            text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
            <span>User</span>
            <span>Email</span>
            <span>Joined</span>
            <span className="text-right">Action</span>
          </div>

          {/* Body */}
          {usersLoading ? (
            <UsersListSkeleton />
          ) : users.length === 0 ? (
            <EmptyUsers search={search} />
          ) : (
            <AnimatePresence mode="popLayout">
              <ul className="divide-y divide-gray-50 dark:divide-gray-800/60">
                {users.map((u, i) => (
                  <motion.li
                    key={u._id}
                    layout
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0  }}
                    exit={  { opacity: 0, x:  12 }}
                    transition={{ delay: i * 0.03, duration: 0.18 }}
                    className="flex items-center gap-3 sm:gap-4 px-5 py-3.5
                      hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors"
                  >
                    {/* Avatar + name */}
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <Avatar src={u.profilePicture} username={u.username} size={10} className="shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                          {u.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          @{u.username}
                        </p>
                      </div>
                    </div>

                    {/* Email */}
                    <p className="hidden sm:block flex-[1.5] text-sm text-gray-500 dark:text-gray-400 truncate min-w-0">
                      {u.email}
                    </p>

                    {/* Join date */}
                    <p className="hidden sm:block text-xs text-gray-400 dark:text-gray-500 shrink-0 w-24 text-right">
                      {new Date(u.createdAt).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric',
                      })}
                    </p>

                    {/* Delete control */}
                    <div className="shrink-0 flex items-center gap-2">
                      {confirmId === u._id ? (
                        <>
                          <button
                            onClick={() => setConfirmId(null)}
                            className="text-xs text-gray-500 dark:text-gray-400
                              hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleDelete(u._id)}
                            disabled={deleting === u._id}
                            className="text-xs font-semibold text-red-500 hover:text-red-600
                              disabled:opacity-50 transition-colors"
                          >
                            {deleting === u._id ? 'Deleting…' : 'Confirm'}
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handleDelete(u._id)}
                          aria-label={`Delete ${u.username}`}
                          className="p-1.5 rounded-lg
                            text-gray-300 dark:text-gray-600
                            hover:text-red-500 dark:hover:text-red-400
                            hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        >
                          <TrashIcon />
                        </button>
                      )}
                    </div>
                  </motion.li>
                ))}
              </ul>
            </AnimatePresence>
          )}

          {/* Pagination */}
          {!usersLoading && totalPages > 1 && (
            <div className="flex items-center justify-between gap-3
              px-5 py-4 border-t border-gray-100 dark:border-gray-800">

              <button
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                disabled={page === 1}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium
                  border border-gray-200 dark:border-gray-700
                  text-gray-600 dark:text-gray-400
                  hover:bg-gray-50 dark:hover:bg-gray-800
                  disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ArrowLeftIcon /> Prev
              </button>

              {/* Page numbers */}
              <div className="flex items-center gap-1">
                {pageNumbers().map((pg) => (
                  <button
                    key={pg}
                    onClick={() => setPage(pg)}
                    className={`w-9 h-9 rounded-xl text-sm font-semibold transition-colors ${
                      pg === page
                        ? 'bg-brand-600 text-white shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    {pg}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                disabled={page === totalPages}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium
                  border border-gray-200 dark:border-gray-700
                  text-gray-600 dark:text-gray-400
                  hover:bg-gray-50 dark:hover:bg-gray-800
                  disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Next <ArrowRightIcon />
              </button>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  )
}

// ── StatCard ───────────────────────────────────────────────────────────────────

const colorMap = {
  blue:   { card: 'bg-blue-50   dark:bg-blue-900/20',   num: 'text-blue-600   dark:text-blue-400'   },
  green:  { card: 'bg-green-50  dark:bg-green-900/20',  num: 'text-green-600  dark:text-green-400'  },
  purple: { card: 'bg-purple-50 dark:bg-purple-900/20', num: 'text-purple-600 dark:text-purple-400' },
}

const StatCard = ({ icon, label, value, color, delay = 0 }) => {
  const c = colorMap[color] ?? colorMap.blue
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0  }}
      transition={{ delay }}
      className={`${c.card} rounded-2xl p-5`}
    >
      <span className="text-3xl">{icon}</span>
      <p className={`text-4xl font-bold mt-3 mb-1 ${c.num}`}>
        {value === null
          ? <span className="inline-block w-12 h-9 bg-current opacity-10 rounded-lg animate-pulse" />
          : value.toLocaleString()
        }
      </p>
      <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">{label}</p>
    </motion.div>
  )
}

// ── Skeleton ───────────────────────────────────────────────────────────────────

const UsersListSkeleton = () => (
  <ul className="divide-y divide-gray-50 dark:divide-gray-800">
    {[1, 2, 3, 4, 5].map((i) => (
      <li key={i} className="flex items-center gap-4 px-5 py-3.5 animate-pulse">
        <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-3 w-32 bg-gray-200 dark:bg-gray-700 rounded-lg" />
          <div className="h-2.5 w-20 bg-gray-200 dark:bg-gray-700 rounded-lg" />
        </div>
        <div className="hidden sm:block h-2.5 w-36 bg-gray-200 dark:bg-gray-700 rounded-lg" />
        <div className="hidden sm:block h-2.5 w-20 bg-gray-200 dark:bg-gray-700 rounded-lg" />
      </li>
    ))}
  </ul>
)

// ── Empty state ────────────────────────────────────────────────────────────────

const EmptyUsers = ({ search }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="flex flex-col items-center py-14 px-4"
  >
    <span className="text-4xl mb-3">👥</span>
    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
      {search ? `No results for "${search}"` : 'No registered users yet'}
    </p>
    {search && (
      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
        Try a different name, username, or email
      </p>
    )}
  </motion.div>
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
const SearchIcon = ({ className = '' }) => (
  <svg className={`w-4 h-4 ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
)
const TrashIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
)
const ArrowLeftIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
  </svg>
)
const ArrowRightIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
  </svg>
)
const XSmallIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
)

export default AdminPanel
