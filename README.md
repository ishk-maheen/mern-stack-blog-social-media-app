# Feedora

A full-stack social blogging platform built with the MERN stack. Feedora combines the best of Facebook, Instagram, and LinkedIn — letting users publish **posts**, **blogs**, and **articles**, interact through likes and comments, schedule content for future publishing, and manage their profile — all wrapped in a modern 3-column layout with dark/light mode and smooth Framer Motion animations.

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Features](#features)
- [Project Structure](#project-structure)
- [Pages & Routes](#pages--routes)
- [API Reference](#api-reference)
- [Database Models](#database-models)
- [Environment Variables](#environment-variables)
- [Local Development](#local-development)
- [How Key Features Work](#how-key-features-work)
- [Cloudinary Upload Flow](#cloudinary-upload-flow)
- [Vercel Deployment](#vercel-deployment)
- [Important Notes](#important-notes)

---

## Overview

Feedora is a full-stack social media + blogging application. It supports:

- Three content types: **Post**, **Blog** (with 10 categories), and **Article**
- Publish immediately or **schedule for a future time**
- Like, comment (with edit + delete), and view tracking
- A 3-column responsive homepage with left/right sidebars
- A public landing page with scroll animations for unauthenticated visitors
- Profile pages with editable avatar and banner
- Admin dashboard for user management
- Dark/light mode with no flash on load

---

## Tech Stack

### Backend

| Package | Version | Purpose |
|---|---|---|
| Node.js | ≥ 18.x | Runtime |
| Express | ^4.19 | HTTP server and routing |
| MongoDB Atlas | — | Cloud database |
| Mongoose | ^8.4 | Schema modeling and validation |
| bcryptjs | ^2.4 | Password hashing |
| jsonwebtoken | ^9.0 | JWT auth tokens |
| Cloudinary | ^2.2 | Image and video storage (CDN) |
| Multer | ^1.4 | File upload (memory storage) |
| express-validator | ^7.1 | Request body validation |
| dotenv | ^16.4 | Environment variable loading |
| nodemon | ^3.1 | Dev auto-restart |

### Frontend

| Package | Version | Purpose |
|---|---|---|
| React | ^19.2 | UI library |
| Vite | ^8.0 | Build tool and dev server |
| TailwindCSS | ^3.4 | Utility-first CSS |
| Framer Motion | ^12.4 | Animations and page transitions |
| Axios | ^1.16 | HTTP client |
| React Router DOM | ^7.15 | Client-side routing (SPA) |
| React Hot Toast | ^2.6 | Toast notifications |

---

## Features

### Authentication
- Signup with name, username, email, password, and an optional profile picture upload
- Login returns a JWT stored in `localStorage`
- Username and email uniqueness enforced at the database level
- Email `admin@gmail.com` is reserved — blocked from public signup
- Input validation on both client and server (express-validator)
- **Account deactivation** — soft-disables account; login prompt shows a reactivation option
- **Account deletion** — permanently removes the user and all their content (posts, comments, media)
- Admin: `admin@gmail.com` / `admin@123` → redirected to Admin Panel

### Content Types & Categories

Three content types, each with its own color-coded badge in the feed:

| Type | Badge Color | Category Required? |
|---|---|---|
| Post | Blue | No |
| Blog | Green | Yes (one of 10) |
| Article | Purple | No |

**Blog Categories (10):**
Educational · Technology · Programming · Design · Business · Lifestyle · Health · Travel · Food · Others

### Feed & Filtering
- All users' content, newest first
- Filter chips: **All** / **Posts** / **Blogs** / **Articles**
- Selecting "Blogs" reveals animated category sub-chips
- Filters applied via query params — no new API endpoint needed
- Infinite scroll with "Load more" button and pagination
- On every feed load, due scheduled posts are published automatically (fallback safety net)

### Create & Edit Content
- **Title** (max 200 chars), **description**, optional image or video
- Content type selector with 3 buttons (Post / Blog / Article)
- Category dropdown appears only for Blog type
- Toggle between **Publish Now** and **Schedule for Later** (datetime picker)
- Edit published posts — update title, description, media, type, and category
- Delete published posts with modal confirmation
- Dynamic toast messages: "Post published!", "Blog scheduled!", "Article updated!", etc.

### Scheduled Publishing
- Scheduled posts stored in a separate `ScheduledPost` collection with `publishAt` timestamp
- **Primary**: Vercel Cron hits `GET /api/posts/publish-scheduled` every minute (requires Vercel Pro)
- **Fallback**: every feed request also publishes overdue posts before returning results
- Users can view all their pending scheduled posts from the sidebar
- Edit or delete a scheduled post before it goes live

### Likes
- Toggle like / unlike on any content
- Optimistic UI — instant feedback, reverts if request fails
- "Who liked this" modal with avatars and username links

### Comments
- Add a comment (max 500 characters) on any post/blog/article
- **Edit your own comment** inline
- **Delete your own comment** with confirmation
- Comments section animates open/closed
- Comment count shown on every card in the feed

### Views
- Unique view count per user (no duplicate counting)
- Tracked silently on post open — fire and forget
- `viewedBy` array stores user IDs; `viewedBy.length` = total views

### Homepage — 3-Column Layout

```
┌──────────────┬──────────────────────┬────────────────┐
│  Left Sidebar│     Center Feed      │  Right Sidebar │
│              │                      │                │
│ Profile card │  Filter chips        │ Trending posts │
│ Nav links    │  Content cards       │ Suggested      │
│ Categories   │  Load more           │ Discover card  │
└──────────────┴──────────────────────┴────────────────┘
 (lg: 2-col)                           (xl: 3-col)
```

- **Left sidebar**: profile snapshot, navigation (Home Feed, Create Content, Scheduled, My Profile), blog category quick-filters
- **Right sidebar**: top 4 trending posts (by likes), suggested creators (unique authors in feed), discover promo — all derived from already-loaded feed data via `useMemo` (zero extra API calls)
- Background: gradient color blobs with blur for depth
- All cards use **glassmorphism**: `backdrop-blur-md` + translucent white/dark background

### Landing Page (Pre-auth)

Shown at `/` for unauthenticated visitors:

- Fixed glassmorphism navbar with Login / Sign up buttons and dark mode toggle
- Hero section: left copy + right animated browser-chrome mockup with live feed cards and floating badges
- Stats bar (creators, posts, readers)
- Features section — 6 cards with hover lift and gradient icon squares
- Categories section — chip layout with "Hot" labels
- Feed preview — 3 mock posts with full PostCard-like styling
- How It Works — 3-step process with numbered badges and connector line
- CTA banner — gradient background with inner radial glow
- Footer — 4-column grid with social links
- All sections animated with Framer Motion `whileInView` scroll triggers

### Profile Page
- Editable profile banner (full-width image)
- Editable profile picture (replaces old image on Cloudinary)
- When profile picture changes → updates everywhere: feed cards, Navbar, comments
- Fallback avatar: first letter of username on a color gradient
- Shows only that user's posts

### Admin Panel
- Accessible only to `admin@gmail.com` / `admin@123`
- Stats cards: total users, total posts, total pending scheduled posts
- Full user table: avatar, name, username, email, join date, admin badge
- Search and filter users (400ms debounce)
- Delete any user with cascade: removes their posts (+ Cloudinary files), comments, scheduled posts, and removes them from all `likes` arrays

### UI & UX
- **Dark / Light mode** — system preference aware, persisted in `localStorage`, applied before React renders (no theme flash)
- Fully responsive: single-column mobile → 2-column tablet → 3-column desktop
- Framer Motion: page transitions (`AnimatePresence`), modal open/close, `whileInView` scroll animations, staggered entrance animations
- `FeedoraIcon` SVG logo — blue-to-purple gradient rounded square with 3 white feed lines (forms a stylized "F") — using React `useId()` for unique gradient IDs per instance
- `Avatar` component — reused everywhere (profile picture or first-letter fallback)
- Toast notifications for every user action with dynamic content-type-aware messages

---

## Project Structure

```
MERN STACK BLOG APP PROJECT/
│
├── README.md
├── CLAUDE.md                          # AI development guide
│
├── backend/
│   ├── server.js                      # Express app — middleware, routes, error handler
│   ├── vercel.json                    # Vercel build config + cron job (every minute)
│   ├── package.json
│   │
│   ├── config/
│   │   └── db.js                      # Cached MongoDB connection (isConnected flag)
│   │
│   ├── models/
│   │   ├── User.js                    # name, username, email, password (hashed), avatar, banner, isAdmin, isActive
│   │   ├── Post.js                    # title, description, media, likes[], comments[], viewedBy[], contentType, category, isEdited
│   │   ├── Comment.js                 # text, author, post ref, isEdited, editedAt
│   │   └── ScheduledPost.js           # same fields as Post + publishAt, published flag, compound index
│   │
│   ├── controllers/
│   │   ├── authController.js          # signup, login, reactivateAccount
│   │   ├── postController.js          # CRUD posts + comments + likes + views + scheduling + publish cron handler
│   │   ├── userController.js          # profile CRUD, avatar/banner upload, deactivate, delete account
│   │   └── adminController.js         # stats, list users, delete user (cascade)
│   │
│   ├── routes/
│   │   ├── authRoutes.js              # POST /signup, /login, /reactivate
│   │   ├── postRoutes.js              # full post + scheduled CRUD + comment edit/delete
│   │   ├── userRoutes.js              # profile + account management
│   │   └── adminRoutes.js             # admin-only routes (all guarded by protect + adminOnly)
│   │
│   ├── middlewares/
│   │   ├── authMiddleware.js          # protect (JWT verify → req.user), adminOnly
│   │   ├── errorMiddleware.js         # global Express error handler (last in chain)
│   │   └── uploadMiddleware.js        # Multer memory storage, image/* + video/*, 10 MB limit
│   │
│   ├── utils/
│   │   ├── cloudinary.js              # Cloudinary config + upload_stream helper
│   │   └── generateToken.js           # JWT sign (7-day expiry)
│   │
│   └── jobs/
│       └── scheduledPosts.js          # publishDueScheduledPosts() — finds and moves due posts to Post collection
│
└── frontend/
    ├── index.html                     # Feedora title, SVG favicon, dark-mode anti-flash script
    ├── vite.config.js                 # Vite + /api proxy → localhost:5000
    ├── vercel.json                    # SPA rewrite: all routes → index.html
    ├── package.json
    │
    └── src/
        ├── main.jsx                   # Mounts App inside BrowserRouter + AuthProvider
        ├── App.jsx                    # AnimatePresence + Routes + PageTransition wrapper
        │
        ├── context/
        │   └── AuthContext.jsx        # user state, loading flag, login(), logout(), updateUser()
        │
        ├── hooks/
        │   ├── useAuth.js             # consumes AuthContext
        │   └── useTheme.js            # dark/light toggle, persisted to localStorage
        │
        ├── services/
        │   └── api.js                 # Axios instance (auto-attaches JWT) + all API call functions
        │
        ├── routes/
        │   └── ProtectedRoute.jsx     # Redirects unauthenticated → /, non-admin → /home
        │
        ├── utils/
        │   └── helpers.js             # Shared utility functions (date formatting, etc.)
        │
        ├── components/
        │   ├── Logo.jsx               # FeedoraIcon SVG — gradient rounded square + feed lines
        │   ├── Navbar.jsx             # Fixed top bar — FeedoraIcon logo, theme toggle, user dropdown
        │   ├── Avatar.jsx             # Profile picture or first-letter fallback (reused everywhere)
        │   ├── PostCard.jsx           # Feed card — media, ContentTypeBadge, like/comment/view actions
        │   ├── PostModal.jsx          # Create + Edit modal — type selector, category, schedule toggle
        │   ├── CommentsSection.jsx    # Comment list + add / edit / delete comment
        │   └── LikesModal.jsx         # "Who liked this" user list modal
        │
        └── pages/
            ├── LandingPage.jsx        # Pre-auth marketing page — hero, features, feed preview, footer
            ├── AuthPage.jsx           # Login + Signup + Reactivation flow
            ├── HomePage.jsx           # 3-column feed: LeftSidebar + Feed + RightSidebar
            ├── ProfilePage.jsx        # User profile — avatar, banner, edit, own posts
            └── AdminPanel.jsx         # Admin dashboard — stats + user management
```

---

## Pages & Routes

| Route | Auth Required | Who Can Access | Page |
|---|---|---|---|
| `/` | No | Anyone (logged-in → redirect to /home or /admin) | Landing Page |
| `/auth` | No | Anyone (logged-in → redirect away) | Login / Signup |
| `/home` | Yes | All logged-in users | Home Feed |
| `/profile/:username` | Yes | All logged-in users | User Profile |
| `/admin` | Yes (isAdmin) | Admin only | Admin Panel |
| `*` (catch-all) | — | — | Redirect based on auth state |

---

## API Reference

> All protected routes require the header: `Authorization: Bearer <jwt_token>`
> All error responses return: `{ "message": "..." }` with the appropriate HTTP status code.

### Auth — `/api/auth`

| Method | Path | Auth | Body / File | Description |
|---|---|---|---|---|
| POST | `/signup` | No | `multipart/form-data`: name, username, email, password, profilePicture (optional) | Register new user |
| POST | `/login` | No | `{ email, password }` | Login, returns JWT + user object |
| POST | `/reactivate` | No | `{ email, password }` | Reactivate a deactivated account |

### Posts — `/api/posts`

| Method | Path | Auth | Query / Body | Description |
|---|---|---|---|---|
| GET | `/` | Yes | `?contentType=&category=&page=1&limit=10` | Get paginated feed with optional filters |
| POST | `/` | Yes | `multipart/form-data`: title, description, contentType, category, media (optional) | Publish post immediately |
| PUT | `/:id` | Yes (author) | `multipart/form-data`: same fields | Edit a published post |
| DELETE | `/:id` | Yes (author) | — | Delete a published post |
| PUT | `/:id/like` | Yes | — | Toggle like / unlike |
| POST | `/:id/comment` | Yes | `{ text }` | Add a comment |
| PUT | `/:postId/comment/:commentId` | Yes (author) | `{ text }` | Edit your own comment |
| DELETE | `/:postId/comment/:commentId` | Yes (author) | — | Delete your own comment |
| PUT | `/:id/view` | Yes | — | Record a unique view |
| POST | `/schedule` | Yes | `multipart/form-data`: + `publishAt` (ISO datetime) | Create a scheduled post |
| GET | `/scheduled` | Yes | — | Get your pending scheduled posts |
| PUT | `/scheduled/:id` | Yes (author) | `multipart/form-data` | Edit a scheduled post |
| DELETE | `/scheduled/:id` | Yes (author) | — | Delete a scheduled post |
| GET | `/publish-scheduled` | No (Cron only) | — | Publish all due scheduled posts |

### Users — `/api/users`

| Method | Path | Auth | Body / File | Description |
|---|---|---|---|---|
| GET | `/me` | Yes | — | Get own full profile |
| PUT | `/profile` | Yes | `{ name }` | Update display name |
| PUT | `/profile-picture` | Yes | `multipart/form-data`: profilePicture | Replace profile picture |
| PUT | `/banner` | Yes | `multipart/form-data`: banner | Replace profile banner |
| PUT | `/deactivate` | Yes | — | Soft-deactivate account |
| DELETE | `/account` | Yes | — | Permanently delete account + all content |
| GET | `/:username` | Yes | — | Get any user's public profile |
| GET | `/:username/posts` | Yes | — | Get all published posts by a user |

### Admin — `/api/admin`

> All admin routes require JWT with `isAdmin: true`

| Method | Path | Description |
|---|---|---|
| GET | `/stats` | Platform stats (total users, posts, scheduled) |
| GET | `/users` | Paginated + searchable user list |
| DELETE | `/users/:id` | Delete user + cascade all their data |

---

## Database Models

### User
```
name            String    required, trimmed
username        String    required, unique, lowercase, min 3 chars
email           String    required, unique, lowercase
password        String    required, min 6 chars, bcrypt hashed, excluded from queries by default
profilePicture  String    default ''  — Cloudinary URL
banner          String    default ''  — Cloudinary URL
isAdmin         Boolean   default false
isActive        Boolean   default true  — false = deactivated
createdAt       Date      (auto)
updatedAt       Date      (auto)
```

**Pre-save hook**: password is hashed with bcryptjs (10 salt rounds) whenever it is new or modified.
**Instance method**: `matchPassword(entered)` — bcrypt compare helper used by authController.

### Post
```
author          ObjectId → User     required
title           String              required, max 200 chars
description     String              required
mediaUrl        String              default ''  — Cloudinary URL
mediaType       'image'|'video'|'none'
likes           [ObjectId → User]   toggle array
comments        [ObjectId → Comment]
viewedBy        [ObjectId → User]   unique viewers — length = view count
contentType     'post'|'blog'|'article'   default 'post'
category        enum(10)|null       required when contentType = 'blog'
isEdited        Boolean             default false
editedAt        Date
createdAt       Date      (auto)
updatedAt       Date      (auto)
```

### Comment
```
post            ObjectId → Post     required
author          ObjectId → User     required
text            String              required, max 500 chars
isEdited        Boolean             default false
editedAt        Date
createdAt       Date      (auto)
updatedAt       Date      (auto)
```

### ScheduledPost
```
author          ObjectId → User     required
title           String              required, max 200 chars
description     String              required
mediaUrl        String              default ''
mediaType       'image'|'video'|'none'
publishAt       Date                required — when to go live
contentType     'post'|'blog'|'article'
category        enum(10)|null
published       Boolean             default false
createdAt       Date      (auto)
updatedAt       Date      (auto)

Index: { publishAt: 1, published: 1 }  — optimizes the cron query
```

---

## Environment Variables

### `backend/.env`

```env
PORT=5000
MONGO_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/feedora
JWT_SECRET=your_long_random_secret_key
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
```

| Variable | Description |
|---|---|
| `PORT` | Express port (default 5000, ignored on Vercel) |
| `MONGO_URI` | Full MongoDB Atlas connection string |
| `JWT_SECRET` | Secret used to sign JWTs — keep private |
| `CLOUDINARY_CLOUD_NAME` | From your Cloudinary dashboard |
| `CLOUDINARY_API_KEY` | From your Cloudinary dashboard |
| `CLOUDINARY_API_SECRET` | From your Cloudinary dashboard |
| `FRONTEND_URL` | Allowed CORS origin — use deployed frontend URL in production |
| `NODE_ENV` | `development` locally, `production` on Vercel |

### `frontend/.env`

```env
VITE_API_URL=http://localhost:5000/api
```

In production: `VITE_API_URL=https://your-backend.vercel.app/api`

---

## Local Development

### Prerequisites
- Node.js 18 or higher
- MongoDB Atlas cluster (free tier is enough)
- Cloudinary account (free tier is enough)

### 1. Install dependencies

```bash
# Backend
cd backend
npm install

# Frontend (open a separate terminal)
cd frontend
npm install
```

### 2. Create environment files

Create `backend/.env` with the variables listed above.

Create `frontend/.env`:
```env
VITE_API_URL=http://localhost:5000/api
```

### 3. Start both servers

```bash
# Terminal 1 — Backend (http://localhost:5000)
cd backend
npm run dev

# Terminal 2 — Frontend (http://localhost:5173)
cd frontend
npm run dev
```

The Vite dev server proxies all `/api` requests to `localhost:5000`, so there are no CORS issues during development.

### 4. Admin login

Use: `admin@gmail.com` / `admin@123`

On first login the admin document is auto-created in MongoDB.

---

## How Key Features Work

### JWT Authentication

1. Signup uploads the optional profile picture to Cloudinary, creates the user in MongoDB, and returns a JWT.
2. The JWT is stored in `localStorage` as both `token` and embedded in the `user` object.
3. An Axios request interceptor reads `localStorage.getItem('token')` and adds `Authorization: Bearer <token>` to every request.
4. The `protect` middleware verifies the token and attaches `req.user` to the request.
5. `adminOnly` middleware then checks `req.user.isAdmin`.

### Content Type & Category System

When creating or editing content:
- `contentType` is always required (`'post'`, `'blog'`, or `'article'`)
- `category` is required only when `contentType === 'blog'`
- Switching away from "blog" type clears the category in the database

On the feed, filters are applied via query string: `?contentType=blog&category=technology`. The backend builds a dynamic `filter` object and applies it to the Mongoose query. Category filter is only applied when `contentType === 'blog'`.

### Scheduled Publishing

Two-layer approach:

**Layer 1 — Vercel Cron (primary):**
- `backend/vercel.json` registers a cron that hits `GET /api/posts/publish-scheduled` every minute
- The handler calls `publishDueScheduledPosts()`:
  1. Finds all ScheduledPosts where `publishAt <= now` and `published: false`
  2. Bulk-inserts them into the Post collection (preserving `contentType`, `category`, `mediaUrl`, etc.)
  3. Marks them as `published: true`
- The compound index `{ publishAt: 1, published: 1 }` makes this query fast
- Requires Vercel Pro plan

**Layer 2 — Feed fallback (safety net):**
- Every `GET /api/posts` call also runs `publishDueScheduledPosts()` before returning results
- Ensures posts go live even without the cron, with a delay of up to the time between feed loads

### Comment Edit & Delete

- Comments store `isEdited: Boolean` and `editedAt: Date`
- `PUT /:postId/comment/:commentId` verifies that `req.user._id` matches `comment.author` before updating
- `DELETE /:postId/comment/:commentId` does the same ownership check, then removes the comment document and pulls its `_id` from the post's `comments` array
- The frontend shows an edit/delete menu only on comments authored by the currently logged-in user

### Account Deactivation & Deletion

**Deactivation** (`PUT /api/users/deactivate`):
- Sets `user.isActive = false`
- Does not delete any data
- On next login attempt, the backend checks `isActive` — if false, returns a 403 error with a `deactivated: true` flag
- The frontend catches this flag and shows a reactivation prompt

**Reactivation** (`POST /api/auth/reactivate`):
- Verifies credentials, sets `isActive = true`, returns a fresh JWT

**Deletion** (`DELETE /api/users/account`):
- Deletes all comments the user wrote
- Deletes all comments on the user's posts (cascade)
- Deletes the user's Cloudinary profile picture (if any)
- Deletes all the user's posts (with Cloudinary media cleanup per post)
- Deletes all the user's scheduled posts
- Removes the user's `_id` from all `likes` arrays across all posts
- Deletes the user document

### 3-Column Layout & Sidebar Data

The right sidebar's "Trending" and "Suggested Creators" sections are computed from the already-loaded `posts` state using `useMemo` — no extra API calls:

```js
// Top 4 posts by likes count
const trending = useMemo(() =>
  [...posts].sort((a, b) => b.likes.length - a.likes.length).slice(0, 4),
[posts])

// Unique authors excluding the logged-in user
const suggested = useMemo(() => {
  const seen = new Set([user._id])
  return posts.reduce((acc, p) => {
    if (!seen.has(p.author._id)) { seen.add(p.author._id); acc.push(p.author) }
    return acc
  }, []).slice(0, 5)
}, [posts, user])
```

### Scroll Animations on First Load

Framer Motion's `whileInView` relies on Intersection Observer. The `AnimatePresence` in `App.jsx` does **not** use `initial={false}` because that prop propagates via React context to all nested motion elements and causes them to skip their `initial` state on the first mount — making all `whileInView` animations invisible on fresh page load. Without `initial={false}`, elements correctly start at `{ opacity: 0, y: 28 }` and animate in when they enter the viewport.

---

## Cloudinary Upload Flow

Multer is configured with **memory storage** — files go into `req.file.buffer` and never touch disk. This is required on Vercel's serverless environment (read-only filesystem).

```
Client (FormData with file)
  → Multer (memoryStorage, 10 MB limit, image/* and video/* only)
  → req.file.buffer
  → cloudinary.uploader.upload_stream() (wrapped in a Promise)
  → Cloudinary CDN
  → secure_url saved to MongoDB
```

**Upload folders:**

| Content | Cloudinary folder |
|---|---|
| Profile pictures | `blog-app/profiles` |
| Post / article / blog media | `blog-app/posts` |
| Profile banners | `blog-app/banners` |

When content is deleted, the `public_id` is extracted from the Cloudinary URL and passed to `cloudinary.uploader.destroy()`. Failures are swallowed silently so a Cloudinary error never blocks the database operation.

---

## Vercel Deployment

Both frontend and backend are deployed as **separate Vercel projects**.

### Backend

`backend/vercel.json`:
```json
{
  "version": 2,
  "builds": [{ "src": "server.js", "use": "@vercel/node" }],
  "routes": [{ "src": "/(.*)", "dest": "server.js" }],
  "crons": [
    {
      "path": "/api/posts/publish-scheduled",
      "schedule": "* * * * *"
    }
  ]
}
```

Steps:
1. Push `backend/` to a GitHub repo
2. Create a new Vercel project → select the backend repo
3. Framework preset: **Other** (no build command needed)
4. Add all environment variables in Vercel dashboard
5. Set `FRONTEND_URL` = your deployed frontend URL
6. Set `NODE_ENV=production`
7. Deploy

> **Cron note:** The per-minute cron requires the **Vercel Pro plan**. On the free Hobby plan the cron does not run, but the feed-load fallback still publishes due posts automatically.

### Frontend

`frontend/vercel.json`:
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

Steps:
1. Push `frontend/` to a GitHub repo
2. Create a new Vercel project → select the frontend repo
3. Framework preset: **Vite**
4. Build command: `npm run build`
5. Output directory: `dist`
6. Add: `VITE_API_URL=https://your-backend.vercel.app/api`
7. Deploy
8. After frontend deploys, update the backend's `FRONTEND_URL` to the frontend URL and redeploy backend

---

## Important Notes

### Express route ordering
Static paths must be declared before parameterized routes. For example:
- `/api/posts/scheduled` and `/api/posts/publish-scheduled` before `/api/posts/:id`
- `/api/users/me`, `/api/users/profile`, `/api/users/profile-picture`, `/api/users/banner` before `/api/users/:username`

Do not reorder these — Express matches routes top-to-bottom.

### Admin credentials
The admin is detected by a plain string comparison in `authController.js`. On first login, a real MongoDB user document is created so the JWT contains a valid `_id`. The email `admin@gmail.com` is blocked from public signup.

**For production:** move these credentials to environment variables and replace the string comparison with `process.env.ADMIN_EMAIL` / `process.env.ADMIN_PASSWORD`.

### Dark mode flash prevention
`index.html` contains an inline script in `<head>` that applies the `dark` class to `<html>` synchronously — before React renders — to prevent any flash of the wrong theme:

```html
<script>
  (function () {
    var stored = localStorage.getItem('theme')
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    if (stored === 'dark' || (!stored && prefersDark)) {
      document.documentElement.classList.add('dark')
    }
  })()
</script>
```

### TailwindCSS and dynamic class names
Tailwind's JIT compiler only generates classes it finds as complete static strings. The `Avatar` component uses a `sizeMap` object with fully written class strings (`w-8 h-8`, `w-10 h-10`, etc.) rather than template literals (`w-${n} h-${n}`). Do not refactor to dynamic class names — they will be stripped from the production build.

### MongoDB connection caching
`config/db.js` tracks an `isConnected` flag and skips opening a new connection if one already exists. This is essential on Vercel's serverless platform where each request may spin up a new function instance — without caching, each request would open a new MongoDB connection and exhaust the connection pool.

### FeedoraIcon and SVG gradient IDs
`Logo.jsx` uses React 18's `useId()` hook to generate a unique `<linearGradient>` ID for each instance of the icon. When multiple `<svg>` elements are on the same page (navbar, landing nav, footer, auth page), they each get their own gradient ID so they don't conflict with each other.

---

## Scripts

### Backend
```bash
npm run dev      # nodemon — auto-restart on file change
npm start        # node server.js — production
```

### Frontend
```bash
npm run dev      # Vite dev server on port 5173
npm run build    # Production build → dist/
npm run preview  # Preview the production build locally
npm run lint     # ESLint
```
"# MERN-STACK-BLOG-SOCIAL-MEDIA-APP" 
