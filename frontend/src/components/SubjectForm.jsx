import { useState, useEffect } from 'react'
import axios from 'axios'
import * as S from '../styles/formStyles'

const BASE = 'http://localhost:8000'

export default function SubjectForm() {
  const [classes, setClasses]               = useState([])
  const [subjects, setSubjects]             = useState([])
  const [selectedClassId, setSelectedClassId] = useState('')
  const [subjectName, setSubjectName]       = useState('')
  const [periodsPerWeek, setPeriodsPerWeek] = useState(1)
  const [subjectType, setSubjectType]       = useState('theory')
  const [message, setMessage]               = useState('')
  const [error, setError]                   = useState('')

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    try {
      const [cRes, sRes] = await Promise.all([
        axios.get(`${BASE}/classes`),
        axios.get(`${BASE}/subjects`),
      ])
      setClasses(cRes.data)
      setSubjects(sRes.data)
    } catch {
      setError('Could not load data. Make sure the backend is running.')
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!selectedClassId) return
    setMessage(''); setError('')
    try {
      await axios.post(`${BASE}/subjects`, {
        subject_name:     subjectName,
        periods_per_week: parseInt(periodsPerWeek),
        subject_type:     subjectType,
        class_id:         parseInt(selectedClassId)
      })
      setMessage(`Subject "${subjectName}" added to ${getClassName(parseInt(selectedClassId))}`)
      setSubjectName('')
      setPeriodsPerWeek(1)
      setSubjectType('theory')
      fetchAll()
    } catch (err) {
      setError(err.response?.data?.detail || 'Error adding subject')
    }
  }

  function handleClassSwitch(id) {
    setSelectedClassId(id)
    setSubjectName('')
    setPeriodsPerWeek(1)
    setSubjectType('theory')
    setMessage('')
    setError('')
  }

  const getClassName = (id) =>
    classes.find(c => c.class_id === id)?.class_name || `Class ${id}`

  const filteredSubjects = selectedClassId
    ? subjects.filter(s => s.class_id === parseInt(selectedClassId))
    : []

  const hasClass = !!selectedClassId

  return (
    <div style={{ padding: '28px 32px', background: '#F0F4F8', minHeight: '100vh' }}>

      {/* Page header */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontSize: '18px', fontWeight: '700', color: '#1B2A3B' }}>Subjects</div>
        <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
          Select a class, then add and manage its subjects
        </div>
      </div>

      {/* ── Step 1: Class selector ── */}
      <div style={{
        background: '#FFFFFF', borderRadius: '10px',
        padding: '16px 20px', marginBottom: '20px',
        border: '1px solid #E2E8F0',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap'
      }}>
        <div style={{ fontSize: '13px', fontWeight: '600', color: '#1B2A3B', whiteSpace: 'nowrap' }}>
          Active class
        </div>
        <select
          value={selectedClassId}
          onChange={e => handleClassSwitch(e.target.value)}
          style={{
            ...S.select,
            maxWidth: '220px',
            fontWeight: selectedClassId ? '700' : '400',
            borderColor: selectedClassId ? '#2563EB' : '#CBD5E1',
            color: selectedClassId ? '#1D4ED8' : '#94A3B8',
          }}
        >
          <option value="">— Select a class —</option>
          {classes.map(c => (
            <option key={c.class_id} value={c.class_id}>{c.class_name}</option>
          ))}
        </select>

        {/* Subject count badge */}
        {hasClass && (
          <div style={{
            fontSize: '12px', fontWeight: '600',
            background: filteredSubjects.length > 0 ? '#EFF6FF' : '#F8FAFC',
            color: filteredSubjects.length > 0 ? '#1D4ED8' : '#94A3B8',
            border: `1px solid ${filteredSubjects.length > 0 ? '#BFDBFE' : '#E2E8F0'}`,
            borderRadius: '20px', padding: '3px 12px',
          }}>
            {filteredSubjects.length} subject{filteredSubjects.length !== 1 ? 's' : ''}
          </div>
        )}

        {!hasClass && (
          <div style={{ fontSize: '12px', color: '#F59E0B', fontWeight: '500' }}>
            ➡️ Please select a class to manage subjects
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start', flexWrap: 'wrap' }}>

        {/* ── Step 2: Add Subject form ── */}
        <div style={{
          ...S.card,
          opacity: hasClass ? 1 : 0.5,
          transition: 'opacity 0.2s ease',
          pointerEvents: hasClass ? 'auto' : 'none',
          position: 'relative'
        }}>
          {/* Disabled overlay label */}
          {!hasClass && (
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: '10px', zIndex: 1,
              fontSize: '13px', fontWeight: '600', color: '#64748B'
            }}>
              
            </div>
          )}

          <div style={{
            display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', marginBottom: '4px'
          }}>
            <div style={S.heading}>Add Subject</div>
            {hasClass && (
              <div style={{
                fontSize: '11px', fontWeight: '600',
                background: '#EFF6FF', color: '#1D4ED8',
                border: '1px solid #BFDBFE',
                borderRadius: '20px', padding: '2px 10px'
              }}>
                → {getClassName(parseInt(selectedClassId))}
              </div>
            )}
          </div>

          <div style={S.fieldWrap}>
            <label style={S.label}>Subject name</label>
            <input
              value={subjectName}
              onChange={e => setSubjectName(e.target.value)}
              placeholder="e.g., Mathematics"
              style={S.input}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={S.fieldWrap}>
              <label style={S.label}>Periods per week</label>
              <input
                type="number" min="1" max="10"
                value={periodsPerWeek}
                onChange={e => setPeriodsPerWeek(e.target.value)}
                style={S.input}
                required
              />
            </div>

            <div style={S.fieldWrap}>
              <label style={S.label}>Subject type</label>
              <div style={{ display: 'flex', gap: '6px' }}>
                {['theory', 'lab'].map(type => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setSubjectType(type)}
                    style={subjectType === type ? S.toggleActive : S.toggleInactive}
                  >
                    {type === 'theory' ? '📖 Theory' : '🔬 Lab'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {message && <div style={S.successBox}>{message}</div>}
          {error   && <div style={S.errorBox}>{error}</div>}

          <button
            onClick={handleSubmit}
            disabled={!hasClass || !subjectName.trim()}
            style={{
              ...S.btn,
              opacity: (!hasClass || !subjectName.trim()) ? 0.5 : 1,
              cursor:  (!hasClass || !subjectName.trim()) ? 'not-allowed' : 'pointer',
            }}
          >
            + Add Subject
          </button>
        </div>

        {/* ── Step 3: Filtered subject table ── */}
        <div style={{ flex: 1, minWidth: '320px' }}>
          {!hasClass ? (
            <div style={{
              background: '#FFFFFF', borderRadius: '10px',
              border: '1px solid #E2E8F0', padding: '40px 24px',
              textAlign: 'center', color: '#94A3B8',
              boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
            }}>
              <div style={{ fontSize: '28px', marginBottom: '10px' }}>🏫</div>
              <div style={{ fontSize: '13px', fontWeight: '600' }}>No class selected</div>
              <div style={{ fontSize: '12px', marginTop: '4px' }}>
                Select a class above to view its subjects
              </div>
            </div>
          ) : filteredSubjects.length === 0 ? (
            <div style={{
              background: '#FFFFFF', borderRadius: '10px',
              border: '1px solid #E2E8F0', padding: '40px 24px',
              textAlign: 'center', color: '#94A3B8',
              boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
            }}>
              <div style={{ fontSize: '28px', marginBottom: '10px' }}>📚</div>
              <div style={{ fontSize: '13px', fontWeight: '600' }}>
                No subjects for {getClassName(parseInt(selectedClassId))} yet
              </div>
              <div style={{ fontSize: '12px', marginTop: '4px' }}>
                Add the first subject using the form
              </div>
            </div>
          ) : (
            <>
              <div style={S.tableCount}>
                {filteredSubjects.length} subject{filteredSubjects.length !== 1 ? 's' : ''} in{' '}
                <strong>{getClassName(parseInt(selectedClassId))}</strong>
              </div>
              <table style={S.table}>
                <thead>
                  <tr>
                    <th style={S.th}>Subject</th>
                    <th style={S.th}>Type</th>
                    <th style={{ ...S.th, textAlign: 'center' }}>Periods/wk</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSubjects.map(s => (
                    <tr key={s.subject_id}>
                      <td style={{ ...S.td, fontWeight: '600', color: '#1B2A3B' }}>
                        {s.subject_name}
                      </td>
                      <td style={S.td}>
                        <span style={{
                          padding: '3px 10px', borderRadius: '20px',
                          fontSize: '11px', fontWeight: '600',
                          background: s.subject_type === 'lab' ? '#FEF3C7' : '#EFF6FF',
                          color:      s.subject_type === 'lab' ? '#92400E' : '#1D4ED8'
                        }}>
                          {s.subject_type === 'lab' ? '🔬 Lab' : '📖 Theory'}
                        </span>
                      </td>
                      <td style={{ ...S.td, textAlign: 'center', fontWeight: '700', color: '#2563EB' }}>
                        {s.periods_per_week}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>

      </div>
    </div>
  )
}