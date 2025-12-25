import React from 'react'
import { FiLoader } from 'react-icons/fi'

const Loading = ({ fullScreen = false, text = 'Loading...' }) => {
  if (fullScreen) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <FiLoader className="animate-spin text-primary-600 text-5xl mx-auto mb-4" />
          <p className="text-gray-600 text-lg">{text}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center py-12">
      <div className="text-center">
        <FiLoader className="animate-spin text-primary-600 text-4xl mx-auto mb-2" />
        <p className="text-gray-600">{text}</p>
      </div>
    </div>
  )
}

export default Loading
