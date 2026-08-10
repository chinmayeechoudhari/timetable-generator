import { Link, useLocation } from 'react-router-dom'

/* ─── SVG Icons for Nav Items ─────────────────────────────────── */
const Icons = {
  dashboard: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  ),
  teachers: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  rooms: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 21h18"/>
      <path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16"/>
      <path d="M9 21v-4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v4"/>
    </svg>
  ),
  classes: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
      <path d="M6 12v5c0 2 6 3 6 3s6-1 6-3v-5"/>
    </svg>
  ),
  subjects: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 2 7 12 12 22 7 12 2"/>
      <polyline points="2 17 12 22 22 17"/>
      <polyline points="2 12 12 17 22 12"/>
    </svg>
  ),
  timeslots: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  teacherSubjects: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
    </svg>
  ),
  availability: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
      <path d="m9 16 2 2 4-4"/>
    </svg>
  ),
  generate: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  ),
  timetable: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2"/>
      <path d="M3 9h18"/>
      <path d="M3 15h18"/>
      <path d="M9 3v18"/>
      <path d="M15 3v18"/>
    </svg>
  )
}

const NAV_GROUPS = [
  {
    section: 'HOME',
    items: [
      { to: '/', label: 'Dashboard', icon: Icons.dashboard }
    ]
  },
  {
    section: 'DATA ENTRY',
    items: [
      { to: '/teachers',             label: 'Teachers',         icon: Icons.teachers },
      { to: '/rooms',                label: 'Rooms',            icon: Icons.rooms },
      { to: '/classes',              label: 'Classes',          icon: Icons.classes },
      { to: '/subjects',             label: 'Subjects',         icon: Icons.subjects },
      { to: '/timeslots',            label: 'Time Slots',       icon: Icons.timeslots },
      { to: '/teacher-subjects',     label: 'Teacher Subjects', icon: Icons.teacherSubjects },
      { to: '/teacher-availability', label: 'Availability',     icon: Icons.availability },
    ]
  },
  {
    section: 'SCHEDULE',
    items: [
      { to: '/generate',  label: 'Generate',  icon: Icons.generate },
      { to: '/timetable', label: 'Timetable', icon: Icons.timetable },
    ]
  }
]

export default function Navbar() {
  const location = useLocation()

  return (
    <aside style={{
      width: '260px',
      minWidth: '260px',
      height: '100vh',
      background: '#0a1633',
      display: 'flex',
      flexDirection: 'column',
      color: '#ffffff',
      fontFamily: "'Inter', 'Segoe UI', sans-serif",
      userSelect: 'none',
      flexShrink: 0,
      borderRight: '1px solid rgba(255, 255, 255, 0.05)',
      boxShadow: '4px 0 20px rgba(0, 0, 0, 0.15)',
    }}>

      {/* ── Brand Header ── */}
      <div style={{
        padding: '24px 20px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
      }}>
        {/* Blue Logo Box */}
        <div style={{
          width: '42px',
          height: '42px',
          borderRadius: '12px',
          background: 'linear-gradient(135deg, #2563eb, #3b82f6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 6px 18px rgba(37, 99, 235, 0.4)',
          flexShrink: 0,
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <rect x="3" y="4" width="18" height="17" rx="3"/>
            <path d="M3 9h18"/>
            <path d="M8 2v4M16 2v4"/>
            <rect x="7" y="13" width="2" height="2" rx=".4" fill="white"/>
            <rect x="11" y="13" width="2" height="2" rx=".4" fill="white"/>
            <rect x="15" y="13" width="2" height="2" rx=".4" fill="white"/>
          </svg>
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '1px' }}>
            <span style={{ fontSize: '18px', fontWeight: '800', color: '#ffffff', letterSpacing: '-0.3px' }}>Timetable</span>
            <span style={{ fontSize: '18px', fontWeight: '900', color: '#3b82f6', letterSpacing: '-0.3px' }}>Pro</span>
          </div>
          <div style={{ fontSize: '11px', fontWeight: '500', color: '#64748b', marginTop: '2px' }}>
            CP-SAT Scheduler
          </div>
        </div>
      </div>

      {/* ── Nav Sections ── */}
      <div style={{
        flex: 1,
        padding: '16px 12px',
        overflowY: 'auto',
      }}>
        {NAV_GROUPS.map(group => (
          <div key={group.section} style={{ marginBottom: '22px' }}>
            <div style={{
              fontSize: '10.5px',
              fontWeight: '700',
              color: '#475569',
              letterSpacing: '0.12em',
              padding: '6px 12px 10px',
              textTransform: 'uppercase',
            }}>
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
                      gap: '12px',
                      padding: '10.5px 14px',
                      borderRadius: '12px',
                      textDecoration: 'none',
                      fontSize: '13.5px',
                      fontWeight: active ? '600' : '500',
                      background: active
                        ? 'linear-gradient(135deg, #2563eb, #1d4ed8)'
                        : 'transparent',
                      color: active ? '#ffffff' : '#94a3b8',
                      boxShadow: active ? '0 6px 20px rgba(37, 99, 235, 0.35)' : 'none',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={e => {
                      if (!active) {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
                        e.currentTarget.style.color = '#ffffff'
                      }
                    }}
                    onMouseLeave={e => {
                      if (!active) {
                        e.currentTarget.style.background = 'transparent'
                        e.currentTarget.style.color = '#94a3b8'
                      }
                    }}
                  >
                    <span style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: active ? '#ffffff' : '#64748b',
                      transition: 'color 0.15s ease',
                    }}>
                      {item.icon}
                    </span>

                    <span style={{ flex: 1 }}>{item.label}</span>

                    {/* Active dot indicator */}
                    {active && (
                      <span style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        background: '#ffffff',
                        boxShadow: '0 0 8px #ffffff',
                      }} />
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* ── Bottom System Status Card ── */}
      <div style={{
        padding: '16px 14px 20px',
        borderTop: '1px solid rgba(255, 255, 255, 0.06)',
      }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          borderRadius: '12px',
          padding: '12px 14px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
              <span style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                background: '#22c55e',
                boxShadow: '0 0 8px #22c55e',
              }} />
              <span style={{ fontSize: '12px', fontWeight: '600', color: '#ffffff' }}>
                System ready
              </span>
            </div>

            <span style={{
              fontSize: '9.5px',
              fontWeight: '700',
              background: 'rgba(34, 197, 94, 0.15)',
              color: '#4ade80',
              padding: '2px 7px',
              borderRadius: '999px',
              letterSpacing: '0.06em',
            }}>
              LIVE
            </span>
          </div>

          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
            All systems operational
          </div>
        </div>
      </div>
    </aside>
  )
}