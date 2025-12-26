import React, { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from 'react-query'
import { toast } from 'react-toastify'
import { adminAPI } from '../../services/api'
import Loading from '../../components/Loading'

const AdminAuthors = () => {
	const queryClient = useQueryClient()
	const { data, isLoading } = useQuery('authors', adminAPI.getAuthors)
	const authors = data?.data?.data || []

	const [newAuthor, setNewAuthor] = useState({ author_name: '' })
	const [edit, setEdit] = useState({})

	const createMutation = useMutation((payload) => adminAPI.createAuthor(payload), {
		onSuccess: () => {
			toast.success('Author created')
			queryClient.invalidateQueries('authors')
			setNewAuthor({ author_name: '' })
		},
		onError: (err) => toast.error(err?.response?.data?.message || 'Failed to create')
	})

	const updateMutation = useMutation(({ id, payload }) => adminAPI.updateAuthor(id, payload), {
		onSuccess: () => {
			toast.success('Author updated')
			queryClient.invalidateQueries('authors')
		},
		onError: (err) => toast.error(err?.response?.data?.message || 'Failed to update')
	})

	const deleteMutation = useMutation((id) => adminAPI.deleteAuthor(id), {
		onSuccess: () => {
			toast.success('Author deleted')
			queryClient.invalidateQueries('authors')
		},
		onError: (err) => toast.error(err?.response?.data?.message || 'Failed to delete')
	})

	const submitNew = (e) => {
		e.preventDefault()
		createMutation.mutate({ author_name: newAuthor.author_name })
	}

	const saveRow = (a) => {
		const row = edit[a.author_id] || {}
		updateMutation.mutate({
			id: a.author_id,
			payload: { author_name: row.author_name ?? a.author_name }
		})
	}

	if (isLoading) return <Loading />

	return (
		<div className="max-w-7xl mx-auto px-4 py-8">
			<h1 className="text-3xl font-bold mb-6">Manage Authors</h1>

			<div className="card mb-8">
				<h2 className="text-xl font-semibold mb-4">Add Author</h2>
				<form onSubmit={submitNew} className="grid grid-cols-1 md:grid-cols-3 gap-4">
					<input
						required
						className="input"
						placeholder="Author name"
						value={newAuthor.author_name}
						onChange={(e) => setNewAuthor({ author_name: e.target.value })}
					/>
					<div />
					<button className="btn btn-primary" disabled={createMutation.isLoading}>
						{createMutation.isLoading ? 'Creating...' : 'Create'}
					</button>
				</form>
			</div>

			<div className="card">
				<h2 className="text-xl font-semibold mb-4">Authors</h2>
				{authors.length === 0 ? (
					<p className="text-gray-600">No authors found.</p>
				) : (
					<div className="overflow-x-auto">
						<table className="min-w-full">
							<thead>
								<tr className="text-left text-sm text-gray-600 border-b">
									<th className="py-2">Name</th>
									<th className="py-2">Books</th>
									<th className="py-2">Actions</th>
								</tr>
							</thead>
							<tbody>
								{authors.map((a) => {
									const row = edit[a.author_id] || {}
									return (
										<tr key={a.author_id} className="border-b last:border-b-0">
											<td className="py-3">
												<input
													className="input"
													value={row.author_name ?? a.author_name}
													onChange={(e) =>
														setEdit((prev) => ({
															...prev,
															[a.author_id]: { ...(prev[a.author_id] || {}), author_name: e.target.value }
														}))
													}
												/>
											</td>
											<td className="py-3 text-gray-600">{a.book_count ?? 0}</td>
											<td className="py-3 flex gap-2">
												<button
													className="btn btn-primary"
													disabled={updateMutation.isLoading}
													onClick={() => saveRow(a)}
												>
													Save
												</button>
												<button
													className="btn btn-danger"
													disabled={deleteMutation.isLoading}
													onClick={() => deleteMutation.mutate(a.author_id)}
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

export default AdminAuthors
