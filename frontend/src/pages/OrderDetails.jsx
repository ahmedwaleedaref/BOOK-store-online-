import React from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery } from 'react-query'
import { FiDownload } from 'react-icons/fi'
import { ordersAPI } from '../services/api'
import Loading from '../components/Loading'
import { useAuth } from '../context/AuthContext'

const OrderDetails = () => {
  const { orderId } = useParams()
  const { isAdmin } = useAuth()

  const {
    data,
    isLoading,
    isError,
    error
  } = useQuery(['order-details', orderId], () => ordersAPI.getOrderDetails(orderId), {
    enabled: !!orderId
  })

  const payload = data?.data?.data
  const order = payload?.order
  const items = payload?.items || []

  const handleDownloadInvoice = async () => {
    try {
      const response = await ordersAPI.downloadInvoice(orderId)
      const blob = new Blob([response.data], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `invoice-${orderId}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Failed to download invoice:', err)
    }
  }

  if (isLoading) return <Loading />

  if (isError) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="card">
          <h1 className="text-2xl font-bold mb-2">Unable to load order</h1>
          <p className="text-gray-600">
            {error?.response?.data?.message || 'Failed to load order details'}
          </p>
          <div className="mt-4">
            <Link to="/my-orders" className="btn btn-secondary">Back to My Orders</Link>
          </div>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="card">
          <h1 className="text-2xl font-bold">Order not found</h1>
          <div className="mt-4">
            <Link to="/my-orders" className="btn btn-secondary">Back to My Orders</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold">Order #{order.order_id}</h1>
          <p className="text-gray-600 mt-1">
            Placed on {new Date(order.order_date).toLocaleString()}
          </p>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-500">Total</div>
          <div className="text-3xl font-bold text-primary-600">${order.total_amount}</div>
        </div>
      </div>

      <div className="card">
        {(order.credit_card_number || order.credit_card_expiry) && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">Payment</h2>
            <div className="text-gray-700">
              <div>Card: <span className="font-medium">{order.credit_card_number || '—'}</span></div>
              <div>Expiry: <span className="font-medium">{order.credit_card_expiry || '—'}</span></div>
            </div>
          </div>
        )}

        <h2 className="text-xl font-semibold mb-4">Items</h2>
        {items.length === 0 ? (
          <p className="text-gray-600">No items found for this order.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="text-left text-sm text-gray-600 border-b">
                  <th className="py-2">Book</th>
                  <th className="py-2">ISBN</th>
                  <th className="py-2">Qty</th>
                  <th className="py-2">Price</th>
                  <th className="py-2">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.order_item_id} className="border-b last:border-b-0">
                    <td className="py-3 font-medium">{item.title}</td>
                    <td className="py-3 text-gray-600">{item.book_isbn}</td>
                    <td className="py-3">{item.quantity}</td>
                    <td className="py-3">${item.price_at_purchase}</td>
                    <td className="py-3 font-semibold">${item.subtotal}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            onClick={handleDownloadInvoice}
            className="btn btn-primary flex items-center gap-2"
          >
            <FiDownload />
            Download Invoice
          </button>
          <Link to="/my-orders" className="btn btn-secondary">Back</Link>
          <Link to={isAdmin ? '/admin' : '/books'} className="btn btn-secondary">
            {isAdmin ? 'Admin Dashboard' : 'Browse Books'}
          </Link>
        </div>
      </div>
    </div>
  )
}

export default OrderDetails
