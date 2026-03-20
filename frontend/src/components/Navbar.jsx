import { Link, useLocation } from 'react-router-dom'

export default function Navbar() {
  const location = useLocation()

  const link = (to, label) => (
    <Link
      to={to}
      style={{
        display: 'block',
        padding: '6px 10px',
        borderRadius: '6px',
        fontSize: '13px',
        textDecoration: 'none',
        marginBottom: '2px',
        background: location.pathname === to ? '#E6F1FB' : 'transparent',
        color: location.pathname === to ? '#0C447C' : '#555',
        fontWeight: location.pathname === to ? '500' : '400',
      }}
    >
      {label}
    </Link>
  )

  return (
    <div style={{
      width: '200px',
      minHeight: '100vh',
      background: '#f9f9f9',
      borderRight: '1px solid #e5e5e5',
      padding: '20px 12px',
      flexShrink: 0
    }}>
      <div style={{ marginBottom: '24px' }}>
        <div style={{ fontSize: '14px', fontWeight: '600', color: '#1a1a1a' }}>Timetable Gen</div>
        <div style={{ fontSize: '11px', color: '#999', marginTop: '2px' }}>College Scheduler</div>
      </div>

      <div style={{ fontSize: '10px', color: '#aaa', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.05em' }}>Data Entry</div>
      {link('/teachers', 'Teachers')}
      {link('/rooms', 'Rooms')}
      {link('/classes', 'Classes')}
      {link('/subjects', 'Subjects')}
      {link('/timeslots', 'Time Slots')}
      {link('/teacher-subjects', 'Teacher Subjects')}
      {link('/teacher-availability', 'Availability')}

      <div style={{ fontSize: '10px', color: '#aaa', textTransform: 'uppercase', margin: '16px 0 6px', letterSpacing: '0.05em' }}>Generate</div>
      {link('/generate', 'Generate')}
      {link('/timetable', 'Timetable')}
    </div>
  )
}