import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { FiStar, FiEdit2, FiTrash2 } from 'react-icons/fi'
import { reviewsAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'

const StarRating = ({ rating, onChange, readonly = false }) => {
  const [hover, setHover] = useState(0)

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onChange && onChange(star)}
          onMouseEnter={() => !readonly && setHover(star)}
          onMouseLeave={() => !readonly && setHover(0)}
          className={`${readonly ? 'cursor-default' : 'cursor-pointer'}`}
        >
          <FiStar
            className={`text-xl ${
              star <= (hover || rating)
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300'
            }`}
          />
        </button>
      ))}
    </div>
  )
}

const RatingDistribution = ({ stats }) => {
  const total = stats.totalReviews || 1

  return (
    <div className="space-y-2">
      {[5, 4, 3, 2, 1].map((star) => {
        const count = stats.distribution?.[star] || 0
        const percentage = (count / total) * 100

        return (
          <div key={star} className="flex items-center gap-2 text-sm">
            <span className="w-8">{star} ★</span>
            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-yellow-400 rounded-full"
                style={{ width: `${percentage}%` }}
              />
            </div>
            <span className="w-8 text-gray-500">{count}</span>
          </div>
        )
      })}
    </div>
  )
}

const BookReviews = ({ isbn }) => {
  const { isAuthenticated, user } = useAuth()
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [rating, setRating] = useState(5)
  const [reviewTitle, setReviewTitle] = useState('')
  const [reviewText, setReviewText] = useState('')

  const { data: reviewsData, isLoading } = useQuery(
    ['reviews', isbn],
    () => reviewsAPI.getBookReviews(isbn)
  )

  const { data: userReviewData } = useQuery(
    ['userReview', isbn],
    () => reviewsAPI.getUserReview(isbn),
    { enabled: isAuthenticated }
  )

  const createMutation = useMutation(
    (data) => reviewsAPI.createReview(isbn, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['reviews', isbn])
        queryClient.invalidateQueries(['userReview', isbn])
        setShowForm(false)
        resetForm()
      }
    }
  )

  const deleteMutation = useMutation(
    () => reviewsAPI.deleteReview(isbn),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['reviews', isbn])
        queryClient.invalidateQueries(['userReview', isbn])
      }
    }
  )

  const resetForm = () => {
    setRating(5)
    setReviewTitle('')
    setReviewText('')
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    createMutation.mutate({
      rating,
      review_title: reviewTitle,
      review_text: reviewText
    })
  }

  const reviews = reviewsData?.data?.data?.reviews || []
  const stats = reviewsData?.data?.data?.stats || {}
  const userReview = userReviewData?.data?.data

  const handleEdit = () => {
    if (userReview) {
      setRating(userReview.rating)
      setReviewTitle(userReview.review_title || '')
      setReviewText(userReview.review_text || '')
      setShowForm(true)
    }
  }

  if (isLoading) {
    return <div className="animate-pulse h-40 bg-gray-100 rounded-lg"></div>
  }

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-bold mb-6">Customer Reviews</h2>

      <div className="grid md:grid-cols-3 gap-8 mb-8">
        {/* Rating Summary */}
        <div className="bg-gray-50 rounded-lg p-6">
          <div className="text-center mb-4">
            <div className="text-5xl font-bold text-gray-900">
              {stats.averageRating || '—'}
            </div>
            <StarRating rating={Math.round(stats.averageRating || 0)} readonly />
            <p className="text-sm text-gray-500 mt-2">
              {stats.totalReviews || 0} reviews
            </p>
          </div>
          <RatingDistribution stats={stats} />
        </div>

        {/* Write Review */}
        <div className="md:col-span-2">
          {isAuthenticated && !showForm && !userReview && (
            <button
              onClick={() => setShowForm(true)}
              className="btn btn-primary mb-4"
            >
              Write a Review
            </button>
          )}

          {userReview && !showForm && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-blue-800">Your Review</p>
                  <StarRating rating={userReview.rating} readonly />
                  {userReview.review_title && (
                    <p className="font-semibold mt-2">{userReview.review_title}</p>
                  )}
                  {userReview.review_text && (
                    <p className="text-gray-600 mt-1">{userReview.review_text}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleEdit}
                    className="p-2 text-blue-600 hover:bg-blue-100 rounded"
                  >
                    <FiEdit2 />
                  </button>
                  <button
                    onClick={() => deleteMutation.mutate()}
                    className="p-2 text-red-600 hover:bg-red-100 rounded"
                  >
                    <FiTrash2 />
                  </button>
                </div>
              </div>
            </div>
          )}

          {showForm && (
            <form onSubmit={handleSubmit} className="bg-gray-50 rounded-lg p-6 mb-6">
              <h3 className="font-semibold mb-4">
                {userReview ? 'Update Your Review' : 'Write a Review'}
              </h3>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Rating</label>
                <StarRating rating={rating} onChange={setRating} />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Title (optional)</label>
                <input
                  type="text"
                  value={reviewTitle}
                  onChange={(e) => setReviewTitle(e.target.value)}
                  className="input w-full"
                  placeholder="Summarize your review"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Review (optional)</label>
                <textarea
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  className="input w-full h-24"
                  placeholder="What did you think of this book?"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={createMutation.isLoading}
                  className="btn btn-primary"
                >
                  {createMutation.isLoading ? 'Submitting...' : 'Submit Review'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false)
                    resetForm()
                  }}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
              </div>

              {createMutation.isError && (
                <p className="text-red-600 text-sm mt-2">
                  {createMutation.error?.response?.data?.message || 'Failed to submit review'}
                </p>
              )}
            </form>
          )}

          {/* Reviews List */}
          <div className="space-y-4">
            {reviews.length === 0 ? (
              <p className="text-gray-500">No reviews yet. Be the first to review!</p>
            ) : (
              reviews.map((review) => (
                <div key={review.review_id} className="border-b pb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <StarRating rating={review.rating} readonly />
                    <span className="text-sm text-gray-500">
                      by {review.first_name || review.username}
                    </span>
                  </div>
                  {review.review_title && (
                    <p className="font-semibold">{review.review_title}</p>
                  )}
                  {review.review_text && (
                    <p className="text-gray-600 mt-1">{review.review_text}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-2">
                    {new Date(review.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default BookReviews
