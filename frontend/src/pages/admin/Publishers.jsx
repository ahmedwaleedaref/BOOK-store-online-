import React, { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from 'react-query'
import { toast } from 'react-toastify'
import { adminAPI } from '../../services/api'
import Loading from '../../components/Loading'

const AdminPublishers = () => {
	const queryClient = useQueryClient()
	const { data, isLoading } = useQuery('publishers', adminAPI.getPublishers)
	const publishers = data?.data?.data || []

	const [newPublisher, setNewPublisher] = useState({
		publisher_name: '',
		address: '',
		phone_number: ''
	})

	const [edit, setEdit] = useState({})
	const setEditField = (id, field, value) => {
		setEdit((prev) => ({
			...prev,
			[id]: {
				...(prev[id] || {}),
				[field]: value
			}
		}))
	}

	const createMutation = useMutation((payload) => adminAPI.createPublisher(payload), {
		onSuccess: () => {
			toast.success('Publisher created')
			queryClient.invalidateQueries('publishers')
			setNewPublisher({ publisher_name: '', address: '', phone_number: '' })
		},
		onError: (err) => toast.error(err?.response?.data?.message || 'Failed to create')
	})

	const updateMutation = useMutation(({ id, payload }) => adminAPI.updatePublisher(id, payload), {
		onSuccess: () => {
			toast.success('Publisher updated')
			queryClient.invalidateQueries('publishers')
		},
		onError: (err) => toast.error(err?.response?.data?.message || 'Failed to update')
	})

	const deleteMutation = useMutation((id) => adminAPI.deletePublisher(id), {
		onSuccess: () => {
			toast.success('Publisher deleted')
			queryClient.invalidateQueries('publishers')
		},
		onError: (err) => toast.error(err?.response?.data?.message || 'Failed to delete')
	})

	const submitNew = (e) => {
		e.preventDefault()
		createMutation.mutate({
			publisher_name: newPublisher.publisher_name,
			address: newPublisher.address || null,
			phone_number: newPublisher.phone_number || null
		})
	}

	const saveRow = (p) => {
		const row = edit[p.publisher_id] || {}
		updateMutation.mutate({
			id: p.publisher_id,
			payload: {
				publisher_name: row.publisher_name ?? p.publisher_name,
				address: row.address ?? p.address,
				phone_number: row.phone_number ?? p.phone_number
			}
		})
	}

	if (isLoading) return <Loading />

	return (
		<div className="max-w-7xl mx-auto px-4 py-8">
			<h1 className="text-3xl font-bold mb-6">Manage Publishers</h1>

			<div className="card mb-8">
				<h2 className="text-xl font-semibold mb-4">Add Publisher</h2>
				<form onSubmit={submitNew} className="grid grid-cols-1 md:grid-cols-4 gap-4">
					<input
						required
						className="input"
						placeholder="Publisher name"
						value={newPublisher.publisher_name}
						onChange={(e) => setNewPublisher({ ...newPublisher, publisher_name: e.target.value })}
					/>
					<input
						className="input"
						placeholder="Address"
						value={newPublisher.address}
						onChange={(e) => setNewPublisher({ ...newPublisher, address: e.target.value })}
					/>
					<input
						className="input"
						placeholder="Phone"
						value={newPublisher.phone_number}
						onChange={(e) => setNewPublisher({ ...newPublisher, phone_number: e.target.value })}
					/>
					<button className="btn btn-primary" disabled={createMutation.isLoading}>
						{createMutation.isLoading ? 'Creating...' : 'Create'}
					</button>
				</form>
			</div>

			<div className="card">
				<h2 className="text-xl font-semibold mb-4">Publishers</h2>
				{publishers.length === 0 ? (
					<p className="text-gray-600">No publishers found.</p>
				) : (
					<div className="overflow-x-auto">
						<table className="min-w-full">
							<thead>
								<tr className="text-left text-sm text-gray-600 border-b">
									<th className="py-2">Name</th>
									<th className="py-2">Address</th>
									<th className="py-2">Phone</th>
									<th className="py-2">Books</th>
									<th className="py-2">Actions</th>
								</tr>
							</thead>
							<tbody>
								{publishers.map((p) => {
									const row = edit[p.publisher_id] || {}
									return (
										<tr key={p.publisher_id} className="border-b last:border-b-0">
											<td className="py-3">
												<input
													className="input"
													value={row.publisher_name ?? p.publisher_name}
													onChange={(e) =>
														setEditField(p.publisher_id, 'publisher_name', e.target.value)
													}
												/>
											</td>
											<td className="py-3">
												<input
													className="input"
													value={row.address ?? (p.address || '')}
													onChange={(e) => setEditField(p.publisher_id, 'address', e.target.value)}
												/>
											</td>
											<td className="py-3">
												<input
													className="input"
													value={row.phone_number ?? (p.phone_number || '')}
													onChange={(e) =>
														setEditField(p.publisher_id, 'phone_number', e.target.value)
													}
												/>
											</td>
											<td className="py-3 text-gray-600">{p.book_count ?? 0}</td>
											<td className="py-3 flex gap-2">
												<button
													className="btn btn-primary"
													disabled={updateMutation.isLoading}
													onClick={() => saveRow(p)}
												>
													Save
												</button>
												<button
													className="btn btn-danger"
													disabled={deleteMutation.isLoading}
													onClick={() => deleteMutation.mutate(p.publisher_id)}
												>
													Delete
												</button>
											</td>
										</tr>
									)
								})}
							</tbody>
						</table>
					</div>
				)}
			</div>
		</div>
	)
}

export default AdminPublishers
