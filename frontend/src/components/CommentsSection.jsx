import { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import Avatar from './Avatar'
import { useAuth } from '../hooks/useAuth'
import { addComment, editComment as editCommentApi, deleteComment as deleteCommentApi } from '../services/api'
import { timeAgo } from '../utils/helpers'

const CommentsSection = ({ postId, comments = [], onCommentAdded, onCommentUpdated, onCommentDeleted }) => {
  const { user }                      = useAuth()
  const [text,       setText]         = useState('')
  const [loading,    setLoading]      = useState(false)
  const [editingId,  setEditingId]    = useState(null)
  const [editText,   setEditText]     = useState('')
  const [deletingId, setDeletingId]   = useState(null)
  const inputRef                      = useRef(null)

  // ── Add comment ───────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault()
    const trimmed = text.trim()
    if (!trimmed) return
    if (trimmed.length > 500) return toast.error('Comment must be under 500 characters')

    setLoading(true)
    try {
      const { data } = await addComment(postId, trimmed)
      onCommentAdded(data)
      setText('')
      inputRef.current?.focus()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add comment')
    } finally {
      setLoading(false)
    }
  }

  // ── Edit comment ──────────────────────────────────────────────────────────────
  const startEdit = (comment) => {
    setEditingId(comment._id)
    setEditText(comment.text)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditText('')
  }

  const handleEditSubmit = async (commentId) => {
    const trimmed = editText.trim()
    if (!trimmed) return toast.error('Comment cannot be empty')
    if (trimmed.length > 500) return toast.error('Comment must be under 500 characters')

    try {
      const { data } = await editCommentApi(postId, commentId, trimmed)
      onCommentUpdated(data)
      setEditingId(null)
      setEditText('')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to edit comment')
    }
  }

  // ── Delete comment ────────────────────────────────────────────────────────────
  const handleDelete = async (commentId) => {
    setDeletingId(commentId)
    try {
      await deleteCommentApi(postId, commentId)
      onCommentDeleted(commentId)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete comment')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={  { opacity: 0, height: 0 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      className="overflow-hidden border-t border-gray-100 dark:border-gray-800"
    >
      <div className="px-4 py-3 space-y-1">

        {/* Comment list */}
        {comments.length > 0 && (
          <ul className="space-y-3 mb-3">
            {[...comments].reverse().map((c) => {
              const isOwner = user?._id === c.author?._id
              const isEditing = editingId === c._id

              return (
                <li key={c._id} className="flex gap-2.5">
                  <Link to={`/profile/${c.author?.username}`} className="shrink-0 mt-0.5">
                    <Avatar
                      src={c.author?.profilePicture}
                      username={c.author?.username}
                      size={8}
                    />
                  </Link>

                  <div className="flex-1 min-w-0">
                    {isEditing ? (
                      /* ── Inline edit form ── */
                      <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-tl-sm px-3 py-2">
                        <p className="text-xs font-semibold text-gray-900 dark:text-white mb-1">
                          {c.author?.name}
                        </p>
                        <input
                          type="text"
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          maxLength={500}
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleEditSubmit(c._id)
                            if (e.key === 'Escape') cancelEdit()
                          }}
                          className="w-full text-sm bg-transparent text-gray-800 dark:text-gray-200
                            outline-none border-b border-brand-400 dark:border-brand-500 pb-0.5"
                        />
                        <div className="flex gap-3 mt-2">
                          <button
                            onClick={() => handleEditSubmit(c._id)}
                            className="text-xs font-semibold text-brand-600 dark:text-brand-400
                              hover:text-brand-700 transition-colors"
                          >
                            Save
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="text-xs text-gray-400 dark:text-gray-500
                              hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* ── Normal comment view ── */
                      <>
                        <div className="inline-block bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-tl-sm px-3 py-2">
                          <Link
                            to={`/profile/${c.author?.username}`}
                            className="block text-xs font-semibold text-gray-900 dark:text-white
                              hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
                          >
                            {c.author?.name}
                          </Link>
                          <p className="text-sm text-gray-700 dark:text-gray-300 mt-0.5 break-words">
                            {c.text}
                          </p>
                        </div>

                        <div className="flex items-center gap-3 mt-1 pl-1">
                          <p className="text-xs text-gray-400 dark:text-gray-500">
                            {timeAgo(c.createdAt)}
                          </p>
                          {c.isEdited && (
                            <span className="text-xs text-gray-400 dark:text-gray-500 italic">
                              Edited
                            </span>
                          )}
                          {isOwner && (
                            <>
                              <button
                                onClick={() => startEdit(c)}
                                className="text-xs text-gray-400 dark:text-gray-500
                                  hover:text-brand-600 dark:hover:text-brand-400
                                  font-medium transition-colors"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDelete(c._id)}
                                disabled={deletingId === c._id}
                                className="text-xs text-gray-400 dark:text-gray-500
                                  hover:text-red-500 dark:hover:text-red-400
                                  font-medium transition-colors disabled:opacity-50"
                              >
                                {deletingId === c._id ? '…' : 'Delete'}
                              </button>
                            </>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        )}

        {/* New comment input */}
        <form onSubmit={handleSubmit} className="flex items-center gap-2.5">
          <Avatar
            src={user?.profilePicture}
            username={user?.username}
            size={8}
            className="shrink-0"
          />
          <div className="flex-1 flex items-center gap-2
            bg-gray-100 dark:bg-gray-800 rounded-full px-4 py-2">
            <input
              ref={inputRef}
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Write a comment…"
              maxLength={500}
              className="flex-1 bg-transparent text-sm text-gray-800 dark:text-gray-200
                placeholder-gray-400 dark:placeholder-gray-500 outline-none"
            />
            <button
              type="submit"
              disabled={!text.trim() || loading}
              className="shrink-0 p-1 rounded-full text-brand-600 dark:text-brand-400
                hover:text-brand-700 disabled:opacity-40 disabled:cursor-not-allowed
                transition-colors"
              aria-label="Send comment"
            >
              {loading ? <Spinner /> : <SendIcon />}
            </button>
          </div>
        </form>

      </div>
    </motion.div>
  )
}

const SendIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
  </svg>
)
const Spinner = () => (
  <div className="w-4 h-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
)

export default CommentsSection
