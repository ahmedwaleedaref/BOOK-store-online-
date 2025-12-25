import React from 'react'
import { useParams } from 'react-router-dom'
const OrderDetails = () => {
  const { orderId } = useParams()
  return <div className="max-w-4xl mx-auto px-4 py-8"><h1 className="text-3xl font-bold">Order Details: #{orderId}</h1></div>
}
export default OrderDetails
