import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { authAPI } from '../services/api'

const Register = () => {
  const [formData, setFormData] = useState({
    username: '', password: '', email: '', first_name: '', last_name: '',
    phone_number: '', address: ''
  })
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await authAPI.register(formData)
      toast.success('Registration successful! Please login.')
      navigate('/login')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="card">
          <h2 className="text-3xl font-bold text-center mb-6">Register</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Username *</label>
                <input required className="input" value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email *</label>
                <input type="email" required className="input" value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Password *</label>
                <input type="password" required className="input" value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Phone</label>
                <input className="input" value={formData.phone_number}
                  onChange={(e) => setFormData({...formData, phone_number: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">First Name *</label>
                <input required className="input" value={formData.first_name}
                  onChange={(e) => setFormData({...formData, first_name: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Last Name *</label>
                <input required className="input" value={formData.last_name}
                  onChange={(e) => setFormData({...formData, last_name: e.target.value})} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Address</label>
              <textarea className="input" rows="3" value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})} />
            </div>
            <button type="submit" disabled={loading} className="btn btn-primary w-full">
              {loading ? 'Registering...' : 'Register'}
            </button>
          </form>
          <p className="mt-4 text-center text-sm">
            Already have an account? <Link to="/login" className="text-primary-600">Login here</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
export default Register
