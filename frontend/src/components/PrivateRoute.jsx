import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const PrivateRoute = ({ children, requireAdmin, requireCustomer }) => {
  const { isAuthenticated, isAdmin, isCustomer } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/" replace />
  }

  if (requireCustomer && !isCustomer) {
    return <Navigate to="/" replace />
  }

  return children
}

export default PrivateRoute
