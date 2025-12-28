import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      localStorage.removeItem('cart')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/change-password', data),
  logout: () => api.post('/auth/logout')
}

export const booksAPI = {
  getAll: (params) => api.get('/books', { params }),
  getByIsbn: (isbn) => api.get(`/books/${isbn}`),
  search: (params) => api.get('/books/search', { params }),
  fullSearch: (params) => api.get('/books/full-search', { params }),
  getByCategory: (category) => api.get(`/books/category/${category}`),
  getCategories: () => api.get('/books/categories'),
  create: (data) => api.post('/books', data),
  update: (isbn, data) => api.put(`/books/${isbn}`, data)
}

export const ordersAPI = {
  placeOrder: (data) => api.post('/orders/place-order', data),
  getMyOrders: () => api.get('/orders/my-orders'),
  getOrderDetails: (orderId) => api.get(`/orders/my-orders/${orderId}`),
  downloadInvoice: (orderId) => api.get(`/orders/my-orders/${orderId}/invoice`, { responseType: 'blob' }),
  getAllOrders: (params) => api.get('/orders', { params }),
  getPublisherOrders: (params) => api.get('/orders/publisher-orders', { params }),
  confirmPublisherOrder: (orderId) => api.put(`/orders/publisher-orders/${orderId}/confirm`),
  placePublisherOrder: (data) => api.post('/orders/publisher-orders', data)
}

export const wishlistAPI = {
  getWishlist: () => api.get('/wishlist'),
  addToWishlist: (isbn) => api.post('/wishlist', { isbn }),
  removeFromWishlist: (isbn) => api.delete(`/wishlist/${isbn}`),
  checkWishlist: (isbn) => api.get(`/wishlist/${isbn}`)
}

export const reviewsAPI = {
  getBookReviews: (isbn, params) => api.get(`/reviews/book/${isbn}`, { params }),
  createReview: (isbn, data) => api.post(`/reviews/book/${isbn}`, data),
  deleteReview: (isbn) => api.delete(`/reviews/book/${isbn}`),
  getUserReview: (isbn) => api.get(`/reviews/book/${isbn}/my-review`),
  getRecommendations: () => api.get('/reviews/recommendations')
}

export const passwordResetAPI = {
  requestReset: (email) => api.post('/password-reset/request', { email }),
  verifyToken: (token) => api.get(`/password-reset/verify/${token}`),
  resetPassword: (token, new_password) => api.post('/password-reset/reset', { token, new_password })
}

export const reportsAPI = {
  getDashboard: () => api.get('/reports/dashboard'),
  getPreviousMonthSales: () => api.get('/reports/sales/previous-month'),
  getSalesByDate: (date) => api.get('/reports/sales/by-date', { params: { date } }),
  getTopCustomers: () => api.get('/reports/customers/top'),
  getTopBooks: () => api.get('/reports/books/top'),
  getInventoryStatus: () => api.get('/reports/inventory/status'),
  getBookReorderCount: (isbn) => api.get(`/reports/books/${isbn}/reorders`)
}

export const adminAPI = {
  getPublishers: () => api.get('/admin/publishers'),
  createPublisher: (data) => api.post('/admin/publishers', data),
  updatePublisher: (id, data) => api.put(`/admin/publishers/${id}`, data),
  deletePublisher: (id) => api.delete(`/admin/publishers/${id}`),
  
  getAuthors: () => api.get('/admin/authors'),
  createAuthor: (data) => api.post('/admin/authors', data),
  updateAuthor: (id, data) => api.put(`/admin/authors/${id}`, data),
  deleteAuthor: (id) => api.delete(`/admin/authors/${id}`)
}

export default api
