import { useEffect, useRef, useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'

const BASE = 'http://localhost:8000'

export default function GenerateTimetable() {
  const [taskId, setTaskId]             = useState(null)
  const [status, setStatus]             = useState(null)
  const [result, setResult]             = useState(null)
  const [error, setError]               = useState(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [elapsed, setElapsed]           = useState(0)
  const [validation, setValidation]     = useState(null)   // preflight result
  const [validating, setValidating]     = useState(false)  // loading state
  const [diagnosis, setDiagnosis]       = useState(null)   // post-failure diagnosis
  const intervalRef                     = useRef(null)
  const timerRef                        = useRef(null)
  const navigate                        = useNavigate()

  // Run preflight check on mount and after each generation attempt
  async function runValidation() {
    setValidating(true)
    try {
      const res = await axios.get(`${BASE}/validate`)
      setValidation(res.data)
    } catch {
      setValidation(null)
    } finally {
      setValidating(false)
    }
  }

  useEffect(() => { runValidation() }, [])

  async function startGenerate() {
    setError(null); setResult(null); setStatus(null)
    setElapsed(0); setDiagnosis(null)
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null }
    if (timerRef.current)    { clearInterval(timerRef.current);    timerRef.current = null }
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
        const r = res.data?.result ?? null
        setResult(r)
        // If solver failed, surface the diagnosis
        if (r?.status === 'no_solution' && r?.diagnosis) {
          setDiagnosis(r.diagnosis)
        }
        clearInterval(intervalRef.current); intervalRef.current = null
        clearInterval(timerRef.current);    timerRef.current = null
        setIsGenerating(false)
      }
    } catch (err) {
      setError(err?.response?.data?.detail || err?.message || 'Failed to fetch status')
      clearInterval(intervalRef.current); intervalRef.current = null
      clearInterval(timerRef.current);    timerRef.current = null
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

  const showRunning  = isGenerating && status !== 'done'
  const solverFailed = status === 'done' && result?.status === 'no_solution'
  const solverOk     = status === 'done' && !solverFailed

  // Generate button is disabled while generating OR if validation has issues
  const canGenerate  = !isGenerating && (validation?.ready !== false)

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

        {/* ── Main card ── */}
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
              { label: 'Algorithm',       value: 'CP-SAT (Google OR-Tools)' },
              { label: 'Soft constraints', value: 'S1 max periods · S2 no consecutive · S3 even spread' },
              { label: 'Solver timeout',  value: '60 seconds max' },
              { label: 'Output',          value: 'Saved to database automatically' },
            ].map(row => (
              <div key={row.label} style={{
                display: 'flex', justifyContent: 'space-between', fontSize: '12px'
              }}>
                <span style={{ color: '#64748B', fontWeight: '500' }}>{row.label}</span>
                <span style={{ color: '#1B2A3B', fontWeight: '600', textAlign: 'right', maxWidth: '280px' }}>
                  {row.value}
                </span>
              </div>
            ))}
          </div>

          {/* Running status */}
          {showRunning && (
            <div style={{
              background: '#EFF6FF', border: '1px solid #BFDBFE',
              borderRadius: '8px', padding: '12px 14px',
              display: 'flex', alignItems: 'center', gap: '10px'
            }}>
              <div style={{
                width: '10px', height: '10px', borderRadius: '50%',
                background: '#2563EB', animation: 'pulse 1s infinite'
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

          {/* Success */}
          {solverOk && (
            <div style={{
              background: '#F0FDF4', border: '1px solid #BBF7D0',
              borderRadius: '8px', padding: '12px 14px'
            }}>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#166534' }}>
                ✓ Timetable generated successfully
              </div>
              <div style={{ fontSize: '12px', color: '#15803D', marginTop: '4px' }}>
                {result?.entries_saved
                  ? `${result.entries_saved} slots assigned`
                  : 'Solver completed'} in {elapsed}s
              </div>
            </div>
          )}

          {/* Solver failed — show diagnosis */}
          {solverFailed && (
            <div style={{
              background: '#FEF2F2', border: '1px solid #FECACA',
              borderRadius: '8px', padding: '12px 14px',
              display: 'flex', flexDirection: 'column', gap: '8px'
            }}>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#991B1B' }}>
                ✗ No solution found
              </div>
              {diagnosis ? (
                <>
                  <div style={{ fontSize: '12px', color: '#DC2626' }}>
                    {diagnosis.summary}
                  </div>
                  {diagnosis.issues.map((msg, i) => (
                    <div key={i} style={{
                      fontSize: '12px', color: '#991B1B',
                      background: '#FEE2E2', borderRadius: '6px',
                      padding: '6px 10px'
                    }}>
                      ✗ {msg}
                    </div>
                  ))}
                  {diagnosis.warnings.map((msg, i) => (
                    <div key={i} style={{
                      fontSize: '12px', color: '#92400E',
                      background: '#FEF3C7', borderRadius: '6px',
                      padding: '6px 10px'
                    }}>
                      ⚠ {msg}
                    </div>
                  ))}
                </>
              ) : (
                <div style={{ fontSize: '12px', color: '#DC2626' }}>
                  Constraints may be too tight. Use the checklist on the right to diagnose.
                </div>
              )}
            </div>
          )}

          {/* General error */}
          {error && (
            <div style={{
              background: '#FEF2F2', border: '1px solid #FECACA',
              borderRadius: '8px', padding: '12px 14px'
            }}>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#991B1B' }}>
                ✗ Generation failed
              </div>
              <div style={{ fontSize: '12px', color: '#DC2626', marginTop: '4px' }}>{error}</div>
            </div>
          )}

          {/* Buttons */}
          <button
            onClick={startGenerate}
            disabled={!canGenerate}
            title={validation?.ready === false ? validation.summary : ''}
            style={{
              padding: '10px 16px', borderRadius: '7px', border: 'none',
              background: canGenerate ? '#2563EB' : '#93C5FD',
              color: '#FFFFFF', fontSize: '13px', fontWeight: '600',
              cursor: canGenerate ? 'pointer' : 'not-allowed', width: '100%'
            }}
          >
            {isGenerating ? '⚡ Generating...' : '⚡ Generate Timetable'}
          </button>

          {/* Blocked explanation */}
          {validation?.ready === false && !isGenerating && (
            <div style={{ fontSize: '11px', color: '#DC2626', textAlign: 'center' }}>
              Fix the issues in the checklist before generating
            </div>
          )}

          {solverOk && (
            <button
              onClick={() => navigate('/timetable')}
              style={{
                padding: '10px 16px', borderRadius: '7px',
                border: '1.5px solid #2563EB', background: '#EFF6FF',
                color: '#1D4ED8', fontSize: '13px', fontWeight: '600',
                cursor: 'pointer', width: '100%'
              }}
            >
              📊 View Timetable →
            </button>
          )}
        </div>

        {/* ── Live validation panel ── */}
        <div style={{
          flex: 1, minWidth: '240px',
          background: '#FFFFFF', borderRadius: '10px',
          padding: '20px', border: '1px solid #E2E8F0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
        }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', marginBottom: '14px'
          }}>
            <div style={{
              fontSize: '12px', fontWeight: '700', color: '#475569',
              textTransform: 'uppercase', letterSpacing: '0.06em'
            }}>
              Pre-generation checklist
            </div>
            <button
              onClick={runValidation}
              disabled={validating}
              style={{
                fontSize: '11px', color: '#2563EB', background: 'none',
                border: 'none', cursor: 'pointer', fontWeight: '600',
                padding: '2px 6px'
              }}
            >
              {validating ? 'Checking...' : '↻ Refresh'}
            </button>
          </div>

          {/* Loading state */}
          {validating && !validation && (
            <div style={{ fontSize: '12px', color: '#94A3B8', padding: '8px 0' }}>
              Running checks...
            </div>
          )}

          {/* Summary badge */}
          {validation && (
            <>
              <div style={{
                fontSize: '12px', fontWeight: '600',
                color: validation.ready ? '#166534' : '#991B1B',
                background: validation.ready ? '#F0FDF4' : '#FEF2F2',
                border: `1px solid ${validation.ready ? '#BBF7D0' : '#FECACA'}`,
                borderRadius: '6px', padding: '7px 10px', marginBottom: '12px'
              }}>
                {validation.ready ? '✓' : '✗'} {validation.summary}
              </div>

              {/* Issues */}
              {validation.issues.map((msg, i) => (
                <div key={i} style={{
                  display: 'flex', gap: '8px', alignItems: 'flex-start',
                  padding: '7px 10px', borderRadius: '7px',
                  marginBottom: '4px', background: '#FEF2F2'
                }}>
                  <span style={{ color: '#DC2626', fontSize: '13px', flexShrink: 0 }}>✗</span>
                  <span style={{ fontSize: '12px', color: '#991B1B' }}>{msg}</span>
                </div>
              ))}

              {/* Warnings */}
              {validation.warnings.map((msg, i) => (
                <div key={i} style={{
                  display: 'flex', gap: '8px', alignItems: 'flex-start',
                  padding: '7px 10px', borderRadius: '7px',
                  marginBottom: '4px', background: '#FFFBEB'
                }}>
                  <span style={{ color: '#D97706', fontSize: '13px', flexShrink: 0 }}>⚠</span>
                  <span style={{ fontSize: '12px', color: '#92400E' }}>{msg}</span>
                </div>
              ))}

              {/* Passed */}
              {validation.passed.map((msg, i) => (
                <div key={i} style={{
                  display: 'flex', gap: '8px', alignItems: 'flex-start',
                  padding: '7px 10px', borderRadius: '7px',
                  marginBottom: '4px', background: '#F0FDF4'
                }}>
                  <span style={{ color: '#16A34A', fontSize: '13px', flexShrink: 0 }}>✓</span>
                  <span style={{ fontSize: '12px', color: '#166534' }}>{msg}</span>
                </div>
              ))}
            </>
          )}
        </div>

      </div>
    </div>
  )
}