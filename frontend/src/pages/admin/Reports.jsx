import React, { useState } from 'react'
import { useMutation, useQuery } from 'react-query'
import { toast } from 'react-toastify'
import { reportsAPI } from '../../services/api'
import Loading from '../../components/Loading'

const AdminReports = () => {
	const { data: prevMonthResp, isLoading: prevLoading } = useQuery(
		'report-prev-month',
		reportsAPI.getPreviousMonthSales
	)
	const { data: topCustomersResp } = useQuery('report-top-customers', reportsAPI.getTopCustomers)
	const { data: topBooksResp } = useQuery('report-top-books', reportsAPI.getTopBooks)
	const { data: inventoryResp } = useQuery('report-inventory', reportsAPI.getInventoryStatus)

	const prevMonth = prevMonthResp?.data?.data
	const topCustomers = topCustomersResp?.data?.data || []
	const topBooks = topBooksResp?.data?.data || []
	const inventory = inventoryResp?.data?.data || []

	const [salesDate, setSalesDate] = useState('')
	const [isbn, setIsbn] = useState('')

	const salesByDateMutation = useMutation((date) => reportsAPI.getSalesByDate(date), {
		onError: (err) => toast.error(err?.response?.data?.message || 'Failed to fetch sales')
	})

	const reorderMutation = useMutation((isbnValue) => reportsAPI.getBookReorderCount(isbnValue), {
		onError: (err) => toast.error(err?.response?.data?.message || 'Failed to fetch reorder count')
	})

	const submitSalesDate = (e) => {
		e.preventDefault()
		if (!salesDate) return
		salesByDateMutation.mutate(salesDate)
	}

	const submitIsbn = (e) => {
		e.preventDefault()
		if (!isbn) return
		reorderMutation.mutate(isbn.trim())
	}

	if (prevLoading) return <Loading />

	const salesByDate = salesByDateMutation.data?.data?.data
	const reorder = reorderMutation.data?.data?.data

	return (
		<div className="max-w-7xl mx-auto px-4 py-8">
			<h1 className="text-3xl font-bold mb-6">Reports</h1>

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				<div className="card">
					<h2 className="text-xl font-semibold mb-4">Previous Month Sales</h2>
					<div className="grid grid-cols-2 gap-4">
						<div>
							<div className="text-sm text-gray-500">Month</div>
							<div className="font-medium">{prevMonth?.month || '—'}</div>
						</div>
						<div>
							<div className="text-sm text-gray-500">Total Sales</div>
							<div className="font-medium">${prevMonth?.total_sales || 0}</div>
						</div>
						<div>
							<div className="text-sm text-gray-500">Orders</div>
							<div className="font-medium">{prevMonth?.num_orders || 0}</div>
						</div>
						<div>
							<div className="text-sm text-gray-500">Customers</div>
							<div className="font-medium">{prevMonth?.num_customers || 0}</div>
						</div>
					</div>
				</div>

				<div className="card">
					<h2 className="text-xl font-semibold mb-4">Sales By Date</h2>
					<form onSubmit={submitSalesDate} className="flex flex-col sm:flex-row gap-3">
						<input
							type="date"
							className="input"
							value={salesDate}
							onChange={(e) => setSalesDate(e.target.value)}
							required
						/>
						<button className="btn btn-primary" disabled={salesByDateMutation.isLoading}>
							{salesByDateMutation.isLoading ? 'Loading...' : 'Fetch'}
						</button>
					</form>

					{salesByDate && (
						<div className="mt-4 grid grid-cols-2 gap-4">
							<div>
								<div className="text-sm text-gray-500">Date</div>
								<div className="font-medium">{salesByDate.sale_date}</div>
							</div>
							<div>
								<div className="text-sm text-gray-500">Total Sales</div>
								<div className="font-medium">${salesByDate.total_sales}</div>
							</div>
							<div>
								<div className="text-sm text-gray-500">Orders</div>
								<div className="font-medium">{salesByDate.num_orders}</div>
							</div>
							<div>
								<div className="text-sm text-gray-500">Customers</div>
								<div className="font-medium">{salesByDate.num_customers}</div>
							</div>
						</div>
					)}
				</div>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
				<div className="card">
					<h2 className="text-xl font-semibold mb-4">Top Customers (Last 3 Months)</h2>
					{topCustomers.length === 0 ? (
						<p className="text-gray-600">No data.</p>
					) : (
						<div className="overflow-x-auto">
							<table className="min-w-full">
								<thead>
									<tr className="text-left text-sm text-gray-600 border-b">
										<th className="py-2">Customer</th>
										<th className="py-2">Username</th>
										<th className="py-2">Orders</th>
										<th className="py-2">Total Spent</th>
									</tr>
								</thead>
								<tbody>
									{topCustomers.map((c) => (
										<tr key={c.user_id} className="border-b last:border-b-0">
											<td className="py-3 font-medium">{c.customer_name}</td>
											<td className="py-3 text-gray-600">{c.username}</td>
											<td className="py-3">{c.num_orders}</td>
											<td className="py-3 font-semibold text-primary-600">${c.total_spent}</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
				</div>

				<div className="card">
					<h2 className="text-xl font-semibold mb-4">Top Books (Last 3 Months)</h2>
					{topBooks.length === 0 ? (
						<p className="text-gray-600">No data.</p>
					) : (
						<div className="overflow-x-auto">
							<table className="min-w-full">
								<thead>
									<tr className="text-left text-sm text-gray-600 border-b">
										<th className="py-2">Title</th>
										<th className="py-2">ISBN</th>
										<th className="py-2">Copies</th>
										<th className="py-2">Revenue</th>
									</tr>
								</thead>
								<tbody>
									{topBooks.map((b) => (
										<tr key={b.isbn} className="border-b last:border-b-0">
											<td className="py-3 font-medium">{b.title}</td>
											<td className="py-3 text-gray-600">{b.isbn}</td>
											<td className="py-3">{b.total_copies_sold}</td>
											<td className="py-3 font-semibold text-primary-600">${b.total_revenue}</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
				</div>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
				<div className="card">
					<h2 className="text-xl font-semibold mb-4">Low Inventory</h2>
					{inventory.length === 0 ? (
						<p className="text-gray-600">No low-stock items.</p>
					) : (
						<div className="overflow-x-auto">
							<table className="min-w-full">
								<thead>
									<tr className="text-left text-sm text-gray-600 border-b">
										<th className="py-2">Title</th>
										<th className="py-2">ISBN</th>
										<th className="py-2">Stock</th>
										<th className="py-2">Threshold</th>
										<th className="py-2">Status</th>
									</tr>
								</thead>
								<tbody>
									{inventory.map((i) => (
										<tr key={i.isbn} className="border-b last:border-b-0">
											<td className="py-3 font-medium">{i.title}</td>
											<td className="py-3 text-gray-600">{i.isbn}</td>
											<td className="py-3">{i.quantity_in_stock}</td>
											<td className="py-3">{i.threshold_quantity}</td>
											<td className="py-3 text-gray-600">{i.stock_status}</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
				</div>

				<div className="card">
					<h2 className="text-xl font-semibold mb-4">Book Reorder Count</h2>
					<form onSubmit={submitIsbn} className="flex flex-col sm:flex-row gap-3">
						<input
							className="input"
							placeholder="Enter ISBN"
							value={isbn}
							onChange={(e) => setIsbn(e.target.value)}
							required
						/>
						<button className="btn btn-primary" disabled={reorderMutation.isLoading}>
							{reorderMutation.isLoading ? 'Loading...' : 'Lookup'}
						</button>
					</form>

					{reorder && (
						<div className="mt-4">
							<div className="font-medium">{reorder.title}</div>
							<div className="text-sm text-gray-600">Publisher: {reorder.publisher_name}</div>
							<div className="grid grid-cols-2 gap-4 mt-3">
								<div>
									<div className="text-sm text-gray-500">Times Reordered</div>
									<div className="font-medium">{reorder.times_reordered}</div>
								</div>
								<div>
									<div className="text-sm text-gray-500">Units Received</div>
									<div className="font-medium">{reorder.total_units_received}</div>
								</div>
								<div>
									<div className="text-sm text-gray-500">Pending Units</div>
									<div className="font-medium">{reorder.pending_units}</div>
								</div>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	)
}

export default AdminReports
