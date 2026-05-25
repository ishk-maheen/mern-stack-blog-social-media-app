import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import Avatar from './Avatar'

const LikesModal = ({ likes = [], onClose }) => (
  <>
    {/* Backdrop */}
    <motion.div
      key="likes-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
    />

    {/* Card */}
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
      <motion.div
        key="likes-card"
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1,    y: 0  }}
        exit={  { opacity: 0, scale: 0.95, y: 12  }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
        onClick={(e) => e.stopPropagation()}
        className="pointer-events-auto w-full max-w-sm
          bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4
          border-b border-gray-100 dark:border-gray-800">
          <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <span className="text-red-400 text-lg">❤</span>
            Liked by {likes.length} {likes.length === 1 ? 'person' : 'people'}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700
              dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <XIcon />
          </button>
        </div>

        {/* User list */}
        <ul className="max-h-80 overflow-y-auto divide-y divide-gray-50 dark:divide-gray-800">
          {likes.length === 0 ? (
            <li className="py-10 text-center text-sm text-gray-400 dark:text-gray-500">
              No likes yet
            </li>
          ) : (
            likes.map((u) => (
              <li key={u._id}>
                <Link
                  to={`/profile/${u.username}`}
                  onClick={onClose}
                  className="flex items-center gap-3 px-5 py-3
                    hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <Avatar src={u.profilePicture} username={u.username} size={10} />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                      {u.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      @{u.username}
                    </p>
                  </div>
                </Link>
              </li>
            ))
          )}
        </ul>
      </motion.div>
    </div>
  </>
)

const XIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
)

export default LikesModal
