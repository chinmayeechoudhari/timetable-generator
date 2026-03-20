import { useState, useEffect } from 'react'
import axios from 'axios'
import * as S from '../styles/formStyles'

const BASE = 'http://localhost:8000'

export default function RoomForm() {
  const [rooms, setRooms]         = useState([])
  const [number, setNumber]       = useState('')
  const [roomType, setRoomType]   = useState('classroom')
  const [message, setMessage]     = useState('')
  const [error, setError]         = useState('')

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
    <div style={{ padding: '32px' }}>
      <div style={S.card}>
        <h2 style={S.heading}>Add Room</h2>
        <div style={S.fieldWrap}>
          <label style={S.label}>Room number</label>
          <input value={number} onChange={e => setNumber(e.target.value)}
            placeholder="e.g., R101" style={S.input} required />
        </div>
        <div style={S.fieldWrap}>
          <label style={S.label}>Room type</label>
          <div style={{ display: 'flex', gap: '10px' }}>
            {['classroom', 'lab'].map(type => (
              <button key={type} type="button" onClick={() => setRoomType(type)}
                style={roomType === type ? S.toggleActive : S.toggleInactive}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
        </div>
        {message && <div style={S.successBox}>{message}</div>}
        {error   && <div style={S.errorBox}>{error}</div>}
        <button onClick={handleSubmit} style={S.btn}>Create room</button>
      </div>

      {rooms.length > 0 && (
        <div style={{ ...S.tableWrap, maxWidth: '640px' }}>
          <div style={S.tableCount}>{rooms.length} room{rooms.length !== 1 ? 's' : ''}</div>
          <table style={S.table}>
            <thead><tr>
              <th style={S.th}>ID</th>
              <th style={S.th}>Room number</th>
              <th style={S.th}>Type</th>
            </tr></thead>
            <tbody>
              {rooms.map(r => (
                <tr key={r.room_id}>
                  <td style={S.td}>{r.room_id}</td>
                  <td style={S.td}>{r.room_number}</td>
                  <td style={S.td}>
                    <span style={{
                      padding: '3px 10px', borderRadius: '10px',
                      fontSize: '11px', fontWeight: '600',
                      background: r.room_type === 'lab' ? '#fff3e0' : '#e3f2fd',
                      color: r.room_type === 'lab' ? '#e65100' : '#1565c0'
                    }}>{r.room_type}</span>
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