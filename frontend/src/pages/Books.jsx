import React, { useState } from 'react'
import { useQuery } from 'react-query'
import { booksAPI } from '../services/api'
import BookCard from '../components/BookCard'
import Loading from '../components/Loading'

const Books = () => {
  const [category, setCategory] = useState('')
  const { data, isLoading } = useQuery(['books', category], () =>
    category ? booksAPI.getByCategory(category) : booksAPI.getAll()
  )

  const books = data?.data?.data?.books || data?.data?.data || []

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Browse Books</h1>
      
      <div className="mb-6">
        <select className="input max-w-xs" value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">All Categories</option>
          <option value="Science">Science</option>
          <option value="Art">Art</option>
          <option value="Religion">Religion</option>
          <option value="History">History</option>
          <option value="Geography">Geography</option>
        </select>
      </div>

      {isLoading ? <Loading /> : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {books.map(book => <BookCard key={book.isbn} book={book} />)}
        </div>
      )}
    </div>
  )
}
export default Books
