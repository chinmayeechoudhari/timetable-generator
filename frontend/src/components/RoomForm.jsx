import { useState, useEffect } from 'react'
import axios from 'axios'
import * as S from '../styles/formStyles'
import ConfirmModal from './ConfirmModal'

const BASE = 'http://localhost:8000'

export default function RoomForm() {
  const [rooms, setRooms] = useState([])
  const [number, setNumber] = useState('')
  const [roomType, setRoomType] = useState('classroom')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // NEW
  const [editingId, setEditingId] = useState(null)

  useEffect(() => { fetchRooms() }, [])

  async function fetchRooms() {
    try {
      const res = await axios.get(`${BASE}/rooms`)
      setRooms(res.data)
    } catch {
      setError('Could not load rooms')
    }
  }

  // NEW
  function handleEdit(r) {
    setEditingId(r.room_id)
    setNumber(r.room_number)
    setRoomType(r.room_type)
    setMessage('')
    setError('')
  }

  // NEW
  function handleCancelEdit() {
    setEditingId(null)
    setNumber('')
    setRoomType('classroom')
    setMessage('')
    setError('')
  }

  // CHANGED: POST or PUT based on editingId
  async function handleSubmit(e) {
    e.preventDefault()
    setMessage('')
    setError('')

    try {
      if (editingId) {
        await axios.put(`${BASE}/rooms/${editingId}`, {
          room_number: number,
          room_type: roomType
        })
        setMessage(`Room "${number}" updated successfully`)
      } else {
        await axios.post(`${BASE}/rooms`, {
          room_number: number,
          room_type: roomType
        })
        setMessage(`Room "${number}" added successfully`)
      }
      handleCancelEdit()
      fetchRooms()
    } catch (err) {
      setError(err.response?.data?.detail || 'Error saving room')
    }
  }

  function promptDelete(r) {
    setDeleteTarget(r)
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    setIsDeleting(true)
    setMessage('')
    setError('')
    try {
      await axios.delete(`${BASE}/rooms/${deleteTarget.room_id}`)
      setMessage(`Room "${deleteTarget.room_number}" deleted successfully`)
      if (editingId === deleteTarget.room_id) handleCancelEdit()
      fetchRooms()
    } catch (err) {
      setError(err.response?.data?.detail || 'Error deleting room.')
    } finally {
      setIsDeleting(false)
      setDeleteTarget(null)
    }
  }

  const labCount = rooms.filter(r => r.room_type === 'lab').length
  const classroomCount = rooms.filter(r => r.room_type === 'classroom').length

  return (
    <div style={{ ...S.page }}>

      <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
        <div>
          <div style={{ ...S.pageTitle, fontSize: '20px', marginBottom: '6px' }}>Rooms</div>
          <div style={{ ...S.pageSub, fontSize: '13px', marginBottom: '0' }}>
            Add classrooms and labs available for timetable generation.
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <div style={statChip}>
            <span style={statChipLabel}>Total</span>
            <span style={statChipValue}>{rooms.length}</span>
          </div>
          <div style={{ ...statChip, background: '#F8FAFC' }}>
            <span style={statChipLabel}>Classrooms</span>
            <span style={statChipValue}>{classroomCount}</span>
          </div>
          <div style={{ ...statChip, background: '#FFFBEB', border: '1px solid #FDE68A' }}>
            <span style={{ ...statChipLabel, color: '#A16207' }}>Labs</span>
            <span style={{ ...statChipValue, color: '#92400E' }}>{labCount}</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start', flexWrap: 'wrap' }}>

        {/* Form card */}
        <div style={{
          ...S.card,
          minWidth: '320px', maxWidth: '420px', width: '100%',
          gap: '16px', borderRadius: '16px', padding: '26px',
          boxShadow: '0 10px 30px rgba(15, 23, 42, 0.06)',
          border: editingId ? '1px solid #2563EB' : '1px solid #E2E8F0'  // CHANGED
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '2px' }}>
            {/* CHANGED: icon + heading */}
            <div style={{
              ...iconBadge,
              background: editingId
                ? 'linear-gradient(135deg, #EFF6FF, #BFDBFE)'
                : 'linear-gradient(135deg, #EFF6FF, #DBEAFE)'
            }}>
              {editingId ? '✏️' : '🚪'}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ ...S.heading, fontSize: '16px', marginBottom: '2px' }}>
                {editingId ? 'Edit Room' : 'Add Room'}
              </div>
              <div style={helperTopText}>
                {editingId
                  ? 'Update the room number or type.'
                  : 'Register a room and classify it as a classroom or lab.'}
              </div>
            </div>
            {/* NEW: Cancel button */}
            {editingId && (
              <button onClick={handleCancelEdit} style={cancelBtn}>Cancel</button>
            )}
          </div>

          <div style={S.fieldWrap}>
            <label style={S.label}>Room number</label>
            <input
              value={number}
              onChange={e => setNumber(e.target.value)}
              placeholder="e.g., R101"
              style={{ ...S.input, height: '44px', borderRadius: '10px', background: '#F8FAFC', border: '1px solid #CBD5E1' }}
              required
            />
            <div style={fieldHint}>Use the exact room label you want to see in the timetable.</div>
          </div>

          <div style={S.fieldWrap}>
            <label style={S.label}>Room type</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              {['classroom', 'lab'].map(type => {
                const isActive = roomType === type
                const isLab = type === 'lab'
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setRoomType(type)}
                    style={{
                      flex: 1, padding: '12px 14px', borderRadius: '12px', cursor: 'pointer',
                      fontSize: '13px', fontWeight: '700',
                      border: isActive ? `1.5px solid ${isLab ? '#D97706' : '#2563EB'}` : '1px solid #CBD5E1',
                      background: isActive ? (isLab ? '#FFFBEB' : '#EFF6FF') : '#F8FAFC',
                      color: isActive ? (isLab ? '#92400E' : '#1D4ED8') : '#64748B',
                      transition: 'all 0.15s ease',
                      boxShadow: isActive ? '0 4px 10px rgba(15, 23, 42, 0.04)' : 'none'
                    }}
                  >
                    <div style={{ fontSize: '18px', marginBottom: '6px' }}>{isLab ? '🔬' : '🏫'}</div>
                    {isLab ? 'Lab' : 'Classroom'}
                  </button>
                )
              })}
            </div>
            <div style={fieldHint}>Labs are typically used for practical sessions; classrooms for theory lectures.</div>
          </div>

          {message && <div style={{ ...S.successBox, borderRadius: '10px' }}>{message}</div>}
          {error && <div style={{ ...S.errorBox, borderRadius: '10px' }}>{error}</div>}

          {/* CHANGED: button label */}
          <button
            onClick={handleSubmit}
            style={{ ...S.btn, height: '46px', borderRadius: '10px', fontSize: '14px', fontWeight: '700', boxShadow: '0 10px 20px rgba(37, 99, 235, 0.18)' }}
          >
            {editingId ? '✓ Update Room' : '+ Add Room'}
          </button>
        </div>

        {/* Table */}
        <div style={{ flex: 1, minWidth: '320px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', marginBottom: '10px' }}>
            <div>
              <div style={sectionTitle}>Room Directory</div>
              <div style={sectionSub}>Review all registered rooms and their scheduling type.</div>
            </div>
            <div style={countPill}>{rooms.length} room{rooms.length !== 1 ? 's' : ''}</div>
          </div>

          {rooms.length > 0 ? (
            <div style={{ background: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 10px 30px rgba(15, 23, 42, 0.04)' }}>
              <table style={{ ...S.table, border: 'none' }}>
                <thead>
                  <tr>
                    <th style={S.th}>ID</th>
                    <th style={S.th}>Room</th>
                    <th style={{ ...S.th, textAlign: 'center' }}>Type</th>
                    {/* NEW */}
                    <th style={{ ...S.th, textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rooms.map((r, index) => (
                    <tr
                      key={r.room_id}
                      style={{
                        // NEW: highlight editing row
                        background: editingId === r.room_id
                          ? '#EFF6FF'
                          : index % 2 === 0 ? '#FFFFFF' : '#FCFDFE'
                      }}
                    >
                      <td style={{ ...S.td, width: '72px', color: '#64748B', fontWeight: '600' }}>#{r.room_id}</td>

                      <td style={S.td}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={roomAvatar(r.room_type)}>
                            {r.room_type === 'lab' ? '🔬' : '🏫'}
                          </div>
                          <div>
                            <div style={{ fontWeight: '700', color: '#1B2A3B' }}>{r.room_number}</div>
                            <div style={miniMeta}>{r.room_type === 'lab' ? 'Practical room' : 'Lecture room'}</div>
                          </div>
                        </div>
                      </td>

                      <td style={{ ...S.td, textAlign: 'center' }}>
                        <span style={r.room_type === 'lab' ? labBadge : classroomBadge}>
                          {r.room_type === 'lab' ? '🔬 Lab' : '🏫 Classroom'}
                        </span>
                      </td>

                      {/* NEW: action buttons */}
                      <td style={{ ...S.td, textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                          <button onClick={() => handleEdit(r)} style={editBtn}>Edit</button>
                          <button onClick={() => promptDelete(r)} style={deleteBtn}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={emptyStateCard}>
              <div style={emptyIcon}>🚪</div>
              <div style={emptyTitle}>No rooms added yet</div>
              <div style={emptyText}>Use the form on the left to create your first room entry.</div>
            </div>
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Delete Room"
        itemName={deleteTarget?.room_number}
        message="Are you sure you want to delete this room? This will disassociate any assigned timetable entries."
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
        isDeleting={isDeleting}
      />
    </div>
  )
}

const statChip = { display: 'flex', alignItems: 'center', gap: '8px', background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '999px', padding: '8px 12px', boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)' }
const statChipLabel = { fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }
const statChipValue = { fontSize: '12px', fontWeight: '700', color: '#1B2A3B' }
const iconBadge = { width: '42px', height: '42px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #EFF6FF, #DBEAFE)', border: '1px solid #BFDBFE', fontSize: '18px', flexShrink: 0 }
const helperTopText = { fontSize: '12px', color: '#64748B', lineHeight: '1.5' }
const fieldHint = { fontSize: '11px', color: '#94A3B8', lineHeight: '1.4' }
const sectionTitle = { fontSize: '15px', fontWeight: '700', color: '#1B2A3B' }
const sectionSub = { fontSize: '12px', color: '#64748B', marginTop: '2px' }
const countPill = { fontSize: '12px', fontWeight: '700', color: '#1D4ED8', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '999px', padding: '6px 12px' }
const roomAvatar = (type) => ({ width: '34px', height: '34px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', flexShrink: 0, background: type === 'lab' ? 'linear-gradient(135deg, #FEF3C7, #FDE68A)' : 'linear-gradient(135deg, #DBEAFE, #BFDBFE)', color: type === 'lab' ? '#92400E' : '#1D4ED8' })
const miniMeta = { fontSize: '11px', color: '#94A3B8', marginTop: '2px' }
const classroomBadge = { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: '88px', padding: '4px 10px', borderRadius: '999px', background: '#EFF6FF', border: '1px solid #BFDBFE', color: '#1D4ED8', fontSize: '12px', fontWeight: '700' }
const labBadge = { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: '70px', padding: '4px 10px', borderRadius: '999px', background: '#FFFBEB', border: '1px solid #FDE68A', color: '#92400E', fontSize: '12px', fontWeight: '700' }
const emptyStateCard = { background: '#FFFFFF', borderRadius: '16px', border: '1px dashed #CBD5E1', padding: '42px 24px', textAlign: 'center' }
const emptyIcon = { fontSize: '28px', marginBottom: '10px' }
const emptyTitle = { fontSize: '14px', fontWeight: '700', color: '#1B2A3B', marginBottom: '6px' }
const emptyText = { fontSize: '12px', color: '#64748B' }
const cancelBtn = { background: 'none', border: '1px solid #CBD5E1', borderRadius: '8px', padding: '4px 10px', fontSize: '12px', color: '#64748B', cursor: 'pointer', flexShrink: 0 }
const editBtn = { padding: '4px 12px', fontSize: '12px', fontWeight: '600', color: '#1D4ED8', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '8px', cursor: 'pointer' }
const deleteBtn = { padding: '4px 12px', fontSize: '12px', fontWeight: '600', color: '#DC2626', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', cursor: 'pointer' }