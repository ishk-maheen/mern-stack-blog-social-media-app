import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '../hooks/useTheme'
import FeedoraIcon from '../components/Logo'

// ── Animation helpers ──────────────────────────────────────────────────────────

const fadeUp = (delay = 0) => ({
  initial:    { opacity: 0, y: 28 },
  whileInView:{ opacity: 1, y: 0  },
  viewport:   { once: true, margin: '-40px' },
  transition: { duration: 0.55, ease: 'easeOut', delay },
})

const fadeIn = (delay = 0) => ({
  initial:    { opacity: 0 },
  whileInView:{ opacity: 1 },
  viewport:   { once: true },
  transition: { duration: 0.5, delay },
})

// ── Mock data (hero + feed preview) ───────────────────────────────────────────

const MOCK_POSTS = [
  {
    id: 1,
    type: 'Blog',
    typeColor: 'bg-emerald-500',
    category: 'Technology',
    title: 'The Future of Web Development in 2025',
    excerpt: 'Exploring the latest trends in React, AI-assisted coding, and edge computing that every developer should know.',
    author: 'Alex Chen',
    username: 'alexchen',
    initials: 'AC',
    avatarGrad: 'from-violet-500 to-purple-600',
    time: '2h ago',
    likes: 142,
    comments: 28,
    views: 891,
  },
  {
    id: 2,
    type: 'Article',
    typeColor: 'bg-purple-500',
    category: 'Design',
    title: 'Building a Modern Design System from Scratch',
    excerpt: 'How to create a scalable, accessible, and beautiful design system that your entire team will actually love using.',
    author: 'Sara Kim',
    username: 'sarakim',
    initials: 'SK',
    avatarGrad: 'from-pink-500 to-rose-500',
    time: '5h ago',
    likes: 89,
    comments: 15,
    views: 534,
  },
  {
    id: 3,
    type: 'Post',
    typeColor: 'bg-blue-500',
    category: null,
    title: 'Just shipped my first open-source project!',
    excerpt: 'After 3 months of late nights and weekends, I finally launched Feedora — a modern social blogging platform.',
    author: 'Mike Dev',
    username: 'mikedev',
    initials: 'MD',
    avatarGrad: 'from-sky-500 to-blue-600',
    time: '1d ago',
    likes: 234,
    comments: 42,
    views: 1203,
  },
]

const FEATURES = [
  {
    icon: '✍️',
    title: 'Create Blogs, Posts & Articles',
    desc: 'Three content types in one platform. Express yourself however you need — quick posts, in-depth blogs, or polished articles.',
    grad: 'from-violet-500 to-purple-600',
  },
  {
    icon: '📅',
    title: 'Schedule Your Content',
    desc: 'Plan ahead and publish at the perfect time. Schedule content days or weeks in advance with our intuitive scheduler.',
    grad: 'from-blue-500 to-cyan-500',
  },
  {
    icon: '❤️',
    title: 'Likes & Comments',
    desc: 'Engage with your community through rich interactions. See who liked your content and join meaningful conversations.',
    grad: 'from-rose-500 to-pink-500',
  },
  {
    icon: '👤',
    title: 'Professional Profiles',
    desc: 'Showcase your work with a beautiful profile. Custom banner, bio, and a full portfolio of your published content.',
    grad: 'from-amber-500 to-orange-500',
  },
  {
    icon: '🌙',
    title: 'Dark Mode',
    desc: 'Easy on the eyes — always. Our carefully crafted dark and light themes look stunning in any lighting condition.',
    grad: 'from-slate-600 to-gray-700',
  },
  {
    icon: '📱',
    title: 'Fully Responsive',
    desc: 'Read and write from anywhere. Feedora looks and works beautifully on desktop, tablet, and mobile devices.',
    grad: 'from-teal-500 to-emerald-500',
  },
]

