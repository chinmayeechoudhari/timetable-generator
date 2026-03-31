export default function SubjectTypeBadge({ name, type, showName = true }) {
    const isLab = type === 'lab'
    const badge = {
      padding:      '1px 6px',
      borderRadius: '20px',
      fontSize:     '10px',
      fontWeight:   '600',
      background:   isLab ? '#FEF3C7' : '#EFF6FF',
      color:        isLab ? '#92400E' : '#1D4ED8',
      whiteSpace:   'nowrap',
      display:      'inline-flex',
      alignItems:   'center',
      gap:          '3px',
      flexShrink:   0,
    }
  
    if (!showName) {
      return <span style={badge}>{isLab ? '🔬 Lab' : '📖 Theory'}</span>
    }
  
    // Stacked layout — name on top, badge below
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
        <span style={{
          fontWeight:   '700',
          fontSize:     '11px',
          color:        '#1B2A3B',
          lineHeight:   '1.2',
          wordBreak:    'break-word',
          overflow:     'hidden',
          display:      '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
        }}>
          {name}
        </span>
        <span style={badge}>{isLab ? '🔬 Lab' : '📖 Theory'}</span>
      </div>
    )
  }