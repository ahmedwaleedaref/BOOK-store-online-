import React, { useMemo, useState } from 'react'
import { useQuery } from 'react-query'
import { useSearchParams } from 'react-router-dom'
import { FiSearch, FiFilter, FiX } from 'react-icons/fi'
import { booksAPI } from '../services/api'
import BookCard from '../components/BookCard'
import Loading from '../components/Loading'

const Books = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '')
  const [category, setCategory] = useState(searchParams.get('category') || '')
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || '')
  const [order, setOrder] = useState(searchParams.get('order') || 'asc')
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '')
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '')
  const [inStock, setInStock] = useState(searchParams.get('inStock') === 'true')
  const [showFilters, setShowFilters] = useState(false)

  const { data: categoriesData } = useQuery('categories', booksAPI.getCategories)

  // Determine if we're in search mode
  const isSearchMode = searchParams.get('q')?.trim().length > 0

  const { data, isLoading } = useQuery(
    ['books', searchParams.toString()],
    () => {
      if (isSearchMode) {
        return booksAPI.fullSearch({
          q: searchParams.get('q'),
          category: searchParams.get('category') || undefined,
          minPrice: searchParams.get('minPrice') || undefined,
          maxPrice: searchParams.get('maxPrice') || undefined,
          inStock: searchParams.get('inStock') || undefined,
          sortBy: searchParams.get('sortBy') || undefined,
          order: searchParams.get('order') || undefined
        })
      }
      return category ? booksAPI.getByCategory(category) : booksAPI.getAll()
    }
  )

  const books = data?.data?.data?.books || data?.data?.data || []
  const pagination = data?.data?.data?.pagination
  const categories = useMemo(() => {
    const raw = categoriesData?.data?.data || []
    return raw.map((c) => c.category).filter(Boolean)
  }, [categoriesData])

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      const params = { q: searchQuery.trim() }
      if (category) params.category = category
      if (minPrice) params.minPrice = minPrice
      if (maxPrice) params.maxPrice = maxPrice
      if (inStock) params.inStock = 'true'
      if (sortBy) params.sortBy = sortBy
      if (order) params.order = order
      setSearchParams(params)
    }
  }

  const clearSearch = () => {
    setSearchQuery('')
    setCategory('')
    setMinPrice('')
    setMaxPrice('')
    setInStock(false)
    setSortBy('')
    setOrder('asc')
    setSearchParams({})
  }

  const applyFilters = () => {
    if (searchQuery.trim()) {
      const params = { q: searchQuery.trim() }
      if (category) params.category = category
      if (minPrice) params.minPrice = minPrice
      if (maxPrice) params.maxPrice = maxPrice
      if (inStock) params.inStock = 'true'
      if (sortBy) params.sortBy = sortBy
      if (order) params.order = order
      setSearchParams(params)
    } else if (category) {
      setSearchParams({ category })
    }
    setShowFilters(false)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Browse Books</h1>
      
      {/* Search Bar */}
      <form onSubmit={handleSearch} className="mb-6">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by title, author, publisher, ISBN..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pl-10 w-full"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <FiX />
              </button>
            )}
          </div>
          <button type="submit" className="btn btn-primary px-6">
            Search
          </button>
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={`btn ${showFilters ? 'btn-primary' : 'btn-secondary'} px-4`}
          >
            <FiFilter />
          </button>
        </div>
      </form>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-gray-50 rounded-lg p-4 mb-6 border">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select 
                className="input w-full" 
                value={category} 
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="">All Categories</option>
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price Range</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="input w-full"
                  min="0"
                  step="0.01"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="input w-full"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
              <div className="flex gap-2">
                <select 
                  className="input flex-1" 
                  value={sortBy} 
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="">Relevance</option>
                  <option value="price">Price</option>
                  <option value="title">Title</option>
                  <option value="year">Year</option>
                </select>
                <select 
                  className="input w-24" 
                  value={order} 
                  onChange={(e) => setOrder(e.target.value)}
                >
                  <option value="asc">Asc</option>
                  <option value="desc">Desc</option>
                </select>
              </div>
            </div>

            <div className="flex items-end gap-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={inStock}
                  onChange={(e) => setInStock(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300"
                />
                <span className="text-sm text-gray-700">In Stock Only</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <button onClick={clearSearch} className="btn btn-secondary">
              Clear All
            </button>
            <button onClick={applyFilters} className="btn btn-primary">
              Apply Filters
            </button>
          </div>
        </div>
      )}

      {/* Search Results Header */}
      {isSearchMode && (
        <div className="flex items-center justify-between mb-4">
          <p className="text-gray-600">
            {pagination?.total || books.length} results for "{searchParams.get('q')}"
          </p>
          <button onClick={clearSearch} className="text-primary-600 hover:underline text-sm">
            Clear search
          </button>
        </div>
      )}

      {/* Category filter for non-search mode */}
      {!isSearchMode && (
        <div className="mb-6">
          <select 
            className="input max-w-xs" 
            value={category} 
            onChange={(e) => {
              setCategory(e.target.value)
              if (e.target.value) {
                setSearchParams({ category: e.target.value })
              } else {
                setSearchParams({})
              }
            }}
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      )}

      {isLoading ? <Loading /> : (
        <>
          {books.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No books found</p>
              {isSearchMode && (
                <p className="text-gray-400 mt-2">Try a different search term or adjust filters</p>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {books.map(book => <BookCard key={book.isbn} book={book} />)}
            </div>
          )}
        </>
      )}
    </div>
  )
}
export default Books
