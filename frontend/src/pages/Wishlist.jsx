import React from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { Link } from 'react-router-dom'
import { FiHeart, FiShoppingCart, FiTrash2 } from 'react-icons/fi'
import { wishlistAPI } from '../services/api'
import { useCart } from '../context/CartContext'
import Loading from '../components/Loading'

const Wishlist = () => {
  const queryClient = useQueryClient()
  const { addToCart } = useCart()

  const { data, isLoading } = useQuery('wishlist', wishlistAPI.getWishlist)

  const removeMutation = useMutation(
    (isbn) => wishlistAPI.removeFromWishlist(isbn),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('wishlist')
      }
    }
  )

  const wishlistItems = data?.data?.data || []

  const handleAddToCart = (item) => {
    addToCart({
      isbn: item.isbn,
      title: item.title,
      price: item.price,
      quantity: 1
    })
  }

  if (isLoading) return <Loading />

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <FiHeart className="text-3xl text-red-500" />
        <h1 className="text-3xl font-bold">My Wishlist</h1>
      </div>

      {wishlistItems.length === 0 ? (
        <div className="text-center py-12">
          <FiHeart className="text-6xl text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg mb-4">Your wishlist is empty</p>
          <Link to="/books" className="btn btn-primary">
            Browse Books
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {wishlistItems.map((item) => (
            <div
              key={item.isbn}
              className="card flex flex-col sm:flex-row items-start sm:items-center gap-4"
            >
              <Link to={`/books/${item.isbn}`} className="flex-1">
                <h3 className="font-semibold text-lg hover:text-primary-600">
                  {item.title}
                </h3>
                {item.authors && (
                  <p className="text-sm text-gray-600">By {item.authors}</p>
                )}
                <p className="text-xs text-gray-500">{item.publisher_name}</p>
              </Link>

              <div className="flex items-center gap-4">
                <span className="text-xl font-bold text-primary-600">
                  ${item.price}
                </span>

                {item.quantity_in_stock > 0 ? (
                  <span className="badge badge-success">In Stock</span>
                ) : (
                  <span className="badge badge-danger">Out of Stock</span>
                )}

                <button
                  onClick={() => handleAddToCart(item)}
                  disabled={item.quantity_in_stock === 0}
                  className="btn btn-primary flex items-center gap-2"
                >
                  <FiShoppingCart />
                  Add to Cart
                </button>

                <button
                  onClick={() => removeMutation.mutate(item.isbn)}
                  className="btn btn-secondary text-red-600 hover:bg-red-50"
                >
                  <FiTrash2 />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Wishlist
