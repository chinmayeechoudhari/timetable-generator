import { useState, useEffect } from 'react'
import axios from 'axios'
import * as S from '../styles/formStyles'

const BASE = 'http://localhost:8000'
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export default function TeacherAvailabilityForm() {
  const [teachers, setTeachers] = useState([])
  const [slots, setSlots] = useState([])
  const [records, setRecords] = useState([])
  const [timetable, setTimetable] = useState([])
  const [subjects, setSubjects] = useState({})
  const [teacherId, setTeacherId] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    try {
      const [tRes, sRes, rRes, ttRes, subRes] = await Promise.all([
        axios.get(`${BASE}/teachers`),
        axios.get(`${BASE}/timeslots`),
        axios.get(`${BASE}/teacher-availabilities`),
        axios.get(`${BASE}/timetable`),
        axios.get(`${BASE}/subjects`),
      ])
      setTeachers(tRes.data)
      setSlots(sRes.data)
      setRecords(rRes.data)
      setTimetable(ttRes.data)
      const subMap = {}
      subRes.data.forEach(s => { subMap[s.subject_id] = s.subject_name })
      setSubjects(subMap)
      if (tRes.data.length > 0 && !teacherId) setTeacherId(String(tRes.data[0].teacher_id))
    } catch {
      setError('Could not load data. Make sure the backend is running.')
    }
  }

  const getTeacherName = (id) =>
    teachers.find(t => t.teacher_id === parseInt(id))?.teacher_name || `Teacher ${id}`

  const getSlotLabel = (id) => {
    const s = slots.find(sl => sl.slot_id === id)
    return s ? `${s.day} — P${s.period_number}` : `Slot ${id}`
  }

  const sortedSlots = [...slots].sort((a, b) =>
    DAYS.indexOf(a.day) - DAYS.indexOf(b.day) || a.period_number - b.period_number
  )

  // Slots where this teacher is currently assigned in the timetable
  const assignedSlotIds = new Set(
    timetable
      .filter(e => e.teacher_id === parseInt(teacherId))
      .map(e => e.slot_id)
  )

  // Unavailability rules for selected teacher
  const teacherRules = records.filter(
    r => r.teacher_id === parseInt(teacherId) && !r.is_available
  )
  const unavailableSlotIds = new Set(teacherRules.map(r => r.slot_id))

  async function markUnavailable(slotId) {
    setMessage(''); setError('')
    const alreadyExists = records.find(
      r => r.teacher_id === parseInt(teacherId) && r.slot_id === slotId
    )
    try {
      if (alreadyExists) {
        await axios.put(
          `${BASE}/teacher-availabilities/${teacherId}/${slotId}`,
          { is_available: false }
        )
      } else {
        await axios.post(`${BASE}/teacher-availabilities`, {
          teacher_id: parseInt(teacherId),
          slot_id: slotId,
          is_available: false
        })
      }
      setMessage('Marked unavailable')
      fetchAll()
    } catch (err) {
      setError(err.response?.data?.detail || 'Error setting availability')
    }
  }

  async function removeRule(slotId) {
    setMessage(''); setError('')
    try {
      await axios.delete(`${BASE}/teacher-availabilities/${teacherId}/${slotId}`)
      setMessage('Unavailability rule removed')
      fetchAll()
    } catch (err) {
      setError(err.response?.data?.detail || 'Error removing rule')
    }
  }

  // Assigned lectures for selected teacher (for the side panel)
  const assignedLectures = timetable
    .filter(e => e.teacher_id === parseInt(teacherId))
    .map(e => {
      const slot = slots.find(s => s.slot_id === e.slot_id)
      return { ...e, slot }
    })
    .filter(e => e.slot)
    .sort((a, b) =>
      DAYS.indexOf(a.slot.day) - DAYS.indexOf(b.slot.day) ||
      a.slot.period_number - b.slot.period_number
    )

  const hasTeacher = !!teacherId

  return (
    <div style={{ padding: '28px 32px', background: '#F0F4F8', minHeight: '100vh' }}>

      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontSize: '18px', fontWeight: '700', color: '#1B2A3B' }}>Availability</div>
        <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
          Select a teacher to view their lectures and manage unavailability rules
        </div>
      </div>

      {/* Teacher selector bar */}
      <div style={{
        background: '#FFFFFF', borderRadius: '10px',
        padding: '14px 20px', marginBottom: '20px',
        border: '1px solid #E2E8F0',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap'
      }}>
        <div style={{ fontSize: '13px', fontWeight: '600', color: '#1B2A3B', whiteSpace: 'nowrap' }}>
          Active teacher
        </div>
        <select
          value={teacherId}
          onChange={e => { setTeacherId(e.target.value); setMessage(''); setError('') }}
          style={{
            ...S.select, maxWidth: '240px',
            fontWeight: teacherId ? '700' : '400',
            borderColor: teacherId ? '#2563EB' : '#CBD5E1',
            color: teacherId ? '#1D4ED8' : '#94A3B8',
          }}
        >
          <option value="">— Select a teacher —</option>
          {teachers.map(t => (
            <option key={t.teacher_id} value={t.teacher_id}>{t.teacher_name}</option>
          ))}
        </select>

        {hasTeacher && (
          <div style={{
            fontSize: '12px', fontWeight: '600',
            background: assignedLectures.length > 0 ? '#EFF6FF' : '#F8FAFC',
            color: assignedLectures.length > 0 ? '#1D4ED8' : '#94A3B8',
            border: `1px solid ${assignedLectures.length > 0 ? '#BFDBFE' : '#E2E8F0'}`,
            borderRadius: '20px', padding: '3px 12px',
          }}>
            {assignedLectures.length} lecture{assignedLectures.length !== 1 ? 's' : ''} assigned
          </div>
        )}
        {teacherRules.length > 0 && (
          <div style={{
            fontSize: '12px', fontWeight: '600',
            background: '#FEF2F2', color: '#991B1B',
            border: '1px solid #FECACA',
            borderRadius: '20px', padding: '3px 12px',
          }}>
            {teacherRules.length} unavailability rule{teacherRules.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {message && <div style={{ ...S.successBox, marginBottom: '12px' }}>{message}</div>}
      {error && <div style={{ ...S.errorBox, marginBottom: '12px' }}>{error}</div>}

      <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start', flexWrap: 'wrap' }}>

        {/* ── Left: slot grid ── */}
        <div style={{
          ...S.card,
          minWidth: '300px', maxWidth: '420px',
          opacity: hasTeacher ? 1 : 0.5,
          pointerEvents: hasTeacher ? 'auto' : 'none',
          transition: 'opacity 0.2s'
        }}>
          <div style={S.heading}>Mark unavailable slots</div>
          <div style={{ fontSize: '11px', color: '#64748B', marginBottom: '12px', lineHeight: 1.5 }}>
            🟦 = currently assigned lecture &nbsp;|&nbsp; 🔴 = unavailability rule set
          </div>

          {sortedSlots.length === 0 && (
            <div style={{ fontSize: '12px', color: '#94A3B8' }}>No timeslots configured yet.</div>
          )}

          {DAYS.filter(d => sortedSlots.some(s => s.day === d)).map(day => (
            <div key={day} style={{ marginBottom: '10px' }}>
              <div style={{
                fontSize: '10px', fontWeight: '700', color: '#94A3B8',
                textTransform: 'uppercase', letterSpacing: '0.08em',
                marginBottom: '5px'
              }}>{day}</div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {sortedSlots.filter(s => s.day === day).map(s => {
                  const isAssigned = assignedSlotIds.has(s.slot_id)
                  const isUnavailable = unavailableSlotIds.has(s.slot_id)
                  return (
                    <button
                      key={s.slot_id}
                      title={
                        isUnavailable ? 'Click to remove rule' :
                          isAssigned ? 'Assigned — click to mark unavailable' :
                            'Click to mark unavailable'
                      }
                      onClick={() =>
                        isUnavailable ? removeRule(s.slot_id) : markUnavailable(s.slot_id)
                      }
                      style={{
                        padding: '5px 10px',
                        borderRadius: '6px',
                        border: `1.5px solid ${isUnavailable ? '#DC2626' :
                            isAssigned ? '#2563EB' : '#E2E8F0'
                          }`,
                        background: isUnavailable ? '#FEF2F2' :
                          isAssigned ? '#EFF6FF' : '#F8FAFC',
                        color: isUnavailable ? '#DC2626' :
                          isAssigned ? '#1D4ED8' : '#94A3B8',
                        fontSize: '11px', fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.12s',
                        position: 'relative',
                      }}
                    >
                      P{s.period_number}
                      {isUnavailable && (
                        <span style={{ marginLeft: '4px', fontSize: '10px' }}>✗</span>
                      )}
                      {isAssigned && !isUnavailable && (
                        <span style={{ marginLeft: '4px', fontSize: '10px' }}>●</span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {/* ── Right: two sub-panels ── */}
        <div style={{ flex: 1, minWidth: '280px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Assigned lectures panel */}
          <div>
            <div style={S.tableCount}>
              Current lectures for {hasTeacher ? getTeacherName(teacherId) : '—'}
            </div>
            {assignedLectures.length === 0 ? (
              <div style={{
                background: '#FFFFFF', borderRadius: '10px',
                border: '1px solid #E2E8F0', padding: '24px',
                textAlign: 'center', color: '#94A3B8', fontSize: '12px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
              }}>
                {hasTeacher ? 'No lectures assigned yet — generate a timetable first' : 'Select a teacher above'}
              </div>
            ) : (
              <table style={S.table}>
                <thead>
                  <tr>
                    <th style={S.th}>Day</th>
                    <th style={S.th}>Period</th>
                    <th style={S.th}>Subject</th>
                    <th style={S.th}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {assignedLectures.map(e => {
                    const isUnavailable = unavailableSlotIds.has(e.slot_id)
                    return (
                      <tr key={`${e.slot_id}`}>
                        <td style={{ ...S.td, fontWeight: '600', color: '#1B2A3B' }}>
                          {e.slot.day}
                        </td>
                        <td style={{ ...S.td, textAlign: 'center', color: '#2563EB', fontWeight: '700' }}>
                          P{e.slot.period_number}
                        </td>
                        <td style={S.td}>
                          {subjects[e.subject_id] || `Subject ${e.subject_id}`}
                        </td>
                        <td style={S.td}>
                          {isUnavailable ? (
                            <span style={{
                              padding: '2px 8px', borderRadius: '20px',
                              fontSize: '11px', fontWeight: '600',
                              background: '#FEF2F2', color: '#991B1B',
                              border: '1px solid #FECACA'
                            }}>
                              ✗ Unavailable
                            </span>
                          ) : (
                            <span style={{
                              padding: '2px 8px', borderRadius: '20px',
                              fontSize: '11px', fontWeight: '600',
                              background: '#F0FDF4', color: '#166534',
                              border: '1px solid #BBF7D0'
                            }}>
                              ✓ Available
                            </span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Unavailability rules panel */}
          {teacherRules.length > 0 && (
            <div>
              <div style={S.tableCount}>
                Unavailability rules — regenerate timetable to apply
              </div>
              <table style={S.table}>
                <thead>
                  <tr>
                    <th style={S.th}>Time slot</th>
                    <th style={S.th}>Conflict</th>
                    <th style={S.th}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {teacherRules.map(r => {
                    const conflict = assignedSlotIds.has(r.slot_id)
                    return (
                      <tr key={r.slot_id}>
                        <td style={{ ...S.td, fontWeight: '600', color: '#1B2A3B' }}>
                          {getSlotLabel(r.slot_id)}
                        </td>
                        <td style={S.td}>
                          {conflict ? (
                            <span style={{
                              padding: '2px 8px', borderRadius: '20px',
                              fontSize: '11px', fontWeight: '600',
                              background: '#FEF3C7', color: '#92400E',
                              border: '1px solid #FDE68A'
                            }}>
                              ⚠ Has lecture
                            </span>
                          ) : (
                            <span style={{
                              padding: '2px 8px', borderRadius: '20px',
                              fontSize: '11px', fontWeight: '600',
                              background: '#F8FAFC', color: '#94A3B8',
                              border: '1px solid #E2E8F0'
                            }}>
                              No conflict
                            </span>
                          )}
                        </td>
                        <td style={S.td}>
                          <button
                            onClick={() => removeRule(r.slot_id)}
                            style={{
                              padding: '3px 10px',
                              borderRadius: '6px',
                              border: '1px solid #FECACA',
                              background: '#FEF2F2',
                              color: '#DC2626',
                              fontSize: '11px', fontWeight: '600',
                              cursor: 'pointer'
                            }}
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              <div style={{
                fontSize: '11px', color: '#64748B',
                background: '#FFFBEB', borderRadius: '6px',
                padding: '8px 10px', border: '1px solid #FDE68A',
                marginTop: '8px', lineHeight: 1.5
              }}>
                ⚡ After making changes, go to <strong>Generate</strong> and re-run the solver.
                The solver will automatically assign a replacement teacher for any conflicting slots.
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}