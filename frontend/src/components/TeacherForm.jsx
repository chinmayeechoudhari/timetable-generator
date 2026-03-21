import { useState, useEffect } from 'react'
import axios from 'axios'
import * as S from '../styles/formStyles'

const BASE = 'http://localhost:8000'

export default function TeacherForm() {
  const [teachers, setTeachers]     = useState([])
  const [name, setName]             = useState('')
  const [maxPeriods, setMaxPeriods] = useState(4)
  const [message, setMessage]       = useState('')
  const [error, setError]           = useState('')

  useEffect(() => { fetchTeachers() }, [])

  async function fetchTeachers() {
    try {
      const res = await axios.get(`${BASE}/teachers`)
      setTeachers(res.data)
    } catch { setError('Could not load teachers') }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setMessage(''); setError('')
    try {
      await axios.post(`${BASE}/teachers`, {
        teacher_name: name,
        max_periods_per_day: parseInt(maxPeriods)
      })
      setMessage(`"${name}" added successfully`)
      setName(''); setMaxPeriods(4)
      fetchTeachers()
    } catch (err) {
      setError(err.response?.data?.detail || 'Error adding teacher')
    }
  }

  return (
    <div style={{ padding: '28px 32px', background: '#F0F4F8', minHeight: '100vh' }}>

      {/* Page header */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontSize: '18px', fontWeight: '700', color: '#1B2A3B' }}>
          Teachers
        </div>
        <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
          Add teachers and set their daily period limits
        </div>
      </div>

      <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start', flexWrap: 'wrap' }}>

        {/* Form card */}
        <div style={S.card}>
          <div style={S.heading}>Add Teacher</div>

          <div style={S.fieldWrap}>
            <label style={S.label}>Teacher name</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g., Prof. Sharma"
              style={S.input}
              required
            />
          </div>

          <div style={S.fieldWrap}>
            <label style={S.label}>Max periods per day</label>
            <input
              type="number" min="1" max="8"
              value={maxPeriods}
              onChange={e => setMaxPeriods(e.target.value)}
              style={S.input}
              required
            />
          </div>

          {message && <div style={S.successBox}>{message}</div>}
          {error   && <div style={S.errorBox}>{error}</div>}

          <button onClick={handleSubmit} style={S.btn}>
            + Add Teacher
          </button>
        </div>

        {/* Table */}
        {teachers.length > 0 && (
          <div style={{ flex: 1, minWidth: '280px' }}>
            <div style={S.tableCount}>
              {teachers.length} teacher{teachers.length !== 1 ? 's' : ''} added
            </div>
            <table style={S.table}>
              <thead>
                <tr>
                  <th style={S.th}>ID</th>
                  <th style={S.th}>Name</th>
                  <th style={S.th}>Max periods/day</th>
                </tr>
              </thead>
              <tbody>
                {teachers.map(t => (
                  <tr key={t.teacher_id}>
                    <td style={S.td}>{t.teacher_id}</td>
                    <td style={S.td}>{t.teacher_name}</td>
                    <td style={{ ...S.td, textAlign: 'center' }}>{t.max_periods_per_day}</td>
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