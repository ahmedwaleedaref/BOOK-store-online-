import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { FiBook } from 'react-icons/fi'

const BookCard = ({ book }) => {
  const { isbn, title, price, category, quantity_in_stock, publisher_name, authors, cover_image } = book
  const [imageError, setImageError] = useState(false)

  const inStock = quantity_in_stock > 0

  // Fallback to Open Library cover if no cover_image or image fails to load
  const coverUrl = cover_image || `https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg`

  return (
    <Link to={`/books/${isbn}`} className="block">
      <div className="card hover:shadow-lg transition-shadow duration-200 h-full">
        {/* Book Cover */}
        <div className="flex justify-center mb-4">
          {!imageError ? (
            <img
              src={coverUrl}
              alt={title}
              className="w-32 h-48 object-cover rounded-lg shadow-md"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-32 h-48 bg-gradient-to-br from-primary-100 to-primary-200 rounded-lg flex items-center justify-center shadow-md">
              <FiBook className="text-5xl text-primary-600" />
            </div>
          )}
        </div>

        {/* Book Info */}
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-gray-800 line-clamp-2 min-h-[3.5rem]">
            {title}
          </h3>

          {authors && (
            <p className="text-sm text-gray-600 line-clamp-1">
              By {authors}
            </p>
          )}

          {publisher_name && (
            <p className="text-xs text-gray-500">
              {publisher_name}
            </p>
          )}

          <div className="flex items-center justify-between pt-2">
            <span className="badge badge-info">{category}</span>
            <span className="text-xl font-bold text-primary-600">
              ${price}
            </span>
          </div>

          <div className="pt-2">
            {inStock ? (
              <span className="badge badge-success">
                {quantity_in_stock} in stock
              </span>
            ) : (
              <span className="badge badge-danger">
                Out of stock
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}

export default BookCard
