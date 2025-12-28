import React from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { FiHeart, FiShoppingCart } from 'react-icons/fi'
import { booksAPI, wishlistAPI } from '../services/api'
import Loading from '../components/Loading'
import BookReviews from '../components/BookReviews'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'

const BookDetails = () => {
  const { isbn } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { isAuthenticated, isCustomer } = useAuth()
  const { addToCart } = useCart()

  const {
    data,
    isLoading,
    isError,
    error
  } = useQuery(['book', isbn], () => booksAPI.getByIsbn(isbn), {
    enabled: !!isbn
  })

  const { data: wishlistData } = useQuery(
    ['wishlistCheck', isbn],
    () => wishlistAPI.checkWishlist(isbn),
    { enabled: isAuthenticated && isCustomer }
  )

  const addToWishlistMutation = useMutation(
    () => wishlistAPI.addToWishlist(isbn),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['wishlistCheck', isbn])
        queryClient.invalidateQueries('wishlist')
      }
    }
  )

  const removeFromWishlistMutation = useMutation(
    () => wishlistAPI.removeFromWishlist(isbn),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['wishlistCheck', isbn])
        queryClient.invalidateQueries('wishlist')
      }
    }
  )

  const book = data?.data?.data
  const inWishlist = wishlistData?.data?.data?.inWishlist

  if (isLoading) return <Loading />

  if (isError) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="card">
          <h1 className="text-2xl font-bold mb-2">Book not available</h1>
          <p className="text-gray-600">
            {error?.response?.data?.message || 'Failed to load book details'}
          </p>
          <div className="mt-4">
            <Link to="/books" className="btn btn-secondary">Back to Books</Link>
          </div>
        </div>
      </div>
    )
  }

  if (!book) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="card">
          <h1 className="text-2xl font-bold">Book not found</h1>
          <div className="mt-4">
            <Link to="/books" className="btn btn-secondary">Back to Books</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold">{book.title}</h1>
          <p className="text-gray-600 mt-1">ISBN: {book.isbn}</p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-primary-600">${book.price}</div>
          <div className="text-sm text-gray-600">In stock: {book.quantity_in_stock}</div>
        </div>
      </div>

      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-gray-500">Authors</div>
            <div className="font-medium">{book.authors || '—'}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Publisher</div>
            <div className="font-medium">{book.publisher_name || '—'}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Category</div>
            <div className="font-medium">{book.category || '—'}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Publication Year</div>
            <div className="font-medium">{book.publication_year || '—'}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Threshold Quantity</div>
            <div className="font-medium">{book.threshold_quantity ?? '—'}</div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          {isAuthenticated && isCustomer ? (
            <>
              <button
                type="button"
                className="btn btn-primary flex items-center gap-2"
                onClick={() => addToCart(book.isbn, 1)}
              >
                <FiShoppingCart />
                Add to Cart
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  addToCart(book.isbn, 1)
                  navigate('/cart')
                }}
              >
                Go to Cart
              </button>
              <button
                type="button"
                className={`btn flex items-center gap-2 ${
                  inWishlist
                    ? 'bg-red-100 text-red-600 hover:bg-red-200'
                    : 'btn-secondary'
                }`}
                onClick={() =>
                  inWishlist
                    ? removeFromWishlistMutation.mutate()
                    : addToWishlistMutation.mutate()
                }
              >
                <FiHeart className={inWishlist ? 'fill-red-500' : ''} />
                {inWishlist ? 'In Wishlist' : 'Add to Wishlist'}
              </button>
            </>
          ) : (
            <Link to="/login" className="btn btn-primary">Login to buy</Link>
          )}
          <Link to="/books" className="btn btn-secondary">Back</Link>
        </div>
      </div>

      {/* Reviews Section */}
      <BookReviews isbn={isbn} />
    </div>
  )
}

export default BookDetails
