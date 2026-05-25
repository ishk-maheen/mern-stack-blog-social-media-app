import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import Navbar from '../components/Navbar'
import PostCard from '../components/PostCard'
import PostModal from '../components/PostModal'
import Avatar from '../components/Avatar'
import { useAuth } from '../hooks/useAuth'
import {
  getFeed,
  getMyScheduledPosts,
  deleteScheduledPost,
} from '../services/api'
import { formatScheduled } from '../utils/helpers'

// ── Constants ──────────────────────────────────────────────────────────────────

const CONTENT_FILTERS = [
  { value: '',        label: 'All'      },
  { value: 'post',    label: 'Posts'    },
  { value: 'blog',    label: 'Blogs'    },
  { value: 'article', label: 'Articles' },
]

const BLOG_CATEGORIES = [
  { value: '',            label: 'All Categories', icon: null },
  { value: 'educational', label: 'Educational',    icon: '🎓' },
  { value: 'technology',  label: 'Technology',     icon: '💻' },
  { value: 'programming', label: 'Programming',    icon: '⌨️' },
  { value: 'design',      label: 'Design',         icon: '🎨' },
  { value: 'business',    label: 'Business',       icon: '💼' },
  { value: 'lifestyle',   label: 'Lifestyle',      icon: '🌿' },
  { value: 'health',      label: 'Health',         icon: '❤️' },
  { value: 'travel',      label: 'Travel',         icon: '✈️' },
  { value: 'food',        label: 'Food',           icon: '🍜' },
  { value: 'others',      label: 'Others',         icon: '✨' },
]

// ── LeftSidebar ────────────────────────────────────────────────────────────────

const LeftSidebar = ({ user, onCreatePost, onScheduled, activeFilter, activeCategory, onFilterChange }) => (
  <aside className="hidden lg:flex flex-col gap-4 sticky top-24">
    {/* Profile card */}
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35 }}
      className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-md rounded-2xl
        shadow-sm border border-white/60 dark:border-gray-800 overflow-hidden"
    >
      <div className="h-14 bg-gradient-to-r from-brand-500 via-purple-500 to-pink-500" />
      <div className="px-4 pb-4 -mt-7">
        <div className="mb-2">
          <Avatar
            src={user?.profilePicture}
            username={user?.username}
            size={12}
            className="ring-2 ring-white dark:ring-gray-900 shadow"
          />
        </div>
        <p className="text-sm font-bold text-gray-900 dark:text-white leading-tight">{user?.name}</p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">@{user?.username}</p>
        <Link
          to={`/profile/${user?.username}`}
          className="mt-3 flex items-center justify-center py-1.5 rounded-xl text-xs font-semibold
            border border-brand-400/50 text-brand-600 dark:text-brand-400
            hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors"
        >
          View Profile
        </Link>
      </div>
    </motion.div>

    {/* Quick navigation */}
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35, delay: 0.06 }}
      className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-md rounded-2xl
        shadow-sm border border-white/60 dark:border-gray-800 p-3"
    >
      <nav className="space-y-0.5">
        {[
          {
            icon: <HomeIcon />,
            label: 'Home Feed',
            active: activeFilter === '',
            onClick: () => onFilterChange('', ''),
          },
          {
            icon: <PencilSquareIcon />,
            label: 'Create Content',
            active: false,
            onClick: onCreatePost,
          },
          {
            icon: <CalendarNavIcon />,
            label: 'Scheduled',
            active: false,
            onClick: onScheduled,
          },
        ].map((item) => (
          <button
            key={item.label}
            onClick={item.onClick}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
              transition-all text-left ${
                item.active
                  ? 'bg-brand-50 dark:bg-brand-900/25 text-brand-700 dark:text-brand-300'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
              }`}
          >
            <span className={item.active ? 'text-brand-500' : 'text-gray-400 dark:text-gray-500'}>
              {item.icon}
            </span>
            {item.label}
          </button>
        ))}
        <Link
          to={`/profile/${user?.username}`}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
            text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800
            hover:text-gray-900 dark:hover:text-white transition-all"
        >
          <span className="text-gray-400 dark:text-gray-500"><UserCircleIcon /></span>
          My Profile
        </Link>
      </nav>
    </motion.div>

    {/* Blog categories */}
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35, delay: 0.12 }}
      className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-md rounded-2xl
        shadow-sm border border-white/60 dark:border-gray-800 p-4"
    >
      <h3 className="text-[10px] font-bold uppercase tracking-widest
        text-gray-400 dark:text-gray-500 mb-3">
        Blog Categories
      </h3>
      <div className="space-y-0.5">
        {BLOG_CATEGORIES.filter((c) => c.value).map((cat) => {
          const isActive = activeFilter === 'blog' && activeCategory === cat.value
          return (
            <button
              key={cat.value}
              onClick={() => onFilterChange('blog', cat.value)}
              className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-sm
                transition-all text-left ${
                  isActive
                    ? 'bg-brand-50 dark:bg-brand-900/25 text-brand-700 dark:text-brand-300 font-semibold'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                }`}
            >
              <span className="leading-none">{cat.icon}</span>
              {cat.label}
            </button>
          )
        })}
      </div>
    </motion.div>
  </aside>
)

