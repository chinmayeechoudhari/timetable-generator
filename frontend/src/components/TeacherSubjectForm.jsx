import { useState, useEffect } from 'react'
import axios from 'axios'
import * as S from '../styles/formStyles'

const BASE = 'http://localhost:8000'

export default function TeacherSubjectForm() {
  const [classes, setClasses]     = useState([])
  const [teachers, setTeachers]   = useState([])
  const [subjects, setSubjects]   = useState([])
  const [links, setLinks]         = useState([])
  const [selectedClass, setSelectedClass] = useState('')
  const [teacherId, setTeacherId] = useState('')
  const [subjectId, setSubjectId] = useState('')
  const [message, setMessage]     = useState('')
  const [error, setError]         = useState('')

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    try {
      const [cRes, tRes, sRes, lRes] = await Promise.all([
        axios.get(`${BASE}/classes`),
        axios.get(`${BASE}/teachers`),
        axios.get(`${BASE}/subjects`),
        axios.get(`${BASE}/teacher-subjects`),
      ])
      setClasses(cRes.data)
      setTeachers(tRes.data)
      setSubjects(sRes.data)
      setLinks(lRes.data)
    } catch {
      setError('Could not load data. Make sure the backend is running.')
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setMessage(''); setError('')
    try {
      await axios.post(`${BASE}/teacher-subjects`, {
        teacher_id: parseInt(teacherId),
        subject_id: parseInt(subjectId)
      })
      setMessage('Subject assigned successfully')
      setTeacherId('')
      setSubjectId('')
      fetchAll()
    } catch (err) {
      setError(err.response?.data?.detail || 'Error assigning subject')
    }
  }

  function handleClassSwitch(cid) {
    setSelectedClass(cid)
    setTeacherId('')
    setSubjectId('')
    setMessage('')
    setError('')
  }

  // Subjects filtered to selected class only
  const filteredSubjects = selectedClass
    ? subjects.filter(s => s.class_id === parseInt(selectedClass))
    : []

  const getClassName   = (id) => classes.find(c => c.class_id === id)?.class_name   || `Class ${id}`
  const getTeacherName = (id) => teachers.find(t => t.teacher_id === id)?.teacher_name || `Teacher ${id}`
  const getSubjectName = (id) => {
    const s = subjects.find(s => s.subject_id === id)
    if (!s) return `Subject ${id}`
    const cls = classes.find(c => c.class_id === s.class_id)
    return cls ? `${s.subject_name} (${cls.class_name})` : s.subject_name
  }

  const hasClass   = !!selectedClass
  const hasTeacher = !!teacherId
  const canSubmit  = hasClass && hasTeacher && !!subjectId

  return (
    <div style={{ padding: '28px 32px', background: '#F0F4F8', minHeight: '100vh' }}>

      {/* Page header */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontSize: '18px', fontWeight: '700', color: '#1B2A3B' }}>
          Teacher Subjects
        </div>
        <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
          Select a class, then assign a teacher to each subject
        </div>
      </div>

      <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start', flexWrap: 'wrap' }}>

        {/* ── Form card ── */}
        <div style={{
          ...S.card,
          minWidth: '340px',
          maxWidth: '460px',
          width: '100%',
          gap: '18px',
          display: 'flex',
          flexDirection: 'column',
        }}>
          <div style={S.heading}>Assign Subject</div>

          {/* Step indicators */}
          <div style={{
            display: 'flex', gap: '6px', alignItems: 'center',
            marginBottom: '4px'
          }}>
            {[
              { n: '1', label: 'Class',   done: hasClass },
              { n: '2', label: 'Teacher', done: hasTeacher },
              { n: '3', label: 'Subject', done: !!subjectId },
            ].map((step, i) => (
              <div key={step.n} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{
                  width: '22px', height: '22px', borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '11px', fontWeight: '700', flexShrink: 0,
                  background: step.done ? '#2563EB' : '#E2E8F0',
                  color:      step.done ? '#FFFFFF'  : '#94A3B8',
                  transition: 'background 0.2s'
                }}>
                  {step.done ? '✓' : step.n}
                </div>
                <span style={{
                  fontSize: '11px', fontWeight: '600',
                  color: step.done ? '#1D4ED8' : '#94A3B8'
                }}>
                  {step.label}
                </span>
                {i < 2 && (
                  <div style={{
                    width: '20px', height: '1px',
                    background: step.done ? '#BFDBFE' : '#E2E8F0',
                    margin: '0 2px'
                  }} />
                )}
              </div>
            ))}
          </div>

          {/* Step 1: Class */}
          <div style={S.fieldWrap}>
            <label style={S.label}>Step 1 — Class</label>
            <select
              value={selectedClass}
              onChange={e => handleClassSwitch(e.target.value)}
              style={{
                ...S.select,
                borderColor:  hasClass ? '#2563EB' : '#CBD5E1',
                color:        hasClass ? '#1D4ED8' : '#94A3B8',
                fontWeight:   hasClass ? '600'     : '400',
              }}
            >
              <option value="">— Select a class —</option>
              {classes.map(c => (
                <option key={c.class_id} value={c.class_id}>{c.class_name}</option>
              ))}
            </select>
          </div>

          {/* Step 2: Teacher */}
          <div style={{
            ...S.fieldWrap,
            opacity:        hasClass ? 1 : 0.45,
            transition:     'opacity 0.2s',
            pointerEvents:  hasClass ? 'auto' : 'none',
          }}>
            <label style={S.label}>Step 2 — Teacher</label>
            <select
              value={teacherId}
              onChange={e => { setTeacherId(e.target.value); setSubjectId('') }}
              style={{
                ...S.select,
                borderColor: hasTeacher ? '#2563EB' : '#CBD5E1',
                color:       hasTeacher ? '#1D4ED8' : '#94A3B8',
              }}
            >
              <option value="">
                {hasClass ? 'Select teacher' : 'Select class first'}
              </option>
              {teachers.map(t => (
                <option key={t.teacher_id} value={t.teacher_id}>
                  {t.teacher_name}
                </option>
              ))}
            </select>
          </div>

          {/* Step 3: Subject */}
          <div style={{
            ...S.fieldWrap,
            opacity:       hasTeacher ? 1 : 0.45,
            transition:    'opacity 0.2s',
            pointerEvents: hasTeacher ? 'auto' : 'none',
          }}>
            <label style={S.label}>
              Step 3 — Subject
              {hasClass && filteredSubjects.length > 0 && (
                <span style={{
                  marginLeft: '8px', fontSize: '11px', fontWeight: '600',
                  background: '#EFF6FF', color: '#1D4ED8',
                  border: '1px solid #BFDBFE',
                  borderRadius: '20px', padding: '1px 8px'
                }}>
                  {filteredSubjects.length} in {getClassName(parseInt(selectedClass))}
                </span>
              )}
            </label>
            <select
              value={subjectId}
              onChange={e => setSubjectId(e.target.value)}
              style={{
                ...S.select,
                borderColor: subjectId ? '#2563EB' : '#CBD5E1',
                color:       subjectId ? '#1D4ED8' : '#94A3B8',
              }}
            >
              <option value="">
                {!hasClass   ? 'Select class first'   :
                 !hasTeacher ? 'Select teacher first'  :
                 filteredSubjects.length === 0 ? 'No subjects for this class' :
                 'Select subject'}
              </option>
              {filteredSubjects.map(s => (
                <option key={s.subject_id} value={s.subject_id}>
                  {s.subject_name}
                </option>
              ))}
            </select>
            {hasClass && filteredSubjects.length === 0 && (
              <div style={{
                fontSize: '11px', color: '#F59E0B',
                marginTop: '4px', fontWeight: '500'
              }}>
                ⚠ No subjects found for this class — add them on the Subjects page first
              </div>
            )}
          </div>

          {message && <div style={S.successBox}>{message}</div>}
          {error   && <div style={S.errorBox}>{error}</div>}

          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            style={{
              ...S.btn,
              opacity: canSubmit ? 1 : 0.5,
              cursor:  canSubmit ? 'pointer' : 'not-allowed',
              padding: '11px 16px',
              fontSize: '13px',
            }}
          >
            + Assign Subject
          </button>
        </div>

        {/* ── Assignments table ── */}
        {(() => {
          const filteredLinks = selectedClass
            ? links.filter(l => {
                const s = subjects.find(s => s.subject_id === l.subject_id)
                return s?.class_id === parseInt(selectedClass)
              })
            : links

          return filteredLinks.length > 0 && (
          <div style={{ flex: 1, minWidth: '300px' }}>

            {/* Sync label */}
            <div style={{
              fontSize: '11px', fontWeight: '600',
              color: selectedClass ? '#1D4ED8' : '#64748B',
              background: selectedClass ? '#EFF6FF' : '#F8FAFC',
              border: `1px solid ${selectedClass ? '#BFDBFE' : '#E2E8F0'}`,
              borderRadius: '6px', padding: '4px 10px',
              marginBottom: '8px', display: 'inline-block'
            }}>
              {selectedClass
                ? `Showing assignments for: ${getClassName(parseInt(selectedClass))}`
                : 'Showing all assignments'}
            </div>

            <div style={S.tableCount}>
              {filteredLinks.length} assignment{filteredLinks.length !== 1 ? 's' : ''}
              {selectedClass ? ` in ${getClassName(parseInt(selectedClass))}` : ' total'}
            </div>
            <table style={S.table}>
              <thead>
                <tr>
                  <th style={S.th}>Teacher</th>
                  <th style={S.th}>Subject</th>
                  <th style={S.th}>Class</th>
                </tr>
              </thead>
              <tbody>
                {filteredLinks.map((l, i) => (
                  <tr key={i}>
                    <td style={{ ...S.td, fontWeight: '600', color: '#1B2A3B' }}>
                      👤 {getTeacherName(l.teacher_id)}
                    </td>
                    <td style={S.td}>
                      📚 {getSubjectName(l.subject_id).split(' (')[0]}
                    </td>
                    <td style={S.td}>
                      <span style={{
                        padding: '2px 8px', borderRadius: '20px',
                        fontSize: '11px', fontWeight: '600',
                        background: '#EFF6FF', color: '#1D4ED8',
                        border: '1px solid #BFDBFE'
                      }}>
                        {(() => {
                          const s = subjects.find(s => s.subject_id === l.subject_id)
                          return s ? getClassName(s.class_id) : '—'
                        })()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          )
        })()}

      </div>
    </div>
  )
}