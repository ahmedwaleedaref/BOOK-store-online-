import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Add token to requests
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

// Handle responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data),
  logout: () => api.post('/auth/logout')
}

// Books API
export const booksAPI = {
  getAll: (params) => api.get('/books', { params }),
  getByIsbn: (isbn) => api.get(`/books/${isbn}`),
  search: (params) => api.get('/books/search', { params }),
  getByCategory: (category) => api.get(`/books/category/${category}`),
  getCategories: () => api.get('/books/categories'),
  create: (data) => api.post('/books', data),
  update: (isbn, data) => api.put(`/books/${isbn}`, data)
}

// Orders API
export const ordersAPI = {
  placeOrder: (data) => api.post('/orders/place-order', data),
  getMyOrders: () => api.get('/orders/my-orders'),
  getOrderDetails: (orderId) => api.get(`/orders/my-orders/${orderId}`),
  getAllOrders: (params) => api.get('/orders', { params }),
  getPublisherOrders: (params) => api.get('/orders/publisher-orders', { params }),
  confirmPublisherOrder: (orderId) => api.put(`/orders/publisher-orders/${orderId}/confirm`),
  placePublisherOrder: (data) => api.post('/orders/publisher-orders', data)
}

// Reports API
export const reportsAPI = {
  getDashboard: () => api.get('/reports/dashboard'),
  getPreviousMonthSales: () => api.get('/reports/sales/previous-month'),
  getSalesByDate: (date) => api.get('/reports/sales/by-date', { params: { date } }),
  getTopCustomers: () => api.get('/reports/customers/top'),
  getTopBooks: () => api.get('/reports/books/top'),
  getInventoryStatus: () => api.get('/reports/inventory/status'),
  getBookReorderCount: (isbn) => api.get(`/reports/books/${isbn}/reorders`)
}

// Admin API
export const adminAPI = {
  // Publishers
  getPublishers: () => api.get('/admin/publishers'),
  createPublisher: (data) => api.post('/admin/publishers', data),
  updatePublisher: (id, data) => api.put(`/admin/publishers/${id}`, data),
  deletePublisher: (id) => api.delete(`/admin/publishers/${id}`),
  
  // Authors
  getAuthors: () => api.get('/admin/authors'),
  createAuthor: (data) => api.post('/admin/authors', data),
  updateAuthor: (id, data) => api.put(`/admin/authors/${id}`, data),
  deleteAuthor: (id) => api.delete(`/admin/authors/${id}`)
}

export default api
