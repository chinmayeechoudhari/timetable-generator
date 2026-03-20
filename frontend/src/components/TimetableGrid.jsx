import { useState, useEffect } from 'react'
import axios from 'axios'

const BASE = 'http://localhost:8000'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8]

const SUBJECT_COLORS = [
  '#6C63FF', '#E91E8C', '#00BCD4', '#FF6B35',
  '#4CAF50', '#FF9800', '#9C27B0', '#F44336'
]

export default function TimetableGrid() {
  const [timetable, setTimetable]   = useState([])
  const [teachers, setTeachers]     = useState({})
  const [subjects, setSubjects]     = useState({})
  const [rooms, setRooms]           = useState({})
  const [classes, setClasses]       = useState({})
  const [subjectColors, setSubjectColors] = useState({})
  const [view, setView]             = useState('class')
  const [selected, setSelected]     = useState(null)
  const [allClasses, setAllClasses] = useState([])
  const [allTeachers, setAllTeachers] = useState([])
  const [allRooms, setAllRooms]     = useState([])
  const [slots, setSlots]           = useState([])
  const [loading, setLoading]       = useState(true)

  useEffect(() => {
    async function fetchAll() {
      try {
        const [ttRes, tRes, sRes, rRes, cRes, slRes] = await Promise.all([
          axios.get(`${BASE}/timetable`),
          axios.get(`${BASE}/teachers`),
          axios.get(`${BASE}/rooms`),
          axios.get(`${BASE}/classes`),
          axios.get(`${BASE}/subjects`),
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
        sRes.data.forEach((s, i) => {
          colors[s.subject_id] = SUBJECT_COLORS[i % SUBJECT_COLORS.length]
        })

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
        console.error('Failed to load timetable data', err)
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [])

  const getSlotId = (day, period) => {
    const slot = slots.find(s => s.day === day && s.period_number === period)
    return slot ? slot.slot_id : null
  }

  const getCell = (filterKey, filterVal, day, period) => {
    const slotId = getSlotId(day, period)
    if (!slotId) return null
    return timetable.find(t =>
      t[filterKey] === filterVal && t.slot_id === slotId
    ) || null
  }

  const switchView = (v) => {
    setView(v)
    if (v === 'class' && allClasses.length > 0) setSelected(allClasses[0].class_id)
    if (v === 'teacher' && allTeachers.length > 0) setSelected(allTeachers[0].teacher_id)
    if (v === 'room' && allRooms.length > 0) setSelected(allRooms[0].room_id)
  }

  const filterOptions = () => {
    if (view === 'class') return allClasses.map(c => ({ id: c.class_id, label: c.class_name }))
    if (view === 'teacher') return allTeachers.map(t => ({ id: t.teacher_id, label: t.teacher_name }))
    if (view === 'room') return allRooms.map(r => ({ id: r.room_id, label: r.room_number }))
    return []
  }

  const filterKey = view === 'class' ? 'class_id' : view === 'teacher' ? 'teacher_id' : 'room_id'

  const activeDays = DAYS.filter(day =>
    slots.some(s => s.day === day)
  )

  const activePeriods = PERIODS.filter(period =>
    slots.some(s => s.period_number === period)
  )

  if (loading) {
    return (
      <div style={{ color: '#aaa', textAlign: 'center', marginTop: '60px', fontSize: '15px' }}>
        Loading timetable...
      </div>
    )
  }

  if (timetable.length === 0) {
    return (
      <div style={{ color: '#aaa', textAlign: 'center', marginTop: '60px', fontSize: '15px' }}>
        No timetable generated yet. Go to Generate page first.
      </div>
    )
  }

  return (
    <div style={{ padding: '8px 0' }}>

      {/* View tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        {['class', 'teacher', 'room'].map(v => (
          <button
            key={v}
            onClick={() => switchView(v)}
            style={{
              padding: '7px 20px',
              borderRadius: '20px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: view === v ? '600' : '400',
              background: view === v ? '#6C63FF' : '#2a2a2a',
              color: view === v ? '#fff' : '#aaa',
              transition: 'all 0.2s'
            }}
          >
            {v === 'class' ? 'Class-wise' : v === 'teacher' ? 'Teacher-wise' : 'Room-wise'}
          </button>
        ))}
      </div>

      {/* Filter selector */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {filterOptions().map(opt => (
          <button
            key={opt.id}
            onClick={() => setSelected(opt.id)}
            style={{
              padding: '6px 16px',
              borderRadius: '8px',
              border: `1px solid ${selected === opt.id ? '#6C63FF' : '#333'}`,
              cursor: 'pointer',
              fontSize: '12px',
              background: selected === opt.id ? '#1a1560' : '#1e1e1e',
              color: selected === opt.id ? '#a09aff' : '#888',
              transition: 'all 0.2s'
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Timetable grid */}
      {selected && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
            <thead>
              <tr>
                <th style={thStyle}>Period</th>
                {activeDays.map(day => (
                  <th key={day} style={thStyle}>{day}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {activePeriods.map(period => (
                <tr key={period}>
                  <td style={periodStyle}>P{period}</td>
                  {activeDays.map(day => {
                    const entry = getCell(filterKey, selected, day, period)
                    return (
                      <td key={day} style={tdStyle}>
                        {entry ? (
                          <div style={{
                            background: subjectColors[entry.subject_id] + '22',
                            borderLeft: `3px solid ${subjectColors[entry.subject_id]}`,
                            borderRadius: '6px',
                            padding: '8px 10px',
                            minHeight: '64px'
                          }}>
                            <div style={{
                              fontSize: '12px',
                              fontWeight: '600',
                              color: subjectColors[entry.subject_id],
                              marginBottom: '4px'
                            }}>
                              {subjects[entry.subject_id] || `Subject ${entry.subject_id}`}
                            </div>
                            {view !== 'teacher' && (
                              <div style={{ fontSize: '11px', color: '#aaa' }}>
                                {teachers[entry.teacher_id] || `Teacher ${entry.teacher_id}`}
                              </div>
                            )}
                            {view !== 'class' && (
                              <div style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>
                                {classes[entry.class_id] || `Class ${entry.class_id}`}
                              </div>
                            )}
                            {view !== 'room' && (
                              <div style={{ fontSize: '11px', color: '#666', marginTop: '2px' }}>
                                {rooms[entry.room_id] || `Room ${entry.room_id}`}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div style={{ color: '#333', fontSize: '18px', textAlign: 'center' }}>—</div>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Legend */}
      <div style={{ marginTop: '24px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        {Object.entries(subjects).map(([id, name]) => (
          <div key={id} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{
              width: '10px', height: '10px', borderRadius: '2px',
              background: subjectColors[parseInt(id)]
            }} />
            <span style={{ fontSize: '11px', color: '#888' }}>{name}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

const thStyle = {
  padding: '10px 12px',
  background: '#1a1a1a',
  color: '#666',
  fontSize: '11px',
  fontWeight: '600',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  textAlign: 'center',
  border: '1px solid #222',
}

const tdStyle = {
  padding: '6px',
  border: '1px solid #1e1e1e',
  verticalAlign: 'top',
  minWidth: '120px',
  background: '#141414',
}

const periodStyle = {
  padding: '10px 12px',
  background: '#1a1a1a',
  color: '#555',
  fontSize: '12px',
  fontWeight: '600',
  textAlign: 'center',
  border: '1px solid #222',
  whiteSpace: 'nowrap',
}