import React, { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from 'react-query'
import { toast } from 'react-toastify'
import { booksAPI, ordersAPI } from '../../services/api'
import Loading from '../../components/Loading'

const AdminPublisherOrders = () => {
	const queryClient = useQueryClient()
	const [status, setStatus] = useState('pending')
	const [manualOrder, setManualOrder] = useState({ book_isbn: '', order_quantity: 1 })

	const { data, isLoading } = useQuery(['publisher-orders', status], () =>
		ordersAPI.getPublisherOrders({ status })
	)

	const { data: booksResp } = useQuery('all-books-for-publisher-order', () =>
		booksAPI.getAll({ page: 1, limit: 100 })
	)

	const books = useMemo(() => booksResp?.data?.data?.books || [], [booksResp])
	const orders = data?.data?.data || []

	const confirmMutation = useMutation((orderId) => ordersAPI.confirmPublisherOrder(orderId), {
		onSuccess: () => {
			toast.success('Publisher order confirmed')
			queryClient.invalidateQueries('publisher-orders')
		},
		onError: (err) => toast.error(err?.response?.data?.message || 'Failed to confirm')
	})

	const manualMutation = useMutation((payload) => ordersAPI.placePublisherOrder(payload), {
		onSuccess: () => {
			toast.success('Publisher order placed')
			queryClient.invalidateQueries('publisher-orders')
			setManualOrder({ book_isbn: '', order_quantity: 1 })
		},
		onError: (err) => toast.error(err?.response?.data?.message || 'Failed to place order')
	})

	const submitManual = (e) => {
		e.preventDefault()
		manualMutation.mutate({
			book_isbn: manualOrder.book_isbn,
			order_quantity: Number(manualOrder.order_quantity)
		})
	}

	return (
		<div className="max-w-7xl mx-auto px-4 py-8">
			<h1 className="text-3xl font-bold mb-6">Publisher Orders</h1>

			<div className="card mb-8">
				<h2 className="text-xl font-semibold mb-4">Place Manual Publisher Order</h2>
				<form onSubmit={submitManual} className="grid grid-cols-1 md:grid-cols-3 gap-4">
					<select
						className="input"
						required
						value={manualOrder.book_isbn}
						onChange={(e) => setManualOrder({ ...manualOrder, book_isbn: e.target.value })}
					>
						<option value="">Select Book</option>
						{books.map((b) => (
							<option key={b.isbn} value={b.isbn}>
								{b.title} ({b.isbn})
							</option>
						))}
					</select>
					<input
						type="number"
						min="1"
						className="input"
						value={manualOrder.order_quantity}
						onChange={(e) => setManualOrder({ ...manualOrder, order_quantity: e.target.value })}
					/>
					<button className="btn btn-primary" disabled={manualMutation.isLoading}>
						{manualMutation.isLoading ? 'Placing...' : 'Place Order'}
					</button>
				</form>
			</div>

			<div className="card">
				<div className="flex items-center justify-between gap-3 mb-4">
					<h2 className="text-xl font-semibold">Orders ({status})</h2>
					<select className="input max-w-xs" value={status} onChange={(e) => setStatus(e.target.value)}>
						<option value="pending">Pending</option>
						<option value="confirmed">Confirmed</option>
					</select>
				</div>

				{isLoading ? (
					<Loading />
				) : orders.length === 0 ? (
					<p className="text-gray-600">No publisher orders found.</p>
				) : (
					<div className="overflow-x-auto">
						<table className="min-w-full">
							<thead>
								<tr className="text-left text-sm text-gray-600 border-b">
									<th className="py-2">Order</th>
									<th className="py-2">Book</th>
									<th className="py-2">Publisher</th>
									<th className="py-2">Qty</th>
									<th className="py-2">Type</th>
									<th className="py-2">Date</th>
									<th className="py-2">Actions</th>
								</tr>
							</thead>
							<tbody>
								{orders.map((o) => (
									<tr key={o.order_id} className="border-b last:border-b-0">
										<td className="py-3 font-medium">#{o.order_id}</td>
										<td className="py-3">{o.title}</td>
										<td className="py-3">{o.publisher_name}</td>
										<td className="py-3">{o.order_quantity}</td>
										<td className="py-3 text-gray-600">{o.order_type}</td>
										<td className="py-3">{new Date(o.order_date).toLocaleString()}</td>
										<td className="py-3">
											{status === 'pending' ? (
												<button
													className="btn btn-primary"
													disabled={confirmMutation.isLoading}
													onClick={() => confirmMutation.mutate(o.order_id)}
												>
													Confirm
												</button>
											) : (
												<span className="text-sm text-gray-600">Confirmed</span>
											)}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</div>
		</div>
	)
}

export default AdminPublisherOrders
