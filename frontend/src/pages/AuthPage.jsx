import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../hooks/useAuth'
import { useTheme } from '../hooks/useTheme'
import { login as loginApi, signup as signupApi, reactivateAccount as reactivateAccountApi } from '../services/api'
import FeedoraIcon from '../components/Logo'

// ── Animation variants ─────────────────────────────────────────────────────────
const slideVariants = {
  enter: (dir) => ({ x: dir > 0 ? 48 : -48, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit:  (dir) => ({ x: dir > 0 ? -48 : 48, opacity: 0 }),
}
const transition = { duration: 0.22, ease: 'easeInOut' }

// ── Feature items shown on left panel ─────────────────────────────────────────
const features = [
  { icon: '📝', label: 'Write Blogs',     desc: 'Share ideas with the world'  },
  { icon: '❤️', label: 'Like & Comment',  desc: 'Engage with the community'   },
  { icon: '📅', label: 'Schedule Blogs',  desc: 'Publish at the perfect time' },
]

// ── AuthPage ───────────────────────────────────────────────────────────────────
const AuthPage = () => {
  const [tab, setTab]         = useState('login')
  const [direction, setDir]   = useState(1)
  const [loading, setLoading] = useState(false)
  const [reactivating, setReactivating] = useState(false)

  const [loginForm,  setLoginForm]  = useState({ email: '', password: '' })
  const [signupForm, setSignupForm] = useState({ name: '', username: '', email: '', password: '' })
  const [picFile,    setPicFile]    = useState(null)
  const [picPreview, setPicPreview] = useState(null)

  // Holds { email, password } when login detects a deactivated account.
  // While this is set the reactivation panel is shown instead of the normal forms.
  const [deactivatedCreds, setDeactivatedCreds] = useState(null)

  const fileRef = useRef(null)

  const { login }              = useAuth()
  const { dark, toggleTheme }  = useTheme()
  const navigate               = useNavigate()

  // ── Helpers ──────────────────────────────────────────────────────────────────

  const switchTab = (next) => {
    setDir(next === 'signup' ? 1 : -1)
    setTab(next)
  }

  const handlePicChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (!file.type.startsWith('image/')) return toast.error('Please select an image file')
    setPicFile(file)
    setPicPreview(URL.createObjectURL(file))
  }

  const cancelReactivation = () => {
    setDeactivatedCreds(null)
    // Clear the password field so it isn't left dangling
    setLoginForm((prev) => ({ ...prev, password: '' }))
  }

  // ── Submit handlers ──────────────────────────────────────────────────────────

  const handleLogin = async (e) => {
    e.preventDefault()
    if (!loginForm.email || !loginForm.password) return toast.error('Please fill in all fields')

    setLoading(true)
    try {
      const { data } = await loginApi(loginForm)
      login(data)
      toast.success(`Welcome back, ${data.name}!`)
      navigate(data.isAdmin ? '/admin' : '/home', { replace: true })
    } catch (err) {
      const code = err.response?.data?.code
      if (code === 'ACCOUNT_DEACTIVATED') {
        // Don't toast — slide into the reactivation panel instead
        setDeactivatedCreds({ email: loginForm.email, password: loginForm.password })
      } else {
        toast.error(err.response?.data?.message || 'Login failed')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSignup = async (e) => {
    e.preventDefault()
    const { name, username, email, password } = signupForm

    if (!name || !username || !email || !password) return toast.error('Please fill in all fields')
    if (username.length < 3)                         return toast.error('Username must be at least 3 characters')
    if (!/^[a-zA-Z0-9_]+$/.test(username))          return toast.error('Username: letters, numbers, underscores only')
    if (password.length < 6)                         return toast.error('Password must be at least 6 characters')

    setLoading(true)
    try {
      const fd = new FormData()
      fd.append('name',     name.trim())
      fd.append('username', username.trim().toLowerCase())
      fd.append('email',    email.trim().toLowerCase())
      fd.append('password', password)
      if (picFile) fd.append('profilePicture', picFile)

      const { data } = await signupApi(fd)
      login(data)
      toast.success(`Welcome to Feedora, ${data.name}!`)
      navigate('/home', { replace: true })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Signup failed')
    } finally {
      setLoading(false)
    }
  }

  const handleReactivate = async () => {
    setReactivating(true)
    try {
      const { data } = await reactivateAccountApi(deactivatedCreds)
      login(data)
      toast.success(`Welcome back, ${data.name}! Your account has been reactivated.`)
      navigate('/home', { replace: true })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reactivation failed. Please try again.')
      setReactivating(false)
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-gray-950 transition-colors duration-200">

      {/* ── Left panel — branding (desktop only) ── */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-brand-600 via-brand-600 to-brand-700 relative overflow-hidden flex-col items-center justify-center p-12">

        {/* Decorative blobs */}
        <div className="absolute -top-20 -left-20 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-white/5 rounded-full blur-2xl" />

        <div className="relative z-10 text-white max-w-sm w-full">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-10">
            <FeedoraIcon size={44} />
            <span className="text-3xl font-bold tracking-tight">Feedora</span>
          </div>

          <h2 className="text-4xl font-bold leading-tight mb-4">
            Share stories.<br />Connect minds.
          </h2>
          <p className="text-blue-100 text-base leading-relaxed mb-10">
            A social blog platform inspired by the best of Facebook, Instagram, and LinkedIn — all in one place.
          </p>

          {/* Feature cards */}
          <div className="space-y-4">
            {features.map((f) => (
              <div key={f.label} className="flex items-center gap-4 bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
                <span className="text-2xl">{f.icon}</span>
                <div>
                  <p className="font-semibold text-sm">{f.label}</p>
                  <p className="text-blue-200 text-xs">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right panel — form ── */}
      <div className="w-full lg:w-1/2 flex flex-col">

        {/* Top bar */}
        <div className="flex items-center justify-between p-4 sm:p-6">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2">
            <FeedoraIcon size={28} />
            <span className="text-xl font-bold text-brand-600">Feedora</span>
          </div>
          <div className="lg:ml-auto">
            <ThemeToggle dark={dark} toggleTheme={toggleTheme} />
          </div>
        </div>

        {/* Form wrapper */}
        <div className="flex-1 flex items-center justify-center p-6 sm:p-10">
          <div className="w-full max-w-md">

            {/* Tab switcher — hidden during reactivation flow */}
            {!deactivatedCreds && (
              <div className="flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1 mb-8">
                {['login', 'signup'].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => switchTab(t)}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-semibold capitalize transition-all duration-200 ${
                      tab === t
                        ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                    }`}
                  >
                    {t === 'login' ? 'Sign In' : 'Sign Up'}
                  </button>
                ))}
              </div>
            )}

            {/* Animated form area */}
            <div className="overflow-hidden">
              <AnimatePresence mode="wait" custom={direction}>

                {/* ── Reactivation panel ── */}
                {deactivatedCreds && (
                  <motion.div
                    key="reactivate"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={transition}
                    className="space-y-6"
                  >
                    {/* Status indicator */}
                    <div className="flex flex-col items-center text-center gap-3">
                      <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30
                        flex items-center justify-center">
                        <LockIcon />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                          Account Deactivated
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          Your account has been deactivated
                        </p>
                      </div>
                    </div>

                    {/* Info card */}
                    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200
                      dark:border-amber-800/40 rounded-xl p-4 space-y-2">
                      <p className="text-sm text-amber-800 dark:text-amber-200 font-medium">
                        Signed in as
                      </p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white break-all">
                        {deactivatedCreds.email}
                      </p>
                      <p className="text-xs text-amber-700 dark:text-amber-300 pt-1">
                        Reactivating will restore your account. All your blogs, comments, and profile data remain intact.
                      </p>
                    </div>

                    {/* Reactivate button */}
                    <button
                      type="button"
                      onClick={handleReactivate}
                      disabled={reactivating}
                      className="w-full py-3 rounded-lg bg-brand-600 hover:bg-brand-700 active:bg-brand-700
                        disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-sm
                        transition-colors flex items-center justify-center gap-2"
                    >
                      {reactivating
                        ? <><Spinner /> Reactivating…</>
                        : 'Reactivate & Sign In'
                      }
                    </button>

                    {/* Back link */}
                    <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                      Not your account?{' '}
                      <button
                        type="button"
                        onClick={cancelReactivation}
                        className="text-brand-600 font-semibold hover:underline"
                      >
                        Go back
                      </button>
                    </p>
                  </motion.div>
                )}

                {/* ── Login form ── */}
                {!deactivatedCreds && tab === 'login' && (
                  <motion.form
                    key="login"
                    custom={direction}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={transition}
                    onSubmit={handleLogin}
                    className="space-y-5"
                  >
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Welcome back</h2>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Sign in to continue</p>
                    </div>

                    <InputField
                      label="Email address"
                      type="email"
                      placeholder="you@example.com"
                      value={loginForm.email}
                      onChange={(v) => setLoginForm({ ...loginForm, email: v })}
                      autoComplete="email"
                    />
                    <InputField
                      label="Password"
                      type="password"
                      placeholder="••••••••"
                      value={loginForm.password}
                      onChange={(v) => setLoginForm({ ...loginForm, password: v })}
                      autoComplete="current-password"
                    />

                    <SubmitBtn loading={loading} label="Sign In" />

                    <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                      Don&apos;t have an account?{' '}
                      <button type="button" onClick={() => switchTab('signup')}
                        className="text-brand-600 font-semibold hover:underline">
                        Sign up free
                      </button>
                    </p>
                  </motion.form>
                )}

                {/* ── Signup form ── */}
                {!deactivatedCreds && tab === 'signup' && (
                  <motion.form
                    key="signup"
                    custom={direction}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={transition}
                    onSubmit={handleSignup}
                    className="space-y-4"
                  >
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Create account</h2>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Join Feedora today — it&apos;s free</p>
                    </div>

                    {/* Profile picture */}
                    <div className="flex flex-col items-center gap-2 py-1">
                      <button type="button" onClick={() => fileRef.current?.click()}
                        className="relative group focus:outline-none">
                        <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-dashed border-gray-300 dark:border-gray-600 group-hover:border-brand-500 transition-colors bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                          {picPreview
                            ? <img src={picPreview} alt="Preview" className="w-full h-full object-cover" />
                            : <CameraIcon />
                          }
                        </div>
                        <span className="absolute bottom-0 right-0 w-6 h-6 bg-brand-600 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-900">
                          <PlusIcon />
                        </span>
                      </button>
                      <span className="text-xs text-gray-400">
                        {picPreview ? 'Tap to change photo' : 'Add profile photo (optional)'}
                      </span>
                      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePicChange} />
                    </div>

                    {/* Name + Username side by side */}
                    <div className="grid grid-cols-2 gap-3">
                      <InputField
                        label="Full Name"
                        type="text"
                        placeholder="John Doe"
                        value={signupForm.name}
                        onChange={(v) => setSignupForm({ ...signupForm, name: v })}
                        autoComplete="name"
                      />
                      <InputField
                        label="Username"
                        type="text"
                        placeholder="johndoe"
                        value={signupForm.username}
                        onChange={(v) => setSignupForm({ ...signupForm, username: v.toLowerCase().replace(/\s/g, '') })}
                        autoComplete="username"
                        prefix="@"
                      />
                    </div>
                    <InputField
                      label="Email address"
                      type="email"
                      placeholder="you@example.com"
                      value={signupForm.email}
                      onChange={(v) => setSignupForm({ ...signupForm, email: v })}
                      autoComplete="email"
                    />
                    <InputField
                      label="Password"
                      type="password"
                      placeholder="Min. 6 characters"
                      value={signupForm.password}
                      onChange={(v) => setSignupForm({ ...signupForm, password: v })}
                      autoComplete="new-password"
                    />

                    <SubmitBtn loading={loading} label="Create Account" />

                    <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                      Already have an account?{' '}
                      <button type="button" onClick={() => switchTab('login')}
                        className="text-brand-600 font-semibold hover:underline">
                        Sign in
                      </button>
                    </p>
                  </motion.form>
                )}

              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Shared sub-components ──────────────────────────────────────────────────────

const InputField = ({ label, type, placeholder, value, onChange, autoComplete, prefix }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
      {label}
    </label>
    <div className="relative">
      {prefix && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm select-none">
          {prefix}
        </span>
      )}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        className={`w-full py-2.5 pr-4 rounded-lg border border-gray-300 dark:border-gray-700
          bg-white dark:bg-gray-800 text-gray-900 dark:text-white
          placeholder-gray-400 dark:placeholder-gray-500 text-sm
          focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent
          transition-shadow ${prefix ? 'pl-7' : 'pl-4'}`}
      />
    </div>
  </div>
)

const SubmitBtn = ({ loading, label }) => (
  <button
    type="submit"
    disabled={loading}
    className="w-full py-3 rounded-lg bg-brand-600 hover:bg-brand-700 active:bg-brand-700
      disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-sm
      transition-colors flex items-center justify-center gap-2 mt-1"
  >
    {loading
      ? <><Spinner /> Please wait…</>
      : label
    }
  </button>
)

const ThemeToggle = ({ dark, toggleTheme }) => (
  <button
    onClick={toggleTheme}
    aria-label="Toggle dark mode"
    className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
  >
    {dark
      ? <SunIcon />
      : <MoonIcon />
    }
  </button>
)

// ── Tiny SVG icons ─────────────────────────────────────────────────────────────
const LockIcon = () => (
  <svg className="w-8 h-8 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
)
const CameraIcon = () => (
  <svg className="w-7 h-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
      d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
)
const PlusIcon = () => (
  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
  </svg>
)
const Spinner = () => (
  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
)
const SunIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
  </svg>
)
const MoonIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M21 12.79A9 9 0 1111.21 3a7 7 0 009.79 9.79z" />
  </svg>
)

export default AuthPage
