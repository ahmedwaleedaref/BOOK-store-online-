import React from 'react'
import { Link } from 'react-router-dom'
import { FiBook } from 'react-icons/fi'

const BookCard = ({ book }) => {
  const { isbn, title, price, category, quantity_in_stock, publisher_name, authors } = book

  const inStock = quantity_in_stock > 0

  return (
    <Link to={`/books/${isbn}`} className="block">
      <div className="card hover:shadow-lg transition-shadow duration-200 h-full">
        {/* Book Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-32 h-40 bg-gradient-to-br from-primary-100 to-primary-200 rounded-lg flex items-center justify-center">
            <FiBook className="text-5xl text-primary-600" />
          </div>
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
