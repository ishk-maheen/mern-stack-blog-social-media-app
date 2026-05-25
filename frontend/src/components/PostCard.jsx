import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import Avatar from './Avatar'
import LikesModal from './LikesModal'
import CommentsSection from './CommentsSection'
import PostModal from './PostModal'
import { useAuth } from '../hooks/useAuth'
import { likeUnlikePost, viewPost, deletePost as deletePostApi } from '../services/api'
import { timeAgo } from '../utils/helpers'

const TRUNCATE = 220

// Resolve a like entry to its user ID (handles populated objects or raw ID strings)
const resolveId = (l) => (typeof l === 'object' ? l._id : l)?.toString()

const PostCard = ({ post, onUpdate, onDelete }) => {
  const { user } = useAuth()

  // Local state — keeps the card reactive without refetching the whole feed
  const [likes,         setLikes]         = useState(post.likes        ?? [])
  const [comments,      setComments]      = useState(post.comments     ?? [])
  const [views,         setViews]         = useState(post.viewedBy?.length ?? 0)
  const [showComments,  setShowComments]  = useState(false)
  const [showLikes,     setShowLikes]     = useState(false)
  const [expanded,      setExpanded]      = useState(false)
  const [likeLoading,   setLikeLoading]   = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting,      setDeleting]      = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)

  const isAuthor = user?._id === post.author?._id
  const hasLiked = likes.some((l) => resolveId(l) === user?._id?.toString())
  const isLong   = post.description?.length > TRUNCATE

  // ── Track view once on mount ──────────────────────────────────────────────────
  useEffect(() => {
    viewPost(post._id)
      .then(({ data }) => setViews(data.views))
      .catch(() => {}) // silent — view tracking is not critical
  }, [post._id])

  // ── Like / Unlike ─────────────────────────────────────────────────────────────
  const handleLike = async () => {
    if (likeLoading) return

    // Optimistic UI update first
    const wasLiked = hasLiked
    setLikes((prev) =>
      wasLiked
        ? prev.filter((l) => resolveId(l) !== user._id?.toString())
        : [...prev, { _id: user._id, name: user.name, username: user.username, profilePicture: user.profilePicture }]
    )

    setLikeLoading(true)
    try {
      const { data } = await likeUnlikePost(post._id)
      setLikes(data.likes)
      onUpdate?.({ ...post, likes: data.likes })
    } catch {
      setLikes(post.likes ?? []) // revert
      toast.error('Failed to update like')
    } finally {
      setLikeLoading(false)
    }
  }

  // ── Delete ────────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!confirmDelete) { setConfirmDelete(true); return }

    setDeleting(true)
    try {
      await deletePostApi(post._id)
      toast.success('Blog deleted')
      onDelete?.(post._id)
    } catch {
      toast.error('Failed to delete blog')
      setDeleting(false)
      setConfirmDelete(false)
    }
  }

  // ── Comment callbacks ─────────────────────────────────────────────────────────
  const handleCommentAdded = (comment) => {
    setComments((prev) => [comment, ...prev])
  }

  const handleCommentUpdated = (updated) => {
    setComments((prev) => prev.map((c) => c._id === updated._id ? updated : c))
  }

  const handleCommentDeleted = (commentId) => {
    setComments((prev) => prev.filter((c) => c._id !== commentId))
  }

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0  }}
      exit={  { opacity: 0, y: -10 }}
      transition={{ duration: 0.25 }}
      className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-md rounded-2xl shadow-sm
        border border-white/60 dark:border-gray-800 overflow-hidden
        hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
    >
      {/* ── Header ── */}
      <div className="flex items-start justify-between px-4 pt-4 pb-2">
        <Link
          to={`/profile/${post.author?.username}`}
          className="flex items-center gap-3 group"
        >
          <Avatar src={post.author?.profilePicture} username={post.author?.username} size={10} />
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white
              group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors leading-tight">
              {post.author?.name}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1 flex-wrap">
              @{post.author?.username}&nbsp;·&nbsp;{timeAgo(post.createdAt)}
              {post.isEdited && <>&nbsp;·&nbsp;<span className="italic">Edited</span></>}
              &nbsp;·&nbsp;
              <ContentTypeBadge type={post.contentType} category={post.category} />
            </p>
          </div>
        </Link>

        {/* Author-only controls */}
        {isAuthor && (
          <div className="flex items-center gap-1 shrink-0 ml-2">
            {confirmDelete ? (
              <>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors px-1"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="text-xs font-semibold text-red-500 hover:text-red-600 disabled:opacity-50 transition-colors"
                >
                  {deleting ? 'Deleting…' : 'Confirm'}
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setShowEditModal(true)}
                  aria-label="Edit blog"
                  className="p-1.5 rounded-lg text-gray-300 dark:text-gray-600
                    hover:text-brand-500 dark:hover:text-brand-400
                    hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors"
                >
                  <PencilIcon />
                </button>
                <button
                  onClick={handleDelete}
                  aria-label="Delete blog"
                  className="p-1.5 rounded-lg text-gray-300 dark:text-gray-600
                    hover:text-red-500 dark:hover:text-red-400
                    hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <TrashIcon />
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* ── Post content ── */}
      <div className="px-4 pb-3">
        <h3 className="font-bold text-base text-gray-900 dark:text-white mb-1.5 leading-snug">
          {post.title}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-line">
          {isLong && !expanded
            ? post.description.slice(0, TRUNCATE) + '…'
            : post.description}
          {isLong && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="text-brand-600 dark:text-brand-400 font-medium ml-1 hover:underline"
            >
              {expanded ? 'See less' : 'See more'}
            </button>
          )}
        </p>
      </div>

      {/* ── Media ── */}
      {post.mediaUrl && (
        <div className="border-y border-gray-100 dark:border-gray-800">
          {post.mediaType === 'video' ? (
            <video
              src={post.mediaUrl}
              controls
              className="w-full max-h-[480px] bg-black"
            />
          ) : (
            <img
              src={post.mediaUrl}
              alt={post.title}
              className="w-full max-h-[480px] object-cover"
              loading="lazy"
            />
          )}
        </div>
      )}

      {/* ── Stats bar ── */}
      {(likes.length > 0 || comments.length > 0 || views > 0) && (
        <div className="flex items-center justify-between px-4 py-2
          text-xs text-gray-400 dark:text-gray-500">
          <div className="flex items-center gap-3">
            {likes.length > 0 && (
              <button
                onClick={() => setShowLikes(true)}
                className="flex items-center gap-1 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
              >
                <span className="text-red-400">❤</span>
                {likes.length} {likes.length === 1 ? 'like' : 'likes'}
              </button>
            )}
            {comments.length > 0 && (
              <button
                onClick={() => setShowComments((v) => !v)}
                className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
              >
                {comments.length} {comments.length === 1 ? 'comment' : 'comments'}
              </button>
            )}
          </div>
          {views > 0 && (
            <span className="flex items-center gap-1">
              <EyeIcon />
              {views} {views === 1 ? 'view' : 'views'}
            </span>
          )}
        </div>
      )}

      {/* ── Action bar ── */}
      <div className="flex border-t border-gray-100 dark:border-gray-800">
        {/* Like */}
        <button
          onClick={handleLike}
          disabled={likeLoading}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5
            text-sm font-medium transition-colors
            hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-70
            ${hasLiked
              ? 'text-red-500'
              : 'text-gray-500 dark:text-gray-400'
            }`}
        >
          <HeartIcon filled={hasLiked} />
          {hasLiked ? 'Liked' : 'Like'}
        </button>

        {/* Divider */}
        <div className="w-px bg-gray-100 dark:bg-gray-800 self-stretch" />

        {/* Comment */}
        <button
          onClick={() => setShowComments((v) => !v)}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5
            text-sm font-medium transition-colors
            hover:bg-gray-50 dark:hover:bg-gray-800
            ${showComments
              ? 'text-brand-600 dark:text-brand-400'
              : 'text-gray-500 dark:text-gray-400'
            }`}
        >
          <CommentIcon />
          Comment
        </button>
      </div>

      {/* ── Comments section (animated) ── */}
      <AnimatePresence>
        {showComments && (
          <CommentsSection
            postId={post._id}
            comments={comments}
            onCommentAdded={handleCommentAdded}
            onCommentUpdated={handleCommentUpdated}
            onCommentDeleted={handleCommentDeleted}
          />
        )}
      </AnimatePresence>

      {/* ── Likes modal ── */}
      <AnimatePresence>
        {showLikes && (
          <LikesModal likes={likes} onClose={() => setShowLikes(false)} />
        )}
      </AnimatePresence>

      {/* ── Edit post modal ── */}
      <AnimatePresence>
        {showEditModal && (
          <PostModal
            onClose={() => setShowEditModal(false)}
            editingPost={post}
            onPostUpdated={(updated) => {
              onUpdate?.(updated)
              setShowEditModal(false)
            }}
          />
        )}
      </AnimatePresence>
    </motion.article>
  )
}

