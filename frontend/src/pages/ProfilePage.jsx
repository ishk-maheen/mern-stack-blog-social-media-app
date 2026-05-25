import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import Navbar from '../components/Navbar'
import PostCard from '../components/PostCard'
import { useAuth } from '../hooks/useAuth'
import {
  getUserProfile,
  getUserPosts,
  updateProfilePicture,
  updateBanner,
  deleteAccount as deleteAccountApi,
  deactivateAccount as deactivateAccountApi,
} from '../services/api'

// ── ProfilePage ────────────────────────────────────────────────────────────────

const ProfilePage = () => {
  const { username }     = useParams()
  const { user, updateUser, logout } = useAuth()
  const navigate         = useNavigate()

  const [profile,           setProfile]           = useState(null)
  const [posts,             setPosts]             = useState([])
  const [loading,           setLoading]           = useState(true)
  const [uploading,         setUploading]         = useState(null) // 'avatar' | 'banner' | null
  const [confirmDeactivate, setConfirmDeactivate] = useState(false)
  const [confirmDeleteAcct, setConfirmDeleteAcct] = useState(false)
  const [acctActionLoading, setAcctActionLoading] = useState(null) // 'deactivate' | 'delete' | null

  const avatarRef = useRef(null)
  const bannerRef = useRef(null)

  const isOwner = user?.username?.toLowerCase() === username?.toLowerCase()

  // ── Fetch profile + posts in parallel ────────────────────────────────────────
  useEffect(() => {
    let cancelled = false

    const load = async () => {
      setLoading(true)
      try {
        const [{ data: prof }, { data: userPosts }] = await Promise.all([
          getUserProfile(username),
          getUserPosts(username),
        ])
        if (!cancelled) { setProfile(prof); setPosts(userPosts) }
      } catch (err) {
        if (!cancelled) {
          toast.error(err.response?.status === 404 ? 'User not found' : 'Failed to load profile')
          navigate('/', { replace: true })
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [username, navigate])

  // ── Update profile picture ────────────────────────────────────────────────────
  const handleAvatarChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (!file.type.startsWith('image/')) return toast.error('Please select an image file')

    setUploading('avatar')
    try {
      const fd = new FormData()
      fd.append('profilePicture', file)
      const { data } = await updateProfilePicture(fd)
      const pic = data.profilePicture

      // Update profile card
      setProfile((p) => ({ ...p, profilePicture: pic }))
      // Update author avatar in all posts currently on this page
      setPosts((prev) => prev.map((p) => ({ ...p, author: { ...p.author, profilePicture: pic } })))
      // Sync Navbar + localStorage
      updateUser({ profilePicture: pic })
      toast.success('Profile picture updated!')
    } catch {
      toast.error('Failed to update profile picture')
    } finally {
      setUploading(null)
      if (avatarRef.current) avatarRef.current.value = ''
    }
  }

  // ── Update banner ─────────────────────────────────────────────────────────────
  const handleBannerChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (!file.type.startsWith('image/')) return toast.error('Please select an image file')

    setUploading('banner')
    try {
      const fd = new FormData()
      fd.append('banner', file)
      const { data } = await updateBanner(fd)

      setProfile((p) => ({ ...p, banner: data.banner }))
      updateUser({ banner: data.banner })
      toast.success('Banner updated!')
    } catch {
      toast.error('Failed to update banner')
    } finally {
      setUploading(null)
      if (bannerRef.current) bannerRef.current.value = ''
    }
  }

  // ── PostCard callbacks ────────────────────────────────────────────────────────
  const handlePostUpdate = (updated) =>
    setPosts((prev) => prev.map((p) => (p._id === updated._id ? updated : p)))

  const handlePostDelete = (id) =>
    setPosts((prev) => prev.filter((p) => p._id !== id))

  // ── Account management ────────────────────────────────────────────────────────
  const handleDeactivate = async () => {
    setAcctActionLoading('deactivate')
    try {
      await deactivateAccountApi()
      toast.success('Account deactivated. You have been logged out.')
      logout()
      navigate('/auth', { replace: true })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to deactivate account')
      setAcctActionLoading(null)
      setConfirmDeactivate(false)
    }
  }

  const handleDeleteAccount = async () => {
    setAcctActionLoading('delete')
    try {
      await deleteAccountApi()
      toast.success('Account permanently deleted.')
      logout()
      navigate('/auth', { replace: true })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete account')
      setAcctActionLoading(null)
      setConfirmDeleteAcct(false)
    }
  }

  // ── Loading ───────────────────────────────────────────────────────────────────
  if (loading) return <ProfileSkeleton />
  if (!profile) return null

  const joinDate = new Date(profile.createdAt).toLocaleDateString('en-US', {
    month: 'long', year: 'numeric',
  })

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />

      <div className="max-w-2xl mx-auto pt-14 pb-16">

        {/* ── Banner ── */}
        <div className="relative h-40 sm:h-52 overflow-hidden group/banner">

          {profile.banner ? (
            <img
              src={profile.banner}
              alt="Profile banner"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-brand-500 via-brand-600 to-purple-600" />
          )}

          {/* Bottom gradient fade */}
          <div className="absolute inset-x-0 bottom-0 h-20
            bg-gradient-to-t from-gray-50 dark:from-gray-950 to-transparent pointer-events-none" />

          {/* Edit banner button — own profile */}
          {isOwner && (
            <button
              onClick={() => bannerRef.current?.click()}
              disabled={!!uploading}
              className="absolute top-3 right-3 flex items-center gap-1.5
                px-3 py-1.5 rounded-lg text-xs font-medium text-white
                bg-black/40 hover:bg-black/60 backdrop-blur-sm
                transition-colors disabled:opacity-60"
            >
              {uploading === 'banner'
                ? <><BtnSpinner />Uploading…</>
                : <><CamIcon size={14} />Edit Banner</>
              }
            </button>
          )}
        </div>

        {/* ── Avatar + info ── */}
        <div className="px-4 sm:px-5">
          <div className="flex items-end justify-between -mt-11 mb-4 relative z-10">

            {/* Avatar wrapper */}
            <div className="relative">
              {/* Image / fallback */}
              <div className="w-24 h-24 rounded-full overflow-hidden
                border-4 border-gray-50 dark:border-gray-950 shadow-lg
                bg-gradient-to-br from-brand-500 to-brand-700">
                {profile.profilePicture ? (
                  <img
                    src={profile.profilePicture}
                    alt={profile.username}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center
                    text-white text-3xl font-bold select-none">
                    {profile.username?.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              {/* Edit avatar overlay — own profile */}
              {isOwner && (
                <button
                  onClick={() => avatarRef.current?.click()}
                  disabled={!!uploading}
                  aria-label="Change profile picture"
                  className="absolute inset-0 rounded-full flex items-center justify-center
                    bg-black/0 hover:bg-black/45 transition-colors group/av
                    disabled:cursor-not-allowed"
                >
                  <span className="opacity-0 group-hover/av:opacity-100 transition-opacity">
                    {uploading === 'avatar'
                      ? <BtnSpinner white />
                      : <CamIcon size={28} white />
                    }
                  </span>
                </button>
              )}
            </div>

            {/* Hint for owner */}
            {isOwner && (
              <p className="hidden sm:block text-xs text-gray-400 dark:text-gray-500 mb-1 select-none">
                Tap avatar or banner to edit
              </p>
            )}
          </div>

          {/* Name / username / joined */}
          <div className="mb-5">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">
              {profile.name}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              @{profile.username}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 flex items-center gap-1">
              <CalIcon />
              Joined {joinDate}
            </p>
          </div>

          {/* ── Blogs section ── */}
          <div className="border-t border-gray-100 dark:border-gray-800 pt-4">
            <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-4
              flex items-center gap-2">
              <PostsIcon />
              {isOwner ? 'Your Blogs' : 'Blogs'}
              <span className="text-gray-400 dark:text-gray-500 font-normal">
                ({posts.length})
              </span>
            </p>

            {posts.length === 0 ? (
              <EmptyPosts isOwner={isOwner} username={profile.username} />
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-4"
              >
                {posts.map((post) => (
                  <PostCard
                    key={post._id}
                    post={post}
                    onUpdate={handlePostUpdate}
                    onDelete={handlePostDelete}
                  />
                ))}
              </motion.div>
            )}
          </div>

          {/* ── Danger Zone (owner only) ── */}
          {isOwner && (
            <div className="mt-8 border-t border-gray-100 dark:border-gray-800 pt-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-red-500 mb-3">
                Danger Zone
              </p>
              <div className="border border-red-200 dark:border-red-900/40 rounded-xl divide-y
                divide-red-100 dark:divide-red-900/30">

                {/* Deactivate */}
                <div className="flex items-start justify-between gap-4 p-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Deactivate Account</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      Disable your account. You can reactivate anytime by signing in with your credentials.
                    </p>
                  </div>
                  {confirmDeactivate ? (
                    <div className="flex items-center gap-3 shrink-0">
                      <button
                        onClick={() => setConfirmDeactivate(false)}
                        className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700
                          dark:hover:text-gray-200 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleDeactivate}
                        disabled={!!acctActionLoading}
                        className="text-xs font-semibold text-amber-600 hover:text-amber-700
                          disabled:opacity-50 transition-colors"
                      >
                        {acctActionLoading === 'deactivate' ? 'Deactivating…' : 'Confirm'}
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setConfirmDeactivate(true); setConfirmDeleteAcct(false) }}
                      className="shrink-0 px-3 py-1.5 text-xs font-semibold rounded-lg
                        border border-amber-500 text-amber-600
                        hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"
                    >
                      Deactivate
                    </button>
                  )}
                </div>

                {/* Delete */}
                <div className="flex items-start justify-between gap-4 p-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Delete Account</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      Permanently delete your account, all your blogs, and all your data. This cannot be undone.
                    </p>
                  </div>
                  {confirmDeleteAcct ? (
                    <div className="flex items-center gap-3 shrink-0">
                      <button
                        onClick={() => setConfirmDeleteAcct(false)}
                        className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700
                          dark:hover:text-gray-200 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleDeleteAccount}
                        disabled={!!acctActionLoading}
                        className="text-xs font-semibold text-red-500 hover:text-red-600
                          disabled:opacity-50 transition-colors"
                      >
                        {acctActionLoading === 'delete' ? 'Deleting…' : 'Confirm'}
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setConfirmDeleteAcct(true); setConfirmDeactivate(false) }}
                      className="shrink-0 px-3 py-1.5 text-xs font-semibold rounded-lg
                        border border-red-500 text-red-500
                        hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      Delete
                    </button>
                  )}
                </div>

              </div>
            </div>
          )}
        </div>
      </div>

      {/* Hidden file inputs */}
      <input
        ref={avatarRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleAvatarChange}
      />
      <input
        ref={bannerRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleBannerChange}
      />
    </div>
  )
}