const CATEGORIES = [
  { label: '💻 Technology',  hot: true  },
  { label: '⌨️ Programming', hot: true  },
  { label: '🎨 Design',      hot: false },
  { label: '💼 Business',    hot: false },
  { label: '❤️ Health',      hot: false },
  { label: '🌿 Lifestyle',   hot: true  },
  { label: '✈️ Travel',      hot: false },
  { label: '🍜 Food',        hot: false },
  { label: '🎓 Educational', hot: false },
  { label: '✨ Others',      hot: false },
]

const STEPS = [
  {
    step: '01',
    icon: '🚀',
    title: 'Create Your Account',
    desc: 'Sign up in seconds. Set up your profile with a photo, banner, and bio that represents you.',
  },
  {
    step: '02',
    icon: '✍️',
    title: 'Publish Your Content',
    desc: 'Write blogs, posts, and articles. Schedule them or go live instantly. Your ideas deserve an audience.',
  },
  {
    step: '03',
    icon: '🌱',
    title: 'Grow Your Audience',
    desc: 'Connect with readers who care about your topics. Build a loyal following and establish your voice.',
  },
]

// ── LandingPage ────────────────────────────────────────────────────────────────

const LandingPage = () => (
  <div className="min-h-screen bg-white dark:bg-gray-950 overflow-x-hidden">

    {/* Background blobs — fixed, behind everything */}
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      <div className="absolute -top-48 -right-48 w-[600px] h-[600px]
        bg-brand-100/60 dark:bg-brand-950/40 rounded-full blur-3xl" />
      <div className="absolute top-1/3 -left-48 w-[500px] h-[500px]
        bg-purple-100/50 dark:bg-purple-950/30 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px]
        bg-pink-100/40 dark:bg-pink-950/20 rounded-full blur-3xl" />
    </div>

    <LandingNav />
    <HeroSection />
    <StatsBar />
    <FeaturesSection />
    <CategoriesSection />
    <FeedPreviewSection />
    <HowItWorksSection />
    <CTABanner />
    <Footer />
  </div>
)

// ── LandingNav ─────────────────────────────────────────────────────────────────

const LandingNav = () => {
  const { dark, toggleTheme } = useTheme()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0,   opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="fixed top-0 inset-x-0 z-50
        bg-white/80 dark:bg-gray-950/80 backdrop-blur-md
        border-b border-gray-200/60 dark:border-gray-800/60 shadow-sm"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 shrink-0">
          <FeedoraIcon size={30} />
          <span className="font-extrabold text-xl tracking-tight
            bg-gradient-to-r from-brand-600 to-purple-600
            bg-clip-text text-transparent">
            Feedora
          </span>
        </Link>

        {/* Desktop actions */}
        <div className="hidden sm:flex items-center gap-3">
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="p-2 rounded-lg text-gray-500 dark:text-gray-400
              hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            {dark ? <SunIcon /> : <MoonIcon />}
          </button>
          <Link
            to="/auth"
            className="px-4 py-2 rounded-xl text-sm font-semibold
              text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700
              hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            Log in
          </Link>
          <Link
            to="/auth"
            className="px-4 py-2 rounded-xl text-sm font-semibold text-white
              bg-gradient-to-r from-brand-600 to-purple-600
              hover:from-brand-700 hover:to-purple-700
              shadow-sm shadow-brand-500/25 transition-all"
          >
            Sign up free
          </Link>
        </div>

        {/* Mobile: theme + hamburger */}
        <div className="flex sm:hidden items-center gap-2">
          <button onClick={toggleTheme} className="p-2 rounded-lg text-gray-500 dark:text-gray-400
            hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            {dark ? <SunIcon /> : <MoonIcon />}
          </button>
          <button
            onClick={() => setMobileOpen((o) => !o)}
            className="p-2 rounded-lg text-gray-500 dark:text-gray-400
              hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            {mobileOpen ? <XIcon /> : <MenuIcon />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="sm:hidden border-t border-gray-100 dark:border-gray-800
              bg-white/95 dark:bg-gray-950/95 backdrop-blur-md overflow-hidden"
          >
            <div className="flex flex-col gap-2 p-4">
              <Link to="/auth" onClick={() => setMobileOpen(false)}
                className="text-center py-2.5 rounded-xl text-sm font-semibold
                  border border-gray-200 dark:border-gray-700
                  text-gray-700 dark:text-gray-300
                  hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                Log in
              </Link>
              <Link to="/auth" onClick={() => setMobileOpen(false)}
                className="text-center py-2.5 rounded-xl text-sm font-semibold text-white
                  bg-gradient-to-r from-brand-600 to-purple-600">
                Sign up free
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  )
}

