import { useState, useEffect } from 'react'
import axios from 'axios'
import * as S from '../styles/formStyles'

const BASE = 'http://localhost:8000'

export default function TeacherForm() {
  const [teachers, setTeachers]     = useState([])
  const [name, setName]             = useState('')
  const [maxPeriods, setMaxPeriods] = useState(4)
  const [message, setMessage]       = useState('')
  const [error, setError]           = useState('')

  // ── NEW: track which teacher is being edited (null = create mode)
  const [editingId, setEditingId]   = useState(null)

  useEffect(() => { fetchTeachers() }, [])

  async function fetchTeachers() {
    try {
      const res = await axios.get(`${BASE}/teachers`)
      setTeachers(res.data)
    } catch {
      setError('Could not load teachers')
    }
  }

  // ── NEW: pre-fill form and switch to edit mode
  function handleEdit(t) {
    setEditingId(t.teacher_id)
    setName(t.teacher_name)
    setMaxPeriods(t.max_periods_per_day)
    setMessage('')
    setError('')
  }

  // ── NEW: reset form back to create mode
  function handleCancelEdit() {
    setEditingId(null)
    setName('')
    setMaxPeriods(4)
    setMessage('')
    setError('')
  }

  // ── CHANGED: POST when creating, PUT when editing
  async function handleSubmit(e) {
    e.preventDefault()
    setMessage('')
    setError('')

    try {
      if (editingId) {
        await axios.put(`${BASE}/teachers/${editingId}`, {
          teacher_name: name,
          max_periods_per_day: parseInt(maxPeriods)
        })
        setMessage(`"${name}" updated successfully`)
      } else {
        await axios.post(`${BASE}/teachers`, {
          teacher_name: name,
          max_periods_per_day: parseInt(maxPeriods)
        })
        setMessage(`"${name}" added successfully`)
      }
      handleCancelEdit()
      fetchTeachers()
    } catch (err) {
      setError(err.response?.data?.detail || 'Error saving teacher')
    }
  }

  // ── NEW: delete with confirm + cascade error handling
  async function handleDelete(t) {
    if (!window.confirm(`Delete "${t.teacher_name}"? This may affect linked subjects and timetable entries.`)) return
    setMessage('')
    setError('')
    try {
      await axios.delete(`${BASE}/teachers/${t.teacher_id}`)
      setMessage(`"${t.teacher_name}" deleted`)
      if (editingId === t.teacher_id) handleCancelEdit()
      fetchTeachers()
    } catch (err) {
      setError(err.response?.data?.detail || 'Cannot delete — linked records exist. Remove subject links first.')
    }
  }

  const avgLoad =
    teachers.length > 0
      ? (teachers.reduce((sum, t) => sum + t.max_periods_per_day, 0) / teachers.length).toFixed(1)
      : null

  return (
    <div style={{ ...S.page }}>

      {/* Page header */}
      <div
        style={{
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: '16px',
          flexWrap: 'wrap'
        }}
      >
        <div>
          <div style={{ ...S.pageTitle, fontSize: '20px', marginBottom: '6px' }}>
            Teachers
          </div>
          <div style={{ ...S.pageSub, fontSize: '13px', marginBottom: '0' }}>
            Add teachers and define how many periods they can handle per day.
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <div style={statChip}>
            <span style={statChipLabel}>Total</span>
            <span style={statChipValue}>{teachers.length}</span>
          </div>

          {avgLoad && (
            <div style={{ ...statChip, background: '#F8FAFC' }}>
              <span style={statChipLabel}>Avg load</span>
              <span style={statChipValue}>{avgLoad}/day</span>
            </div>
          )}
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          gap: '24px',
          alignItems: 'flex-start',
          flexWrap: 'wrap'
        }}
      >

        {/* Form card */}
        <div
          style={{
            ...S.card,
            minWidth: '320px',
            maxWidth: '420px',
            width: '100%',
            gap: '16px',
            borderRadius: '16px',
            padding: '26px',
            boxShadow: '0 10px 30px rgba(15, 23, 42, 0.06)',
            // ── NEW: blue left border when in edit mode
            border: editingId ? '1px solid #2563EB' : '1px solid #E2E8F0'
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '2px'
            }}
          >
            {/* ── CHANGED: icon and heading switch based on mode */}
            <div style={{
              ...iconBadge,
              background: editingId
                ? 'linear-gradient(135deg, #EFF6FF, #BFDBFE)'
                : 'linear-gradient(135deg, #EFF6FF, #DBEAFE)'
            }}>
              {editingId ? '✏️' : '👨‍🏫'}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ ...S.heading, fontSize: '16px', marginBottom: '2px' }}>
                {editingId ? 'Edit Teacher' : 'Add Teacher'}
              </div>
              <div style={helperTopText}>
                {editingId
                  ? 'Update the name or daily period limit.'
                  : 'Create a faculty entry and set the daily teaching limit.'}
              </div>
            </div>

            {/* ── NEW: Cancel button visible only in edit mode */}
            {editingId && (
              <button
                onClick={handleCancelEdit}
                style={{
                  background: 'none',
                  border: '1px solid #CBD5E1',
                  borderRadius: '8px',
                  padding: '4px 10px',
                  fontSize: '12px',
                  color: '#64748B',
                  cursor: 'pointer',
                  flexShrink: 0
                }}
              >
                Cancel
              </button>
            )}
          </div>

          <div style={S.fieldWrap}>
            <label style={S.label}>Teacher name</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g., Prof. Sharma"
              style={{
                ...S.input,
                height: '44px',
                borderRadius: '10px',
                background: '#F8FAFC',
                border: '1px solid #CBD5E1'
              }}
              required
            />
            <div style={fieldHint}>
              Use the display name you want to see in the timetable.
            </div>
          </div>

          <div style={S.fieldWrap}>
            <label style={S.label}>Max periods per day</label>
            <input
              type="number"
              min="1"
              max="8"
              value={maxPeriods}
              onChange={e => setMaxPeriods(e.target.value)}
              style={{
                ...S.input,
                height: '44px',
                borderRadius: '10px',
                background: '#F8FAFC',
                border: '1px solid #CBD5E1'
              }}
              required
            />
            <div style={fieldHint}>
              Recommended range: 4 to 6 periods per day.
            </div>
          </div>

          {message && (
            <div style={{ ...S.successBox, borderRadius: '10px' }}>
              {message}
            </div>
          )}

          {error && (
            <div style={{ ...S.errorBox, borderRadius: '10px' }}>
              {error}
            </div>
          )}

          {/* ── CHANGED: button label switches based on mode */}
          <button
            onClick={handleSubmit}
            style={{
              ...S.btn,
              height: '46px',
              borderRadius: '10px',
              fontSize: '14px',
              fontWeight: '700',
              boxShadow: '0 10px 20px rgba(37, 99, 235, 0.18)'
            }}
          >
            {editingId ? '✓ Update Teacher' : '+ Add Teacher'}
          </button>
        </div>

        {/* Table / Empty state */}
        <div style={{ flex: 1, minWidth: '320px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              flexWrap: 'wrap',
              marginBottom: '10px'
            }}
          >
            <div>
              <div style={sectionTitle}>Teacher Directory</div>
              <div style={sectionSub}>
                Review all teachers and their configured daily limits.
              </div>
            </div>

            <div style={countPill}>
              {teachers.length} teacher{teachers.length !== 1 ? 's' : ''}
            </div>
          </div>

          {teachers.length > 0 ? (
            <div
              style={{
                background: '#FFFFFF',
                borderRadius: '16px',
                border: '1px solid #E2E8F0',
                overflow: 'hidden',
                boxShadow: '0 10px 30px rgba(15, 23, 42, 0.04)'
              }}
            >
              <table style={{ ...S.table, border: 'none' }}>
                <thead>
                  <tr>
                    <th style={S.th}>ID</th>
                    <th style={S.th}>Name</th>
                    <th style={{ ...S.th, textAlign: 'center' }}>Max periods/day</th>
                    {/* ── NEW: Actions column header */}
                    <th style={{ ...S.th, textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {teachers.map((t, index) => (
                    <tr
                      key={t.teacher_id}
                      style={{
                        // ── NEW: highlight the row being edited
                        background: editingId === t.teacher_id
                          ? '#EFF6FF'
                          : index % 2 === 0 ? '#FFFFFF' : '#FCFDFE'
                      }}
                    >
                      <td style={{ ...S.td, width: '72px', color: '#64748B', fontWeight: '600' }}>
                        #{t.teacher_id}
                      </td>

                      <td style={S.td}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={avatarCircle}>
                            {getInitials(t.teacher_name)}
                          </div>
                          <div>
                            <div style={{ fontWeight: '700', color: '#1B2A3B' }}>
                              {t.teacher_name}
                            </div>
                            <div style={miniMeta}>Faculty member</div>
                          </div>
                        </div>
                      </td>

                      <td style={{ ...S.td, textAlign: 'center' }}>
                        <span style={loadBadge}>
                          {t.max_periods_per_day}
                        </span>
                      </td>

                      {/* ── NEW: Edit + Delete buttons */}
                      <td style={{ ...S.td, textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                          <button
                            onClick={() => handleEdit(t)}
                            style={editBtn}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(t)}
                            style={deleteBtn}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={emptyStateCard}>
              <div style={emptyIcon}>🧑‍🏫</div>
              <div style={emptyTitle}>No teachers added yet</div>
              <div style={emptyText}>
                Use the form on the left to create your first teacher entry.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function getInitials(name) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase())
    .join('')
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const statChip = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  background: '#FFFFFF',
  border: '1px solid #E2E8F0',
  borderRadius: '999px',
  padding: '8px 12px',
  boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)'
}

const statChipLabel = {
  fontSize: '11px',
  fontWeight: '700',
  color: '#64748B',
  textTransform: 'uppercase',
  letterSpacing: '0.05em'
}

const statChipValue = {
  fontSize: '12px',
  fontWeight: '700',
  color: '#1B2A3B'
}

const iconBadge = {
  width: '42px',
  height: '42px',
  borderRadius: '12px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'linear-gradient(135deg, #EFF6FF, #DBEAFE)',
  border: '1px solid #BFDBFE',
  fontSize: '18px',
  flexShrink: 0
}

const helperTopText = {
  fontSize: '12px',
  color: '#64748B',
  lineHeight: '1.5'
}

const fieldHint = {
  fontSize: '11px',
  color: '#94A3B8',
  lineHeight: '1.4'
}

const sectionTitle = {
  fontSize: '15px',
  fontWeight: '700',
  color: '#1B2A3B'
}

const sectionSub = {
  fontSize: '12px',
  color: '#64748B',
  marginTop: '2px'
}

const countPill = {
  fontSize: '12px',
  fontWeight: '700',
  color: '#1D4ED8',
  background: '#EFF6FF',
  border: '1px solid #BFDBFE',
  borderRadius: '999px',
  padding: '6px 12px'
}

const avatarCircle = {
  width: '34px',
  height: '34px',
  borderRadius: '50%',
  background: 'linear-gradient(135deg, #DBEAFE, #BFDBFE)',
  color: '#1D4ED8',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '12px',
  fontWeight: '800',
  flexShrink: 0
}

const miniMeta = {
  fontSize: '11px',
  color: '#94A3B8',
  marginTop: '2px'
}

const loadBadge = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: '34px',
  padding: '4px 10px',
  borderRadius: '999px',
  background: '#F8FAFC',
  border: '1px solid #CBD5E1',
  color: '#1B2A3B',
  fontSize: '12px',
  fontWeight: '700'
}

const emptyStateCard = {
  background: '#FFFFFF',
  borderRadius: '16px',
  border: '1px dashed #CBD5E1',
  padding: '42px 24px',
  textAlign: 'center'
}

const emptyIcon = {
  fontSize: '28px',
  marginBottom: '10px'
}

const emptyTitle = {
  fontSize: '14px',
  fontWeight: '700',
  color: '#1B2A3B',
  marginBottom: '6px'
}

const emptyText = {
  fontSize: '12px',
  color: '#64748B'
}

// ── NEW button styles
const editBtn = {
  padding: '4px 12px',
  fontSize: '12px',
  fontWeight: '600',
  color: '#1D4ED8',
  background: '#EFF6FF',
  border: '1px solid #BFDBFE',
  borderRadius: '8px',
  cursor: 'pointer'
}

const deleteBtn = {
  padding: '4px 12px',
  fontSize: '12px',
  fontWeight: '600',
  color: '#DC2626',
  background: '#FEF2F2',
  border: '1px solid #FECACA',
  borderRadius: '8px',
  cursor: 'pointer'
}