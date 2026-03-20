import { useState, useEffect } from 'react'
import axios from 'axios'
import * as S from '../styles/formStyles'

const BASE = 'http://localhost:8000'
const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']

export default function TimeSlotForm() {
  const [slots, setSlots]       = useState([])
  const [day, setDay]           = useState('Monday')
  const [period, setPeriod]     = useState(1)
  const [message, setMessage]   = useState('')
  const [error, setError]       = useState('')

  useEffect(() => { fetchSlots() }, [])

  async function fetchSlots() {
    try {
      const res = await axios.get(`${BASE}/timeslots`)
      setSlots(res.data)
    } catch { setError('Could not load timeslots') }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setMessage(''); setError('')
    try {
      await axios.post(`${BASE}/timeslots`, {
        day, period_number: parseInt(period)
      })
      setMessage(`${day} — Period ${period} added`)
      fetchSlots()
    } catch (err) {
      setError(err.response?.data?.detail || 'Error adding timeslot')
    }
  }

  const sortedSlots = [...slots].sort((a, b) =>
    DAYS.indexOf(a.day) - DAYS.indexOf(b.day) || a.period_number - b.period_number
  )

  return (
    <div style={{ padding: '32px' }}>
      <div style={S.card}>
        <h2 style={S.heading}>Add Time Slot</h2>
        <div style={S.fieldWrap}>
          <label style={S.label}>Day</label>
          <select value={day} onChange={e => setDay(e.target.value)} style={S.select}>
            {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <div style={S.fieldWrap}>
          <label style={S.label}>Period number</label>
          <input type="number" min="1" max="8" value={period}
            onChange={e => setPeriod(e.target.value)} style={S.input} required />
          <span style={{ fontSize: '11px', color: '#aaa' }}>Range: 1 to 8</span>
        </div>
        {message && <div style={S.successBox}>{message}</div>}
        {error   && <div style={S.errorBox}>{error}</div>}
        <button onClick={handleSubmit} style={S.btn}>Create timeslot</button>
      </div>

      {sortedSlots.length > 0 && (
        <div style={{ ...S.tableWrap, maxWidth: '640px' }}>
          <div style={S.tableCount}>{sortedSlots.length} timeslot{sortedSlots.length !== 1 ? 's' : ''}</div>
          <table style={S.table}>
            <thead><tr>
              <th style={S.th}>ID</th>
              <th style={S.th}>Day</th>
              <th style={S.th}>Period</th>
            </tr></thead>
            <tbody>
              {sortedSlots.map(s => (
                <tr key={s.slot_id}>
                  <td style={S.td}>{s.slot_id}</td>
                  <td style={S.td}>{s.day}</td>
                  <td style={S.td}>Period {s.period_number}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}