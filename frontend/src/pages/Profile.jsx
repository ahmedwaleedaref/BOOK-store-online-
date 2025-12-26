import React, { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import { authAPI } from '../services/api'

const Profile = () => {
  const [loading, setLoading] = useState(false)
  const [profileLoading, setProfileLoading] = useState(true)

  const [profile, setProfile] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    address: ''
  })

  const [passwords, setPasswords] = useState({
    current_password: '',
    new_password: ''
  })

  useEffect(() => {
    const load = async () => {
      try {
        const res = await authAPI.getProfile()
        const p = res?.data?.data
        setProfile({
          first_name: p?.first_name || '',
          last_name: p?.last_name || '',
          email: p?.email || '',
          phone_number: p?.phone_number || '',
          address: p?.address || ''
        })
      } catch (e) {
        toast.error(e?.response?.data?.message || 'Failed to load profile')
      } finally {
        setProfileLoading(false)
      }
    }

    load()
  }, [])

  const updateProfile = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await authAPI.updateProfile(profile)
      toast.success('Profile updated')

      // Keep localStorage user in sync for navbar username/email if present
      const stored = localStorage.getItem('user')
      if (stored) {
        const u = JSON.parse(stored)
        localStorage.setItem('user', JSON.stringify({ ...u, ...profile }))
      }
    } catch (e2) {
      toast.error(e2?.response?.data?.message || 'Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  const changePassword = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await authAPI.changePassword(passwords)
      toast.success('Password changed')
      setPasswords({ current_password: '', new_password: '' })
    } catch (e2) {
      toast.error(e2?.response?.data?.message || 'Failed to change password')
    } finally {
      setLoading(false)
    }
  }

  if (profileLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="card">Loading profile...</div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">My Profile</h1>

      <div className="card mb-6">
        <h2 className="text-xl font-semibold mb-4">Personal Information</h2>
        <form onSubmit={updateProfile} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-600">First Name</label>
              <input
                className="input"
                value={profile.first_name}
                onChange={(e) => setProfile({ ...profile, first_name: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm text-gray-600">Last Name</label>
              <input
                className="input"
                value={profile.last_name}
                onChange={(e) => setProfile({ ...profile, last_name: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="text-sm text-gray-600">Email</label>
            <input
              type="email"
              className="input"
              value={profile.email}
              onChange={(e) => setProfile({ ...profile, email: e.target.value })}
            />
          </div>

          <div>
            <label className="text-sm text-gray-600">Phone</label>
            <input
              className="input"
              value={profile.phone_number}
              onChange={(e) => setProfile({ ...profile, phone_number: e.target.value })}
            />
          </div>

          <div>
            <label className="text-sm text-gray-600">Address</label>
            <input
              className="input"
              value={profile.address}
              onChange={(e) => setProfile({ ...profile, address: e.target.value })}
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            Save Changes
          </button>
        </form>
      </div>

      <div className="card">
        <h2 className="text-xl font-semibold mb-4">Change Password</h2>
        <form onSubmit={changePassword} className="space-y-4">
          <div>
            <label className="text-sm text-gray-600">Current Password</label>
            <input
              type="password"
              className="input"
              value={passwords.current_password}
              onChange={(e) => setPasswords({ ...passwords, current_password: e.target.value })}
            />
          </div>
          <div>
            <label className="text-sm text-gray-600">New Password</label>
            <input
              type="password"
              className="input"
              value={passwords.new_password}
              onChange={(e) => setPasswords({ ...passwords, new_password: e.target.value })}
              placeholder="At least 8 chars, upper/lower/number"
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            Change Password
          </button>
        </form>
      </div>
    </div>
  )
}

export default Profile
