import { Link, useLocation } from 'react-router-dom'

const NAV = [
  {
    section: 'Data Entry',
    items: [
      { to: '/teachers',            label: 'Teachers',         icon: '👤' },
      { to: '/rooms',               label: 'Rooms',            icon: '🚪' },
      { to: '/classes',             label: 'Classes',          icon: '🏫' },
      { to: '/subjects',            label: 'Subjects',         icon: '📚' },
      { to: '/timeslots',           label: 'Time Slots',       icon: '🕐' },
      { to: '/teacher-subjects',    label: 'Teacher Subjects', icon: '🔗' },
      { to: '/teacher-availability',label: 'Availability',     icon: '📅' },
    ]
  },
  {
    section: 'Generate',
    items: [
      { to: '/generate',  label: 'Generate', icon: '⚡' },
      { to: '/timetable', label: 'Timetable', icon: '📊' },
    ]
  }
]

export default function Navbar() {
  const location = useLocation()

  return (
    <div style={{
      width: '220px',
      minHeight: '100vh',
      background: '#0f0f0f',
      borderRight: '1px solid #1e1e1e',
      padding: '0',
      flexShrink: 0,
      display: 'flex',
      flexDirection: 'column'
    }}>

      {/* Logo */}
      <div style={{
        padding: '24px 20px 20px',
        borderBottom: '1px solid #1e1e1e'
      }}>
        <div style={{
          fontSize: '15px', fontWeight: '700',
          color: '#e0e0e0', letterSpacing: '-0.3px'
        }}>
          Timetable Gen
        </div>
        <div style={{
          fontSize: '11px', color: '#444',
          marginTop: '3px'
        }}>
          College Scheduler
        </div>
      </div>

      {/* Nav sections */}
      <div style={{ padding: '12px 10px', flex: 1 }}>
        {NAV.map(group => (
          <div key={group.section} style={{ marginBottom: '8px' }}>
            <div style={{
              fontSize: '10px', fontWeight: '600',
              color: '#3a3a3a', textTransform: 'uppercase',
              letterSpacing: '0.08em', padding: '8px 10px 4px'
            }}>
              {group.section}
            </div>
            {group.items.map(item => {
              const active = location.pathname === item.to
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    marginBottom: '2px',
                    fontSize: '13px',
                    fontWeight: active ? '600' : '400',
                    background: active ? '#1a1560' : 'transparent',
                    color: active ? '#a09aff' : '#555',
                    transition: 'all 0.15s',
                    borderLeft: active ? '2px solid #6C63FF' : '2px solid transparent'
                  }}
                  onMouseEnter={e => {
                    if (!active) {
                      e.currentTarget.style.background = '#161616'
                      e.currentTarget.style.color = '#888'
                    }
                  }}
                  onMouseLeave={e => {
                    if (!active) {
                      e.currentTarget.style.background = 'transparent'
                      e.currentTarget.style.color = '#555'
                    }
                  }}
                >
                  <span style={{ fontSize: '14px' }}>{item.icon}</span>
                  {item.label}
                </Link>
              )
            })}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{
        padding: '16px 20px',
        borderTop: '1px solid #1e1e1e',
        fontSize: '11px',
        color: '#2a2a2a'
      }}>
        CP-SAT Solver · OR-Tools
      </div>
    </div>
  )
}