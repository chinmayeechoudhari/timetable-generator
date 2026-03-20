import { useState, useEffect } from 'react'
import axios from 'axios'

const BASE = 'http://localhost:8000'
const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
const PERIODS = [1,2,3,4,5,6,7,8]

const COLORS = [
  { bg: '#ede9fe', border: '#7c3aed', text: '#5b21b6' },
  { bg: '#dbeafe', border: '#2563eb', text: '#1d4ed8' },
  { bg: '#dcfce7', border: '#16a34a', text: '#15803d' },
  { bg: '#fef3c7', border: '#d97706', text: '#b45309' },
  { bg: '#fce7f3', border: '#db2777', text: '#9d174d' },
  { bg: '#e0f2fe', border: '#0284c7', text: '#0369a1' },
  { bg: '#fff7ed', border: '#ea580c', text: '#c2410c' },
  { bg: '#f0fdf4', border: '#22c55e', text: '#15803d' },
]

export default function TimetableGrid() {
  const [timetable, setTimetable]     = useState([])
  const [teachers, setTeachers]       = useState({})
  const [subjects, setSubjects]       = useState({})
  const [rooms, setRooms]             = useState({})
  const [classes, setClasses]         = useState({})
  const [subjectColors, setSubjectColors] = useState({})
  const [allClasses, setAllClasses]   = useState([])
  const [allTeachers, setAllTeachers] = useState([])
  const [allRooms, setAllRooms]       = useState([])
  const [slots, setSlots]             = useState([])
  const [view, setView]               = useState('class')
  const [selected, setSelected]       = useState(null)
  const [loading, setLoading]         = useState(true)

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    try {
      const [ttRes, tRes, sRes, rRes, cRes, slRes] = await Promise.all([
        axios.get(`${BASE}/timetable`),
        axios.get(`${BASE}/teachers`),
        axios.get(`${BASE}/subjects`),
        axios.get(`${BASE}/rooms`),
        axios.get(`${BASE}/classes`),
        axios.get(`${BASE}/timeslots`),
      ])
      const teacherMap = {}
      tRes.data.forEach(t => { teacherMap[t.teacher_id] = t.teacher_name })
      const subjectMap = {}
      sRes.data.forEach(s => { subjectMap[s.subject_id] = s.subject_name })
      const roomMap = {}
      rRes.data.forEach(r => { roomMap[r.room_id] = r.room_number })
      const classMap = {}
      cRes.data.forEach(c => { classMap[c.class_id] = c.class_name })
      const colors = {}
      sRes.data.forEach((s, i) => { colors[s.subject_id] = COLORS[i % COLORS.length] })

      setTimetable(ttRes.data)
      setTeachers(teacherMap)
      setSubjects(subjectMap)
      setRooms(roomMap)
      setClasses(classMap)
      setSubjectColors(colors)
      setAllClasses(cRes.data)
      setAllTeachers(tRes.data)
      setAllRooms(rRes.data)
      setSlots(slRes.data)
      if (cRes.data.length > 0) setSelected(cRes.data[0].class_id)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const getSlotId = (day, period) => {
    const s = slots.find(s => s.day === day && s.period_number === period)
    return s ? s.slot_id : null
  }

  const getCell = (filterKey, filterVal, day, period) => {
    const slotId = getSlotId(day, period)
    if (!slotId) return null
    return timetable.find(t => t[filterKey] === filterVal && t.slot_id === slotId) || null
  }

  const switchView = (v) => {
    setView(v)
    if (v === 'class' && allClasses.length > 0) setSelected(allClasses[0].class_id)
    if (v === 'teacher' && allTeachers.length > 0) setSelected(allTeachers[0].teacher_id)
    if (v === 'room' && allRooms.length > 0) setSelected(allRooms[0].room_id)
  }

  const filterOptions = () => {
    if (view === 'class')   return allClasses.map(c  => ({ id: c.class_id,   label: c.class_name }))
    if (view === 'teacher') return allTeachers.map(t => ({ id: t.teacher_id, label: t.teacher_name }))
    if (view === 'room')    return allRooms.map(r    => ({ id: r.room_id,    label: r.room_number }))
    return []
  }

  const filterKey   = view === 'class' ? 'class_id' : view === 'teacher' ? 'teacher_id' : 'room_id'
  const activeDays  = DAYS.filter(day => slots.some(s => s.day === day))
  const activePeriods = PERIODS.filter(p => slots.some(s => s.period_number === p))

  if (loading) return (
    <div style={{ padding: '48px', textAlign: 'center', color: '#999' }}>
      Loading timetable...
    </div>
  )

  if (timetable.length === 0) return (
    <div style={{ padding: '48px', textAlign: 'center', color: '#999' }}>
      No timetable generated yet. Go to Generate page first.
    </div>
  )

  return (
    <div style={{ padding: '28px 32px', background: '#f7f7f8', minHeight: '100vh' }}>

      {/* Page title */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#1a1a1a', margin: 0 }}>
          Timetable
        </h1>
        <p style={{ fontSize: '13px', color: '#888', margin: '4px 0 0' }}>
          {timetable.length} slots assigned
        </p>
      </div>

      {/* View tabs */}
      <div style={{
        display: 'inline-flex', gap: '4px',
        background: '#ebebeb', borderRadius: '12px',
        padding: '4px', marginBottom: '20px'
      }}>
        {[
          { key: 'class',   label: 'Class-wise' },
          { key: 'teacher', label: 'Teacher-wise' },
          { key: 'room',    label: 'Room-wise' }
        ].map(v => (
          <button key={v.key} onClick={() => switchView(v.key)} style={{
            padding: '8px 20px', borderRadius: '9px', border: 'none',
            cursor: 'pointer', fontSize: '13px', fontWeight: '600',
            background: view === v.key ? '#ffffff' : 'transparent',
            color: view === v.key ? '#1a1a1a' : '#888',
            boxShadow: view === v.key ? '0 1px 4px rgba(0,0,0,0.12)' : 'none',
            transition: 'all 0.15s'
          }}>
            {v.label}
          </button>
        ))}
      </div>

      {/* Filter pills */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
        {filterOptions().map(opt => (
          <button key={opt.id} onClick={() => setSelected(opt.id)} style={{
            padding: '6px 18px', borderRadius: '20px',
            border: `1.5px solid ${selected === opt.id ? '#6C63FF' : '#e0e0e0'}`,
            cursor: 'pointer', fontSize: '13px', fontWeight: '600',
            background: selected === opt.id ? '#ede9fe' : '#ffffff',
            color: selected === opt.id ? '#5b21b6' : '#666',
            transition: 'all 0.15s'
          }}>
            {opt.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      {selected && (
        <div style={{
          background: '#ffffff', borderRadius: '14px',
          border: '1px solid #e8e8e8', overflow: 'hidden',
          boxShadow: '0 2px 12px rgba(0,0,0,0.06)'
        }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
              <thead>
                <tr style={{ background: '#fafafa' }}>
                  <th style={thStyle}>Period</th>
                  {activeDays.map(day => (
                    <th key={day} style={thStyle}>{day}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {activePeriods.map((period, pi) => (
                  <tr key={period} style={{ background: pi % 2 === 0 ? '#ffffff' : '#fdfcff' }}>
                    <td style={periodStyle}>P{period}</td>
                    {activeDays.map(day => {
                      const entry = getCell(filterKey, selected, day, period)
                      const color = entry ? (subjectColors[entry.subject_id] || COLORS[0]) : null
                      return (
                        <td key={day} style={tdStyle}>
                          {entry ? (
                            <div style={{
                              background: color.bg,
                              borderLeft: `3px solid ${color.border}`,
                              borderRadius: '8px',
                              padding: '10px 12px',
                              minHeight: '68px'
                            }}>
                              <div style={{
                                fontSize: '12px', fontWeight: '700',
                                color: color.text, marginBottom: '5px',
                                lineHeight: 1.3
                              }}>
                                {subjects[entry.subject_id] || `Subject ${entry.subject_id}`}
                              </div>
                              {view !== 'teacher' && (
                                <div style={{ fontSize: '11px', color: '#555', marginBottom: '2px' }}>
                                  👤 {teachers[entry.teacher_id] || `Teacher ${entry.teacher_id}`}
                                </div>
                              )}
                              {view !== 'class' && (
                                <div style={{ fontSize: '11px', color: '#555', marginBottom: '2px' }}>
                                  🏫 {classes[entry.class_id] || `Class ${entry.class_id}`}
                                </div>
                              )}
                              {view !== 'room' && (
                                <div style={{ fontSize: '11px', color: '#777' }}>
                                  🚪 {rooms[entry.room_id] || `Room ${entry.room_id}`}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div style={{
                              minHeight: '68px', display: 'flex',
                              alignItems: 'center', justifyContent: 'center',
                              color: '#e0e0e0', fontSize: '18px'
                            }}>—</div>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Legend */}
      <div style={{
        marginTop: '20px', display: 'flex',
        gap: '10px', flexWrap: 'wrap', alignItems: 'center'
      }}>
        <span style={{ fontSize: '11px', color: '#aaa', fontWeight: '600' }}>SUBJECTS</span>
        {Object.entries(subjects).map(([id, name]) => {
          const color = subjectColors[parseInt(id)] || COLORS[0]
          return (
            <div key={id} style={{
              display: 'flex', alignItems: 'center', gap: '5px',
              background: color.bg, border: `1px solid ${color.border}`,
              borderRadius: '6px', padding: '3px 10px'
            }}>
              <div style={{
                width: '7px', height: '7px',
                borderRadius: '50%', background: color.border
              }} />
              <span style={{ fontSize: '11px', fontWeight: '600', color: color.text }}>
                {name}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

const thStyle = {
  padding: '12px 14px',
  fontSize: '11px', fontWeight: '700',
  color: '#888', textTransform: 'uppercase',
  letterSpacing: '0.06em', textAlign: 'center',
  border: '1px solid #f0f0f0', whiteSpace: 'nowrap'
}

const tdStyle = {
  padding: '6px', border: '1px solid #f5f5f5',
  verticalAlign: 'top', minWidth: '130px'
}

const periodStyle = {
  padding: '12px 14px', fontSize: '12px',
  fontWeight: '700', color: '#aaa',
  textAlign: 'center', border: '1px solid #f0f0f0',
  background: '#fafafa', whiteSpace: 'nowrap'
}