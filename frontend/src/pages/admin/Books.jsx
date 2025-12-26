import React, { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from 'react-query'
import { toast } from 'react-toastify'
import { adminAPI, booksAPI } from '../../services/api'
import Loading from '../../components/Loading'

const AdminBooks = () => {
	const queryClient = useQueryClient()

	const [page, setPage] = useState(1)
	const [limit] = useState(20)

	const [createForm, setCreateForm] = useState({
		isbn: '',
		title: '',
		publisher_id: '',
		publication_year: '',
		price: '',
		category: 'Science',
		quantity_in_stock: 0,
		threshold_quantity: 0,
		author_ids: []
	})

	const { data: booksResp, isLoading: booksLoading } = useQuery(
		['admin-books', page, limit],
		() => booksAPI.getAll({ page, limit })
	)

	const { data: publishersResp } = useQuery('admin-publishers', adminAPI.getPublishers)
	const { data: authorsResp } = useQuery('admin-authors', adminAPI.getAuthors)

	const books = booksResp?.data?.data?.books || []
	const pagination = booksResp?.data?.data?.pagination

	const publishers = useMemo(() => publishersResp?.data?.data || [], [publishersResp])
	const authors = useMemo(() => authorsResp?.data?.data || [], [authorsResp])

	const createBookMutation = useMutation((payload) => booksAPI.create(payload), {
		onSuccess: () => {
			toast.success('Book created')
			queryClient.invalidateQueries('admin-books')
			setCreateForm({
				isbn: '',
				title: '',
				publisher_id: '',
				publication_year: '',
				price: '',
				category: 'Science',
				quantity_in_stock: 0,
				threshold_quantity: 0,
				author_ids: []
			})
		},
		onError: (err) => {
			toast.error(err?.response?.data?.message || 'Failed to create book')
		}
	})

	const updateBookMutation = useMutation(({ isbn, payload }) => booksAPI.update(isbn, payload), {
		onSuccess: () => {
			toast.success('Book updated')
			queryClient.invalidateQueries('admin-books')
		},
		onError: (err) => {
			toast.error(err?.response?.data?.message || 'Failed to update book')
		}
	})

	const onCreateSubmit = (e) => {
		e.preventDefault()

		const payload = {
			isbn: String(createForm.isbn).trim(),
			title: String(createForm.title).trim(),
			publisher_id: Number(createForm.publisher_id),
			publication_year: createForm.publication_year ? Number(createForm.publication_year) : undefined,
			price: Number(createForm.price),
			category: createForm.category,
			quantity_in_stock: Number(createForm.quantity_in_stock || 0),
			threshold_quantity: Number(createForm.threshold_quantity || 0),
			author_ids: createForm.author_ids.map((x) => Number(x)).filter((n) => Number.isFinite(n))
		}

		createBookMutation.mutate(payload)
	}

	const [editState, setEditState] = useState({})
	const setEditField = (isbn, field, value) => {
		setEditState((prev) => ({
			...prev,
			[isbn]: {
				...(prev[isbn] || {}),
				[field]: value
			}
		}))
	}

	const saveBookRow = (book) => {
		const row = editState[book.isbn] || {}
		const payload = {
			price: row.price === '' || row.price === undefined ? undefined : Number(row.price),
			quantity_in_stock:
				row.quantity_in_stock === '' || row.quantity_in_stock === undefined
					? undefined
					: Number(row.quantity_in_stock)
		}
		updateBookMutation.mutate({ isbn: book.isbn, payload })
	}

	return (
		<div className="max-w-7xl mx-auto px-4 py-8">
			<h1 className="text-3xl font-bold mb-6">Manage Books</h1>

			<div className="card mb-8">
				<h2 className="text-xl font-semibold mb-4">Add New Book</h2>
				<form onSubmit={onCreateSubmit} className="space-y-4">
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div>
							<label className="block text-sm font-medium mb-1">ISBN *</label>
							<input
								required
								className="input"
								value={createForm.isbn}
								onChange={(e) => setCreateForm({ ...createForm, isbn: e.target.value })}
							/>
						</div>
						<div>
							<label className="block text-sm font-medium mb-1">Title *</label>
							<input
								required
								className="input"
								value={createForm.title}
								onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
							/>
						</div>
						<div>
							<label className="block text-sm font-medium mb-1">Publisher *</label>
							<select
								required
								className="input"
								value={createForm.publisher_id}
								onChange={(e) => setCreateForm({ ...createForm, publisher_id: e.target.value })}
							>
								<option value="">Select publisher</option>
								{publishers.map((p) => (
									<option key={p.publisher_id} value={p.publisher_id}>
										{p.publisher_name}
									</option>
								))}
							</select>
						</div>
						<div>
							<label className="block text-sm font-medium mb-1">Category *</label>
							<select
								required
								className="input"
								value={createForm.category}
								onChange={(e) => setCreateForm({ ...createForm, category: e.target.value })}
							>
								<option value="Science">Science</option>
								<option value="Art">Art</option>
								<option value="Religion">Religion</option>
								<option value="History">History</option>
								<option value="Geography">Geography</option>
							</select>
						</div>
						<div>
							<label className="block text-sm font-medium mb-1">Publication Year</label>
							<input
								type="number"
								className="input"
								value={createForm.publication_year}
								onChange={(e) => setCreateForm({ ...createForm, publication_year: e.target.value })}
							/>
						</div>
						<div>
							<label className="block text-sm font-medium mb-1">Price *</label>
							<input
								required
								type="number"
								step="0.01"
								min="0.01"
								className="input"
								value={createForm.price}
								onChange={(e) => setCreateForm({ ...createForm, price: e.target.value })}
							/>
						</div>
						<div>
							<label className="block text-sm font-medium mb-1">Quantity In Stock</label>
							<input
								type="number"
								min="0"
								className="input"
								value={createForm.quantity_in_stock}
								onChange={(e) => setCreateForm({ ...createForm, quantity_in_stock: e.target.value })}
							/>
						</div>
						<div>
							<label className="block text-sm font-medium mb-1">Threshold Quantity *</label>
							<input
								required
								type="number"
								min="0"
								className="input"
								value={createForm.threshold_quantity}
								onChange={(e) =>
									setCreateForm({ ...createForm, threshold_quantity: e.target.value })
								}
							/>
						</div>
					</div>

					<div>
						<label className="block text-sm font-medium mb-1">Authors</label>
						<select
							multiple
							className="input h-40"
							value={createForm.author_ids}
							onChange={(e) => {
								const selected = Array.from(e.target.selectedOptions).map((o) => o.value)
								setCreateForm({ ...createForm, author_ids: selected })
							}}
						>
							{authors.map((a) => (
								<option key={a.author_id} value={a.author_id}>
									{a.author_name}
								</option>
							))}
						</select>
						<p className="text-xs text-gray-500 mt-1">Hold Ctrl to select multiple.</p>
					</div>

					<button
						type="submit"
						disabled={createBookMutation.isLoading}
						className="btn btn-primary"
					>
						{createBookMutation.isLoading ? 'Creating...' : 'Create Book'}
					</button>
				</form>
			</div>

			<div className="card">
				<div className="flex items-center justify-between gap-3 mb-4">
					<h2 className="text-xl font-semibold">Books</h2>
					{pagination && (
						<div className="text-sm text-gray-600">
							Page {pagination.page} of {pagination.pages} (Total: {pagination.total})
						</div>
					)}
				</div>

				{booksLoading ? (
					<Loading />
				) : (
					<div className="overflow-x-auto">
						<table className="min-w-full">
							<thead>
								<tr className="text-left text-sm text-gray-600 border-b">
									<th className="py-2">Title</th>
									<th className="py-2">ISBN</th>
									<th className="py-2">Category</th>
									<th className="py-2">Publisher</th>
									<th className="py-2">Authors</th>
									<th className="py-2">Price</th>
									<th className="py-2">Stock</th>
									<th className="py-2">Actions</th>
								</tr>
							</thead>
							<tbody>
								{books.map((b) => {
									const row = editState[b.isbn] || {}
									return (
										<tr key={b.isbn} className="border-b last:border-b-0">
											<td className="py-3 font-medium">{b.title}</td>
											<td className="py-3 text-gray-600">{b.isbn}</td>
											<td className="py-3">{b.category}</td>
											<td className="py-3">{b.publisher_name}</td>
											<td className="py-3 text-gray-600">{b.authors || '—'}</td>
											<td className="py-3">
												<input
													type="number"
													step="0.01"
													className="input w-28"
													value={row.price ?? b.price}
													onChange={(e) => setEditField(b.isbn, 'price', e.target.value)}
												/>
											</td>
											<td className="py-3">
												<input
													type="number"
													min="0"
													className="input w-24"
													value={row.quantity_in_stock ?? b.quantity_in_stock}
													onChange={(e) =>
														setEditField(b.isbn, 'quantity_in_stock', e.target.value)
													}
												/>
											</td>
											<td className="py-3">
												<button
													className="btn btn-primary"
													disabled={updateBookMutation.isLoading}
													onClick={() => saveBookRow(b)}
												>
													Save
												</button>
											</td>
										</tr>
									)
								})}
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

export default AdminBooks
