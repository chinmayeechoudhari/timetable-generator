import { useState, useEffect } from 'react'
import axios from 'axios'
import * as S from '../styles/formStyles'

const BASE = 'http://localhost:8000'

export default function ClassForm() {
  const [classes, setClasses] = useState([])
  const [name, setName]       = useState('')
  const [message, setMessage] = useState('')
  const [error, setError]     = useState('')

  useEffect(() => { fetchClasses() }, [])

  async function fetchClasses() {
    try {
      const res = await axios.get(`${BASE}/classes`)
      setClasses(res.data)
    } catch { setError('Could not load classes') }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setMessage(''); setError('')
    try {
      await axios.post(`${BASE}/classes`, { class_name: name })
      setMessage(`Class "${name}" added successfully`)
      setName('')
      fetchClasses()
    } catch (err) {
      setError(err.response?.data?.detail || 'Error adding class')
    }
  }

  return (
    <div style={{ padding: '28px 32px', background: '#F0F4F8', minHeight: '100vh' }}>

      {/* Page header */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontSize: '18px', fontWeight: '700', color: '#1B2A3B' }}>
          Classes
        </div>
        <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
          Add classes that need to be scheduled
        </div>
      </div>

      <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start', flexWrap: 'wrap' }}>

        {/* Form card */}
        <div style={S.card}>
          <div style={S.heading}>Add Class</div>

          <div style={S.fieldWrap}>
            <label style={S.label}>Class name</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g., CS-A"
              style={S.input}
              required
            />
          </div>

          {message && <div style={S.successBox}>{message}</div>}
          {error   && <div style={S.errorBox}>{error}</div>}

          <button onClick={handleSubmit} style={S.btn}>
            + Add Class
          </button>
        </div>

        {/* Table */}
        {classes.length > 0 && (
          <div style={{ flex: 1, minWidth: '280px' }}>
            <div style={S.tableCount}>
              {classes.length} class{classes.length !== 1 ? 'es' : ''} added
            </div>
            <table style={S.table}>
              <thead>
                <tr>
                  <th style={S.th}>ID</th>
                  <th style={S.th}>Class name</th>
                </tr>
              </thead>
              <tbody>
                {classes.map(c => (
                  <tr key={c.class_id}>
                    <td style={S.td}>{c.class_id}</td>
                    <td style={{ ...S.td, fontWeight: '600', color: '#2563EB' }}>
                      {c.class_name}
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