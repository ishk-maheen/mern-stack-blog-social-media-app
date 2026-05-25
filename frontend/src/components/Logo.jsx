import { useId } from 'react'

// Feedora logo mark — three horizontal feed lines of decreasing width,
// forming a stylised "F" on a blue-to-purple gradient rounded square.
// useId() gives each instance a unique gradient ID so multiple SVGs on
// the same page don't share a conflicting <linearGradient> reference.

const FeedoraIcon = ({ size = 32, className = '' }) => {
  const uid  = useId()
  const gid  = `fg${uid.replace(/[^a-z0-9]/gi, '')}`

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Feedora"
    >
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%"   stopColor="#2563EB" />
          <stop offset="100%" stopColor="#7C3AED" />
        </linearGradient>
      </defs>

      {/* Background rounded square */}
      <rect width="32" height="32" rx="8" fill={`url(#${gid})`} />

      {/* Feed lines — longest → medium → shortest, left-aligned = stylised F */}
      <rect x="7" y="9"    width="18" height="3.5" rx="1.75" fill="white" />
      <rect x="7" y="14.5" width="12" height="3.5" rx="1.75" fill="white" />
      <rect x="7" y="20"   width="7"  height="3.5" rx="1.75" fill="white" />
    </svg>
  )
}

export default FeedoraIcon
