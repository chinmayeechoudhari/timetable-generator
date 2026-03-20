import { useState, useEffect } from 'react'
import axios from 'axios'

const BASE = 'http://localhost:8000'

export default function SubjectForm() {
  const [classes, setClasses]         = useState([])
  const [subjects, setSubjects]       = useState([])
  const [subjectName, setSubjectName] = useState('')
  const [periodsPerWeek, setPeriodsPerWeek] = useState(1)
  const [subjectType, setSubjectType] = useState('theory')
  const [classId, setClassId]         = useState('')
  const [message, setMessage]         = useState('')
  const [error, setError]             = useState('')

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    try {
      const [cRes, sRes] = await Promise.all([
        axios.get(`${BASE}/classes`),
        axios.get(`${BASE}/subjects`),
      ])
      setClasses(cRes.data)
      setSubjects(sRes.data)
      if (cRes.data.length > 0) setClassId(cRes.data[0].class_id)
    } catch {
      setError('Could not load data. Make sure the backend is running.')
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setMessage('')
    setError('')
    try {
      await axios.post(`${BASE}/subjects`, {
        subject_name:     subjectName,
        periods_per_week: parseInt(periodsPerWeek),
        subject_type:     subjectType,
        class_id:         parseInt(classId)
      })
      setMessage(`Subject "${subjectName}" added successfully`)
      setSubjectName('')
      setPeriodsPerWeek(1)
      fetchAll()
    } catch (err) {
      setError(err.response?.data?.detail || 'Error adding subject')
    }
  }

  const getClassName = (id) =>
    classes.find(c => c.class_id === id)?.class_name || `Class ${id}`

  return (
    <div style={{ maxWidth: '640px' }}>
      <h2 style={headingStyle}>Add Subject</h2>

      <form onSubmit={handleSubmit} style={formStyle}>

        <div style={fieldStyle}>
          <label style={labelStyle}>Subject name</label>
          <input
            value={subjectName}
            onChange={e => setSubjectName(e.target.value)}
            placeholder="e.g., Mathematics"
            style={inputStyle}
            required
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          <div style={fieldStyle}>
            <label style={labelStyle}>Periods per week</label>
            <input
              type="number"
              min="1"
              max="10"
              value={periodsPerWeek}
              onChange={e => setPeriodsPerWeek(e.target.value)}
              style={inputStyle}
              required
            />
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>Subject type</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {['theory', 'lab'].map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setSubjectType(type)}
                  style={{
                    flex: 1, padding: '10px', borderRadius: '8px',
                    cursor: 'pointer', fontSize: '13px', fontWeight: '600',
                    transition: 'all 0.2s',
                    background: subjectType === type ? '#1a1560' : '#111',
                    border: `1px solid ${subjectType === type ? '#6C63FF' : '#333'}`,
                    color: subjectType === type ? '#a09aff' : '#666'
                  }}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div style={fieldStyle}>
          <label style={labelStyle}>Class</label>
          <select
            value={classId}
            onChange={e => setClassId(e.target.value)}
            style={selectStyle}
            required
          >
            <option value="">Select class</option>
            {classes.map(c => (
              <option key={c.class_id} value={c.class_id}>
                {c.class_name}
              </option>
            ))}
          </select>
        </div>

        {message && <div style={successStyle}>{message}</div>}
        {error   && <div style={errorStyle}>{error}</div>}

        <button type="submit" style={btnStyle}>Create subject</button>
      </form>

      {subjects.length > 0 && (
        <div style={{ marginTop: '32px' }}>
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '10px' }}>
            {subjects.length} subject{subjects.length !== 1 ? 's' : ''}
          </div>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Subject</th>
                <th style={thStyle}>Type</th>
                <th style={thStyle}>Periods/week</th>
                <th style={thStyle}>Class</th>
              </tr>
            </thead>
            <tbody>
              {subjects.map(s => (
                <tr key={s.subject_id}>
                  <td style={tdStyle}>{s.subject_name}</td>
                  <td style={tdStyle}>
                    <span style={{
                      padding: '3px 10px', borderRadius: '10px',
                      fontSize: '11px', fontWeight: '600',
                      background: s.subject_type === 'lab' ? '#1a1000' : '#0d1a2b',
                      color: s.subject_type === 'lab' ? '#FF9800' : '#42a5f5'
                    }}>
                      {s.subject_type}
                    </span>
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'center' }}>{s.periods_per_week}</td>
                  <td style={tdStyle}>{getClassName(s.class_id)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

const headingStyle = {
  fontSize: '20px', fontWeight: '600',
  color: '#e0e0e0', marginBottom: '24px'
}
const formStyle = {
  background: '#1a1a1a', borderRadius: '12px',
  padding: '24px', display: 'flex',
  flexDirection: 'column', gap: '16px'
}
const fieldStyle  = { display: 'flex', flexDirection: 'column', gap: '6px' }
const labelStyle  = { fontSize: '13px', color: '#aaa', fontWeight: '500' }
const inputStyle  = {
  padding: '10px 12px', borderRadius: '8px',
  border: '1px solid #333', background: '#0f0f0f',
  color: '#e0e0e0', fontSize: '14px'
}
const selectStyle = {
  padding: '10px 12px', borderRadius: '8px',
  border: '1px solid #333', background: '#0f0f0f',
  color: '#e0e0e0', fontSize: '14px', cursor: 'pointer'
}
const btnStyle = {
  padding: '12px', borderRadius: '8px', border: 'none',
  background: '#6C63FF', color: '#fff', fontSize: '14px',
  fontWeight: '600', cursor: 'pointer', marginTop: '4px'
}
const successStyle = {
  padding: '10px 14px', borderRadius: '8px',
  background: '#0d2b1a', color: '#4caf7d', fontSize: '13px'
}
const errorStyle = {
  padding: '10px 14px', borderRadius: '8px',
  background: '#2b0d0d', color: '#f44336', fontSize: '13px'
}
const tableStyle = { width: '100%', borderCollapse: 'collapse', fontSize: '13px' }
const thStyle = {
  padding: '8px 12px', background: '#1a1a1a',
  color: '#666', fontSize: '11px', fontWeight: '600',
  textTransform: 'uppercase', textAlign: 'left',
  border: '1px solid #222'
}
const tdStyle = {
  padding: '10px 12px', border: '1px solid #1e1e1e',
  color: '#ccc', background: '#111'
}