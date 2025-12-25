import React from 'react'
import { Link } from 'react-router-dom'
import { FiBook, FiShoppingCart, FiTrendingUp, FiUsers } from 'react-icons/fi'
import { useAuth } from '../context/AuthContext'

const Home = () => {
  const { isAuthenticated, isAdmin, isCustomer } = useAuth()

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Welcome to Our Bookstore
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Discover thousands of books across all categories. Order directly with our simplified system.
          </p>

          <div className="flex justify-center space-x-4">
            <Link
              to="/books"
              className="btn btn-primary text-lg px-8 py-3"
            >
              Browse Books
            </Link>
            {!isAuthenticated && (
              <Link
                to="/register"
                className="btn btn-secondary text-lg px-8 py-3"
              >
                Register Now
              </Link>
            )}
          </div>
        </div>

        {/* Features */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="card text-center">
            <FiBook className="text-5xl text-primary-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Wide Selection</h3>
            <p className="text-gray-600">
              Browse thousands of books across Science, Art, Religion, History, and Geography
            </p>
          </div>

          <div className="card text-center">
            <FiShoppingCart className="text-5xl text-primary-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Easy Ordering</h3>
            <p className="text-gray-600">
              Place orders directly - no cart needed. Simple and fast!
            </p>
          </div>

          <div className="card text-center">
            <FiTrendingUp className="text-5xl text-primary-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Auto Stock Management</h3>
            <p className="text-gray-600">
              Automated reordering ensures books are always available
            </p>
          </div>

          <div className="card text-center">
            <FiUsers className="text-5xl text-primary-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Track Orders</h3>
            <p className="text-gray-600">
              View your complete order history and details anytime
            </p>
          </div>
        </div>

        {/* Quick Links based on user type */}
        {isAuthenticated && (
          <div className="mt-16 card">
            <h2 className="text-2xl font-bold mb-6 text-center">
              Quick Actions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {isAdmin ? (
                <>
                  <Link
                    to="/admin"
                    className="btn btn-primary py-4 text-center"
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/admin/books"
                    className="btn btn-secondary py-4 text-center"
                  >
                    Manage Books
                  </Link>
                  <Link
                    to="/admin/orders"
                    className="btn btn-secondary py-4 text-center"
                  >
                    View Orders
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/books"
                    className="btn btn-primary py-4 text-center"
                  >
                    Browse Books
                  </Link>
                  <Link
                    to="/place-order"
                    className="btn btn-primary py-4 text-center"
                  >
                    Place Order
                  </Link>
                  <Link
                    to="/my-orders"
                    className="btn btn-secondary py-4 text-center"
                  >
                    My Orders
                  </Link>
                </>
              )}
            </div>
          </div>
        )}

        {/* Statistics */}
        <div className="mt-16">
          <h2 className="text-3xl font-bold text-center mb-8">Why Choose Us?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-primary-600 mb-2">1000+</div>
              <div className="text-gray-600">Books Available</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary-600 mb-2">5</div>
              <div className="text-gray-600">Categories</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary-600 mb-2">24/7</div>
              <div className="text-gray-600">Online Ordering</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Home
