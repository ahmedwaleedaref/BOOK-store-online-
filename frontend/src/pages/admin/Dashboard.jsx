import React from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from 'react-query'
import { reportsAPI } from '../../services/api'

const Dashboard = () => {
  const { data } = useQuery('dashboard', reportsAPI.getDashboard)
  const stats = data?.data?.data || {}

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="card"><h3 className="text-gray-600">Total Books</h3><p className="text-3xl font-bold">{stats.totalBooks || 0}</p></div>
        <div className="card"><h3 className="text-gray-600">Total Customers</h3><p className="text-3xl font-bold">{stats.totalCustomers || 0}</p></div>
        <div className="card"><h3 className="text-gray-600">Total Orders</h3><p className="text-3xl font-bold">{stats.totalOrders || 0}</p></div>
        <div className="card"><h3 className="text-gray-600">Total Revenue</h3><p className="text-3xl font-bold">${stats.totalRevenue || 0}</p></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Link to="/admin/books" className="btn btn-primary py-4 text-center">Manage Books</Link>
        <Link to="/admin/orders" className="btn btn-primary py-4 text-center">Customer Orders</Link>
        <Link to="/admin/publisher-orders" className="btn btn-primary py-4 text-center">Publisher Orders</Link>
        <Link to="/admin/publishers" className="btn btn-secondary py-4 text-center">Manage Publishers</Link>
        <Link to="/admin/authors" className="btn btn-secondary py-4 text-center">Manage Authors</Link>
        <Link to="/admin/reports" className="btn btn-secondary py-4 text-center">Reports</Link>
      </div>
    </div>
  )
}
export default Dashboard
