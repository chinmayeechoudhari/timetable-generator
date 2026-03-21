import { useState, useEffect } from 'react'
import axios from 'axios'
import * as S from '../styles/formStyles'

const BASE = 'http://localhost:8000'

export default function RoomForm() {
  const [rooms, setRooms]       = useState([])
  const [number, setNumber]     = useState('')
  const [roomType, setRoomType] = useState('classroom')
  const [message, setMessage]   = useState('')
  const [error, setError]       = useState('')

  useEffect(() => { fetchRooms() }, [])

  async function fetchRooms() {
    try {
      const res = await axios.get(`${BASE}/rooms`)
      setRooms(res.data)
    } catch { setError('Could not load rooms') }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setMessage(''); setError('')
    try {
      await axios.post(`${BASE}/rooms`, {
        room_number: number,
        room_type: roomType
      })
      setMessage(`Room "${number}" added successfully`)
      setNumber('')
      fetchRooms()
    } catch (err) {
      setError(err.response?.data?.detail || 'Error adding room')
    }
  }

  return (
    <div style={{ padding: '28px 32px', background: '#F0F4F8', minHeight: '100vh' }}>

      {/* Page header */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontSize: '18px', fontWeight: '700', color: '#1B2A3B' }}>
          Rooms
        </div>
        <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
          Add classrooms and labs available for scheduling
        </div>
      </div>

      <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start', flexWrap: 'wrap' }}>

        {/* Form card */}
        <div style={S.card}>
          <div style={S.heading}>Add Room</div>

          <div style={S.fieldWrap}>
            <label style={S.label}>Room number</label>
            <input
              value={number}
              onChange={e => setNumber(e.target.value)}
              placeholder="e.g., R101"
              style={S.input}
              required
            />
          </div>

          <div style={S.fieldWrap}>
            <label style={S.label}>Room type</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {['classroom', 'lab'].map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setRoomType(type)}
                  style={roomType === type ? S.toggleActive : S.toggleInactive}
                >
                  {type === 'classroom' ? '🏫 Classroom' : '🔬 Lab'}
                </button>
              ))}
            </div>
          </div>

          {message && <div style={S.successBox}>{message}</div>}
          {error   && <div style={S.errorBox}>{error}</div>}

          <button onClick={handleSubmit} style={S.btn}>
            + Add Room
          </button>
        </div>

        {/* Table */}
        {rooms.length > 0 && (
          <div style={{ flex: 1, minWidth: '280px' }}>
            <div style={S.tableCount}>
              {rooms.length} room{rooms.length !== 1 ? 's' : ''} added
            </div>
            <table style={S.table}>
              <thead>
                <tr>
                  <th style={S.th}>ID</th>
                  <th style={S.th}>Room number</th>
                  <th style={S.th}>Type</th>
                </tr>
              </thead>
              <tbody>
                {rooms.map(r => (
                  <tr key={r.room_id}>
                    <td style={S.td}>{r.room_id}</td>
                    <td style={S.td}>{r.room_number}</td>
                    <td style={S.td}>
                      <span style={{
                        padding: '3px 10px',
                        borderRadius: '20px',
                        fontSize: '11px',
                        fontWeight: '600',
                        background: r.room_type === 'lab' ? '#FEF3C7' : '#EFF6FF',
                        color: r.room_type === 'lab' ? '#92400E' : '#1D4ED8'
                      }}>
                        {r.room_type === 'lab' ? '🔬 Lab' : '🏫 Classroom'}
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