import React, { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from 'react-query'
import { booksAPI } from '../services/api'
import { useCart } from '../context/CartContext'
import Loading from '../components/Loading'

const Cart = () => {
  const navigate = useNavigate()
  const { items, setQuantity, removeFromCart } = useCart()

  const { data, isLoading } = useQuery('books', () => booksAPI.getAll())
  const books = data?.data?.data?.books || data?.data?.data || []

  const bookByIsbn = useMemo(() => {
    const map = new Map()
    books.forEach((b) => map.set(b.isbn, b))
    return map
  }, [books])

  const lines = useMemo(() => {
    return items
      .map((i) => {
        const book = bookByIsbn.get(i.isbn)
        const price = book?.price ?? 0
        const title = book?.title ?? i.isbn
        const available = book?.quantity_in_stock
        const subtotal = price * i.quantity
        return { ...i, title, price, available, subtotal }
      })
      .filter(Boolean)
  }, [items, bookByIsbn])

  const total = useMemo(() => lines.reduce((acc, l) => acc + (l.subtotal || 0), 0), [lines])

  if (isLoading) return <Loading />

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold">Shopping Cart</h1>
          <p className="text-gray-600 mt-1">Review items, quantities, and total price.</p>
        </div>
        <div className="flex gap-3">
          <Link to="/books" className="btn btn-secondary">Browse Books</Link>
          <button
            type="button"
            className="btn btn-primary"
            disabled={items.length === 0}
            onClick={() => navigate('/place-order')}
          >
            Checkout
          </button>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="card text-center">
          <p className="text-gray-700">Your cart is empty.</p>
          <div className="mt-4">
            <Link to="/books" className="btn btn-primary">Start Shopping</Link>
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="text-left text-sm text-gray-600 border-b">
                  <th className="py-2">Book</th>
                  <th className="py-2">ISBN</th>
                  <th className="py-2">Price</th>
                  <th className="py-2">Qty</th>
                  <th className="py-2">Subtotal</th>
                  <th className="py-2"></th>
                </tr>
              </thead>
              <tbody>
                {lines.map((line) => (
                  <tr key={line.isbn} className="border-b last:border-b-0">
                    <td className="py-3 font-medium">{line.title}</td>
                    <td className="py-3 text-gray-600">{line.isbn}</td>
                    <td className="py-3">${line.price}</td>
                    <td className="py-3">
                      <input
                        type="number"
                        min="1"
                        className="input w-24"
                        value={line.quantity}
                        onChange={(e) => setQuantity(line.isbn, parseInt(e.target.value))}
                      />
                      {typeof line.available === 'number' && (
                        <div className="text-xs text-gray-500 mt-1">{line.available} available</div>
                      )}
                    </td>
                    <td className="py-3 font-semibold">${line.subtotal.toFixed(2)}</td>
                    <td className="py-3 text-right">
                      <button
                        type="button"
                        className="btn btn-danger"
                        onClick={() => removeFromCart(line.isbn)}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 flex items-center justify-between">
            <div className="text-gray-600">Total</div>
            <div className="text-2xl font-bold text-primary-600">${total.toFixed(2)}</div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Cart
