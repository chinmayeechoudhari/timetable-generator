import { useState, useEffect } from 'react'
import axios from 'axios'

const BASE = 'http://localhost:8000'

export default function TeacherAvailabilityForm() {
  const [teachers, setTeachers]   = useState([])
  const [slots, setSlots]         = useState([])
  const [records, setRecords]     = useState([])
  const [teacherId, setTeacherId] = useState('')
  const [slotId, setSlotId]       = useState('')
  const [isAvailable, setIsAvailable] = useState('true')
  const [message, setMessage]     = useState('')
  const [error, setError]         = useState('')

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    try {
      const [tRes, sRes, rRes] = await Promise.all([
        axios.get(`${BASE}/teachers`),
        axios.get(`${BASE}/timeslots`),
        axios.get(`${BASE}/teacher-availabilities`),
      ])
      setTeachers(tRes.data)
      setSlots(sRes.data)
      setRecords(rRes.data)
      if (tRes.data.length > 0) setTeacherId(tRes.data[0].teacher_id)
      if (sRes.data.length > 0) setSlotId(sRes.data[0].slot_id)
    } catch {
      setError('Could not load data. Make sure the backend is running.')
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setMessage('')
    setError('')
    try {
      await axios.post(`${BASE}/teacher-availabilities`, {
        teacher_id:   parseInt(teacherId),
        slot_id:      parseInt(slotId),
        is_available: isAvailable === 'true'
      })
      setMessage('Availability set successfully')
      fetchAll()
    } catch (err) {
      setError(err.response?.data?.detail || 'Error setting availability')
    }
  }

  const getTeacherName = (id) =>
    teachers.find(t => t.teacher_id === id)?.teacher_name || `Teacher ${id}`

  const getSlotLabel = (id) => {
    const s = slots.find(sl => sl.slot_id === id)
    return s ? `${s.day} — Period ${s.period_number}` : `Slot ${id}`
  }

  const sortedSlots = [...slots].sort((a, b) => {
    const days = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
    return days.indexOf(a.day) - days.indexOf(b.day) || a.period_number - b.period_number
  })

  return (
    <div style={{ maxWidth: '640px' }}>
      <h2 style={headingStyle}>Set Teacher Availability</h2>

      <form onSubmit={handleSubmit} style={formStyle}>

        <div style={fieldStyle}>
          <label style={labelStyle}>Teacher</label>
          <select
            value={teacherId}
            onChange={e => setTeacherId(e.target.value)}
            style={selectStyle}
            required
          >
            <option value="">Select teacher</option>
            {teachers.map(t => (
              <option key={t.teacher_id} value={t.teacher_id}>
                {t.teacher_name}
              </option>
            ))}
          </select>
        </div>

        <div style={fieldStyle}>
          <label style={labelStyle}>Time slot</label>
          <select
            value={slotId}
            onChange={e => setSlotId(e.target.value)}
            style={selectStyle}
            required
          >
            <option value="">Select time slot</option>
            {sortedSlots.map(s => (
              <option key={s.slot_id} value={s.slot_id}>
                {s.day} — Period {s.period_number}
              </option>
            ))}
          </select>
        </div>

        <div style={fieldStyle}>
          <label style={labelStyle}>Availability</label>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={() => setIsAvailable('true')}
              style={{
                ...toggleBtn,
                background: isAvailable === 'true' ? '#0d2b1a' : '#111',
                border: `1px solid ${isAvailable === 'true' ? '#4caf7d' : '#333'}`,
                color: isAvailable === 'true' ? '#4caf7d' : '#666'
              }}
            >
              Available
            </button>
            <button
              type="button"
              onClick={() => setIsAvailable('false')}
              style={{
                ...toggleBtn,
                background: isAvailable === 'false' ? '#2b0d0d' : '#111',
                border: `1px solid ${isAvailable === 'false' ? '#f44336' : '#333'}`,
                color: isAvailable === 'false' ? '#f44336' : '#666'
              }}
            >
              Not available
            </button>
          </div>
        </div>

        {message && <div style={successStyle}>{message}</div>}
        {error   && <div style={errorStyle}>{error}</div>}

        <button type="submit" style={btnStyle}>Set availability</button>
      </form>

      {records.length > 0 && (
        <div style={{ marginTop: '32px' }}>
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '10px' }}>
            {records.length} record{records.length !== 1 ? 's' : ''}
          </div>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Teacher</th>
                <th style={thStyle}>Time slot</th>
                <th style={thStyle}>Status</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r, i) => (
                <tr key={i}>
                  <td style={tdStyle}>{getTeacherName(r.teacher_id)}</td>
                  <td style={tdStyle}>{getSlotLabel(r.slot_id)}</td>
                  <td style={tdStyle}>
                    <span style={{
                      padding: '3px 10px', borderRadius: '10px', fontSize: '11px',
                      fontWeight: '600',
                      background: r.is_available ? '#0d2b1a' : '#2b0d0d',
                      color: r.is_available ? '#4caf7d' : '#f44336'
                    }}>
                      {r.is_available ? 'Available' : 'Not available'}
                    </span>
                  </td>
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
const selectStyle = {
  padding: '10px 12px', borderRadius: '8px',
  border: '1px solid #333', background: '#0f0f0f',
  color: '#e0e0e0', fontSize: '14px', cursor: 'pointer'
}
const toggleBtn = {
  flex: 1, padding: '10px', borderRadius: '8px',
  cursor: 'pointer', fontSize: '13px', fontWeight: '600',
  transition: 'all 0.2s'
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