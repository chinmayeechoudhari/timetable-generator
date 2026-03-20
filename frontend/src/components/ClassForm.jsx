import { useState, useEffect } from 'react'
import axios from 'axios'
import * as S from '../styles/formStyles'

const BASE = 'http://localhost:8000'

export default function ClassForm() {
  const [classes, setClasses] = useState([])
  const [name, setName]       = useState('')
  const [message, setMessage] = useState('')
  const [error, setError]     = useState('')

  useEffect(() => { fetchClasses() }, [])

  async function fetchClasses() {
    try {
      const res = await axios.get(`${BASE}/classes`)
      setClasses(res.data)
    } catch { setError('Could not load classes') }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setMessage(''); setError('')
    try {
      await axios.post(`${BASE}/classes`, { class_name: name })
      setMessage(`Class "${name}" added successfully`)
      setName('')
      fetchClasses()
    } catch (err) {
      setError(err.response?.data?.detail || 'Error adding class')
    }
  }

  return (
    <div style={{ padding: '32px' }}>
      <div style={S.card}>
        <h2 style={S.heading}>Add Class</h2>
        <div style={S.fieldWrap}>
          <label style={S.label}>Class name</label>
          <input value={name} onChange={e => setName(e.target.value)}
            placeholder="e.g., CS-A" style={S.input} required />
        </div>
        {message && <div style={S.successBox}>{message}</div>}
        {error   && <div style={S.errorBox}>{error}</div>}
        <button onClick={handleSubmit} style={S.btn}>Create class</button>
      </div>

      {classes.length > 0 && (
        <div style={{ ...S.tableWrap, maxWidth: '640px' }}>
          <div style={S.tableCount}>{classes.length} class{classes.length !== 1 ? 'es' : ''}</div>
          <table style={S.table}>
            <thead><tr>
              <th style={S.th}>ID</th>
              <th style={S.th}>Class name</th>
            </tr></thead>
            <tbody>
              {classes.map(c => (
                <tr key={c.class_id}>
                  <td style={S.td}>{c.class_id}</td>
                  <td style={S.td}>{c.class_name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}