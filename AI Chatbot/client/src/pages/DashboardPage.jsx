import React, { useState, useEffect } from 'react'
import WebsiteTable from '../components/WebsiteTable'
import axios from 'axios'
import toast from 'react-hot-toast'

const DashboardPage = () => {
  const [stats, setStats] = useState({
    totalWebsites: 0,
    totalChats: 0,
    certificatesIssued: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await axios.get('/api/dashboard/stats')
      setStats(response.data)
    } catch (error) {
      console.error('Error fetching stats:', error)
      toast.error('Failed to load dashboard stats')
    } finally {
      setLoading(false)
    }
  }

  const handleImportCSV = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    const formData = new FormData()
    formData.append('csvFile', file)

    try {
      const response = await axios.post('/api/websites/import-csv', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      toast.success(`Imported ${response.data.count} websites successfully`)
      // Refresh the page to show new data
      window.location.reload()
    } catch (error) {
      console.error('Error importing CSV:', error)
      toast.error('Failed to import CSV file')
    }
  }

  const handleExportData = async () => {
    try {
      const response = await axios.get('/api/websites/export', {
        responseType: 'blob'
      })
      
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', 'websites-export.json')
      document.body.appendChild(link)
      link.click()
      link.remove()
      
      toast.success('Data exported successfully')
    } catch (error) {
      console.error('Error exporting data:', error)
      toast.error('Failed to export data')
    }
  }

  return (
    <div className="container">
      <div className="card">
        <h1 style={{ color: '#667eea', marginBottom: '20px' }}>📊 Admin Dashboard</h1>
        
        {/* Stats Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
          <div className="card" style={{ textAlign: 'center', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
            <h3 style={{ margin: '0 0 8px 0' }}>{loading ? '...' : stats.totalWebsites}</h3>
            <p style={{ margin: 0, opacity: 0.9 }}>Total Websites</p>
          </div>
          
          <div className="card" style={{ textAlign: 'center', background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
            <h3 style={{ margin: '0 0 8px 0' }}>{loading ? '...' : stats.totalChats}</h3>
            <p style={{ margin: 0, opacity: 0.9 }}>Total Conversations</p>
          </div>
          
          <div className="card" style={{ textAlign: 'center', background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white' }}>
            <h3 style={{ margin: '0 0 8px 0' }}>{loading ? '...' : stats.certificatesIssued}</h3>
            <p style={{ margin: 0, opacity: 0.9 }}>Certificates Issued</p>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '16px', marginBottom: '30px', flexWrap: 'wrap' }}>
          <label className="btn btn-primary" style={{ cursor: 'pointer' }}>
            📁 Import CSV
            <input
              type="file"
              accept=".csv"
              onChange={handleImportCSV}
              style={{ display: 'none' }}
            />
          </label>
          
          <button onClick={handleExportData} className="btn btn-secondary">
            📤 Export Data
          </button>
          
          <button 
            onClick={() => window.location.reload()} 
            className="btn btn-secondary"
          >
            🔄 Refresh Data
          </button>
        </div>
        
        {/* Instructions */}
        <div style={{ padding: '16px', background: '#d1ecf1', borderRadius: '8px', marginBottom: '20px' }}>
          <h4 style={{ marginBottom: '8px', color: '#0c5460' }}>📋 Instructions:</h4>
          <ul style={{ margin: 0, paddingLeft: '20px', color: '#0c5460' }}>
            <li><strong>Import CSV:</strong> Upload your competition websites data in CSV format</li>
            <li><strong>Export Data:</strong> Download current website data as JSON</li>
            <li><strong>Edit Websites:</strong> Click "Edit" to modify website information</li>
            <li><strong>API Keys:</strong> Add API keys for certificate generation functionality</li>
          </ul>
        </div>
      </div>
      
      {/* Website Management Table */}
      <WebsiteTable />
      
      {/* CSV Format Guide */}
      <div className="card">
        <h3>📄 CSV Format Guide</h3>
        <p>When importing CSV files, use this format:</p>
        <div style={{ background: '#f8f9fa', padding: '16px', borderRadius: '8px', fontFamily: 'monospace', fontSize: '14px' }}>
          website Name,Links,Payment Links,Exam Date<br/>
          National School Olympiad,https://nationalschoololympiad.com/,,"Oct 7, Nov 7, Dec 2"<br/>
          International Scratch Olympiad,https://scratcholympiads.com/,,31 October<br/>
          International Painting Olympics,https://paintingolympics.in/,https://rzp.io/rzp/paintingolympicssep25,
        </div>
        <p style={{ marginTop: '12px', fontSize: '14px', color: '#666' }}>
          <strong>Note:</strong> API keys should be added manually after import for security reasons.
        </p>
      </div>
    </div>
  )
}

export default DashboardPage