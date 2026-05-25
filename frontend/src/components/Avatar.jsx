// Tailwind JIT requires static class strings — dynamic `w-${n}` won't compile.
// All sizes are pre-declared in the map so JIT can detect them.
const sizeMap = {
  6:  'w-6  h-6  text-xs',
  8:  'w-8  h-8  text-sm',
  9:  'w-9  h-9  text-sm',
  10: 'w-10 h-10 text-sm',
  12: 'w-12 h-12 text-base',
  14: 'w-14 h-14 text-lg',
  16: 'w-16 h-16 text-xl',
  20: 'w-20 h-20 text-2xl',
  24: 'w-24 h-24 text-3xl',
  32: 'w-32 h-32 text-4xl',
}

const Avatar = ({ src, username = '', size = 8, className = '' }) => {
  const sz = sizeMap[size] ?? sizeMap[8]

  if (src) {
    return (
      <img
        src={src}
        alt={username}
        className={`${sz} rounded-full object-cover flex-shrink-0 ${className}`}
      />
    )
  }

  return (
    <div
      className={`${sz} rounded-full bg-gradient-to-br from-brand-500 to-brand-700
        flex items-center justify-center text-white font-semibold
        flex-shrink-0 select-none ${className}`}
    >
      {username.charAt(0).toUpperCase() || '?'}
    </div>
  )
}

export default Avatar
