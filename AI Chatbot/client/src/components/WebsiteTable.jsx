import React, { useState, useEffect } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'

const WebsiteTable = () => {
  const [websites, setWebsites] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [showAddForm, setShowAddForm] = useState(false)
  const [newWebsite, setNewWebsite] = useState({
    name: '',
    link: '',
    paymentLink: '',
    examDate: '',
    apiKey: ''
  })

  useEffect(() => {
    fetchWebsites()
  }, [])

  const fetchWebsites = async () => {
    try {
      const response = await axios.get('/api/websites')
      setWebsites(response.data)
    } catch (error) {
      console.error('Error fetching websites:', error)
      toast.error('Failed to load websites')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (website) => {
    setEditingId(website._id)
    setEditForm({ ...website })
  }

  const handleSaveEdit = async () => {
    try {
      await axios.put(`/api/websites/${editingId}`, editForm)
      setWebsites(websites.map(w => w._id === editingId ? { ...w, ...editForm } : w))
      setEditingId(null)
      setEditForm({})
      toast.success('Website updated successfully')
    } catch (error) {
      console.error('Error updating website:', error)
      toast.error('Failed to update website')
    }
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditForm({})
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this website?')) return
    
    try {
      await axios.delete(`/api/websites/${id}`)
      setWebsites(websites.filter(w => w._id !== id))
      toast.success('Website deleted successfully')
    } catch (error) {
      console.error('Error deleting website:', error)
      toast.error('Failed to delete website')
    }
  }

  const handleAddWebsite = async (e) => {
    e.preventDefault()
    try {
      const response = await axios.post('/api/websites', newWebsite)
      setWebsites([...websites, response.data])
      setNewWebsite({ name: '', link: '', paymentLink: '', examDate: '', apiKey: '' })
      setShowAddForm(false)
      toast.success('Website added successfully')
    } catch (error) {
      console.error('Error adding website:', error)
      toast.error('Failed to add website')
    }
  }

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    )
  }

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Website Management</h2>
        <button 
          onClick={() => setShowAddForm(!showAddForm)} 
          className="btn btn-primary"
        >
          {showAddForm ? 'Cancel' : 'Add Website'}
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleAddWebsite} className="card" style={{ marginBottom: '20px', background: '#f8f9fa' }}>
          <h3>Add New Website</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginTop: '16px' }}>
            <input
              type="text"
              placeholder="Website Name"
              value={newWebsite.name}
              onChange={(e) => setNewWebsite({ ...newWebsite, name: e.target.value })}
              className="input"
              required
            />
            <input
              type="url"
              placeholder="Website Link"
              value={newWebsite.link}
              onChange={(e) => setNewWebsite({ ...newWebsite, link: e.target.value })}
              className="input"
              required
            />
            <input
              type="url"
              placeholder="Payment Link"
              value={newWebsite.paymentLink}
              onChange={(e) => setNewWebsite({ ...newWebsite, paymentLink: e.target.value })}
              className="input"
            />
            <input
              type="text"
              placeholder="Exam Date"
              value={newWebsite.examDate}
              onChange={(e) => setNewWebsite({ ...newWebsite, examDate: e.target.value })}
              className="input"
            />
            <input
              type="text"
              placeholder="API Key"
              value={newWebsite.apiKey}
              onChange={(e) => setNewWebsite({ ...newWebsite, apiKey: e.target.value })}
              className="input"
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ marginTop: '16px' }}>
            Add Website
          </button>
        </form>
      )}

      <div style={{ overflowX: 'auto' }}>
        <table className="table">
          <thead>
            <tr>
              <th>Website Name</th>
              <th>Link</th>
              <th>Payment Link</th>
              <th>Exam Date</th>
              <th>API Key</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {websites.map((website) => (
              <tr key={website._id}>
                <td>
                  {editingId === website._id ? (
                    <input
                      type="text"
                      value={editForm.name || ''}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="input"
                    />
                  ) : (
                    website.name
                  )}
                </td>
                <td>
                  {editingId === website._id ? (
                    <input
                      type="url"
                      value={editForm.link || ''}
                      onChange={(e) => setEditForm({ ...editForm, link: e.target.value })}
                      className="input"
                    />
                  ) : (
                    <a href={website.link} target="_blank" rel="noopener noreferrer">
                      {website.link}
                    </a>
                  )}
                </td>
                <td>
                  {editingId === website._id ? (
                    <input
                      type="url"
                      value={editForm.paymentLink || ''}
                      onChange={(e) => setEditForm({ ...editForm, paymentLink: e.target.value })}
                      className="input"
                    />
                  ) : (
                    website.paymentLink ? (
                      <a href={website.paymentLink} target="_blank" rel="noopener noreferrer">
                        Payment Link
                      </a>
                    ) : (
                      'N/A'
                    )
                  )}
                </td>
                <td>
                  {editingId === website._id ? (
                    <input
                      type="text"
                      value={editForm.examDate || ''}
                      onChange={(e) => setEditForm({ ...editForm, examDate: e.target.value })}
                      className="input"
                    />
                  ) : (
                    website.examDate || 'N/A'
                  )}
                </td>
                <td>
                  {editingId === website._id ? (
                    <input
                      type="text"
                      value={editForm.apiKey || ''}
                      onChange={(e) => setEditForm({ ...editForm, apiKey: e.target.value })}
                      className="input"
                    />
                  ) : (
                    website.apiKey ? '••••••••' : 'N/A'
                  )}
                </td>
                <td>
                  {editingId === website._id ? (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={handleSaveEdit} className="btn btn-primary" style={{ fontSize: '12px', padding: '6px 12px' }}>
                        Save
                      </button>
                      <button onClick={handleCancelEdit} className="btn btn-secondary" style={{ fontSize: '12px', padding: '6px 12px' }}>
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => handleEdit(website)} className="btn btn-secondary" style={{ fontSize: '12px', padding: '6px 12px' }}>
                        Edit
                      </button>
                      <button onClick={() => handleDelete(website._id)} className="btn" style={{ fontSize: '12px', padding: '6px 12px', background: '#dc3545', color: 'white' }}>
                        Delete
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {websites.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
          No websites found. Add your first website to get started.
        </div>
      )}
    </div>
  )
}

export default WebsiteTable