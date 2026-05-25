// Returns the first letter of a username in uppercase for fallback avatars
export const getInitial = (username = '') => username.charAt(0).toUpperCase()

// Formats a date string to a readable relative time (e.g. "2 hours ago")
export const timeAgo = (dateStr) => {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)

  if (mins  < 1)  return 'just now'
  if (mins  < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days  < 7)  return `${days}d ago`
  return new Date(dateStr).toLocaleDateString()
}

// Formats a future date for scheduled post display
export const formatScheduled = (dateStr) =>
  new Date(dateStr).toLocaleString(undefined, {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })

// Builds a FormData object from a plain object + optional file field
export const toFormData = (obj, fileField, file) => {
  const fd = new FormData()
  Object.entries(obj).forEach(([k, v]) => v !== undefined && fd.append(k, v))
  if (file && fileField) fd.append(fileField, file)
  return fd
}
