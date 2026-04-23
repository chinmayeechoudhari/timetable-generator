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
    <div
      style={{
        width: '250px',
        minWidth: '250px',
        height: '100vh',
        background: 'linear-gradient(180deg, #162334 0%, #1B2A3B 45%, #152233 100%)',
        display: 'flex',
        flexDirection: 'column',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        flexShrink: 0,
        boxShadow: '8px 0 24px rgba(15, 23, 42, 0.08)'
      }}
    >
      <div
        style={{
          padding: '20px 18px 18px',
          borderBottom: '1px solid rgba(255,255,255,0.08)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #3B82F6, #2563EB)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '22px',
              flexShrink: 0,
              boxShadow: '0 10px 20px rgba(37, 99, 235, 0.28)'
            }}
          >
            🗓️
          </div>

          <div>
            <div
              style={{
                fontSize: '15px',
                fontWeight: '800',
                color: '#FFFFFF',
                lineHeight: 1.2,
                letterSpacing: '-0.2px'
              }}
            >
              TimetablePro
            </div>
            <div
              style={{
                fontSize: '11px',
                color: 'rgba(255,255,255,0.5)',
                marginTop: '2px'
              }}
            >
              CP-SAT Scheduler
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          padding: '12px 10px',
          flex: 1,
          overflowY: 'auto'
        }}
      >
        {NAV.map(group => (
          <div key={group.section} style={{ marginBottom: '14px' }}>
            <div
              style={{
                fontSize: '10px',
                fontWeight: '800',
                color: 'rgba(255,255,255,0.28)',
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                padding: '10px 10px 6px'
              }}
            >
              {group.section}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
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
                      padding: '11px 12px',
                      borderRadius: '12px',
                      textDecoration: 'none',
                      fontSize: '13px',
                      fontWeight: active ? '700' : '500',
                      background: active
                        ? 'linear-gradient(135deg, #2563EB, #1D4ED8)'
                        : 'transparent',
                      color: active ? '#FFFFFF' : 'rgba(255,255,255,0.68)',
                      border: active
                        ? '1px solid rgba(255,255,255,0.08)'
                        : '1px solid transparent',
                      boxShadow: active
                        ? '0 8px 20px rgba(37, 99, 235, 0.22)'
                        : 'none',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={e => {
                      if (!active) {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.06)'
                        e.currentTarget.style.color = 'rgba(255,255,255,0.95)'
                        e.currentTarget.style.border = '1px solid rgba(255,255,255,0.05)'
                      }
                    }}
                    onMouseLeave={e => {
                      if (!active) {
                        e.currentTarget.style.background = 'transparent'
                        e.currentTarget.style.color = 'rgba(255,255,255,0.68)'
                        e.currentTarget.style.border = '1px solid transparent'
                      }
                    }}
                  >
                    <span
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '14px',
                        background: active
                          ? 'rgba(255,255,255,0.14)'
                          : 'rgba(255,255,255,0.05)',
                        flexShrink: 0
                      }}
                    >
                      {item.icon}
                    </span>

                    <span style={{ flex: 1 }}>{item.label}</span>

                    {active && (
                      <span
                        style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          background: '#FFFFFF',
                          boxShadow: '0 0 0 4px rgba(255,255,255,0.12)'
                        }}
                      />
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          padding: '14px 16px',
          borderTop: '1px solid rgba(255,255,255,0.08)'
        }}
      >
        <div
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '12px',
            padding: '10px 12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#22C55E',
                boxShadow: '0 0 0 4px rgba(34, 197, 94, 0.15)'
              }}
            />
            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.68)', fontWeight: '600' }}>
              System ready
            </span>
          </div>

          <span
            style={{
              fontSize: '10px',
              color: 'rgba(255,255,255,0.32)',
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '0.08em'
            }}
          >
            Live
          </span>
        </div>
      </div>
    </div>
  )
}