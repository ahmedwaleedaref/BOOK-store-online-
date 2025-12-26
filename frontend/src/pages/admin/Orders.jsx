import React, { useState } from 'react'
import { useQuery } from 'react-query'
import { ordersAPI } from '../../services/api'
import Loading from '../../components/Loading'

const AdminOrders = () => {
	const [page, setPage] = useState(1)
	const [limit] = useState(20)

	const { data, isLoading } = useQuery(['admin-orders', page, limit], () =>
		ordersAPI.getAllOrders({ page, limit })
	)

	const orders = data?.data?.data?.orders || []
	const pagination = data?.data?.data?.pagination

	if (isLoading) return <Loading />

	return (
		<div className="max-w-7xl mx-auto px-4 py-8">
			<h1 className="text-3xl font-bold mb-6">Customer Orders</h1>

			<div className="card">
				<div className="flex items-center justify-between gap-3 mb-4">
					<h2 className="text-xl font-semibold">Orders</h2>
					{pagination && (
						<div className="text-sm text-gray-600">
							Page {pagination.page} of {pagination.pages} (Total: {pagination.total})
						</div>
					)}
				</div>

				{orders.length === 0 ? (
					<p className="text-gray-600">No orders found.</p>
				) : (
					<div className="overflow-x-auto">
						<table className="min-w-full">
							<thead>
								<tr className="text-left text-sm text-gray-600 border-b">
									<th className="py-2">Order</th>
									<th className="py-2">Customer</th>
									<th className="py-2">Email</th>
									<th className="py-2">Date</th>
									<th className="py-2">Total</th>
								</tr>
							</thead>
							<tbody>
								{orders.map((o) => (
									<tr key={o.order_id} className="border-b last:border-b-0">
										<td className="py-3 font-medium">#{o.order_id}</td>
										<td className="py-3">{o.username}</td>
										<td className="py-3 text-gray-600">{o.email}</td>
										<td className="py-3">{new Date(o.order_date).toLocaleString()}</td>
										<td className="py-3 font-semibold text-primary-600">${o.total_amount}</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}

				{pagination && (
					<div className="mt-4 flex items-center justify-between">
						<button
							className="btn btn-secondary"
							disabled={page <= 1}
							onClick={() => setPage((p) => Math.max(1, p - 1))}
						>
							Prev
						</button>
						<button
							className="btn btn-secondary"
							disabled={page >= pagination.pages}
							onClick={() => setPage((p) => p + 1)}
						>
							Next
						</button>
					</div>
				)}
			</div>
		</div>
	)
}

export default AdminOrders
