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
    section: 'Schedule',
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
      width: '210px',
      minWidth: '210px',
      height: '100vh',
      background: '#1B2A3B',
      display: 'flex',
      flexDirection: 'column',
      borderRight: 'none',
      flexShrink: 0
    }}>
      {/* Logo */}
      <div style={{
        padding: '20px 16px 16px',
        borderBottom: '1px solid rgba(255,255,255,0.07)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '36px', height: '36px',
            borderRadius: '8px',
            background: '#2563EB',
            display: 'flex', alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px', flexShrink: 0
          }}>🗓️</div>
          <div>
            <div style={{
              fontSize: '14px', fontWeight: '700',
              color: '#FFFFFF', lineHeight: 1.2,
              letterSpacing: '-0.2px'
            }}>TimetablePro</div>
            <div style={{
              fontSize: '10px', color: 'rgba(255,255,255,0.4)',
              marginTop: '1px'
            }}>CP-SAT Scheduler</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <div style={{ padding: '8px', flex: 1, overflowY: 'auto' }}>
        {NAV.map(group => (
          <div key={group.section} style={{ marginBottom: '4px' }}>
            <div style={{
              fontSize: '9px', fontWeight: '700',
              color: 'rgba(255,255,255,0.25)',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              padding: '10px 8px 4px'
            }}>
              {group.section}
            </div>
            {group.items.map(item => {
              const active = location.pathname === item.to
              return (
                <Link key={item.to} to={item.to} style={{
                  display: 'flex', alignItems: 'center',
                  gap: '8px', padding: '7px 10px',
                  borderRadius: '6px', textDecoration: 'none',
                  marginBottom: '1px', fontSize: '12px',
                  fontWeight: active ? '600' : '400',
                  background: active ? '#2563EB' : 'transparent',
                  color: active ? '#FFFFFF' : 'rgba(255,255,255,0.5)',
                  transition: 'all 0.12s'
                }}
                  onMouseEnter={e => {
                    if (!active) {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.06)'
                      e.currentTarget.style.color = 'rgba(255,255,255,0.85)'
                    }
                  }}
                  onMouseLeave={e => {
                    if (!active) {
                      e.currentTarget.style.background = 'transparent'
                      e.currentTarget.style.color = 'rgba(255,255,255,0.5)'
                    }
                  }}>
                  <span style={{ fontSize: '13px', width: '18px', textAlign: 'center' }}>
                    {item.icon}
                  </span>
                  {item.label}
                </Link>
              )
            })}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{
        padding: '12px 16px',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', alignItems: 'center', gap: '6px'
      }}>
        <div style={{
          width: '6px', height: '6px', borderRadius: '50%',
          background: '#22c55e'
        }} />
        <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.25)' }}>
          System ready
        </span>
      </div>
    </div>
  )
}