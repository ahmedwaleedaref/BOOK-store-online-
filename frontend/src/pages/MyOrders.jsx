import React from 'react'
import { useQuery } from 'react-query'
import { ordersAPI } from '../services/api'
import { Link } from 'react-router-dom'
import Loading from '../components/Loading'

const MyOrders = () => {
  const { data, isLoading } = useQuery('my-orders', ordersAPI.getMyOrders)
  const orders = data?.data?.data || []

  if (isLoading) return <Loading />

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">My Orders</h1>
      {orders.length === 0 ? (
        <div className="card text-center"><p>No orders yet. <Link to="/place-order" className="text-primary-600">Place your first order</Link></p></div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => (
            <div key={order.order_id} className="card hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-center">
                <div><h3 className="font-semibold">Order #{order.order_id}</h3><p className="text-sm text-gray-600">{new Date(order.order_date).toLocaleDateString()}</p></div>
                <div className="text-right"><p className="text-xl font-bold text-primary-600">${order.total_amount}</p><Link to={`/my-orders/${order.order_id}`} className="text-sm text-primary-600">View Details</Link></div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
export default MyOrders
