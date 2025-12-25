import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { useQuery } from 'react-query'
import { booksAPI, ordersAPI } from '../services/api'

const PlaceOrder = () => {
  const [items, setItems] = useState([{ isbn: '', quantity: 1 }])
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { data } = useQuery('books', () => booksAPI.getAll())
  const books = data?.data?.data?.books || data?.data?.data || []

  const addItem = () => setItems([...items, { isbn: '', quantity: 1 }])
  const removeItem = (index) => setItems(items.filter((_, i) => i !== index))
  const updateItem = (index, field, value) => {
    const updated = [...items]
    updated[index][field] = value
    setItems(updated)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const response = await ordersAPI.placeOrder({ items })
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
      <h1 className="text-3xl font-bold mb-6">Place Order</h1>
      <div className="card">
        <form onSubmit={handleSubmit}>
          {items.map((item, index) => (
            <div key={index} className="flex gap-4 mb-4">
              <select required className="input flex-1" value={item.isbn}
                onChange={(e) => updateItem(index, 'isbn', e.target.value)}>
                <option value="">Select Book</option>
                {books.map(book => (
                  <option key={book.isbn} value={book.isbn}>
                    {book.title} - ${book.price} ({book.quantity_in_stock} available)
                  </option>
                ))}
              </select>
              <input type="number" min="1" required className="input w-24" value={item.quantity}
                onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value))} />
              {items.length > 1 && (
                <button type="button" onClick={() => removeItem(index)} className="btn btn-danger">Remove</button>
              )}
            </div>
          ))}
          <button type="button" onClick={addItem} className="btn btn-secondary mb-4">Add Another Book</button>
          <button type="submit" disabled={loading} className="btn btn-primary w-full">
            {loading ? 'Placing Order...' : 'Place Order'}
          </button>
        </form>
      </div>
    </div>
  )
}
export default PlaceOrder
