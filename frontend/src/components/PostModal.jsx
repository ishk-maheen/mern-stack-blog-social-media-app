import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { useAuth } from '../hooks/useAuth'
import {
  createPost,
  createScheduledPost,
  editPost as editPostApi,
  editScheduledPost as editScheduledPostApi,
} from '../services/api'
import Avatar from './Avatar'

// ── Constants ──────────────────────────────────────────────────────────────────

const CONTENT_TYPES = [
  { value: 'post',    label: 'Post',    icon: '📝' },
  { value: 'blog',    label: 'Blog',    icon: '✍️' },
  { value: 'article', label: 'Article', icon: '📰' },
]

const BLOG_CATEGORIES = [
  'Educational', 'Technology', 'Programming', 'Design',
  'Business', 'Lifestyle', 'Health', 'Travel', 'Food', 'Others',
]

// ── Helpers ────────────────────────────────────────────────────────────────────

const minDatetime = () => {
  const d = new Date(Date.now() + 60_000)
  return d.toISOString().slice(0, 16)
}

// Converts a server date string to datetime-local input value in local time
const toDatetimeLocal = (dateStr) => {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const offset = d.getTimezoneOffset() * 60_000
  return new Date(d - offset).toISOString().slice(0, 16)
}

// ── PostModal ──────────────────────────────────────────────────────────────────
//
// Modes:
//   create          — no editingPost / editingScheduledPost props
//   edit published  — editingPost prop provided
//   edit scheduled  — editingScheduledPost prop provided

