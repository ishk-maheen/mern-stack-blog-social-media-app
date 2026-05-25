import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
})

// Attach JWT token to every request automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// ── Auth ──────────────────────────────────────────────────────────────────────
export const signup             = (formData)     => api.post('/auth/signup', formData)
export const login              = (credentials)  => api.post('/auth/login', credentials)
export const reactivateAccount  = (credentials)  => api.post('/auth/reactivate', credentials)

// ── Posts ─────────────────────────────────────────────────────────────────────
export const getFeed             = (page = 1, limit = 10, contentType = '', category = '') => {
  let url = `/posts?page=${page}&limit=${limit}`
  if (contentType) url += `&contentType=${contentType}`
  if (category)    url += `&category=${category}`
  return api.get(url)
}
export const createPost          = (formData)  => api.post('/posts', formData)
export const createScheduledPost = (formData)  => api.post('/posts/schedule', formData)
export const getMyScheduledPosts = ()          => api.get('/posts/scheduled')
export const deleteScheduledPost = (id)        => api.delete(`/posts/scheduled/${id}`)
export const editPost            = (id, formData) => api.put(`/posts/${id}`, formData)
export const editScheduledPost   = (id, formData) => api.put(`/posts/scheduled/${id}`, formData)
export const likeUnlikePost      = (id)        => api.put(`/posts/${id}/like`)
export const addComment          = (id, text)  => api.post(`/posts/${id}/comment`, { text })
export const editComment         = (postId, commentId, text) => api.put(`/posts/${postId}/comment/${commentId}`, { text })
export const deleteComment       = (postId, commentId) => api.delete(`/posts/${postId}/comment/${commentId}`)
export const viewPost            = (id)        => api.put(`/posts/${id}/view`)
export const deletePost          = (id)        => api.delete(`/posts/${id}`)

// ── Users ─────────────────────────────────────────────────────────────────────
export const getMyProfile        = ()                   => api.get('/users/me')
export const getUserProfile      = (username)           => api.get(`/users/${username}`)
export const getUserPosts        = (username)           => api.get(`/users/${username}/posts`)
export const updateProfile       = (data)               => api.put('/users/profile', data)
export const updateProfilePicture = (formData)          => api.put('/users/profile-picture', formData)
export const updateBanner        = (formData)           => api.put('/users/banner', formData)
export const deactivateAccount   = ()                   => api.put('/users/deactivate')
export const deleteAccount       = ()                   => api.delete('/users/account')

// ── Admin ─────────────────────────────────────────────────────────────────────
export const getAdminStats = ()                   => api.get('/admin/stats')
export const getAdminUsers = (page = 1, search = '') =>
  api.get(`/admin/users?page=${page}&search=${search}`)
export const deleteAdminUser = (id)               => api.delete(`/admin/users/${id}`)

export default api
