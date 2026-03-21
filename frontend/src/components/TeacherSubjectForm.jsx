import { useState, useEffect } from 'react'
import axios from 'axios'
import * as S from '../styles/formStyles'

const BASE = 'http://localhost:8000'

export default function TeacherSubjectForm() {
  const [teachers, setTeachers]   = useState([])
  const [subjects, setSubjects]   = useState([])
  const [links, setLinks]         = useState([])
  const [teacherId, setTeacherId] = useState('')
  const [subjectId, setSubjectId] = useState('')
  const [message, setMessage]     = useState('')
  const [error, setError]         = useState('')

  useEffect(() => { fetchAll() }, [])

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
    setMessage(''); setError('')
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

  const getTeacherName = (id) =>
    teachers.find(t => t.teacher_id === id)?.teacher_name || `Teacher ${id}`
  const getSubjectName = (id) =>
    subjects.find(s => s.subject_id === id)?.subject_name || `Subject ${id}`

  return (
    <div style={{ padding: '28px 32px', background: '#F0F4F8', minHeight: '100vh' }}>

      {/* Page header */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontSize: '18px', fontWeight: '700', color: '#1B2A3B' }}>
          Teacher Subjects
        </div>
        <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
          Assign which teacher teaches which subject
        </div>
      </div>

      <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start', flexWrap: 'wrap' }}>

        {/* Form card */}
        <div style={S.card}>
          <div style={S.heading}>Assign Subject</div>

          <div style={S.fieldWrap}>
            <label style={S.label}>Teacher</label>
            <select
              value={teacherId}
              onChange={e => setTeacherId(e.target.value)}
              style={S.select}
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

          <div style={S.fieldWrap}>
            <label style={S.label}>Subject</label>
            <select
              value={subjectId}
              onChange={e => setSubjectId(e.target.value)}
              style={S.select}
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

          {message && <div style={S.successBox}>{message}</div>}
          {error   && <div style={S.errorBox}>{error}</div>}

          <button onClick={handleSubmit} style={S.btn}>
            + Assign Subject
          </button>
        </div>

        {/* Assignments table */}
        {links.length > 0 && (
          <div style={{ flex: 1, minWidth: '280px' }}>
            <div style={S.tableCount}>
              {links.length} assignment{links.length !== 1 ? 's' : ''} made
            </div>
            <table style={S.table}>
              <thead>
                <tr>
                  <th style={S.th}>Teacher</th>
                  <th style={S.th}>Subject</th>
                </tr>
              </thead>
              <tbody>
                {links.map((l, i) => (
                  <tr key={i}>
                    <td style={{ ...S.td, fontWeight: '600', color: '#1B2A3B' }}>
                      👤 {getTeacherName(l.teacher_id)}
                    </td>
                    <td style={S.td}>
                      📚 {getSubjectName(l.subject_id)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}