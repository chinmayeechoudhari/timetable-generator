import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

const NAV_SECTIONS = [
  {
    section: 'Data Entry',
    items: [
      { id: 'teachers',             label: 'Teachers',     icon: '👨‍🏫', link: '/teachers' },
      { id: 'rooms',                label: 'Rooms',        icon: '🚪', link: '/rooms' },
      { id: 'classes',              label: 'Classes',      icon: '🎓', link: '/classes' },
      { id: 'subjects',             label: 'Subjects',     icon: '📚', link: '/subjects' },
      { id: 'timeslots',            label: 'Timeslots',    icon: '🕐', link: '/timeslots' },
      { id: 'teacher-subjects',     label: 'Assignments',  icon: '📋', link: '/teacher-subjects' },
      { id: 'teacher-availability', label: 'Availability', icon: '📅', link: '/teacher-availability' },
    ],
  },
  {
    section: 'Schedule',
    items: [
      { id: 'generate',  label: 'Generate',  icon: '⚡', link: '/generate' },
      { id: 'timetable', label: 'Timetable', icon: '🗓️', link: '/timetable' },
    ],
  },
]

export default function NavSidebar({ onCollapse }) {
  const [collapsed, setCollapsed] = useState(false)
  const navigate  = useNavigate()
  const location  = useLocation()

  const W = collapsed ? 70 : 265
  const currentPath = location.pathname === '/' ? '/teachers' : location.pathname

  function toggle() {
    const next = !collapsed
    setCollapsed(next)
    onCollapse?.(next)
  }

  function isActive(link) {
    return currentPath === link
  }

  return (
    <aside style={{
      position:      'fixed',
      top:           0,
      left:          0,
      bottom:        0,
      width:         W,
      zIndex:        50,
      display:       'flex',
      flexDirection: 'column',
      background:    '#FFFFFF',
      borderRight:   '1px solid #E2E8F0',
      transition:    'width 0.3s cubic-bezier(0.4,0,0.2,1)',
      overflow:      'hidden',
      fontFamily:    "'Inter', 'Segoe UI', sans-serif",
      boxShadow:     '2px 0 10px rgba(0,0,0,0.04)',
    }}>

      {/* ── Header ── */}
      <div style={{
        display:        'flex',
        alignItems:     'center',
        justifyContent: collapsed ? 'center' : 'space-between',
        padding:        collapsed ? '20px 0' : '20px 18px',
        borderBottom:   '1px solid #F1F5F9',
        minHeight:      68,
        flexShrink:     0,
      }}>
        {!collapsed && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden' }}>
            <span style={{ fontSize: 22 }}>🗓️</span>
            <span style={{
              fontSize:      16,
              fontWeight:    700,
              color:         '#1B2A3B',
              whiteSpace:    'nowrap',
              letterSpacing: '-0.01em',
            }}>
              TimetablePro
            </span>
          </div>
        )}

        <button
          onClick={toggle}
          title={collapsed ? 'Expand' : 'Collapse'}
          style={{
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            width:          36,
            height:         36,
            borderRadius:   9,
            border:         '1px solid #E2E8F0',
            background:     '#F8FAFC',
            color:          '#64748B',
            cursor:         'pointer',
            flexShrink:     0,
            transition:     'background 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#EEF2FF'}
          onMouseLeave={e => e.currentTarget.style.background = '#F8FAFC'}
        >
          <svg
            width="16" height="16" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="2.2"
            strokeLinecap="round" strokeLinejoin="round"
            style={{ transform: collapsed ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s' }}
          >
            <path d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>

      {/* ── Nav sections ── */}
      <nav style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '14px 10px' }}>
        {NAV_SECTIONS.map((section, si) => (
          <div key={section.section} style={{ marginBottom: si < NAV_SECTIONS.length - 1 ? 22 : 0 }}>

            {/* Section label */}
            {!collapsed && (
              <p style={{
                fontSize:      11,
                fontWeight:    700,
                color:         '#94A3B8',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                margin:        '0 0 8px 10px',
              }}>
                {section.section}
              </p>
            )}

            {/* Items */}
            {section.items.map(item => {
              const active = isActive(item.link)
              return (
                <button
                  key={item.id}
                  onClick={() => navigate(item.link)}
                  title={collapsed ? item.label : undefined}
                  style={{
                    width:          '100%',
                    display:        'flex',
                    alignItems:     'center',
                    gap:            12,
                    padding:        collapsed ? '11px 0' : '11px 12px',
                    justifyContent: collapsed ? 'center' : 'flex-start',
                    borderRadius:   9,
                    border:         'none',
                    cursor:         'pointer',
                    marginBottom:   4,
                    transition:     'background 0.15s, color 0.15s',
                    background:     active ? '#EEF2FF' : 'transparent',
                    color:          active ? '#2563EB' : '#475569',
                    fontFamily:     'inherit',
                    position:       'relative',
                  }}
                  onMouseEnter={e => {
                    if (!active) {
                      e.currentTarget.style.background = '#F8FAFC'
                      e.currentTarget.style.color      = '#1B2A3B'
                    }
                  }}
                  onMouseLeave={e => {
                    if (!active) {
                      e.currentTarget.style.background = 'transparent'
                      e.currentTarget.style.color      = '#475569'
                    }
                  }}
                >
                  {/* Active indicator bar */}
                  {active && !collapsed && (
                    <span style={{
                      position:     'absolute',
                      left:         0,
                      top:          '50%',
                      transform:    'translateY(-50%)',
                      width:        3.5,
                      height:       22,
                      borderRadius: '0 3px 3px 0',
                      background:   '#2563EB',
                    }} />
                  )}

                  <span style={{ fontSize: 19, flexShrink: 0, lineHeight: 1 }}>
                    {item.icon}
                  </span>

                  {!collapsed && (
                    <span style={{
                      fontSize:   14,
                      fontWeight: active ? 600 : 500,
                      whiteSpace: 'nowrap',
                      flex:       1,
                      textAlign:  'left',
                    }}>
                      {item.label}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        ))}
      </nav>

      {/* ── Footer ── */}
      {!collapsed && (
        <div style={{
          padding:    '14px 18px',
          borderTop:  '1px solid #F1F5F9',
          display:    'flex',
          alignItems: 'center',
          gap:        12,
          flexShrink: 0,
        }}>
          <div style={{
            width:          36,
            height:         36,
            borderRadius:   9,
            background:     '#EEF2FF',
            border:         '1px solid #C7D2FE',
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            fontSize:       16,
            flexShrink:     0,
          }}>
            🏫
          </div>
          <div style={{ overflow: 'hidden' }}>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#1B2A3B', whiteSpace: 'nowrap' }}>
              CP-SAT Scheduler
            </p>
            <p style={{ margin: 0, fontSize: 11, color: '#94A3B8', whiteSpace: 'nowrap' }}>
              v1.0
            </p>
          </div>
        </div>
      )}
    </aside>
  )
}