// ── RightSidebar ───────────────────────────────────────────────────────────────

const RightSidebar = ({ posts, user }) => {
  const trending = useMemo(
    () => [...posts].sort((a, b) => (b.likes?.length ?? 0) - (a.likes?.length ?? 0)).slice(0, 4),
    [posts]
  )

  const creators = useMemo(() => {
    const seen = new Set([user?._id?.toString()].filter(Boolean))
    const result = []
    for (const p of posts) {
      const a = p.author
      if (!a?._id || seen.has(a._id.toString())) continue
      seen.add(a._id.toString())
      result.push(a)
      if (result.length === 4) break
    }
    return result
  }, [posts, user])

  return (
    <aside className="hidden xl:flex flex-col gap-4 sticky top-24">
      {/* Trending now */}
      <motion.div
        initial={{ opacity: 0, x: 16 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.35 }}
        className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-md rounded-2xl
          shadow-sm border border-white/60 dark:border-gray-800 p-4"
      >
        <h3 className="text-[10px] font-bold uppercase tracking-widest
          text-gray-400 dark:text-gray-500 mb-3 flex items-center gap-1.5">
          <FireIcon />
          Trending Now
        </h3>
        {trending.length === 0 ? (
          <p className="text-xs text-gray-400 dark:text-gray-500 italic">Nothing yet — be the first!</p>
        ) : (
          <div className="space-y-3">
            {trending.map((post, i) => (
              <div key={post._id} className="flex items-start gap-2.5">
                <span className="text-sm font-black text-gray-200 dark:text-gray-700 mt-0.5 w-4 shrink-0 select-none">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-800 dark:text-gray-200
                    line-clamp-2 leading-snug">
                    {post.title}
                  </p>
                  <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
                    @{post.author?.username}&nbsp;·&nbsp;{post.likes?.length ?? 0} likes
                  </p>
                </div>
                {post.mediaUrl && post.mediaType === 'image' && (
                  <img
                    src={post.mediaUrl}
                    alt=""
                    className="w-9 h-9 rounded-lg object-cover shrink-0"
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Suggested creators */}
      {creators.length > 0 && (
        <motion.div
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.35, delay: 0.07 }}
          className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-md rounded-2xl
            shadow-sm border border-white/60 dark:border-gray-800 p-4"
        >
          <h3 className="text-[10px] font-bold uppercase tracking-widest
            text-gray-400 dark:text-gray-500 mb-3 flex items-center gap-1.5">
            <UsersIcon />
            Suggested Creators
          </h3>
          <div className="space-y-3">
            {creators.map((creator) => (
              <Link
                key={creator._id}
                to={`/profile/${creator.username}`}
                className="flex items-center gap-2.5 group"
              >
                <Avatar src={creator.profilePicture} username={creator.username} size={8} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate
                    group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                    {creator.name}
                  </p>
                  <p className="text-[11px] text-gray-400 dark:text-gray-500 truncate">
                    @{creator.username}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </motion.div>
      )}

      {/* Discover promo card */}
      <motion.div
        initial={{ opacity: 0, x: 16 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.35, delay: 0.14 }}
        className="relative overflow-hidden rounded-2xl shadow-md
          bg-gradient-to-br from-brand-500 via-purple-600 to-pink-500 p-4"
      >
        {/* Inner glow */}
        <div
          className="absolute inset-0 opacity-25"
          style={{
            backgroundImage: 'radial-gradient(circle at 75% 15%, white 0%, transparent 55%)',
          }}
        />
        <p className="text-[10px] font-bold uppercase tracking-widest text-white/60 mb-1">Discover</p>
        <p className="text-sm font-bold text-white leading-snug">
          Explore content from creators worldwide
        </p>
        <p className="text-[11px] text-white/50 mt-1.5">Posts · Blogs · Articles</p>
      </motion.div>
    </aside>
  )
}

// ── HomePage ───────────────────────────────────────────────────────────────────

const HomePage = () => {
  const { user } = useAuth()

  const [posts,          setPosts]          = useState([])
  const [loading,        setLoading]        = useState(true)
  const [loadingMore,    setLoadingMore]    = useState(false)
  const [page,           setPage]           = useState(1)
  const [hasMore,        setHasMore]        = useState(false)
  const [showModal,      setShowModal]      = useState(false)
  const [showScheduled,  setShowScheduled]  = useState(false)
  const [activeFilter,   setActiveFilter]   = useState('')
  const [activeCategory, setActiveCategory] = useState('')

  // ── Feed loading ─────────────────────────────────────────────────────────────

  const loadFeed = useCallback(async (pageNum = 1, replace = true, filterType = '', filterCat = '') => {
    try {
      if (pageNum === 1) setLoading(true)
      else               setLoadingMore(true)

      const { data } = await getFeed(pageNum, 10, filterType, filterCat)
      setPosts((prev) => replace ? data.posts : [...prev, ...data.posts])
      setHasMore(pageNum < data.totalPages)
      setPage(pageNum)
    } catch {
      toast.error('Failed to load feed')
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [])

  useEffect(() => { loadFeed(1, true) }, [loadFeed]) // eslint-disable-line

  const handleFilterChange = (filterType, category = '') => {
    setActiveFilter(filterType)
    setActiveCategory(category)
    loadFeed(1, true, filterType, category)
  }

  // ── Feed state updaters ───────────────────────────────────────────────────────

  const handlePostCreated = (newPost) => {
    setPosts((prev) => [newPost, ...prev])
    setShowModal(false)
  }

  const handlePostUpdate = useCallback((updated) => {
    setPosts((prev) => prev.map((p) => p._id === updated._id ? updated : p))
  }, [])

  const handlePostDelete = useCallback((id) => {
    setPosts((prev) => prev.filter((p) => p._id !== id))
  }, [])

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gradient-to-br
      from-slate-50 via-white to-indigo-50/50
      dark:from-gray-950 dark:via-gray-900 dark:to-slate-950">

      {/* ── Decorative background blobs ── */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[520px] h-[520px]
          bg-brand-100/50 dark:bg-brand-950/40 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-56 w-[420px] h-[420px]
          bg-purple-100/40 dark:bg-purple-950/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 right-1/3 w-[380px] h-[380px]
          bg-pink-100/30 dark:bg-pink-950/20 rounded-full blur-3xl" />
      </div>

      <Navbar />

      <div className="max-w-7xl mx-auto px-4 pt-20 pb-16">
        <div className="grid grid-cols-1
          lg:grid-cols-[260px_1fr]
          xl:grid-cols-[260px_1fr_280px]
          gap-6 items-start">

          {/* ── Left Sidebar ── */}
          <LeftSidebar
            user={user}
            onCreatePost={() => setShowModal(true)}
            onScheduled={() => setShowScheduled(true)}
            activeFilter={activeFilter}
            activeCategory={activeCategory}
            onFilterChange={handleFilterChange}
          />

          {/* ── Main Feed ── */}
          <main className="min-w-0">

            {/* Create post card */}
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-md rounded-2xl
                shadow-sm border border-white/60 dark:border-gray-800 p-4 mb-5"
            >
              <div className="flex items-center gap-3">
                <Avatar src={user?.profilePicture} username={user?.username} size={10} />
                <button
                  onClick={() => setShowModal(true)}
                  className="flex-1 text-left px-4 py-2.5 rounded-xl
                    bg-gray-100/80 dark:bg-gray-800/80
                    hover:bg-gray-200/80 dark:hover:bg-gray-700/80
                    text-gray-400 dark:text-gray-500 text-sm transition-colors"
                >
                  What&apos;s on your mind, {user?.name?.split(' ')[0]}?
                </button>
              </div>
              <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                <ActionBtn icon={<PhotoIcon />}    label="Photo / Video" onClick={() => setShowModal(true)} />
                <ActionBtn icon={<CalendarIcon />} label="Scheduled"     onClick={() => setShowScheduled(true)} />
              </div>
            </motion.div>

            {/* Filter bar */}
            <div className="mb-5 space-y-2.5">
              {/* Content type chips */}
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {CONTENT_FILTERS.map((f) => (
                  <button
                    key={f.value}
                    onClick={() => handleFilterChange(f.value, '')}
                    className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-semibold
                      transition-all ${
                        activeFilter === f.value
                          ? 'bg-brand-600 text-white shadow-sm'
                          : 'bg-white/70 dark:bg-gray-900/70 backdrop-blur-sm text-gray-600 dark:text-gray-400 border border-gray-200/80 dark:border-gray-700 hover:border-brand-400 hover:text-brand-600 dark:hover:text-brand-400'
                      }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Blog category chips */}
              <AnimatePresence>
                {activeFilter === 'blog' && (
                  <motion.div
                    key="cat-row"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.18 }}
                    className="overflow-hidden"
                  >
                    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                      {BLOG_CATEGORIES.map((c) => (
                        <button
                          key={c.value}
                          onClick={() => handleFilterChange('blog', c.value)}
                          className={`shrink-0 flex items-center gap-1 px-3 py-1 rounded-full
                            text-xs font-semibold transition-all ${
                              activeCategory === c.value
                                ? 'bg-brand-500 text-white shadow-sm'
                                : 'bg-white/70 dark:bg-gray-800/70 text-gray-500 dark:text-gray-400 hover:bg-brand-50 dark:hover:bg-brand-900/20 hover:text-brand-600 dark:hover:text-brand-400'
                            }`}
                        >
                          {c.icon && <span>{c.icon}</span>}
                          {c.label}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Feed */}
            {loading ? (
              <FeedSkeleton />
            ) : posts.length === 0 ? (
              <EmptyFeed onCreatePost={() => setShowModal(true)} />
            ) : (
              <div className="space-y-4">
                {posts.map((post) => (
                  <PostCard
                    key={post._id}
                    post={post}
                    onUpdate={handlePostUpdate}
                    onDelete={handlePostDelete}
                  />
                ))}
                {hasMore && (
                  <div className="text-center pt-2 pb-4">
                    <button
                      onClick={() => loadFeed(page + 1, false, activeFilter, activeCategory)}
                      disabled={loadingMore}
                      className="px-8 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700
                        disabled:opacity-60 text-white text-sm font-semibold transition-colors"
                    >
                      {loadingMore ? 'Loading…' : 'Load more'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </main>

          {/* ── Right Sidebar ── */}
          <RightSidebar posts={posts} user={user} />
        </div>
      </div>

      {/* Post creation modal */}
      <AnimatePresence>
        {showModal && (
          <PostModal
            onClose={() => setShowModal(false)}
            onPostCreated={handlePostCreated}
          />
        )}
      </AnimatePresence>

      {/* Scheduled posts modal */}
      <AnimatePresence>
        {showScheduled && (
          <ScheduledPostsModal onClose={() => setShowScheduled(false)} />
        )}
      </AnimatePresence>
    </div>
  )
}

// ── ScheduledPostsModal ────────────────────────────────────────────────────────

const ScheduledPostsModal = ({ onClose }) => {
  const [items,       setItems]       = useState([])
  const [loading,     setLoading]     = useState(true)
  const [deleting,    setDeleting]    = useState(null)
  const [editingItem, setEditingItem] = useState(null)

  useEffect(() => {
    getMyScheduledPosts()
      .then(({ data }) => setItems(data))
      .catch(() => toast.error('Failed to load scheduled blogs'))
      .finally(() => setLoading(false))
  }, [])

  const handleCancel = async (id) => {
    setDeleting(id)
    try {
      await deleteScheduledPost(id)
      setItems((prev) => prev.filter((p) => p._id !== id))
      toast.success('Scheduled blog cancelled')
    } catch {
      toast.error('Failed to cancel blog')
    } finally {
      setDeleting(null)
    }
  }

  const handleScheduledUpdated = (updated) => {
    setItems((prev) => prev.map((p) => (p._id === updated._id ? updated : p)))
    setEditingItem(null)
  }

  return (
    <Backdrop onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1,    y: 0  }}
        exit={  { opacity: 0, scale: 0.96, y: 16  }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between px-5 py-4
          border-b border-gray-100 dark:border-gray-800">
          <h2 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-brand-500" />
            Scheduled Blogs
          </h2>
          <button onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600
              dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <XIcon />
          </button>
        </div>

        <AnimatePresence>
          {editingItem && (
            <PostModal
              onClose={() => setEditingItem(null)}
              editingScheduledPost={editingItem}
              onScheduledUpdated={handleScheduledUpdated}
            />
          )}
        </AnimatePresence>

        <div className="max-h-[60vh] overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-12"><Spinner /></div>
          ) : items.length === 0 ? (
            <div className="text-center py-12 px-6">
              <div className="text-4xl mb-3">📅</div>
              <p className="text-gray-500 dark:text-gray-400 text-sm">No scheduled blogs yet</p>
              <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">
                Create a blog and choose a future publish time
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100 dark:divide-gray-800">
              {items.map((sp) => (
                <li key={sp._id} className="flex items-start gap-3 px-5 py-4">
                  {sp.mediaUrl && sp.mediaType === 'image' && (
                    <img src={sp.mediaUrl} alt=""
                      className="w-12 h-12 rounded-lg object-cover shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{sp.title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">{sp.description}</p>
                    <span className="inline-flex items-center gap-1 mt-1.5 text-xs
                      text-brand-600 dark:text-brand-400 font-medium">
                      <CalendarIcon className="w-3 h-3" />
                      {formatScheduled(sp.publishAt)}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1 shrink-0">
                    <button
                      onClick={() => setEditingItem(sp)}
                      className="text-xs text-brand-600 dark:text-brand-400 hover:text-brand-700
                        font-medium px-2.5 py-1 rounded-lg
                        hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleCancel(sp._id)}
                      disabled={deleting === sp._id}
                      className="text-xs text-red-500 hover:text-red-600 font-medium
                        px-2.5 py-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20
                        disabled:opacity-50 transition-colors"
                    >
                      {deleting === sp._id ? '…' : 'Cancel'}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </motion.div>
    </Backdrop>
  )
}

// ── Skeleton & empty states ────────────────────────────────────────────────────

const FeedSkeleton = () => (
  <div className="space-y-4">
    {[1, 2, 3].map((i) => (
      <div key={i}
        className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-md rounded-2xl p-5
          shadow-sm border border-white/60 dark:border-gray-800 animate-pulse">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full" />
          <div className="space-y-1.5 flex-1">
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-32" />
            <div className="h-2.5 bg-gray-200 dark:bg-gray-700 rounded w-20" />
          </div>
        </div>
        <div className="space-y-2 mb-4">
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full" />
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
        </div>
        <div className="h-44 bg-gray-200 dark:bg-gray-700 rounded-xl" />
      </div>
    ))}
  </div>
)

const EmptyFeed = ({ onCreatePost }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-md rounded-2xl
      shadow-sm border border-white/60 dark:border-gray-800 text-center py-16 px-6"
  >
    <div className="text-5xl mb-4">✍️</div>
    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Nothing here yet</h3>
    <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
      Be the first to share something with the community
    </p>
    <button
      onClick={onCreatePost}
      className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700
        text-white text-sm font-semibold transition-colors"
    >
      Create first post
    </button>
  </motion.div>
)

// ── Shared primitives ──────────────────────────────────────────────────────────

const Backdrop = ({ children, onClick }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.15 }}
    onClick={onClick}
    className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm
      flex items-center justify-center p-4"
  >
    {children}
  </motion.div>
)

const ActionBtn = ({ icon, label, onClick }) => (
  <button
    onClick={onClick}
    className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl
      text-sm font-medium text-gray-600 dark:text-gray-400
      hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
  >
    {icon}
    {label}
  </button>
)

const Spinner = () => (
  <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
)

// ── Icons ──────────────────────────────────────────────────────────────────────

const PhotoIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
)

const CalendarIcon = ({ className = 'w-4 h-4' }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
)

const CalendarNavIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
)

const XIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
)

const HomeIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
)

const PencilSquareIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
)

const UserCircleIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const FireIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
  </svg>
)

const UsersIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
)

export default HomePage
