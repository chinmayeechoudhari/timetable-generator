import { useState, useEffect } from 'react'
import axios from 'axios'
import * as S from '../styles/formStyles'

const BASE = 'http://localhost:8000'
const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']

export default function TeacherAvailabilityForm() {
  const [teachers, setTeachers]       = useState([])
  const [slots, setSlots]             = useState([])
  const [records, setRecords]         = useState([])
  const [teacherId, setTeacherId]     = useState('')
  const [slotId, setSlotId]           = useState('')
  const [isAvailable, setIsAvailable] = useState('true')
  const [message, setMessage]         = useState('')
  const [error, setError]             = useState('')

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
    setMessage(''); setError('')
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

  const sortedSlots = [...slots].sort((a, b) =>
    DAYS.indexOf(a.day) - DAYS.indexOf(b.day) || a.period_number - b.period_number
  )

  return (
    <div style={{ padding: '28px 32px', background: '#F0F4F8', minHeight: '100vh' }}>

      {/* Page header */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontSize: '18px', fontWeight: '700', color: '#1B2A3B' }}>
          Availability
        </div>
        <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
          Mark slots where a teacher is unavailable — all slots available by default
        </div>
      </div>

      <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start', flexWrap: 'wrap' }}>

        {/* Form card */}
        <div style={S.card}>
          <div style={S.heading}>Set Availability</div>

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
            <label style={S.label}>Status</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setIsAvailable('true')}
                style={{
                  ...(isAvailable === 'true' ? S.toggleActive : S.toggleInactive),
                  flex: 1
                }}
              >
                ✓ Available
              </button>
              <button
                type="button"
                onClick={() => setIsAvailable('false')}
                style={{
                  ...S.toggleInactive,
                  flex: 1,
                  ...(isAvailable === 'false' ? {
                    border: '1.5px solid #DC2626',
                    background: '#FEF2F2',
                    color: '#DC2626'
                  } : {})
                }}
              >
                ✗ Not available
              </button>
            </div>
          </div>

          {message && <div style={S.successBox}>{message}</div>}
          {error   && <div style={S.errorBox}>{error}</div>}

          <button onClick={handleSubmit} style={S.btn}>
            Set Availability
          </button>

          <div style={{
            fontSize: '11px', color: '#64748B',
            background: '#F8FAFC', borderRadius: '6px',
            padding: '8px 10px', border: '1px solid #E2E8F0',
            lineHeight: 1.5
          }}>
            💡 Only mark unavailable slots. The solver treats all unmarked slots as available.
          </div>
        </div>

        {/* Records table */}
        {records.length > 0 && (
          <div style={{ flex: 1, minWidth: '280px' }}>
            <div style={S.tableCount}>
              {records.length} record{records.length !== 1 ? 's' : ''} set
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
                {records.map((r) => (
                  <tr key={`${r.teacher_id}-${r.slot_id}`}>
                    <td style={{ ...S.td, fontWeight: '600', color: '#1B2A3B' }}>
                      {getTeacherName(r.teacher_id)}
                    </td>
                    <td style={{ ...S.td, color: '#475569' }}>
                      {getSlotLabel(r.slot_id)}
                    </td>
                    <td style={S.td}>
                      <span style={{
                        padding: '3px 10px',
                        borderRadius: '20px',
                        fontSize: '11px',
                        fontWeight: '600',
                        background: r.is_available ? '#F0FDF4' : '#FEF2F2',
                        color: r.is_available ? '#166534' : '#991B1B',
                        border: `1px solid ${r.is_available ? '#BBF7D0' : '#FECACA'}`
                      }}>
                        {r.is_available ? '✓ Available' : '✗ Unavailable'}
                      </span>
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