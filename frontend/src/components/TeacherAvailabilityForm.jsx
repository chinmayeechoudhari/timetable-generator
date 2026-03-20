import * as S from '../styles/formStyles'
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
    <div style={{ padding: '32px' }}>

      <div style={S.card}>
        <h2 style={S.heading}>Set Teacher Availability</h2>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

          <div style={S.fieldWrap}>
            <label style={S.label}>Teacher</label>
            <select
              value={teacherId}
              onChange={e => setTeacherId(e.target.value)}
              style={S.select}
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

          <div style={S.fieldWrap}>
            <label style={S.label}>Time slot</label>
            <select
              value={slotId}
              onChange={e => setSlotId(e.target.value)}
              style={S.select}
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

          <div style={S.fieldWrap}>
            <label style={S.label}>Availability</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setIsAvailable('true')}
                style={isAvailable === 'true' ? S.toggleActive : S.toggleInactive}
              >
                Available
              </button>

              <button
                type="button"
                onClick={() => setIsAvailable('false')}
                style={isAvailable === 'false' ? S.toggleActive : S.toggleInactive}
              >
                Not available
              </button>
            </div>
          </div>

          {message && <div style={S.successBox}>{message}</div>}
          {error   && <div style={S.errorBox}>{error}</div>}

          <button type="submit" style={S.btn}>Set availability</button>
        </form>
      </div>

      {records.length > 0 && (
        <div style={{ ...S.tableWrap, maxWidth: '640px' }}>
          <div style={S.tableCount}>
            {records.length} record{records.length !== 1 ? 's' : ''}
          </div>

          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>Teacher</th>
                <th style={S.th}>Time slot</th>
                <th style={S.th}>Status</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r, i) => (
                <tr key={`${r.teacher_id}-${r.slot_id}`}>
                  <td style={S.td}>{getTeacherName(r.teacher_id)}</td>
                  <td style={S.td}>{getSlotLabel(r.slot_id)}</td>
                  <td style={S.td}>
                    <span style={{
                      padding: '3px 10px',
                      borderRadius: '10px',
                      fontSize: '11px',
                      fontWeight: '600',
                      background: r.is_available ? '#e8f5e9' : '#fdecea',
                      color: r.is_available ? '#2e7d32' : '#c62828'
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