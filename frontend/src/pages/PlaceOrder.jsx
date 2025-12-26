import React, { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { useQuery } from 'react-query'
import { booksAPI, ordersAPI } from '../services/api'
import { useCart } from '../context/CartContext'

const PlaceOrder = () => {
  const { items, clearCart } = useCart()
  const [loading, setLoading] = useState(false)
  const [creditCardNumber, setCreditCardNumber] = useState('')
  const [creditCardExpiry, setCreditCardExpiry] = useState('')
  const navigate = useNavigate()
  const { data } = useQuery('books', () => booksAPI.getAll())
  const books = data?.data?.data?.books || data?.data?.data || []

  const bookByIsbn = useMemo(() => {
    const map = new Map()
    books.forEach((b) => map.set(b.isbn, b))
    return map
  }, [books])

  const lines = useMemo(() => {
    return items.map((i) => {
      const book = bookByIsbn.get(i.isbn)
      const price = book?.price ?? 0
      const title = book?.title ?? i.isbn
      const subtotal = price * i.quantity
      return { ...i, title, price, subtotal }
    })
  }, [items, bookByIsbn])

  const total = useMemo(() => lines.reduce((acc, l) => acc + (l.subtotal || 0), 0), [lines])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (!items || items.length === 0) {
        toast.error('Your cart is empty')
        return
      }

      await ordersAPI.placeOrder({
        items,
        credit_card_number: creditCardNumber,
        credit_card_expiry: creditCardExpiry
      })

      clearCart()
      toast.success('Order placed successfully!')
      navigate('/my-orders')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to place order')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Checkout</h1>
      <div className="card">
        {items.length === 0 ? (
          <div className="text-center">
            <p className="text-gray-700">Your cart is empty.</p>
            <div className="mt-4">
              <Link to="/books" className="btn btn-primary">Browse Books</Link>
            </div>
          </div>
        ) : (
          <>
            <h2 className="text-xl font-semibold mb-4">Cart Items</h2>
            <div className="overflow-x-auto mb-6">
              <table className="min-w-full">
                <thead>
                  <tr className="text-left text-sm text-gray-600 border-b">
                    <th className="py-2">Book</th>
                    <th className="py-2">Qty</th>
                    <th className="py-2">Price</th>
                    <th className="py-2">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {lines.map((line) => (
                    <tr key={line.isbn} className="border-b last:border-b-0">
                      <td className="py-3 font-medium">{line.title}</td>
                      <td className="py-3">{line.quantity}</td>
                      <td className="py-3">${line.price}</td>
                      <td className="py-3 font-semibold">${line.subtotal.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between mb-8">
              <div className="text-gray-600">Total</div>
              <div className="text-2xl font-bold text-primary-600">${total.toFixed(2)}</div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <h2 className="text-xl font-semibold">Payment</h2>
              <div>
                <label className="text-sm text-gray-600">Credit Card Number</label>
                <input
                  className="input"
                  value={creditCardNumber}
                  onChange={(e) => setCreditCardNumber(e.target.value)}
                  placeholder="e.g. 4242 4242 4242 4242"
                  required
                />
              </div>
              <div>
                <label className="text-sm text-gray-600">Expiry Date</label>
                <input
                  className="input"
                  value={creditCardExpiry}
                  onChange={(e) => setCreditCardExpiry(e.target.value)}
                  placeholder="MM/YY"
                  required
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Link to="/cart" className="btn btn-secondary">Back to Cart</Link>
                <button type="submit" disabled={loading} className="btn btn-primary flex-1">
                  {loading ? 'Placing Order...' : 'Place Order'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
export default PlaceOrder
