import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { useAuth } from './context/AuthContext'

import Navbar from './components/Navbar'
import PrivateRoute from './components/PrivateRoute'
import Loading from './components/Loading'

import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Books from './pages/Books'
import BookDetails from './pages/BookDetails'
import PlaceOrder from './pages/PlaceOrder'
import MyOrders from './pages/MyOrders'
import OrderDetails from './pages/OrderDetails'
import Cart from './pages/Cart'
import Profile from './pages/Profile'

import AdminDashboard from './pages/admin/Dashboard'
import AdminBooks from './pages/admin/Books'
import AdminOrders from './pages/admin/Orders'
import AdminPublisherOrders from './pages/admin/PublisherOrders'
import AdminPublishers from './pages/admin/Publishers'
import AdminAuthors from './pages/admin/Authors'
import AdminReports from './pages/admin/Reports'

function App() {
  const { loading, isAdmin } = useAuth()

  if (loading) {
    return <Loading fullScreen />
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/books" element={isAdmin ? <Navigate to="/admin" replace /> : <Books />} />
          <Route path="/books/:isbn" element={isAdmin ? <Navigate to="/admin" replace /> : <BookDetails />} />

          {/* Customer Routes */}
          <Route
            path="/cart"
            element={
              <PrivateRoute requireCustomer>
                <Cart />
              </PrivateRoute>
            }
          />
          <Route
            path="/place-order"
            element={
              <PrivateRoute requireCustomer>
                <PlaceOrder />
              </PrivateRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <PrivateRoute requireCustomer>
                <Profile />
              </PrivateRoute>
            }
          />
          <Route
            path="/my-orders"
            element={
              <PrivateRoute requireCustomer>
                <MyOrders />
              </PrivateRoute>
            }
          />
          <Route
            path="/my-orders/:orderId"
            element={
              <PrivateRoute requireCustomer>
                <OrderDetails />
              </PrivateRoute>
            }
          />

          {/* Admin Routes */}
          <Route
            path="/admin"
            element={
              <PrivateRoute requireAdmin>
                <AdminDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/books"
            element={
              <PrivateRoute requireAdmin>
                <AdminBooks />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/orders"
            element={
              <PrivateRoute requireAdmin>
                <AdminOrders />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/publisher-orders"
            element={
              <PrivateRoute requireAdmin>
                <AdminPublisherOrders />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/publishers"
            element={
              <PrivateRoute requireAdmin>
                <AdminPublishers />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/authors"
            element={
              <PrivateRoute requireAdmin>
                <AdminAuthors />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/reports"
            element={
              <PrivateRoute requireAdmin>
                <AdminReports />
              </PrivateRoute>
            }
          />

          {/* 404 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </div>
  )
}

export default App
