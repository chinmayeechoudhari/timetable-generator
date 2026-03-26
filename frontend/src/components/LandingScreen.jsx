import { useState, useEffect } from 'react'

export default function LandingScreen({ onEnter }) {
  const [visible, setVisible]       = useState(false)
  const [btnVisible, setBtnVisible] = useState(false)
  const [exiting, setExiting]       = useState(false)

  // Staggered fade-in: content first, button after
  useEffect(() => {
    const t1 = setTimeout(() => setVisible(true),   80)
    const t2 = setTimeout(() => setBtnVisible(true), 600)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  // Keyboard: Enter to continue
  useEffect(() => {
    function onKey(e) { if (e.key === 'Enter') handleEnter() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  function handleEnter() {
    setExiting(true)
    setTimeout(onEnter, 500)  // wait for fade-out before unmounting
  }

  return (
    <div
      onClick={handleEnter}
      style={{
        position:       'fixed',
        inset:          0,
        display:        'flex',
        flexDirection:  'column',
        alignItems:     'center',
        justifyContent: 'center',
        cursor:         'pointer',
        userSelect:     'none',
        // Gradient background consistent with app's #F0F4F8 palette
        background:     'linear-gradient(135deg, #1B2A3B 0%, #1e3a5f 50%, #2563EB 100%)',
        opacity:        exiting ? 0 : 1,
        transition:     'opacity 0.5s ease',
        zIndex:         9999,
      }}
    >
      {/* Subtle grid texture overlay */}
      <div style={{
        position:   'absolute',
        inset:      0,
        background: 'radial-gradient(circle at 70% 30%, rgba(96,165,250,0.12) 0%, transparent 60%)',
        pointerEvents: 'none'
      }} />

      {/* Main content */}
      <div style={{
        display:        'flex',
        flexDirection:  'column',
        alignItems:     'center',
        gap:            '20px',
        opacity:        visible ? 1 : 0,
        transform:      visible ? 'translateY(0)' : 'translateY(18px)',
        transition:     'opacity 0.6s ease, transform 0.6s ease',
      }}>

        {/* Icon */}
        <div style={{
          width:          '80px',
          height:         '80px',
          borderRadius:   '22px',
          background:     'rgba(255,255,255,0.1)',
          border:         '1px solid rgba(255,255,255,0.2)',
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          fontSize:       '38px',
          backdropFilter: 'blur(8px)',
          marginBottom:   '4px',
        }}>
          🗓️
        </div>

        {/* App name */}
        <div style={{
          fontSize:      '48px',
          fontWeight:    '800',
          color:         '#FFFFFF',
          letterSpacing: '-0.02em',
          lineHeight:    1,
          fontFamily:    "'Inter', 'Segoe UI', sans-serif",
        }}>
          TimetablePro
        </div>

        {/* Subtitle */}
        <div style={{
          fontSize:      '15px',
          fontWeight:    '500',
          color:         'rgba(255,255,255,0.6)',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
        }}>
          CP-SAT Scheduler
        </div>

        {/* Divider */}
        <div style={{
          width:      '48px',
          height:     '2px',
          background: 'rgba(255,255,255,0.25)',
          borderRadius: '2px',
        }} />

        {/* Tagline */}
        <div style={{
          fontSize:   '14px',
          color:      'rgba(255,255,255,0.45)',
          fontWeight: '400',
          textAlign:  'center',
          maxWidth:   '300px',
          lineHeight: '1.6',
        }}>
          Conflict-free timetables powered by constraint programming
        </div>

        {/* Get Started button */}
        <div style={{
          marginTop:  '12px',
          opacity:    btnVisible ? 1 : 0,
          transform:  btnVisible ? 'translateY(0)' : 'translateY(10px)',
          transition: 'opacity 0.5s ease, transform 0.5s ease',
        }}>
          <button
            onClick={e => { e.stopPropagation(); handleEnter() }}
            style={{
              padding:       '12px 36px',
              borderRadius:  '8px',
              border:        '1.5px solid rgba(255,255,255,0.35)',
              background:    'rgba(255,255,255,0.12)',
              color:         '#FFFFFF',
              fontSize:      '14px',
              fontWeight:    '600',
              cursor:        'pointer',
              letterSpacing: '0.04em',
              backdropFilter: 'blur(8px)',
              transition:    'background 0.2s, border-color 0.2s',
              fontFamily:    "'Inter', 'Segoe UI', sans-serif",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background    = 'rgba(255,255,255,0.22)'
              e.currentTarget.style.borderColor   = 'rgba(255,255,255,0.6)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background    = 'rgba(255,255,255,0.12)'
              e.currentTarget.style.borderColor   = 'rgba(255,255,255,0.35)'
            }}
          >
            Get Started →
          </button>
        </div>

        {/* Click anywhere hint */}
        <div style={{
          fontSize:   '11px',
          color:      'rgba(255,255,255,0.25)',
          marginTop:  '4px',
          opacity:    btnVisible ? 1 : 0,
          transition: 'opacity 0.5s ease',
        }}>
          or press Enter / click anywhere to continue
        </div>

      </div>
    </div>
  )
}