// ── ContentTypeBadge ──────────────────────────────────────────────────────────

const TYPE_STYLES = {
  post:    'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
  blog:    'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
  article: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
}

const ContentTypeBadge = ({ type = 'post', category }) => {
  const style = TYPE_STYLES[type] || TYPE_STYLES.post
  const label = type.charAt(0).toUpperCase() + type.slice(1)
  return (
    <span className="inline-flex items-center gap-1">
      <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${style}`}>
        {label}
      </span>
      {type === 'blog' && category && (
        <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-medium
          bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 capitalize">
          {category}
        </span>
      )}
    </span>
  )
}

// ── Icons ──────────────────────────────────────────────────────────────────────

const HeartIcon = ({ filled }) =>
  filled ? (
    <svg className="w-4.5 h-4.5 w-[18px] h-[18px]" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 21.593c-.525-.445-4.52-3.754-6.36-5.55C3.733 14.203 2 12.348 2 9.5 2 6.42 4.42 4 7.5 4c1.743 0 3.345.872 4.5 2.201C13.155 4.872 14.757 4 16.5 4 19.58 4 22 6.42 22 9.5c0 2.848-1.733 4.703-3.64 6.543C16.52 17.839 12.525 21.148 12 21.593z" />
    </svg>
  ) : (
    <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
  )

const CommentIcon = () => (
  <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </svg>
)

const EyeIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
)

const TrashIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
)

const PencilIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
  </svg>
)

export default PostCard