// ── Profile skeleton ───────────────────────────────────────────────────────────

const ProfileSkeleton = () => (
  <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
    <Navbar />
    <div className="max-w-2xl mx-auto pt-14 pb-16">
      {/* Banner */}
      <div className="h-40 sm:h-52 bg-gray-200 dark:bg-gray-800 animate-pulse" />

      <div className="px-4 sm:px-5">
        {/* Avatar */}
        <div className="-mt-11 mb-4">
          <div className="w-24 h-24 rounded-full bg-gray-200 dark:bg-gray-800 animate-pulse
            border-4 border-gray-50 dark:border-gray-950" />
        </div>

        {/* Name + username */}
        <div className="space-y-2 mb-6">
          <div className="h-5 w-40 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
          <div className="h-4 w-28 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
          <div className="h-3 w-36 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
        </div>

        {/* Post skeletons */}
        <div className="border-t border-gray-100 dark:border-gray-800 pt-4 space-y-4">
          {[1, 2].map((i) => (
            <div key={i}
              className="bg-white dark:bg-gray-900 rounded-2xl p-5 animate-pulse
                border border-gray-100 dark:border-gray-800">
              <div className="flex gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
                  <div className="h-2.5 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-4/5" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
)

// ── Empty posts state ──────────────────────────────────────────────────────────

const EmptyPosts = ({ isOwner, username }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="text-center py-14 px-4"
  >
    <div className="text-5xl mb-3">✍️</div>
    <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
      {isOwner ? "You haven't blogged yet" : `@${username} hasn't blogged yet`}
    </h3>
    <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
      {isOwner
        ? 'Share your first thought with the community'
        : 'Check back later for blogs from this user'}
    </p>
    {isOwner && (
      <Link
        to="/home"
        className="inline-block px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700
          text-white text-sm font-semibold transition-colors"
      >
        Create your first blog
      </Link>
    )}
  </motion.div>
)

// ── Tiny primitives ────────────────────────────────────────────────────────────

const BtnSpinner = ({ white = false }) => (
  <div className={`w-3.5 h-3.5 border-2 rounded-full animate-spin shrink-0
    ${white ? 'border-white border-t-transparent' : 'border-gray-100 border-t-transparent'}`} />
)

const CamIcon = ({ size = 16, white = false }) => (
  <svg
    style={{ width: size, height: size, flexShrink: 0 }}
    className={white ? 'text-white' : 'text-current'}
    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}
  >
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
)
const CalIcon = () => (
  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
)
const PostsIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
  </svg>
)

export default ProfilePage
