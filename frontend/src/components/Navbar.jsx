import { Link, useLocation } from 'react-router-dom'

const NAV = [
  {
    section: 'Data Entry',
    items: [
      { to: '/teachers',             label: 'Teachers',         icon: '👤' },
      { to: '/rooms',                label: 'Rooms',            icon: '🚪' },
      { to: '/classes',              label: 'Classes',          icon: '🏫' },
      { to: '/subjects',             label: 'Subjects',         icon: '📚' },
      { to: '/timeslots',            label: 'Time Slots',       icon: '🕐' },
      { to: '/teacher-subjects',     label: 'Teacher Subjects', icon: '🔗' },
      { to: '/teacher-availability', label: 'Availability',     icon: '📅' },
    ]
  },
  {
    section: 'Generate',
    items: [
      { to: '/generate',  label: 'Generate',  icon: '⚡' },
      { to: '/timetable', label: 'Timetable', icon: '📊' },
    ]
  }
]

export default function Navbar() {
  const location = useLocation()

  return (
    <div style={{
      width: '230px',
      minHeight: '100vh',
      background: '#1a1a2e',
      flexShrink: 0,
      display: 'flex',
      flexDirection: 'column',
      boxShadow: '2px 0 12px rgba(0,0,0,0.15)'
    }}>

      {/* Logo block */}
      <div style={{
        padding: '28px 20px 22px',
        borderBottom: '1px solid rgba(255,255,255,0.07)'
      }}>
        <div style={{
          fontSize: '20px',
          fontWeight: '800',
          letterSpacing: '-0.5px',
          background: 'linear-gradient(135deg, #a78bfa, #6C63FF)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          lineHeight: 1.2
        }}>
          Timetable
        </div>
        <div style={{
          fontSize: '20px',
          fontWeight: '800',
          letterSpacing: '-0.5px',
          background: 'linear-gradient(135deg, #6C63FF, #4f46e5)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          lineHeight: 1.2
        }}>
          Generator
        </div>
        <div style={{
          fontSize: '10px',
          color: 'rgba(255,255,255,0.25)',
          marginTop: '6px',
          letterSpacing: '0.12em',
          textTransform: 'uppercase'
        }}>
          CP-SAT Scheduler
        </div>
      </div>

      {/* Nav items */}
      <div style={{ padding: '14px 12px', flex: 1, overflowY: 'auto' }}>
        {NAV.map(group => (
          <div key={group.section} style={{ marginBottom: '6px' }}>
            <div style={{
              fontSize: '9px',
              fontWeight: '700',
              color: 'rgba(255,255,255,0.2)',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              padding: '10px 8px 4px'
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
                    padding: '9px 10px',
                    borderRadius: '10px',
                    textDecoration: 'none',
                    marginBottom: '2px',
                    fontSize: '13px',
                    fontWeight: active ? '600' : '400',
                    background: active
                      ? 'rgba(108,99,255,0.2)'
                      : 'transparent',
                    color: active
                      ? '#a78bfa'
                      : 'rgba(255,255,255,0.45)',
                    borderLeft: active
                      ? '3px solid #6C63FF'
                      : '3px solid transparent',
                    transition: 'all 0.15s'
                  }}
                  onMouseEnter={e => {
                    if (!active) {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
                      e.currentTarget.style.color = 'rgba(255,255,255,0.75)'
                    }
                  }}
                  onMouseLeave={e => {
                    if (!active) {
                      e.currentTarget.style.background = 'transparent'
                      e.currentTarget.style.color = 'rgba(255,255,255,0.45)'
                    }
                  }}
                >
                  <span style={{ fontSize: '15px', width: '20px', textAlign: 'center' }}>
                    {item.icon}
                  </span>
                  {item.label}
                </Link>
              )
            })}
          </div>
        ))}
      </div>

      {/* Bottom badge */}
      <div style={{
        padding: '14px 20px',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <div style={{
          width: '8px', height: '8px',
          borderRadius: '50%',
          background: '#4ade80',
          boxShadow: '0 0 6px #4ade80'
        }} />
        <span style={{
          fontSize: '11px',
          color: 'rgba(255,255,255,0.25)',
          letterSpacing: '0.04em'
        }}>
          OR-Tools · FastAPI · React
        </span>
      </div>
    </div>
  )
}