// ── HeroSection ────────────────────────────────────────────────────────────────

const HeroSection = () => (
  <section className="pt-28 pb-20 sm:pt-36 sm:pb-28 px-4 sm:px-6">
    <div className="max-w-7xl mx-auto">
      <div className="grid lg:grid-cols-2 gap-16 items-center">

        {/* Left — copy */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full
            bg-brand-50 dark:bg-brand-900/30
            border border-brand-200 dark:border-brand-800 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse" />
            <span className="text-xs font-semibold text-brand-700 dark:text-brand-300">
              Modern social blogging platform
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-extrabold
            text-gray-900 dark:text-white leading-[1.1] tracking-tight mb-6">
            Share your ideas{' '}
            <span className="bg-gradient-to-r from-brand-600 via-purple-600 to-pink-500
              bg-clip-text text-transparent">
              with the world
            </span>
          </h1>

          <p className="text-lg text-gray-500 dark:text-gray-400 leading-relaxed mb-8 max-w-lg">
            Write blogs, posts, and articles. Connect with readers who care.
            Schedule content, build your audience, and grow your creative voice —
            all in one modern platform.
          </p>

          <div className="flex flex-wrap gap-3 mb-10">
            <Link
              to="/auth"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl
                font-semibold text-white text-sm
                bg-gradient-to-r from-brand-600 to-purple-600
                hover:from-brand-700 hover:to-purple-700
                shadow-lg shadow-brand-500/30
                hover:shadow-xl hover:shadow-brand-500/40
                hover:-translate-y-0.5 active:translate-y-0
                transition-all duration-200"
            >
              Get Started — it&apos;s free
              <ArrowRightIcon />
            </Link>
            <Link
              to="/auth"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl
                font-semibold text-sm
                text-gray-700 dark:text-gray-200
                border border-gray-200 dark:border-gray-700
                hover:bg-gray-100 dark:hover:bg-gray-800
                hover:-translate-y-0.5 active:translate-y-0
                transition-all duration-200"
            >
              Explore Blogs
            </Link>
          </div>

          {/* Social proof */}
          <div className="flex items-center gap-4 text-sm text-gray-400 dark:text-gray-500">
            <div className="flex -space-x-2">
              {['from-violet-500 to-purple-600','from-pink-500 to-rose-500','from-sky-500 to-blue-600','from-amber-500 to-orange-500'].map((g, i) => (
                <div key={i} className={`w-7 h-7 rounded-full bg-gradient-to-br ${g}
                  ring-2 ring-white dark:ring-gray-950 text-[10px] font-bold
                  text-white flex items-center justify-center`}>
                  {['A','S','M','K'][i]}
                </div>
              ))}
            </div>
            <span>Join <strong className="text-gray-700 dark:text-gray-300">2,000+</strong> creators already writing</span>
          </div>
        </motion.div>

        {/* Right — app preview mockup */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
          className="relative flex justify-center lg:justify-end"
        >
          <div className="relative w-full max-w-[420px]">

            {/* Browser chrome frame */}
            <div className="rounded-2xl shadow-2xl shadow-gray-900/20 dark:shadow-black/40
              border border-gray-200 dark:border-gray-800 overflow-hidden
              bg-white dark:bg-gray-900">

              {/* Browser bar */}
              <div className="flex items-center gap-2 px-4 py-3
                bg-gray-50 dark:bg-gray-800
                border-b border-gray-200 dark:border-gray-700">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <div className="flex-1 mx-4 bg-white dark:bg-gray-700 rounded-md px-3 py-1">
                  <p className="text-[11px] text-gray-400 dark:text-gray-500 font-mono">
                    blogspace.app/home
                  </p>
                </div>
              </div>

              {/* Simulated feed */}
              <div className="p-3 space-y-3 max-h-[480px] overflow-hidden">
                {MOCK_POSTS.map((post, i) => (
                  <MockFeedCard key={post.id} post={post} delay={i * 0.12} />
                ))}
              </div>
            </div>

            {/* Floating badge — top right */}
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -top-5 -right-5 flex items-center gap-2 px-3 py-2
                bg-white dark:bg-gray-800 rounded-xl shadow-lg
                border border-gray-100 dark:border-gray-700"
            >
              <span className="text-lg">🔥</span>
              <div>
                <p className="text-[10px] text-gray-400 dark:text-gray-500 leading-none">Trending</p>
                <p className="text-xs font-bold text-gray-800 dark:text-white leading-tight">142 likes</p>
              </div>
            </motion.div>

            {/* Floating badge — bottom left */}
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
              className="absolute -bottom-5 -left-5 flex items-center gap-2 px-3 py-2
                bg-white dark:bg-gray-800 rounded-xl shadow-lg
                border border-gray-100 dark:border-gray-700"
            >
              <span className="text-lg">💬</span>
              <div>
                <p className="text-[10px] text-gray-400 dark:text-gray-500 leading-none">New comment</p>
                <p className="text-xs font-bold text-gray-800 dark:text-white leading-tight">Great post!</p>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  </section>
)

// ── MockFeedCard (used inside hero) ───────────────────────────────────────────

const MockFeedCard = ({ post, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.45, delay: 0.3 + delay }}
    className="bg-gray-50 dark:bg-gray-800/60 rounded-xl p-3
      border border-gray-100 dark:border-gray-700/60"
  >
    <div className="flex items-center gap-2 mb-2">
      <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${post.avatarGrad}
        flex items-center justify-center text-[10px] font-bold text-white shrink-0`}>
        {post.initials}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate">{post.author}</p>
        <p className="text-[10px] text-gray-400 dark:text-gray-500">{post.time}</p>
      </div>
      <span className={`text-[9px] font-bold uppercase tracking-wide
        px-1.5 py-0.5 rounded text-white ${post.typeColor}`}>
        {post.type}
      </span>
    </div>
    <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 mb-1 line-clamp-1">
      {post.title}
    </p>
    <p className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed mb-2">
      {post.excerpt}
    </p>
    <div className="flex items-center gap-3 text-[10px] text-gray-400 dark:text-gray-500">
      <span>❤️ {post.likes}</span>
      <span>💬 {post.comments}</span>
      <span>👁 {post.views}</span>
    </div>
  </motion.div>
)

// ── StatsBar ───────────────────────────────────────────────────────────────────

const StatsBar = () => (
  <motion.section {...fadeIn(0)}
    className="py-10 border-y border-gray-100 dark:border-gray-800
      bg-gray-50/50 dark:bg-gray-900/50"
  >
    <div className="max-w-4xl mx-auto px-4 sm:px-6">
      <div className="grid grid-cols-3 gap-4 text-center">
        {[
          { value: '2,000+', label: 'Active Creators' },
          { value: '12,000+', label: 'Published Articles' },
          { value: '50,000+', label: 'Monthly Readers' },
        ].map((stat) => (
          <div key={stat.label}>
            <p className="text-2xl sm:text-3xl font-extrabold
              bg-gradient-to-r from-brand-600 to-purple-600
              bg-clip-text text-transparent">
              {stat.value}
            </p>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1 font-medium">
              {stat.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  </motion.section>
)

// ── FeaturesSection ────────────────────────────────────────────────────────────

const FeaturesSection = () => (
  <section className="py-24 px-4 sm:px-6">
    <div className="max-w-7xl mx-auto">

      <motion.div {...fadeUp()} className="text-center mb-14">
        <p className="text-xs font-bold uppercase tracking-widest
          text-brand-600 dark:text-brand-400 mb-3">
          Everything you need
        </p>
        <h2 className="text-3xl sm:text-4xl font-extrabold
          text-gray-900 dark:text-white tracking-tight mb-4">
          Built for modern creators
        </h2>
        <p className="text-gray-500 dark:text-gray-400 max-w-lg mx-auto text-base leading-relaxed">
          All the tools you need to create, publish, and grow — without the complexity.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {FEATURES.map((f, i) => (
          <motion.div
            key={f.title}
            {...fadeUp(i * 0.07)}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className="group relative overflow-hidden rounded-2xl p-6
              bg-white dark:bg-gray-900
              border border-gray-100 dark:border-gray-800
              shadow-sm hover:shadow-md transition-shadow"
          >
            {/* Top gradient accent */}
            <div className={`absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r ${f.grad}
              opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

            <div className={`w-12 h-12 rounded-xl mb-4 flex items-center justify-center
              bg-gradient-to-br ${f.grad} shadow-md text-xl`}>
              {f.icon}
            </div>
            <h3 className="font-bold text-gray-900 dark:text-white mb-2 text-[15px]">
              {f.title}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
              {f.desc}
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
)

// ── CategoriesSection ──────────────────────────────────────────────────────────

const CategoriesSection = () => (
  <section className="py-20 px-4 sm:px-6
    bg-gradient-to-br from-gray-50 to-indigo-50/40
    dark:from-gray-900 dark:to-gray-900/80
    border-y border-gray-100 dark:border-gray-800">
    <div className="max-w-4xl mx-auto text-center">

      <motion.div {...fadeUp()}>
        <p className="text-xs font-bold uppercase tracking-widest
          text-brand-600 dark:text-brand-400 mb-3">
          Explore by topic
        </p>
        <h2 className="text-3xl sm:text-4xl font-extrabold
          text-gray-900 dark:text-white tracking-tight mb-3">
          Find content you love
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mb-10 text-base">
          Browse across 10 categories and discover ideas that inspire you.
        </p>
      </motion.div>

      <motion.div {...fadeUp(0.1)}
        className="flex flex-wrap justify-center gap-3">
        {CATEGORIES.map((cat) => (
          <motion.div
            key={cat.label}
            whileHover={{ scale: 1.05, y: -2 }}
            transition={{ duration: 0.15 }}
          >
            <Link
              to="/auth"
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full
                text-sm font-semibold border transition-all cursor-pointer ${
                  cat.hot
                    ? 'bg-brand-600 text-white border-brand-600 shadow-sm shadow-brand-500/30'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-brand-400 hover:text-brand-600 dark:hover:text-brand-400'
                }`}
            >
              {cat.label}
              {cat.hot && (
                <span className="text-[9px] font-black bg-white/20 px-1 py-0.5 rounded-full uppercase tracking-wide">
                  Hot
                </span>
              )}
            </Link>
          </motion.div>
        ))}
      </motion.div>
    </div>
  </section>
)

// ── FeedPreviewSection ─────────────────────────────────────────────────────────

const FeedPreviewSection = () => (
  <section className="py-24 px-4 sm:px-6">
    <div className="max-w-4xl mx-auto">

      <motion.div {...fadeUp()} className="text-center mb-12">
        <p className="text-xs font-bold uppercase tracking-widest
          text-brand-600 dark:text-brand-400 mb-3">
          Community feed
        </p>
        <h2 className="text-3xl sm:text-4xl font-extrabold
          text-gray-900 dark:text-white tracking-tight mb-3">
          See what&apos;s happening
        </h2>
        <p className="text-gray-500 dark:text-gray-400 text-base">
          Real-time feed of posts, blogs, and articles from the community.
        </p>
      </motion.div>

      <div className="space-y-4">
        {MOCK_POSTS.map((post, i) => (
          <motion.div
            key={post.id}
            {...fadeUp(i * 0.1)}
            whileHover={{ y: -2, transition: { duration: 0.2 } }}
            className="bg-white dark:bg-gray-900 rounded-2xl p-5 sm:p-6
              border border-gray-100 dark:border-gray-800 shadow-sm
              hover:shadow-md transition-shadow"
          >
            <div className="flex items-start gap-4">
              <div className={`w-11 h-11 rounded-full bg-gradient-to-br ${post.avatarGrad}
                flex items-center justify-center text-sm font-bold text-white shrink-0`}>
                {post.initials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {post.author}
                  </span>
                  <span className="text-xs text-gray-400 dark:text-gray-500">@{post.username}</span>
                  <span className="text-xs text-gray-400 dark:text-gray-500">·</span>
                  <span className="text-xs text-gray-400 dark:text-gray-500">{post.time}</span>
                  <span className={`text-[10px] font-bold uppercase tracking-wide
                    px-2 py-0.5 rounded text-white ${post.typeColor}`}>
                    {post.type}
                  </span>
                  {post.category && (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded
                      bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                      {post.category}
                    </span>
                  )}
                </div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-1.5">
                  {post.title}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-3 line-clamp-2">
                  {post.excerpt}
                </p>
                <div className="flex items-center gap-5 text-sm text-gray-400 dark:text-gray-500">
                  <span className="flex items-center gap-1.5 hover:text-rose-500 transition-colors cursor-pointer">
                    <HeartIcon /> {post.likes}
                  </span>
                  <span className="flex items-center gap-1.5 hover:text-brand-500 transition-colors cursor-pointer">
                    <CommentIcon /> {post.comments}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <EyeIcon /> {post.views}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div {...fadeUp(0.3)} className="text-center mt-8">
        <Link
          to="/auth"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl
            font-semibold text-sm text-brand-600 dark:text-brand-400
            border border-brand-200 dark:border-brand-800
            hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors"
        >
          View full feed after login
          <ArrowRightIcon />
        </Link>
      </motion.div>
    </div>
  </section>
)

// ── HowItWorksSection ──────────────────────────────────────────────────────────

const HowItWorksSection = () => (
  <section className="py-24 px-4 sm:px-6
    bg-gradient-to-br from-gray-50 to-blue-50/30
    dark:from-gray-900 dark:to-gray-900
    border-y border-gray-100 dark:border-gray-800">
    <div className="max-w-5xl mx-auto">

      <motion.div {...fadeUp()} className="text-center mb-14">
        <p className="text-xs font-bold uppercase tracking-widest
          text-brand-600 dark:text-brand-400 mb-3">
          Simple process
        </p>
        <h2 className="text-3xl sm:text-4xl font-extrabold
          text-gray-900 dark:text-white tracking-tight">
          Up and running in minutes
        </h2>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
        {/* Connector line (desktop only) */}
        <div className="hidden md:block absolute top-10 left-[calc(16.66%+16px)] right-[calc(16.66%+16px)]
          h-px bg-gradient-to-r from-brand-200 via-purple-300 to-pink-200
          dark:from-brand-900 dark:via-purple-900 dark:to-pink-900" />

        {STEPS.map((step, i) => (
          <motion.div
            key={step.step}
            {...fadeUp(i * 0.12)}
            className="relative flex flex-col items-center text-center"
          >
            <div className="relative mb-5">
              <div className="w-20 h-20 rounded-2xl bg-white dark:bg-gray-800
                border border-gray-100 dark:border-gray-700 shadow-md
                flex items-center justify-center text-3xl z-10 relative">
                {step.icon}
              </div>
              <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full
                bg-gradient-to-br from-brand-600 to-purple-600
                flex items-center justify-center
                text-[10px] font-black text-white z-20">
                {i + 1}
              </span>
            </div>
            <h3 className="font-bold text-gray-900 dark:text-white mb-2 text-base">
              {step.title}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed max-w-[220px]">
              {step.desc}
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
)

// ── CTABanner ─────────────────────────────────────────────────────────────────

const CTABanner = () => (
  <section className="py-24 px-4 sm:px-6">
    <div className="max-w-3xl mx-auto">
      <motion.div
        {...fadeUp()}
        className="relative overflow-hidden rounded-3xl p-10 sm:p-14 text-center
          bg-gradient-to-br from-brand-600 via-purple-600 to-pink-500
          shadow-2xl shadow-brand-500/30"
      >
        {/* Glow overlay */}
        <div
          className="absolute inset-0 opacity-30"
          style={{ backgroundImage: 'radial-gradient(circle at 30% 20%, white 0%, transparent 55%)' }}
        />
        <p className="text-sm font-bold uppercase tracking-widest text-white/60 mb-3">
          Ready to start?
        </p>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4 leading-tight">
          Your ideas deserve an audience
        </h2>
        <p className="text-white/70 mb-8 max-w-md mx-auto text-base leading-relaxed">
          Join thousands of creators already sharing their knowledge, stories,
          and ideas on Feedora. Free forever.
        </p>
        <Link
          to="/auth"
          className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl
            font-bold text-base text-brand-700
            bg-white hover:bg-gray-50
            shadow-lg hover:shadow-xl
            hover:-translate-y-0.5 active:translate-y-0
            transition-all duration-200"
        >
          Create your free account
          <ArrowRightIcon />
        </Link>
      </motion.div>
    </div>
  </section>
)

// ── Footer ─────────────────────────────────────────────────────────────────────

const Footer = () => (
  <footer className="border-t border-gray-100 dark:border-gray-800
    bg-gray-50/50 dark:bg-gray-900/50 py-12 px-4 sm:px-6">
    <div className="max-w-7xl mx-auto">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">

        {/* Brand */}
        <div className="lg:col-span-2">
          <div className="flex items-center gap-2.5 mb-3">
            <FeedoraIcon size={30} />
            <span className="font-extrabold text-xl tracking-tight
              bg-gradient-to-r from-brand-600 to-purple-600 bg-clip-text text-transparent">
              Feedora
            </span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed max-w-xs">
            A modern social blogging platform for creators who want to share their ideas,
            build an audience, and connect with readers worldwide.
          </p>
        </div>

        {/* Product */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-widest
            text-gray-400 dark:text-gray-500 mb-4">
            Product
          </h4>
          <ul className="space-y-2.5">
            {['Features', 'Categories', 'Pricing', 'Blog'].map((item) => (
              <li key={item}>
                <Link to="/auth" className="text-sm text-gray-500 dark:text-gray-400
                  hover:text-gray-900 dark:hover:text-white transition-colors">
                  {item}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Company */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-widest
            text-gray-400 dark:text-gray-500 mb-4">
            Company
          </h4>
          <ul className="space-y-2.5">
            {['About', 'Privacy', 'Terms', 'Contact'].map((item) => (
              <li key={item}>
                <Link to="/auth" className="text-sm text-gray-500 dark:text-gray-400
                  hover:text-gray-900 dark:hover:text-white transition-colors">
                  {item}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="pt-8 border-t border-gray-100 dark:border-gray-800
        flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-xs text-gray-400 dark:text-gray-500">
          © 2025 Feedora. All rights reserved.
        </p>
        <div className="flex items-center gap-4">
          {/* Social links */}
          {[
            { label: 'Twitter / X', icon: <TwitterIcon /> },
            { label: 'GitHub',      icon: <GitHubIcon />  },
            { label: 'LinkedIn',    icon: <LinkedInIcon /> },
          ].map((s) => (
            <button
              key={s.label}
              aria-label={s.label}
              className="text-gray-400 dark:text-gray-500
                hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            >
              {s.icon}
            </button>
          ))}
        </div>
      </div>
    </div>
  </footer>
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
const MenuIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
  </svg>
)
const XIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
)
const ArrowRightIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
  </svg>
)
const HeartIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
  </svg>
)
const CommentIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </svg>
)
const EyeIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
)
const TwitterIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
)
const GitHubIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
  </svg>
)
const LinkedInIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
)

export default LandingPage
