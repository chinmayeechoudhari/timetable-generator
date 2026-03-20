import { useState, useEffect } from 'react'
import axios from 'axios'

const BASE = 'http://localhost:8000'

export default function TeacherSubjectForm() {
  const [teachers, setTeachers] = useState([])
  const [subjects, setSubjects] = useState([])
  const [links, setLinks]       = useState([])
  const [teacherId, setTeacherId] = useState('')
  const [subjectId, setSubjectId] = useState('')
  const [message, setMessage]   = useState('')
  const [error, setError]       = useState('')

  useEffect(() => {
    fetchAll()
  }, [])

  async function fetchAll() {
    try {
      const [tRes, sRes, lRes] = await Promise.all([
        axios.get(`${BASE}/teachers`),
        axios.get(`${BASE}/subjects`),
        axios.get(`${BASE}/teacher-subjects`),
      ])
      setTeachers(tRes.data)
      setSubjects(sRes.data)
      setLinks(lRes.data)
      if (tRes.data.length > 0) setTeacherId(tRes.data[0].teacher_id)
      if (sRes.data.length > 0) setSubjectId(sRes.data[0].subject_id)
    } catch {
      setError('Could not load data. Make sure the backend is running.')
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setMessage('')
    setError('')
    try {
      await axios.post(`${BASE}/teacher-subjects`, {
        teacher_id: parseInt(teacherId),
        subject_id: parseInt(subjectId)
      })
      setMessage('Subject assigned successfully')
      fetchAll()
    } catch (err) {
      setError(err.response?.data?.detail || 'Error assigning subject')
    }
  }

  const getTeacherName = (id) => teachers.find(t => t.teacher_id === id)?.teacher_name || id
  const getSubjectName = (id) => subjects.find(s => s.subject_id === id)?.subject_name || id

  return (
    <div style={{ maxWidth: '640px' }}>
      <h2 style={headingStyle}>Assign Subject to Teacher</h2>

      <form onSubmit={handleSubmit} style={formStyle}>

        <div style={fieldStyle}>
          <label style={labelStyle}>Teacher</label>
          <select
            value={teacherId}
            onChange={e => setTeacherId(e.target.value)}
            style={selectStyle}
            required
          >
            <option value="">Select teacher</option>
            {teachers.map(t => (
              <option key={t.teacher_id} value={t.teacher_id}>
                {t.teacher_name}
              </option>
            ))}
          </select>
        </div>

        <div style={fieldStyle}>
          <label style={labelStyle}>Subject</label>
          <select
            value={subjectId}
            onChange={e => setSubjectId(e.target.value)}
            style={selectStyle}
            required
          >
            <option value="">Select subject</option>
            {subjects.map(s => (
              <option key={s.subject_id} value={s.subject_id}>
                {s.subject_name}
              </option>
            ))}
          </select>
        </div>

        {message && <div style={successStyle}>{message}</div>}
        {error   && <div style={errorStyle}>{error}</div>}

        <button type="submit" style={btnStyle}>Assign subject</button>
      </form>

      {/* Existing links table */}
      {links.length > 0 && (
        <div style={{ marginTop: '32px' }}>
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '10px' }}>
            {links.length} assignment{links.length !== 1 ? 's' : ''}
          </div>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Teacher</th>
                <th style={thStyle}>Subject</th>
              </tr>
            </thead>
            <tbody>
              {links.map((l, i) => (
                <tr key={i}>
                  <td style={tdStyle}>{getTeacherName(l.teacher_id)}</td>
                  <td style={tdStyle}>{getSubjectName(l.subject_id)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

const headingStyle = {
  fontSize: '20px', fontWeight: '600',
  color: '#e0e0e0', marginBottom: '24px'
}
const formStyle = {
  background: '#1a1a1a', borderRadius: '12px',
  padding: '24px', display: 'flex',
  flexDirection: 'column', gap: '16px'
}
const fieldStyle = { display: 'flex', flexDirection: 'column', gap: '6px' }
const labelStyle = { fontSize: '13px', color: '#aaa', fontWeight: '500' }
const selectStyle = {
  padding: '10px 12px', borderRadius: '8px',
  border: '1px solid #333', background: '#0f0f0f',
  color: '#e0e0e0', fontSize: '14px', cursor: 'pointer'
}
const btnStyle = {
  padding: '12px', borderRadius: '8px', border: 'none',
  background: '#6C63FF', color: '#fff', fontSize: '14px',
  fontWeight: '600', cursor: 'pointer', marginTop: '4px'
}
const successStyle = {
  padding: '10px 14px', borderRadius: '8px',
  background: '#0d2b1a', color: '#4caf7d', fontSize: '13px'
}
const errorStyle = {
  padding: '10px 14px', borderRadius: '8px',
  background: '#2b0d0d', color: '#f44336', fontSize: '13px'
}
const tableStyle = {
  width: '100%', borderCollapse: 'collapse', fontSize: '13px'
}
const thStyle = {
  padding: '8px 12px', background: '#1a1a1a',
  color: '#666', fontSize: '11px', fontWeight: '600',
  textTransform: 'uppercase', textAlign: 'left',
  border: '1px solid #222'
}
const tdStyle = {
  padding: '10px 12px', border: '1px solid #1e1e1e',
  color: '#ccc', background: '#111'
}