const PostModal = ({
  onClose,
  onPostCreated,          // create mode
  editingPost,            // edit-published mode: the post object
  onPostUpdated,          // edit-published mode: callback(updatedPost)
  editingScheduledPost,   // edit-scheduled mode: the scheduled post object
  onScheduledUpdated,     // edit-scheduled mode: callback(updatedSp)
}) => {
  const { user } = useAuth()

  const isEditPost      = !!editingPost
  const isEditScheduled = !!editingScheduledPost
  const isEditing       = isEditPost || isEditScheduled

  // Seed initial data from whichever editing prop is supplied
  const seed = editingPost || editingScheduledPost || {}

  const existingMediaUrl  = (seed.mediaUrl && seed.mediaType !== 'none') ? seed.mediaUrl  : ''
  const existingMediaType = (seed.mediaUrl && seed.mediaType !== 'none') ? seed.mediaType : null

  const [title,            setTitle]            = useState(seed.title       || '')
  const [description,      setDescription]      = useState(seed.description || '')
  const [contentType,      setContentType]      = useState(seed.contentType || 'post')
  const [category,         setCategory]         = useState(seed.category    || '')
  const [mediaFile,        setMediaFile]        = useState(null)
  const [mediaPreview,     setMediaPreview]     = useState(existingMediaUrl || null)
  const [mediaType,        setMediaType]        = useState(existingMediaType)
  const [shouldRemoveMedia,setShouldRemoveMedia] = useState(false)
  const [publishMode,      setPublishMode]      = useState('now') // create-mode only
  const [scheduledAt,      setScheduledAt]      = useState(
    isEditScheduled ? toDatetimeLocal(editingScheduledPost.publishAt) : ''
  )
  const [loading,  setLoading]  = useState(false)
  const [dragOver, setDragOver] = useState(false)

  const fileRef     = useRef(null)
  const textareaRef = useRef(null)

  // ── Media handlers ───────────────────────────────────────────────────────────

  const applyFile = (file) => {
    if (!file) return
    const isImage = file.type.startsWith('image/')
    const isVideo = file.type.startsWith('video/')
    if (!isImage && !isVideo) return toast.error('Only image and video files are allowed')
    if (file.size > 100 * 1024 * 1024) return toast.error('File must be under 100 MB')

    setMediaFile(file)
    setMediaType(isVideo ? 'video' : 'image')
    setMediaPreview(URL.createObjectURL(file))
    setShouldRemoveMedia(false)
  }

  const handleFileInput = (e) => applyFile(e.target.files[0])
  const handleDrop      = (e) => { e.preventDefault(); setDragOver(false); applyFile(e.dataTransfer.files[0]) }
  const handleDragOver  = (e) => { e.preventDefault(); setDragOver(true)  }
  const handleDragLeave = ()  => setDragOver(false)

  const handleRemoveMedia = () => {
    if (mediaFile) {
      // Undo new-file selection — revert to original media if any
      setMediaFile(null)
      setMediaPreview(existingMediaUrl || null)
      setMediaType(existingMediaType)
      setShouldRemoveMedia(false)
    } else {
      // Remove the existing server media
      setMediaPreview(null)
      setMediaType(null)
      setShouldRemoveMedia(true)
    }
    if (fileRef.current) fileRef.current.value = ''
  }

  // ── Auto-resize textarea ─────────────────────────────────────────────────────

  const handleDescChange = (e) => {
    setDescription(e.target.value)
    const el = e.target
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }

  // ── Derived label (used in toasts, header, and submit button) ─────────────────

  const typeLabel = CONTENT_TYPES.find((t) => t.value === contentType)?.label || 'Post'

  // ── Submit ────────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!title.trim())       return toast.error('Title is required')
    if (!description.trim()) return toast.error('Description is required')
    if (contentType === 'blog' && !category) return toast.error('Please select a blog category')

    const needsSchedule = isEditScheduled || publishMode === 'schedule'
    if (needsSchedule) {
      if (!scheduledAt)                        return toast.error('Please select a publish time')
      if (new Date(scheduledAt) <= new Date()) return toast.error('Scheduled time must be in the future')
    }

    const fd = new FormData()
    fd.append('title',       title.trim())
    fd.append('description', description.trim())
    fd.append('contentType', contentType)
    if (contentType === 'blog' && category) fd.append('category', category.toLowerCase())
    if (mediaFile)              fd.append('media',       mediaFile)
    else if (shouldRemoveMedia) fd.append('removeMedia', 'true')

    setLoading(true)
    try {
      if (isEditPost) {
        const { data } = await editPostApi(editingPost._id, fd)
        toast.success(`${typeLabel} updated!`)
        onPostUpdated?.(data)
        onClose()
      } else if (isEditScheduled) {
        fd.append('publishAt', new Date(scheduledAt).toISOString())
        const { data } = await editScheduledPostApi(editingScheduledPost._id, fd)
        toast.success(`Scheduled ${typeLabel.toLowerCase()} updated!`)
        onScheduledUpdated?.(data)
        onClose()
      } else if (publishMode === 'schedule') {
        fd.append('publishAt', new Date(scheduledAt).toISOString())
        await createScheduledPost(fd)
        toast.success(`${typeLabel} scheduled!`)
        onClose()
      } else {
        const { data } = await createPost(fd)
        toast.success(`${typeLabel} published!`)
        onPostCreated(data)
      }
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
        (isEditing ? `Failed to update ${typeLabel.toLowerCase()}` : `Failed to publish ${typeLabel.toLowerCase()}`)
      )
    } finally {
      setLoading(false)
    }
  }

  const canSubmit = title.trim() && description.trim() && !loading

  // ── Header label ─────────────────────────────────────────────────────────────

  const headerTitle = isEditPost      ? `Edit ${typeLabel}`
    : isEditScheduled                 ? `Edit Scheduled ${typeLabel}`
    : `Create ${typeLabel}`

  const submitLabel = isEditPost      ? '💾 Save Changes'
    : isEditScheduled                 ? '📅 Update Schedule'
    : publishMode === 'schedule'      ? `📅 Schedule ${typeLabel}`
    : `⚡ Publish ${typeLabel}`

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Backdrop */}
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        onClick={onClose}
        className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
      />

      {/* Panel */}
      <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4 pointer-events-none">
        <motion.div
          key="panel"
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0,  opacity: 1 }}
          exit={  { y: 80, opacity: 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 320 }}
          onClick={(e) => e.stopPropagation()}
          className="pointer-events-auto w-full sm:max-w-lg
            bg-white dark:bg-gray-900
            rounded-t-3xl sm:rounded-2xl shadow-2xl
            flex flex-col max-h-[92vh] sm:max-h-[85vh]"
        >
          {/* Drag handle (mobile) */}
          <div className="sm:hidden flex justify-center pt-3 pb-1 shrink-0">
            <div className="w-10 h-1 rounded-full bg-gray-200 dark:bg-gray-700" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3.5 shrink-0
            border-b border-gray-100 dark:border-gray-800">
            <h2 className="font-bold text-lg text-gray-900 dark:text-white">{headerTitle}</h2>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700
                dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <XIcon />
            </button>
          </div>

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto">
            <div className="px-5 pt-4 pb-2 space-y-4">

              {/* Author */}
              <div className="flex items-center gap-3">
                <Avatar src={user?.profilePicture} username={user?.username} size={10} />
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{user?.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">@{user?.username}</p>
                </div>
              </div>

              {/* Content type selector */}
              <div>
                <p className="text-xs font-semibold tracking-wider uppercase
                  text-gray-400 dark:text-gray-500 mb-2">
                  Content type
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {CONTENT_TYPES.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => { setContentType(opt.value); if (opt.value !== 'blog') setCategory('') }}
                      className={`flex items-center justify-center gap-1.5 py-2 rounded-xl
                        text-sm font-semibold transition-all ${
                          contentType === opt.value
                            ? 'bg-brand-600 text-white shadow-sm ring-2 ring-brand-600/30'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                        }`}
                    >
                      <span>{opt.icon}</span>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Blog category selector — only for blogs */}
              <AnimatePresence>
                {contentType === 'blog' && (
                  <motion.div
                    key="category"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <label className="block text-xs font-semibold tracking-wider uppercase
                      text-gray-400 dark:text-gray-500 mb-2">
                      Blog category
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl text-sm
                        border border-gray-200 dark:border-gray-700
                        bg-white dark:bg-gray-800
                        text-gray-900 dark:text-white
                        focus:outline-none focus:ring-2 focus:ring-brand-500
                        transition"
                    >
                      <option value="">Select a category…</option>
                      {BLOG_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat.toLowerCase()}>{cat}</option>
                      ))}
                    </select>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Title */}
              <input
                type="text"
                placeholder={`Give your ${typeLabel.toLowerCase()} a title…`}
                value={title}
                maxLength={200}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full text-xl font-bold placeholder-gray-300 dark:placeholder-gray-600
                  text-gray-900 dark:text-white bg-transparent border-none outline-none"
              />

              {/* Description */}
              <textarea
                ref={textareaRef}
                placeholder="What's on your mind?"
                value={description}
                onChange={handleDescChange}
                rows={3}
                className="w-full text-sm placeholder-gray-400 dark:placeholder-gray-500
                  text-gray-700 dark:text-gray-300 bg-transparent border-none outline-none
                  resize-none leading-relaxed"
              />

              {/* Media preview / drop zone */}
              {mediaPreview ? (
                <div className="relative rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800">
                  {mediaType === 'video'
                    ? <video src={mediaPreview} controls className="w-full max-h-64 object-contain" />
                    : <img   src={mediaPreview} alt="Preview" className="w-full max-h-64 object-cover" />
                  }
                  <button
                    onClick={handleRemoveMedia}
                    className="absolute top-2 right-2 p-1.5 rounded-full
                      bg-black/60 hover:bg-black/80 text-white transition-colors"
                  >
                    <XIcon className="w-4 h-4" />
                  </button>
                  <div className="absolute bottom-2 left-2">
                    <span className="text-xs bg-black/60 text-white px-2 py-0.5 rounded-full capitalize">
                      {mediaType}
                    </span>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => fileRef.current?.click()}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  className={`flex flex-col items-center justify-center gap-2 py-7 rounded-xl
                    border-2 border-dashed cursor-pointer transition-colors
                    ${dragOver
                      ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20 text-brand-600'
                      : 'border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-600 hover:border-brand-400 hover:text-brand-500 dark:hover:border-brand-600 dark:hover:text-brand-400'
                    }`}
                >
                  <UploadIcon />
                  <span className="text-sm font-medium">
                    {dragOver ? 'Drop it here' : 'Add photo or video'}
                  </span>
                  <span className="text-xs opacity-60">Click to browse or drag & drop • Max 100 MB</span>
                </div>
              )}

              <input
                ref={fileRef}
                type="file"
                accept="image/*,video/*"
                className="hidden"
                onChange={handleFileInput}
              />

              {/* Publish mode — create mode only */}
              {!isEditing && (
                <div className="pb-1">
                  <p className="text-xs font-semibold tracking-wider uppercase
                    text-gray-400 dark:text-gray-500 mb-2">
                    When to publish
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'now',      icon: '⚡', label: 'Post Now'  },
                      { id: 'schedule', icon: '📅', label: 'Schedule'  },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setPublishMode(opt.id)}
                        className={`flex items-center justify-center gap-2 py-2.5 rounded-xl
                          text-sm font-semibold transition-all ${
                            publishMode === opt.id
                              ? 'bg-brand-600 text-white shadow-sm ring-2 ring-brand-600/30'
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                          }`}
                      >
                        <span>{opt.icon}</span>
                        {opt.label}
                      </button>
                    ))}
                  </div>

                  {publishMode === 'schedule' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0, marginTop: 0 }}
                      animate={{ opacity: 1, height: 'auto', marginTop: 12 }}
                      exit={   { opacity: 0, height: 0, marginTop: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1.5 font-medium">
                        Publish date & time
                      </label>
                      <input
                        type="datetime-local"
                        value={scheduledAt}
                        min={minDatetime()}
                        onChange={(e) => setScheduledAt(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl text-sm
                          border border-gray-200 dark:border-gray-700
                          bg-white dark:bg-gray-800
                          text-gray-900 dark:text-white
                          focus:outline-none focus:ring-2 focus:ring-brand-500
                          [color-scheme:light] dark:[color-scheme:dark]
                          transition"
                      />
                    </motion.div>
                  )}
                </div>
              )}

              {/* Datetime picker — edit-scheduled mode only */}
              {isEditScheduled && (
                <div className="pb-1">
                  <label className="block text-xs font-semibold tracking-wider uppercase
                    text-gray-400 dark:text-gray-500 mb-2">
                    Publish date & time
                  </label>
                  <input
                    type="datetime-local"
                    value={scheduledAt}
                    min={minDatetime()}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl text-sm
                      border border-gray-200 dark:border-gray-700
                      bg-white dark:bg-gray-800
                      text-gray-900 dark:text-white
                      focus:outline-none focus:ring-2 focus:ring-brand-500
                      [color-scheme:light] dark:[color-scheme:dark]
                      transition"
                  />
                </div>
              )}

            </div>
          </div>

          {/* Footer */}
          <div className="px-5 py-4 shrink-0 border-t border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="p-2.5 rounded-xl bg-gray-100 dark:bg-gray-800
                  text-gray-500 dark:text-gray-400
                  hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                aria-label="Attach media"
              >
                <PhotoIcon />
              </button>

              <button
                onClick={handleSubmit}
                disabled={!canSubmit}
                className="flex-1 py-2.5 rounded-xl font-semibold text-sm
                  bg-brand-600 hover:bg-brand-700 active:bg-brand-800
                  disabled:opacity-50 disabled:cursor-not-allowed
                  text-white transition-colors flex items-center justify-center gap-2"
              >
                {loading ? <><Spinner /> Please wait…</> : submitLabel}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  )
}

// ── Icons + primitives ─────────────────────────────────────────────────────────

const XIcon = ({ className = 'w-5 h-5' }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
)
const PhotoIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
)
const UploadIcon = () => (
  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
  </svg>
)
const Spinner = () => (
  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
)

export default PostModal
