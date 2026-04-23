import { useState, useEffect } from 'react'
import axios from 'axios'
import * as S from '../styles/formStyles'

const BASE = 'http://localhost:8000'

export default function ClassForm() {
  const [classes, setClasses] = useState([])
  const [name, setName] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  // NEW
  const [editingId, setEditingId] = useState(null)

  useEffect(() => { fetchClasses() }, [])

  async function fetchClasses() {
    try {
      const res = await axios.get(`${BASE}/classes`)
      setClasses(res.data)
    } catch {
      setError('Could not load classes')
    }
  }

  // NEW
  function handleEdit(c) {
    setEditingId(c.class_id)
    setName(c.class_name)
    setMessage('')
    setError('')
  }

  // NEW
  function handleCancelEdit() {
    setEditingId(null)
    setName('')
    setMessage('')
    setError('')
  }

  // CHANGED: POST or PUT based on editingId
  async function handleSubmit(e) {
    e.preventDefault()
    setMessage('')
    setError('')

    try {
      if (editingId) {
        await axios.put(`${BASE}/classes/${editingId}`, { class_name: name })
        setMessage(`Class "${name}" updated successfully`)
      } else {
        await axios.post(`${BASE}/classes`, { class_name: name })
        setMessage(`Class "${name}" added successfully`)
      }
      handleCancelEdit()
      fetchClasses()
    } catch (err) {
      setError(err.response?.data?.detail || 'Error saving class')
    }
  }

  // NEW
  async function handleDelete(c) {
    if (!window.confirm(`Delete class "${c.class_name}"? This will also remove its linked subjects.`)) return
    setMessage('')
    setError('')
    try {
      await axios.delete(`${BASE}/classes/${c.class_id}`)
      setMessage(`Class "${c.class_name}" deleted`)
      if (editingId === c.class_id) handleCancelEdit()
      fetchClasses()
    } catch (err) {
      setError(err.response?.data?.detail || 'Cannot delete — linked records exist. Remove subjects first.')
    }
  }

  return (
    <div style={{ ...S.page }}>

      <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
        <div>
          <div style={{ ...S.pageTitle, fontSize: '20px', marginBottom: '6px' }}>Classes</div>
          <div style={{ ...S.pageSub, fontSize: '13px', marginBottom: '0' }}>
            Add and manage class groups that need to be scheduled.
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <div style={statChip}>
            <span style={statChipLabel}>Total</span>
            <span style={statChipValue}>{classes.length}</span>
          </div>
          <div style={{ ...statChip, background: '#F8FAFC' }}>
            <span style={statChipLabel}>Configured</span>
            <span style={statChipValue}>{classes.length > 0 ? 'Yes' : 'No'}</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start', flexWrap: 'wrap' }}>

        {/* Form card */}
        <div style={{
          ...S.card,
          minWidth: '320px', maxWidth: '420px', width: '100%',
          gap: '16px', borderRadius: '16px', padding: '26px',
          boxShadow: '0 10px 30px rgba(15, 23, 42, 0.06)',
          border: editingId ? '1px solid #2563EB' : '1px solid #E2E8F0'  // CHANGED
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '2px' }}>
            {/* CHANGED: icon + heading */}
            <div style={{
              ...iconBadge,
              background: editingId
                ? 'linear-gradient(135deg, #EFF6FF, #BFDBFE)'
                : 'linear-gradient(135deg, #EFF6FF, #DBEAFE)'
            }}>
              {editingId ? '✏️' : '🏫'}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ ...S.heading, fontSize: '16px', marginBottom: '2px' }}>
                {editingId ? 'Edit Class' : 'Add Class'}
              </div>
              <div style={helperTopText}>
                {editingId
                  ? 'Update the class name.'
                  : 'Create a class entry that will be used throughout scheduling.'}
              </div>
            </div>
            {/* NEW: Cancel button */}
            {editingId && (
              <button onClick={handleCancelEdit} style={cancelBtn}>Cancel</button>
            )}
          </div>

          <div style={S.fieldWrap}>
            <label style={S.label}>Class name</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g., CS-A"
              style={{ ...S.input, height: '44px', borderRadius: '10px', background: '#F8FAFC', border: '1px solid #CBD5E1' }}
              required
            />
            <div style={fieldHint}>Use the exact class label you want visible across the timetable.</div>
          </div>

          {message && <div style={{ ...S.successBox, borderRadius: '10px' }}>{message}</div>}
          {error && <div style={{ ...S.errorBox, borderRadius: '10px' }}>{error}</div>}

          {/* CHANGED: button label */}
          <button
            onClick={handleSubmit}
            style={{ ...S.btn, height: '46px', borderRadius: '10px', fontSize: '14px', fontWeight: '700', boxShadow: '0 10px 20px rgba(37, 99, 235, 0.18)' }}
          >
            {editingId ? '✓ Update Class' : '+ Add Class'}
          </button>
        </div>

        {/* Table */}
        <div style={{ flex: 1, minWidth: '320px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', marginBottom: '10px' }}>
            <div>
              <div style={sectionTitle}>Class Directory</div>
              <div style={sectionSub}>Review all configured class groups available for scheduling.</div>
            </div>
            <div style={countPill}>{classes.length} class{classes.length !== 1 ? 'es' : ''}</div>
          </div>

          {classes.length > 0 ? (
            <div style={{ background: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 10px 30px rgba(15, 23, 42, 0.04)' }}>
              <table style={{ ...S.table, border: 'none' }}>
                <thead>
                  <tr>
                    <th style={S.th}>ID</th>
                    <th style={S.th}>Class name</th>
                    {/* NEW */}
                    <th style={{ ...S.th, textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {classes.map((c, index) => (
                    <tr
                      key={c.class_id}
                      style={{
                        // NEW: highlight editing row
                        background: editingId === c.class_id
                          ? '#EFF6FF'
                          : index % 2 === 0 ? '#FFFFFF' : '#FCFDFE'
                      }}
                    >
                      <td style={{ ...S.td, width: '72px', color: '#64748B', fontWeight: '600' }}>#{c.class_id}</td>

                      <td style={S.td}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={classAvatar}>{getClassInitials(c.class_name)}</div>
                          <div>
                            <div style={{ fontWeight: '700', color: '#1D4ED8' }}>{c.class_name}</div>
                            <div style={miniMeta}>Scheduled class group</div>
                          </div>
                        </div>
                      </td>

                      {/* NEW: action buttons */}
                      <td style={{ ...S.td, textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                          <button onClick={() => handleEdit(c)} style={editBtn}>Edit</button>
                          <button onClick={() => handleDelete(c)} style={deleteBtn}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={emptyStateCard}>
              <div style={emptyIcon}>🏫</div>
              <div style={emptyTitle}>No classes added yet</div>
              <div style={emptyText}>Use the form on the left to create your first class entry.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function getClassInitials(name) {
  return name.split(/[\s-_]+/).filter(Boolean).slice(0, 2).map(p => p[0]?.toUpperCase()).join('')
}

const statChip = { display: 'flex', alignItems: 'center', gap: '8px', background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '999px', padding: '8px 12px', boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)' }
const statChipLabel = { fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }
const statChipValue = { fontSize: '12px', fontWeight: '700', color: '#1B2A3B' }
const iconBadge = { width: '42px', height: '42px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #EFF6FF, #DBEAFE)', border: '1px solid #BFDBFE', fontSize: '18px', flexShrink: 0 }
const helperTopText = { fontSize: '12px', color: '#64748B', lineHeight: '1.5' }
const fieldHint = { fontSize: '11px', color: '#94A3B8', lineHeight: '1.4' }
const sectionTitle = { fontSize: '15px', fontWeight: '700', color: '#1B2A3B' }
const sectionSub = { fontSize: '12px', color: '#64748B', marginTop: '2px' }
const countPill = { fontSize: '12px', fontWeight: '700', color: '#1D4ED8', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '999px', padding: '6px 12px' }
const classAvatar = { width: '34px', height: '34px', borderRadius: '50%', background: 'linear-gradient(135deg, #DBEAFE, #BFDBFE)', color: '#1D4ED8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '800', flexShrink: 0 }
const miniMeta = { fontSize: '11px', color: '#94A3B8', marginTop: '2px' }
const emptyStateCard = { background: '#FFFFFF', borderRadius: '16px', border: '1px dashed #CBD5E1', padding: '42px 24px', textAlign: 'center' }
const emptyIcon = { fontSize: '28px', marginBottom: '10px' }
const emptyTitle = { fontSize: '14px', fontWeight: '700', color: '#1B2A3B', marginBottom: '6px' }
const emptyText = { fontSize: '12px', color: '#64748B' }
const cancelBtn = { background: 'none', border: '1px solid #CBD5E1', borderRadius: '8px', padding: '4px 10px', fontSize: '12px', color: '#64748B', cursor: 'pointer', flexShrink: 0 }
const editBtn = { padding: '4px 12px', fontSize: '12px', fontWeight: '600', color: '#1D4ED8', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '8px', cursor: 'pointer' }
const deleteBtn = { padding: '4px 12px', fontSize: '12px', fontWeight: '600', color: '#DC2626', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', cursor: 'pointer' }