import * as S from '../styles/formStyles'
import { useState, useEffect } from 'react'
import axios from 'axios'

const BASE = 'http://localhost:8000'

export default function SubjectForm() {
  const [classes, setClasses]         = useState([])
  const [subjects, setSubjects]       = useState([])
  const [subjectName, setSubjectName] = useState('')
  const [periodsPerWeek, setPeriodsPerWeek] = useState(1)
  const [subjectType, setSubjectType] = useState('theory')
  const [classId, setClassId]         = useState('')
  const [message, setMessage]         = useState('')
  const [error, setError]             = useState('')

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    try {
      const [cRes, sRes] = await Promise.all([
        axios.get(`${BASE}/classes`),
        axios.get(`${BASE}/subjects`),
      ])
      setClasses(cRes.data)
      setSubjects(sRes.data)
      if (cRes.data.length > 0) setClassId(cRes.data[0].class_id)
    } catch {
      setError('Could not load data. Make sure the backend is running.')
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setMessage('')
    setError('')
    try {
      await axios.post(`${BASE}/subjects`, {
        subject_name:     subjectName,
        periods_per_week: parseInt(periodsPerWeek),
        subject_type:     subjectType,
        class_id:         parseInt(classId)
      })
      setMessage(`Subject "${subjectName}" added successfully`)
      setSubjectName('')
      setPeriodsPerWeek(1)
      fetchAll()
    } catch (err) {
      setError(err.response?.data?.detail || 'Error adding subject')
    }
  }

  const getClassName = (id) =>
    classes.find(c => c.class_id === id)?.class_name || `Class ${id}`

  return (
    <div style={{ padding: '32px' }}>
      
      <div style={S.card}>
        <h2 style={S.heading}>Add Subject</h2>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div style={S.fieldWrap}>
              <label style={S.label}>Periods per week</label>
              <input
                type="number"
                min="1"
                max="10"
                value={periodsPerWeek}
                onChange={e => setPeriodsPerWeek(e.target.value)}
                style={S.input}
                required
              />
            </div>

            <div style={S.fieldWrap}>
              <label style={S.label}>Subject type</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {['theory', 'lab'].map(type => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setSubjectType(type)}
                    style={subjectType === type ? S.toggleActive : S.toggleInactive}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div style={S.fieldWrap}>
            <label style={S.label}>Class</label>
            <select
              value={classId}
              onChange={e => setClassId(e.target.value)}
              style={S.select}
              required
            >
              <option value="">Select class</option>
              {classes.map(c => (
                <option key={c.class_id} value={c.class_id}>
                  {c.class_name}
                </option>
              ))}
            </select>
          </div>

          {message && <div style={S.successBox}>{message}</div>}
          {error   && <div style={S.errorBox}>{error}</div>}

          <button type="submit" style={S.btn}>Create subject</button>
        </form>
      </div>

      {subjects.length > 0 && (
        <div style={{ ...S.tableWrap, maxWidth: '640px' }}>
          <div style={S.tableCount}>
            {subjects.length} subject{subjects.length !== 1 ? 's' : ''}
          </div>

          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>Subject</th>
                <th style={S.th}>Type</th>
                <th style={S.th}>Periods/week</th>
                <th style={S.th}>Class</th>
              </tr>
            </thead>
            <tbody>
              {subjects.map(s => (
                <tr key={s.subject_id}>
                  <td style={S.td}>{s.subject_name}</td>
                  <td style={S.td}>
                    <span style={{
                      padding: '3px 10px',
                      borderRadius: '10px',
                      fontSize: '11px',
                      fontWeight: '600',
                      background: s.subject_type === 'lab' ? '#fff3e0' : '#e3f2fd',
                      color: s.subject_type === 'lab' ? '#e65100' : '#1565c0'
                    }}>
                      {s.subject_type}
                    </span>
                  </td>
                  <td style={{ ...S.td, textAlign: 'center' }}>
                    {s.periods_per_week}
                  </td>
                  <td style={S.td}>
                    {getClassName(s.class_id)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}