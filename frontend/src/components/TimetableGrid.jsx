import { useState, useEffect, useRef } from 'react'
import axios from 'axios'

const BASE = 'http://localhost:8000'
const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
const PERIODS = [1,2,3,4,5,6,7,8]

const COLORS = [
  { bg: '#EFF6FF', border: '#2563EB', text: '#1D4ED8' },
  { bg: '#F0FDF4', border: '#16A34A', text: '#15803D' },
  { bg: '#FEF3C7', border: '#D97706', text: '#B45309' },
  { bg: '#FDF4FF', border: '#9333EA', text: '#7E22CE' },
  { bg: '#FFF1F2', border: '#E11D48', text: '#BE123C' },
  { bg: '#F0FDFA', border: '#0D9488', text: '#0F766E' },
  { bg: '#FFF7ED', border: '#EA580C', text: '#C2410C' },
  { bg: '#EEF2FF', border: '#4F46E5', text: '#4338CA' },
]

export default function TimetableGrid() {
  const [timetable, setTimetable]         = useState([])
  const [teachers, setTeachers]           = useState({})
  const [subjects, setSubjects]           = useState({})
  const [rooms, setRooms]                 = useState({})
  const [classes, setClasses]             = useState({})
  const [subjectColors, setSubjectColors] = useState({})
  const [allClasses, setAllClasses]       = useState([])
  const [allTeachers, setAllTeachers]     = useState([])
  const [allRooms, setAllRooms]           = useState([])
  const [slots, setSlots]                 = useState([])
  const [view, setView]                   = useState('class')
  const [selected, setSelected]           = useState(null)
  const [loading, setLoading]             = useState(true)

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
      const teacherMap = {}; tRes.data.forEach(t => { teacherMap[t.teacher_id] = t.teacher_name })
      const subjectMap = {}; sRes.data.forEach(s => { subjectMap[s.subject_id] = s.subject_name })
      const roomMap    = {}; rRes.data.forEach(r => { roomMap[r.room_id] = r.room_number })
      const classMap   = {}; cRes.data.forEach(c => { classMap[c.class_id] = c.class_name })
      const colors     = {}; sRes.data.forEach((s, i) => { colors[s.subject_id] = COLORS[i % COLORS.length] })

      setTimetable(ttRes.data); setTeachers(teacherMap); setSubjects(subjectMap)
      setRooms(roomMap); setClasses(classMap); setSubjectColors(colors)
      setAllClasses(cRes.data); setAllTeachers(tRes.data); setAllRooms(rRes.data)
      setSlots(slRes.data)
      if (cRes.data.length > 0) setSelected(cRes.data[0].class_id)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const getSlotId = (day, period) => {
    const s = slots.find(s => s.day === day && s.period_number === period)
    return s ? s.slot_id : null
  }

  const getCell = (fKey, fVal, day, period) => {
    const slotId = getSlotId(day, period)
    if (!slotId) return null
    return timetable.find(t => t[fKey] === fVal && t.slot_id === slotId) || null
  }

  const switchView = (v) => {
    setView(v)
    if (v === 'class'   && allClasses.length > 0)  setSelected(allClasses[0].class_id)
    if (v === 'teacher' && allTeachers.length > 0) setSelected(allTeachers[0].teacher_id)
    if (v === 'room'    && allRooms.length > 0)    setSelected(allRooms[0].room_id)
  }

  const filterOptions = () => {
    if (view === 'class')   return allClasses.map(c  => ({ id: c.class_id,   label: c.class_name }))
    if (view === 'teacher') return allTeachers.map(t => ({ id: t.teacher_id, label: t.teacher_name }))
    if (view === 'room')    return allRooms.map(r    => ({ id: r.room_id,    label: r.room_number }))
    return []
  }

  const getSelectedLabel = () => {
    if (view === 'class')   return classes[selected]  || ''
    if (view === 'teacher') return teachers[selected] || ''
    if (view === 'room')    return rooms[selected]    || ''
    return ''
  }

  const filterKey     = view === 'class' ? 'class_id' : view === 'teacher' ? 'teacher_id' : 'room_id'
  const activeDays    = DAYS.filter(day => slots.some(s => s.day === day))
  const activePeriods = PERIODS.filter(p => slots.some(s => s.period_number === p))

  function handleExport() {
    const styleId = 'print-style'
    let style = document.getElementById(styleId)
    if (!style) { style = document.createElement('style'); style.id = styleId; document.head.appendChild(style) }
    style.innerHTML = `@media print {
      body * { visibility: hidden; }
      #print-area, #print-area * { visibility: visible; }
      #print-area { position: absolute; left: 0; top: 0; width: 100%; padding: 24px; }
      .no-print { display: none !important; }
      table { border-collapse: collapse; width: 100%; }
      th, td { border: 1px solid #ccc; padding: 6px 8px; font-size: 10px; }
      th { background: #f5f5f5; font-weight: 700; }
    }`
    window.print()
  }

  function handleExportAll() {
    const styleId = 'print-style-all'
    let style = document.getElementById(styleId)
    if (!style) { style = document.createElement('style'); style.id = styleId; document.head.appendChild(style) }
    style.innerHTML = `@media print {
      body * { visibility: hidden; }
      #print-all-area, #print-all-area * { visibility: visible; }
      #print-all-area { position: absolute; left: 0; top: 0; width: 100%; padding: 24px; }
      .no-print { display: none !important; }
      .print-section { page-break-after: always; padding: 16px 0; }
      .print-section:last-child { page-break-after: avoid; }
      table { border-collapse: collapse; width: 100%; margin-top: 8px; }
      th, td { border: 1px solid #ddd; padding: 5px 7px; font-size: 10px; }
      th { background: #f5f5f5; font-weight: 700; text-align: center; }
      .print-title { font-size: 14px; font-weight: 700; margin-bottom: 4px; }
      .print-sub { font-size: 11px; color: #666; margin-bottom: 8px; }
    }`
    window.print()
  }

  const renderGrid = (fKey, fVal, showTeacher, showClass, showRoom) => (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      
      {/* HEADER → PERIODS AS COLUMNS */}
      <thead>
        <tr style={{ background: '#F8FAFC' }}>
          <th style={thStyle}>Day</th>
          {activePeriods.map(period => (
            <th key={period} style={thStyle}>P{period}</th>
          ))}
        </tr>
      </thead>
  
      {/* BODY → DAYS AS ROWS */}
      <tbody>
        {activeDays.map((day, di) => (
          <tr key={day} style={{ background: di % 2 === 0 ? '#FFFFFF' : '#FAFAFA' }}>
  
            {/* DAY LABEL */}
            <td style={periodStyle}>{day}</td>
  
            {/* PERIOD CELLS */}
            {activePeriods.map(period => {
              const entry = getCell(fKey, fVal, day, period)
              const color = entry
                ? (subjectColors[entry.subject_id] || COLORS[0])
                : null
  
              return (
                <td key={period} style={tdStyle}>
                  {entry ? (
                    <div style={{
                      background: color.bg,
                      borderLeft: `3px solid ${color.border}`,
                      borderRadius: '5px',
                      padding: '6px 8px',
                      minHeight: '52px'
                    }}>
                      <div style={{
                        fontSize: '11px',
                        fontWeight: '700',
                        color: color.text,
                        marginBottom: '3px'
                      }}>
                        {subjects[entry.subject_id] || `S${entry.subject_id}`}
                      </div>
  
                      {showTeacher && (
                        <div style={{ fontSize: '10px', color: '#475569' }}>
                          👤 {teachers[entry.teacher_id] || `T${entry.teacher_id}`}
                        </div>
                      )}
  
                      {showClass && (
                        <div style={{ fontSize: '10px', color: '#475569' }}>
                          🏫 {classes[entry.class_id] || `C${entry.class_id}`}
                        </div>
                      )}
  
                      {showRoom && (
                        <div style={{ fontSize: '10px', color: '#64748B' }}>
                          🚪 {rooms[entry.room_id] || `R${entry.room_id}`}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{
                      minHeight: '52px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#CBD5E1',
                      fontSize: '16px'
                    }}>
                      —
                    </div>
                  )}
                </td>
              )
            })}
          </tr>
        ))}
      </tbody>
    </table>
  )

  if (loading) return (
    <div style={{ padding: '48px', textAlign: 'center', color: '#64748B', background: '#F0F4F8', minHeight: '100vh' }}>
      Loading timetable...
    </div>
  )

  if (timetable.length === 0) return (
    <div style={{ padding: '48px', textAlign: 'center', background: '#F0F4F8', minHeight: '100vh' }}>
      <div style={{ fontSize: '15px', fontWeight: '600', color: '#1B2A3B', marginBottom: '6px' }}>
        No timetable generated yet
      </div>
      <div style={{ fontSize: '13px', color: '#64748B' }}>
        Go to the Generate page and run the solver first
      </div>
    </div>
  )

  return (
    <div style={{ padding: '28px 32px', background: '#F0F4F8', minHeight: '100vh' }}>

      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap', gap: '12px', marginBottom: '20px'
      }}>
        <div>
          <div style={{ fontSize: '18px', fontWeight: '700', color: '#1B2A3B' }}>
            Timetable
          </div>
          <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
            {timetable.length} slots assigned
          </div>
        </div>

        <div className="no-print" style={{ display: 'flex', gap: '8px' }}>
          <button onClick={handleExport} style={{
            padding: '8px 14px', borderRadius: '7px',
            border: '1.5px solid #2563EB', background: '#EFF6FF',
            color: '#1D4ED8', fontSize: '12px', fontWeight: '600', cursor: 'pointer'
          }}>
            Export current view
          </button>
          <button onClick={handleExportAll} style={{
            padding: '8px 14px', borderRadius: '7px',
            border: '1.5px solid #16A34A', background: '#F0FDF4',
            color: '#15803D', fontSize: '12px', fontWeight: '600', cursor: 'pointer'
          }}>
            Export all views
          </button>
        </div>
      </div>

      {/* View tabs */}
      <div className="no-print" style={{
        display: 'inline-flex', gap: '3px',
        background: '#E2E8F0', borderRadius: '8px',
        padding: '3px', marginBottom: '14px'
      }}>
        {[
          { key: 'class',   label: 'Class-wise' },
          { key: 'teacher', label: 'Teacher-wise' },
          { key: 'room',    label: 'Room-wise' }
        ].map(v => (
          <button key={v.key} onClick={() => switchView(v.key)} style={{
            padding: '7px 16px', borderRadius: '6px', border: 'none',
            cursor: 'pointer', fontSize: '12px', fontWeight: '600',
            background: view === v.key ? '#FFFFFF' : 'transparent',
            color: view === v.key ? '#1B2A3B' : '#64748B',
            boxShadow: view === v.key ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            transition: 'all 0.12s'
          }}>{v.label}</button>
        ))}
      </div>

      {/* Filter pills */}
      <div className="no-print" style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '16px' }}>
        {filterOptions().map(opt => (
          <button key={opt.id} onClick={() => setSelected(opt.id)} style={{
            padding: '5px 14px', borderRadius: '20px',
            border: `1.5px solid ${selected === opt.id ? '#2563EB' : '#CBD5E1'}`,
            cursor: 'pointer', fontSize: '12px', fontWeight: '600',
            background: selected === opt.id ? '#EFF6FF' : '#FFFFFF',
            color: selected === opt.id ? '#1D4ED8' : '#64748B',
            transition: 'all 0.12s'
          }}>{opt.label}</button>
        ))}
      </div>

      {/* Grid */}
      {selected && (
        <div id="print-area">
          <div style={{ display: 'none' }} className="print-title">
            {view === 'class' ? 'Class' : view === 'teacher' ? 'Teacher' : 'Room'}: {getSelectedLabel()}
          </div>
          <div style={{
            background: '#FFFFFF', borderRadius: '10px',
            border: '1px solid #E2E8F0', overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
          }}>
            <div style={{ overflowX: 'auto' }}>
              {renderGrid(filterKey, selected, view !== 'teacher', view !== 'class', view !== 'room')}
            </div>
          </div>
        </div>
      )}

      {/* Hidden print all */}
      <div id="print-all-area" style={{ display: 'none' }}>
        {allClasses.map(c => (
          <div key={c.class_id} className="print-section">
            <div className="print-title">Class: {c.class_name}</div>
            <div className="print-sub">Class-wise timetable</div>
            {renderGrid('class_id', c.class_id, true, false, true)}
          </div>
        ))}
        {allTeachers.map(t => (
          <div key={t.teacher_id} className="print-section">
            <div className="print-title">Teacher: {t.teacher_name}</div>
            <div className="print-sub">Teacher-wise timetable</div>
            {renderGrid('teacher_id', t.teacher_id, false, true, true)}
          </div>
        ))}
        {allRooms.map(r => (
          <div key={r.room_id} className="print-section">
            <div className="print-title">Room: {r.room_number}</div>
            <div className="print-sub">Room-wise timetable</div>
            {renderGrid('room_id', r.room_id, true, true, false)}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="no-print" style={{
        marginTop: '16px', display: 'flex',
        gap: '8px', flexWrap: 'wrap', alignItems: 'center'
      }}>
        <span style={{
          fontSize: '10px', color: '#94A3B8',
          fontWeight: '700', textTransform: 'uppercase',
          letterSpacing: '0.06em'
        }}>
          Subjects
        </span>
        {Object.entries(subjects).map(([id, name]) => {
          const color = subjectColors[parseInt(id)] || COLORS[0]
          return (
            <div key={id} style={{
              display: 'flex', alignItems: 'center', gap: '5px',
              background: color.bg,
              border: `1px solid ${color.border}`,
              borderRadius: '20px', padding: '3px 10px'
            }}>
              <div style={{
                width: '6px', height: '6px',
                borderRadius: '50%', background: color.border
              }} />
              <span style={{
                fontSize: '11px', fontWeight: '600', color: color.text
              }}>{name}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

const thStyle = {
  padding: '10px 12px', fontSize: '10px', fontWeight: '700',
  color: '#64748B', textTransform: 'uppercase',
  letterSpacing: '0.06em', textAlign: 'center',
  border: '1px solid #F1F5F9', whiteSpace: 'nowrap',
  background: '#F8FAFC'
}

const tdStyle = {
  padding: '4px', border: '1px solid #F1F5F9',
  verticalAlign: 'top', minWidth: '110px'
}

const periodStyle = {
  padding: '10px 12px', fontSize: '11px', fontWeight: '700',
  color: '#94A3B8', textAlign: 'center',
  border: '1px solid #F1F5F9', background: '#F8FAFC',
  whiteSpace: 'nowrap'
}