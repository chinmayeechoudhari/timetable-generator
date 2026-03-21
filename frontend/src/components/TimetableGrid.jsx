import { useState, useEffect, useRef } from 'react'
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
  const [timetable, setTimetable]       = useState([])
  const [teachers, setTeachers]         = useState({})
  const [subjects, setSubjects]         = useState({})
  const [rooms, setRooms]               = useState({})
  const [classes, setClasses]           = useState({})
  const [subjectColors, setSubjectColors] = useState({})
  const [allClasses, setAllClasses]     = useState([])
  const [allTeachers, setAllTeachers]   = useState([])
  const [allRooms, setAllRooms]         = useState([])
  const [slots, setSlots]               = useState([])
  const [view, setView]                 = useState('class')
  const [selected, setSelected]         = useState(null)
  const [loading, setLoading]           = useState(true)
  const printRef = useRef()

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
    const label = getSelectedLabel()
    const viewLabel = view === 'class' ? 'Class' : view === 'teacher' ? 'Teacher' : 'Room'

    // inject print styles
    const styleId = 'print-style'
    let style = document.getElementById(styleId)
    if (!style) {
      style = document.createElement('style')
      style.id = styleId
      document.head.appendChild(style)
    }
    style.innerHTML = `
      @media print {
        body * { visibility: hidden; }
        #print-area, #print-area * { visibility: visible; }
        #print-area {
          position: absolute; left: 0; top: 0;
          width: 100%; padding: 24px;
        }
        .no-print { display: none !important; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ccc; padding: 6px 8px; font-size: 11px; }
        th { background: #f5f5f5; font-weight: 700; }
        .cell-entry {
          padding: 6px 8px;
          border-radius: 4px;
          font-size: 10px;
        }
      }
    `
    window.print()
  }

  function handleExportAll() {
    const styleId = 'print-style-all'
    let style = document.getElementById(styleId)
    if (!style) {
      style = document.createElement('style')
      style.id = styleId
      document.head.appendChild(style)
    }
    style.innerHTML = `
      @media print {
        body * { visibility: hidden; }
        #print-all-area, #print-all-area * { visibility: visible; }
        #print-all-area {
          position: absolute; left: 0; top: 0;
          width: 100%; padding: 24px;
        }
        .no-print { display: none !important; }
        .print-section { page-break-after: always; padding: 16px 0; }
        .print-section:last-child { page-break-after: avoid; }
        table { border-collapse: collapse; width: 100%; margin-top: 8px; }
        th, td { border: 1px solid #ddd; padding: 5px 7px; font-size: 10px; }
        th { background: #f5f5f5; font-weight: 700; text-align: center; }
        .print-title { font-size: 14px; font-weight: 700; color: #1a1a1a; margin-bottom: 4px; }
        .print-sub { font-size: 11px; color: #666; margin-bottom: 8px; }
      }
    `
    window.print()
  }

  const renderGrid = (fKey, fVal, showTeacher, showClass, showRoom) => (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
      <thead>
        <tr style={{ background: '#fafafa' }}>
          <th style={thStyle}>Period</th>
          {activeDays.map(day => <th key={day} style={thStyle}>{day}</th>)}
        </tr>
      </thead>
      <tbody>
        {activePeriods.map((period, pi) => (
          <tr key={period} style={{ background: pi % 2 === 0 ? '#fff' : '#fdfcff' }}>
            <td style={periodStyle}>P{period}</td>
            {activeDays.map(day => {
              const entry = getCell(fKey, fVal, day, period)
              const color = entry ? (subjectColors[entry.subject_id] || COLORS[0]) : null
              return (
                <td key={day} style={tdStyle}>
                  {entry ? (
                    <div className="cell-entry" style={{
                      background: color.bg,
                      borderLeft: `3px solid ${color.border}`,
                      borderRadius: '6px',
                      padding: '7px 9px',
                      minHeight: '56px'
                    }}>
                      <div style={{ fontSize: '11px', fontWeight: '700', color: color.text, marginBottom: '3px' }}>
                        {subjects[entry.subject_id] || `S${entry.subject_id}`}
                      </div>
                      {showTeacher && (
                        <div style={{ fontSize: '10px', color: '#555' }}>
                          👤 {teachers[entry.teacher_id] || `T${entry.teacher_id}`}
                        </div>
                      )}
                      {showClass && (
                        <div style={{ fontSize: '10px', color: '#555' }}>
                          🏫 {classes[entry.class_id] || `C${entry.class_id}`}
                        </div>
                      )}
                      {showRoom && (
                        <div style={{ fontSize: '10px', color: '#777' }}>
                          🚪 {rooms[entry.room_id] || `R${entry.room_id}`}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{ minHeight: '56px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#e0e0e0' }}>—</div>
                  )}
                </td>
              )
            })}
          </tr>
        ))}
      </tbody>
    </table>
  )

  if (loading) return <div style={{ padding: '48px', color: '#999' }}>Loading timetable...</div>

  if (timetable.length === 0) return (
    <div style={{ padding: '48px', textAlign: 'center', color: '#999' }}>
      No timetable generated yet. Go to Generate page first.
    </div>
  )

  return (
    <div style={{ padding: '28px 32px', background: '#F0F4F8', minHeight: '100vh' }}>

      {/* Header */}
      <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#1a1a1a', margin: 0 }}>Timetable</h1>
          <p style={{ fontSize: '13px', color: '#888', margin: '4px 0 0' }}>{timetable.length} slots assigned</p>
        </div>

        {/* Export buttons */}
        <div className="no-print" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button onClick={handleExport} style={exportBtnStyle('#6C63FF', '#ede9fe', '#5b21b6')}>
            Export current view
          </button>
          <button onClick={handleExportAll} style={exportBtnStyle('#16a34a', '#dcfce7', '#15803d')}>
            Export all views
          </button>
        </div>
      </div>

      {/* View tabs */}
      <div className="no-print" style={{
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
            background: view === v.key ? '#fff' : 'transparent',
            color: view === v.key ? '#1a1a1a' : '#888',
            boxShadow: view === v.key ? '0 1px 4px rgba(0,0,0,0.12)' : 'none',
            transition: 'all 0.15s'
          }}>{v.label}</button>
        ))}
      </div>

      {/* Filter pills */}
      <div className="no-print" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
        {filterOptions().map(opt => (
          <button key={opt.id} onClick={() => setSelected(opt.id)} style={{
            padding: '6px 18px', borderRadius: '20px',
            border: `1.5px solid ${selected === opt.id ? '#6C63FF' : '#e0e0e0'}`,
            cursor: 'pointer', fontSize: '13px', fontWeight: '600',
            background: selected === opt.id ? '#ede9fe' : '#fff',
            color: selected === opt.id ? '#5b21b6' : '#666',
            transition: 'all 0.15s'
          }}>{opt.label}</button>
        ))}
      </div>

      {/* Current view grid — shown on screen and in "Export current view" */}
      {selected && (
        <div id="print-area">
          {/* Print header — only shows when printing */}
          <div style={{ display: 'none' }} className="print-title">
            Timetable — {view === 'class' ? 'Class' : view === 'teacher' ? 'Teacher' : 'Room'}: {getSelectedLabel()}
          </div>

          <div style={{
            background: '#fff', borderRadius: '14px',
            border: '1px solid #e8e8e8', overflow: 'hidden',
            boxShadow: '0 2px 12px rgba(0,0,0,0.06)'
          }}>
            <div style={{ overflowX: 'auto' }}>
              {renderGrid(
                filterKey, selected,
                view !== 'teacher',
                view !== 'class',
                view !== 'room'
              )}
            </div>
          </div>
        </div>
      )}

      {/* Hidden area for "Export all views" — prints all classes, all teachers, all rooms */}
      <div id="print-all-area" style={{ display: 'none' }}>

        {/* All classes */}
        {allClasses.map(c => (
          <div key={c.class_id} className="print-section">
            <div className="print-title">Class: {c.class_name}</div>
            <div className="print-sub">Class-wise timetable</div>
            {renderGrid('class_id', c.class_id, true, false, true)}
          </div>
        ))}

        {/* All teachers */}
        {allTeachers.map(t => (
          <div key={t.teacher_id} className="print-section">
            <div className="print-title">Teacher: {t.teacher_name}</div>
            <div className="print-sub">Teacher-wise timetable</div>
            {renderGrid('teacher_id', t.teacher_id, false, true, true)}
          </div>
        ))}

        {/* All rooms */}
        {allRooms.map(r => (
          <div key={r.room_id} className="print-section">
            <div className="print-title">Room: {r.room_number}</div>
            <div className="print-sub">Room-wise timetable</div>
            {renderGrid('room_id', r.room_id, true, true, false)}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div style={{ marginTop: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }} className="no-print">
        <span style={{ fontSize: '11px', color: '#aaa', fontWeight: '600' }}>SUBJECTS</span>
        {Object.entries(subjects).map(([id, name]) => {
          const color = subjectColors[parseInt(id)] || COLORS[0]
          return (
            <div key={id} style={{
              display: 'flex', alignItems: 'center', gap: '5px',
              background: color.bg, border: `1px solid ${color.border}`,
              borderRadius: '6px', padding: '3px 10px'
            }}>
              <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: color.border }} />
              <span style={{ fontSize: '11px', fontWeight: '600', color: color.text }}>{name}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

const exportBtnStyle = (border, bg, color) => ({
  padding: '8px 16px', borderRadius: '8px',
  border: `1.5px solid ${border}`,
  background: bg, color: color,
  fontSize: '12px', fontWeight: '700',
  cursor: 'pointer'
})

const thStyle = {
  padding: '11px 12px', fontSize: '11px', fontWeight: '700',
  color: '#888', textTransform: 'uppercase',
  letterSpacing: '0.05em', textAlign: 'center',
  border: '1px solid #f0f0f0', whiteSpace: 'nowrap'
}

const tdStyle = {
  padding: '5px', border: '1px solid #f5f5f5',
  verticalAlign: 'top', minWidth: '120px'
}

const periodStyle = {
  padding: '11px 12px', fontSize: '12px', fontWeight: '700',
  color: '#aaa', textAlign: 'center',
  border: '1px solid #f0f0f0', background: '#fafafa',
  whiteSpace: 'nowrap'
}