import { useEffect, useRef, useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'

const BASE = 'http://localhost:8000'

export default function GenerateTimetable() {
  const [taskId, setTaskId]           = useState(null)
  const [status, setStatus]           = useState(null)
  const [result, setResult]           = useState(null)
  const [error, setError]             = useState(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [elapsed, setElapsed]         = useState(0)
  const intervalRef                   = useRef(null)
  const timerRef                      = useRef(null)
  const navigate                      = useNavigate()

  async function startGenerate() {
    setError(null); setResult(null); setStatus(null); setElapsed(0)
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null }
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
    setIsGenerating(true)
    timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000)
    try {
      const res = await axios.post(`${BASE}/generate`)
      setTaskId(res.data?.task_id || null)
      setStatus(res.data?.status || 'running')
    } catch (err) {
      setError(err?.response?.data?.detail || err?.message || 'Failed to start generation')
      setIsGenerating(false)
      clearInterval(timerRef.current)
    }
  }

  async function pollStatus(id) {
    try {
      const res = await axios.get(`${BASE}/generate/status/${id}`)
      const s = res.data?.status
      setStatus(s)
      if (s === 'done') {
        setResult(res.data?.result ?? null)
        clearInterval(intervalRef.current); intervalRef.current = null
        clearInterval(timerRef.current); timerRef.current = null
        setIsGenerating(false)
      }
    } catch (err) {
      setError(err?.response?.data?.detail || err?.message || 'Failed to fetch status')
      clearInterval(intervalRef.current); intervalRef.current = null
      clearInterval(timerRef.current); timerRef.current = null
      setIsGenerating(false)
    }
  }

  useEffect(() => {
    if (!taskId) return
    intervalRef.current = setInterval(() => pollStatus(taskId), 3000)
    return () => {
      clearInterval(intervalRef.current)
      clearInterval(timerRef.current)
    }
  }, [taskId])

  const showRunning = isGenerating && status !== 'done'

  return (
    <div style={{ padding: '28px 32px', background: '#F0F4F8', minHeight: '100vh' }}>

      {/* Page header */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontSize: '18px', fontWeight: '700', color: '#1B2A3B' }}>
          Generate Timetable
        </div>
        <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
          Run the CP-SAT solver to generate a conflict-free timetable
        </div>
      </div>

      <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start', flexWrap: 'wrap' }}>

        {/* Main card */}
        <div style={{
          background: '#FFFFFF', borderRadius: '10px',
          padding: '24px', width: '100%', maxWidth: '520px',
          border: '1px solid #E2E8F0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          display: 'flex', flexDirection: 'column', gap: '16px'
        }}>
          <div style={{ fontSize: '15px', fontWeight: '700', color: '#1B2A3B' }}>
            Solver Configuration
          </div>

          {/* Info rows */}
          <div style={{
            background: '#F8FAFC', borderRadius: '8px',
            padding: '12px 14px', border: '1px solid #E2E8F0',
            display: 'flex', flexDirection: 'column', gap: '8px'
          }}>
            {[
              { label: 'Algorithm', value: 'CP-SAT (Google OR-Tools)' },
              { label: 'Constraint type', value: 'Hard + Soft constraints' },
              { label: 'Solver timeout', value: '60 seconds max' },
              { label: 'Output', value: 'Saved to database automatically' },
            ].map(row => (
              <div key={row.label} style={{
                display: 'flex', justifyContent: 'space-between',
                fontSize: '12px'
              }}>
                <span style={{ color: '#64748B', fontWeight: '500' }}>{row.label}</span>
                <span style={{ color: '#1B2A3B', fontWeight: '600' }}>{row.value}</span>
              </div>
            ))}
          </div>

          {/* Status display */}
          {showRunning && (
            <div style={{
              background: '#EFF6FF', border: '1px solid #BFDBFE',
              borderRadius: '8px', padding: '12px 14px',
              display: 'flex', alignItems: 'center', gap: '10px'
            }}>
              <div style={{
                width: '10px', height: '10px', borderRadius: '50%',
                background: '#2563EB',
                animation: 'pulse 1s infinite'
              }} />
              <div>
                <div style={{ fontSize: '13px', fontWeight: '600', color: '#1D4ED8' }}>
                  Solver running...
                </div>
                <div style={{ fontSize: '11px', color: '#3B82F6', marginTop: '2px' }}>
                  {elapsed}s elapsed — checking every 3 seconds
                </div>
              </div>
            </div>
          )}

          {status === 'done' && (
            <div style={{
              background: '#F0FDF4', border: '1px solid #BBF7D0',
              borderRadius: '8px', padding: '12px 14px'
            }}>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#166534' }}>
                ✓ Timetable generated successfully
              </div>
              {result && (
                <div style={{ fontSize: '12px', color: '#15803D', marginTop: '4px' }}>
                  {result.entries_saved
                    ? `${result.entries_saved} slots assigned`
                    : 'Solver completed'}
                  {' '}in {elapsed}s
                </div>
              )}
            </div>
          )}

          {error && (
            <div style={{
              background: '#FEF2F2', border: '1px solid #FECACA',
              borderRadius: '8px', padding: '12px 14px'
            }}>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#991B1B' }}>
                ✗ Generation failed
              </div>
              <div style={{ fontSize: '12px', color: '#DC2626', marginTop: '4px' }}>
                {error}
              </div>
            </div>
          )}

          {/* Buttons */}
          <button
            onClick={startGenerate}
            disabled={isGenerating}
            style={{
              padding: '10px 16px', borderRadius: '7px', border: 'none',
              background: isGenerating ? '#93C5FD' : '#2563EB',
              color: '#FFFFFF', fontSize: '13px', fontWeight: '600',
              cursor: isGenerating ? 'wait' : 'pointer', width: '100%'
            }}
          >
            {isGenerating ? '⚡ Generating...' : '⚡ Generate Timetable'}
          </button>

          {status === 'done' && (
            <button
              onClick={() => navigate('/timetable')}
              style={{
                padding: '10px 16px', borderRadius: '7px',
                border: '1.5px solid #2563EB',
                background: '#EFF6FF', color: '#1D4ED8',
                fontSize: '13px', fontWeight: '600',
                cursor: 'pointer', width: '100%'
              }}
            >
              📊 View Timetable →
            </button>
          )}
        </div>

        {/* Steps guide */}
        <div style={{
          flex: 1, minWidth: '240px',
          background: '#FFFFFF', borderRadius: '10px',
          padding: '20px', border: '1px solid #E2E8F0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
        }}>
          <div style={{
            fontSize: '12px', fontWeight: '700', color: '#475569',
            textTransform: 'uppercase', letterSpacing: '0.06em',
            marginBottom: '14px'
          }}>
            Before generating, make sure you have added:
          </div>
          {[
            { icon: '👤', label: 'Teachers', path: '/teachers' },
            { icon: '🚪', label: 'Rooms', path: '/rooms' },
            { icon: '🏫', label: 'Classes', path: '/classes' },
            { icon: '📚', label: 'Subjects with periods/week', path: '/subjects' },
            { icon: '🕐', label: 'Time slots configured', path: '/timeslots' },
            { icon: '🔗', label: 'Teacher-subject links', path: '/teacher-subjects' },
          ].map((item, i) => (
            <div
              key={item.path}
              onClick={() => navigate(item.path)}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '8px 10px', borderRadius: '7px',
                cursor: 'pointer', marginBottom: '4px',
                transition: 'background 0.12s'
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{
                width: '24px', height: '24px', borderRadius: '6px',
                background: '#EFF6FF', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                fontSize: '13px', flexShrink: 0
              }}>
                {item.icon}
              </div>
              <span style={{ fontSize: '12px', color: '#475569', fontWeight: '500' }}>
                {item.label}
              </span>
              <span style={{ marginLeft: 'auto', fontSize: '11px', color: '#94A3B8' }}>→</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}