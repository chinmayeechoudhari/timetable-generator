import { useState, useEffect } from 'react'
import axios from 'axios'
import * as S from '../styles/formStyles'
import SubjectTypeBadge from './SubjectTypeBadge'
import ConfirmModal from './ConfirmModal'

const BASE = 'http://localhost:8000'

export default function SubjectForm() {
  const [classes, setClasses]               = useState([])
  const [subjects, setSubjects]             = useState([])
  const [selectedClassId, setSelectedClassId] = useState('')
  const [subjectName, setSubjectName]       = useState('')
  const [selectedTypes, setSelectedTypes]   = useState({ theory: true, lab: false })
  const [theoryPeriods, setTheoryPeriods]   = useState(1)
  const [labPeriods, setLabPeriods]         = useState(1)
  const [message, setMessage]               = useState('')
  const [error, setError]                   = useState('')
  const [deleteTarget, setDeleteTarget]     = useState(null)
  const [isDeleting, setIsDeleting]         = useState(false)

  // NEW — for edit mode
  // editingId is the subject_id being edited.
  // editingType tracks which type row (theory/lab) is being edited,
  // since one subject name can have two rows.
  const [editingId, setEditingId]     = useState(null)
  const [editingType, setEditingType] = useState(null)

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

  function toggleType(type) {
    setSelectedTypes(prev => {
      const next = { ...prev, [type]: !prev[type] }
      if (!next.theory && !next.lab) return prev
      return next
    })
  }

  // NEW: pre-fill form for a single subject row (theory OR lab — not both)
  function handleEdit(s) {
    setEditingId(s.subject_id)
    setEditingType(s.subject_type)
    setSubjectName(s.subject_name)
    if (s.subject_type === 'theory') {
      setSelectedTypes({ theory: true, lab: false })
      setTheoryPeriods(s.periods_per_week)
    } else {
      setSelectedTypes({ theory: false, lab: true })
      setLabPeriods(s.periods_per_week)
    }
    setMessage('')
    setError('')
  }

  // NEW
  function handleCancelEdit() {
    setEditingId(null)
    setEditingType(null)
    setSubjectName('')
    setTheoryPeriods(1)
    setLabPeriods(1)
    setSelectedTypes({ theory: true, lab: false })
    setMessage('')
    setError('')
  }

  // CHANGED: PUT when editing, POST (loop) when creating
  async function handleSubmit(e) {
    e.preventDefault()
    if (!selectedClassId || !subjectName.trim()) return
    setMessage('')
    setError('')

    try {
      if (editingId) {
        // Edit mode: single row update
        const periods = editingType === 'theory' ? parseInt(theoryPeriods) : parseInt(labPeriods)
        await axios.put(`${BASE}/subjects/${editingId}`, {
          subject_name: subjectName.trim(),
          periods_per_week: periods,
          subject_type: editingType,
          class_id: parseInt(selectedClassId)
        })
        setMessage(`"${subjectName}" updated successfully`)
        handleCancelEdit()
      } else {
        // Create mode: one or two rows
        const entries = []
        if (selectedTypes.theory) entries.push({ subject_type: 'theory', periods_per_week: parseInt(theoryPeriods) })
        if (selectedTypes.lab)    entries.push({ subject_type: 'lab',    periods_per_week: parseInt(labPeriods) })

        for (const entry of entries) {
          await axios.post(`${BASE}/subjects`, {
            subject_name: subjectName.trim(),
            periods_per_week: entry.periods_per_week,
            subject_type: entry.subject_type,
            class_id: parseInt(selectedClassId)
          })
        }

        const both = selectedTypes.theory && selectedTypes.lab
        setMessage(
          both
            ? `"${subjectName}" added as Theory + Lab to ${getClassName(parseInt(selectedClassId))}`
            : `"${subjectName}" added to ${getClassName(parseInt(selectedClassId))}`
        )
        setSubjectName('')
        setTheoryPeriods(1)
        setLabPeriods(1)
        setSelectedTypes({ theory: true, lab: false })
      }
      fetchAll()
    } catch (err) {
      setError(err.response?.data?.detail || 'Error saving subject')
    }
  }

  function promptDelete(s) {
    setDeleteTarget(s)
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    setIsDeleting(true)
    setMessage('')
    setError('')
    try {
      await axios.delete(`${BASE}/subjects/${deleteTarget.subject_id}`)
      setMessage(`"${deleteTarget.subject_name}" (${deleteTarget.subject_type}) deleted successfully`)
      if (editingId === deleteTarget.subject_id) handleCancelEdit()
      fetchAll()
    } catch (err) {
      setError(err.response?.data?.detail || 'Error deleting subject.')
    } finally {
      setIsDeleting(false)
      setDeleteTarget(null)
    }
  }

  function handleClassSwitch(id) {
    setSelectedClassId(id)
    handleCancelEdit()   // also resets edit state on class switch
  }

  const getClassName = (id) =>
    classes.find(c => c.class_id === id)?.class_name || `Class ${id}`

  const filteredSubjects = selectedClassId
    ? subjects.filter(s => s.class_id === parseInt(selectedClassId))
    : []

  const hasClass  = !!selectedClassId
  const bothTypes = selectedTypes.theory && selectedTypes.lab
  const canSubmit = hasClass && subjectName.trim() && (selectedTypes.theory || selectedTypes.lab)

  const theoryCount = filteredSubjects.filter(s => s.subject_type === 'theory').length
  const labCount    = filteredSubjects.filter(s => s.subject_type === 'lab').length

  // In edit mode, lock type toggles (you edit one row at a time)
  const typeToggleLocked = !!editingId

  return (
    <div style={{ ...S.page }}>

      <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
        <div>
          <div style={{ ...S.pageTitle, fontSize: '20px', marginBottom: '6px' }}>Subjects</div>
          <div style={{ ...S.pageSub, fontSize: '13px', marginBottom: '0' }}>
            Select a class, then add and manage theory and lab subjects.
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <div style={statChip}><span style={statChipLabel}>Classes</span><span style={statChipValue}>{classes.length}</span></div>
          {hasClass && (
            <>
              <div style={{ ...statChip, background: '#F8FAFC' }}><span style={statChipLabel}>Subjects</span><span style={statChipValue}>{filteredSubjects.length}</span></div>
              <div style={{ ...statChip, background: '#EFF6FF' }}><span style={{ ...statChipLabel, color: '#1D4ED8' }}>Theory</span><span style={{ ...statChipValue, color: '#1D4ED8' }}>{theoryCount}</span></div>
              <div style={{ ...statChip, background: '#FFFBEB', border: '1px solid #FDE68A' }}><span style={{ ...statChipLabel, color: '#A16207' }}>Labs</span><span style={{ ...statChipValue, color: '#92400E' }}>{labCount}</span></div>
            </>
          )}
        </div>
      </div>

      {/* Class selector bar */}
      <div style={{ background: '#FFFFFF', borderRadius: '16px', padding: '16px 18px', marginBottom: '20px', border: '1px solid #E2E8F0', boxShadow: '0 10px 30px rgba(15, 23, 42, 0.05)', display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
        <div style={selectorIcon}>🏫</div>
        <div style={{ minWidth: '120px' }}>
          <div style={{ fontSize: '12px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Active class</div>
          <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '2px' }}>Choose a class context first</div>
        </div>
        <select
          value={selectedClassId}
          onChange={e => handleClassSwitch(e.target.value)}
          style={{ ...S.select, maxWidth: '240px', height: '44px', borderRadius: '10px', fontWeight: selectedClassId ? '700' : '400', borderColor: selectedClassId ? '#2563EB' : '#CBD5E1', color: selectedClassId ? '#1D4ED8' : '#94A3B8', background: '#F8FAFC' }}
        >
          <option value="">— Select a class —</option>
          {classes.map(c => <option key={c.class_id} value={c.class_id}>{c.class_name}</option>)}
        </select>
        {hasClass
          ? <div style={activeClassPill}>{getClassName(parseInt(selectedClassId))}</div>
          : <div style={warningText}>➜ Please select a class to manage subjects</div>
        }
      </div>

      <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start', flexWrap: 'wrap' }}>

        {/* Form card */}
        <div style={{
          ...S.card,
          minWidth: '340px', maxWidth: '440px', width: '100%',
          gap: '16px', borderRadius: '16px', padding: '26px',
          boxShadow: '0 10px 30px rgba(15, 23, 42, 0.06)',
          border: editingId ? '1px solid #2563EB' : '1px solid #E2E8F0',  // CHANGED
          opacity: hasClass ? 1 : 0.55,
          transition: 'opacity 0.2s ease',
          pointerEvents: hasClass ? 'auto' : 'none'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'space-between', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {/* CHANGED: icon + heading */}
              <div style={{
                ...iconBadge,
                background: editingId
                  ? 'linear-gradient(135deg, #EFF6FF, #BFDBFE)'
                  : 'linear-gradient(135deg, #EFF6FF, #DBEAFE)'
              }}>
                {editingId ? '✏️' : '📚'}
              </div>
              <div>
                <div style={{ ...S.heading, fontSize: '16px', marginBottom: '2px' }}>
                  {editingId ? `Edit Subject (${editingType})` : 'Add Subject'}
                </div>
                <div style={helperTopText}>
                  {editingId
                    ? 'Update the subject name or period count.'
                    : 'Add one subject once and mark it as theory, lab, or both.'}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {hasClass && !editingId && (
                <div style={classTag}>{getClassName(parseInt(selectedClassId))}</div>
              )}
              {/* NEW: Cancel button */}
              {editingId && (
                <button onClick={handleCancelEdit} style={cancelBtn}>Cancel</button>
              )}
            </div>
          </div>

          <div style={S.fieldWrap}>
            <label style={S.label}>Subject name</label>
            <input
              value={subjectName}
              onChange={e => setSubjectName(e.target.value)}
              placeholder="e.g., Programming"
              style={{ ...S.input, height: '44px', borderRadius: '10px', background: '#F8FAFC', border: '1px solid #CBD5E1' }}
              required
            />
            <div style={fieldHint}>Use the exact subject name you want displayed in the timetable.</div>
          </div>

          <div style={S.fieldWrap}>
            <label style={S.label}>Subject type</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              {[
                { key: 'theory', icon: '📖', label: 'Theory', activeBg: '#EFF6FF', activeBorder: '#2563EB', activeText: '#1D4ED8' },
                { key: 'lab',    icon: '🔬', label: 'Lab',    activeBg: '#FFFBEB', activeBorder: '#D97706', activeText: '#92400E' },
              ].map(({ key, icon, label, activeBg, activeBorder, activeText }) => {
                const active = selectedTypes[key]
                return (
                  <button
                    key={key}
                    type="button"
                    // CHANGED: lock toggles in edit mode
                    onClick={() => !typeToggleLocked && toggleType(key)}
                    style={{
                      flex: 1, padding: '12px 14px', borderRadius: '12px',
                      border: active ? `1.5px solid ${activeBorder}` : '1px solid #CBD5E1',
                      background: active ? activeBg : '#F8FAFC',
                      color: active ? activeText : '#64748B',
                      fontWeight: '700', fontSize: '13px',
                      cursor: typeToggleLocked ? 'not-allowed' : 'pointer',
                      opacity: typeToggleLocked && !active ? 0.4 : 1,
                      transition: 'all 0.15s ease',
                      boxShadow: active ? '0 4px 10px rgba(15, 23, 42, 0.04)' : 'none'
                    }}
                  >
                    <div style={{ fontSize: '18px', marginBottom: '6px' }}>{icon}</div>
                    {label}
                  </button>
                )
              })}
            </div>
            {bothTypes && !editingId && (
              <div style={dualInfo}>✓ This will create two entries for the same subject: Theory + Lab</div>
            )}
            {typeToggleLocked && (
              <div style={{ ...dualInfo, background: '#EFF6FF', color: '#1D4ED8', borderColor: '#BFDBFE' }}>
                ℹ️ Type is locked while editing. Cancel to switch.
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: bothTypes ? '1fr 1fr' : '1fr', gap: '12px' }}>
            {selectedTypes.theory && (
              <div style={S.fieldWrap}>
                <label style={S.label}>{bothTypes ? 'Theory periods/wk' : 'Periods per week'}</label>
                <input
                  type="number" min="1" max="10"
                  value={theoryPeriods}
                  onChange={e => setTheoryPeriods(e.target.value)}
                  style={{ ...S.input, height: '44px', borderRadius: '10px', borderColor: '#2563EB', background: '#EFF6FF' }}
                  required
                />
                <div style={fieldHint}>Weekly periods allocated for theory sessions.</div>
              </div>
            )}
            {selectedTypes.lab && (
              <div style={S.fieldWrap}>
                <label style={S.label}>{bothTypes ? 'Lab periods/wk' : 'Periods per week'}</label>
                <input
                  type="number" min="1" max="10"
                  value={labPeriods}
                  onChange={e => setLabPeriods(e.target.value)}
                  style={{ ...S.input, height: '44px', borderRadius: '10px', borderColor: '#D97706', background: '#FFFBEB' }}
                />
                <div style={fieldHint}>Weekly periods allocated for lab sessions.</div>
              </div>
            )}
          </div>

          {message && <div style={{ ...S.successBox, borderRadius: '10px' }}>{message}</div>}
          {error   && <div style={{ ...S.errorBox,   borderRadius: '10px' }}>{error}</div>}

          {/* CHANGED: button label */}
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            style={{
              ...S.btn, height: '46px', borderRadius: '10px', fontSize: '14px', fontWeight: '700',
              opacity: canSubmit ? 1 : 0.55,
              cursor: canSubmit ? 'pointer' : 'not-allowed',
              boxShadow: canSubmit ? '0 10px 20px rgba(37, 99, 235, 0.18)' : 'none'
            }}
          >
            {editingId ? '✓ Update Subject' : `+ Add Subject${bothTypes ? ' (Theory + Lab)' : ''}`}
          </button>
        </div>

        {/* Table */}
        <div style={{ flex: 1, minWidth: '320px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', marginBottom: '10px' }}>
            <div>
              <div style={sectionTitle}>Subject Directory</div>
              <div style={sectionSub}>View the subjects currently configured for the selected class.</div>
            </div>
            {hasClass && <div style={countPill}>{filteredSubjects.length} subject{filteredSubjects.length !== 1 ? 's' : ''}</div>}
          </div>

          {!hasClass ? (
            <div style={emptyStateCard}>
              <div style={emptyIcon}>🏫</div>
              <div style={emptyTitle}>No class selected</div>
              <div style={emptyText}>Select a class above to view and manage its subjects.</div>
            </div>
          ) : filteredSubjects.length === 0 ? (
            <div style={emptyStateCard}>
              <div style={emptyIcon}>📚</div>
              <div style={emptyTitle}>No subjects for {getClassName(parseInt(selectedClassId))} yet</div>
              <div style={emptyText}>Use the form on the left to add the first subject for this class.</div>
            </div>
          ) : (
            <div style={{ background: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 10px 30px rgba(15, 23, 42, 0.04)' }}>
              <table style={{ ...S.table, border: 'none' }}>
                <thead>
                  <tr>
                    <th style={S.th}>Subject</th>
                    <th style={S.th}>Type</th>
                    <th style={{ ...S.th, textAlign: 'center' }}>Periods/wk</th>
                    {/* NEW */}
                    <th style={{ ...S.th, textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSubjects.map((s, index) => (
                    <tr
                      key={s.subject_id}
                      style={{
                        // NEW: highlight editing row
                        background: editingId === s.subject_id
                          ? '#EFF6FF'
                          : index % 2 === 0 ? '#FFFFFF' : '#FCFDFE'
                      }}
                    >
                      <td style={S.td}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={subjectAvatar(s.subject_type)}>
                            {s.subject_type === 'lab' ? '🔬' : '📖'}
                          </div>
                          <div>
                            <div style={{ fontWeight: '700', color: '#1B2A3B' }}>{s.subject_name}</div>
                            <div style={miniMeta}>{s.subject_type === 'lab' ? 'Practical session' : 'Theory session'}</div>
                          </div>
                        </div>
                      </td>
                      <td style={S.td}><SubjectTypeBadge type={s.subject_type} showName={false} /></td>
                      <td style={{ ...S.td, textAlign: 'center' }}>
                        <span style={periodBadge(s.subject_type)}>{s.periods_per_week}</span>
                      </td>
                      {/* NEW: action buttons */}
                      <td style={{ ...S.td, textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                          <button onClick={() => handleEdit(s)} style={editBtn}>Edit</button>
                          <button onClick={() => promptDelete(s)} style={deleteBtn}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Delete Subject"
        itemName={deleteTarget ? `${deleteTarget.subject_name} (${deleteTarget.subject_type})` : ''}
        message="Are you sure you want to delete this subject? This will disassociate any teacher links and timetable entries."
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
        isDeleting={isDeleting}
      />
    </div>
  )
}

const statChip = { display: 'flex', alignItems: 'center', gap: '8px', background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '999px', padding: '8px 12px', boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)' }
const statChipLabel = { fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }
const statChipValue = { fontSize: '12px', fontWeight: '700', color: '#1B2A3B' }
const selectorIcon = { width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #EFF6FF, #DBEAFE)', border: '1px solid #BFDBFE', fontSize: '18px', flexShrink: 0 }
const activeClassPill = { fontSize: '12px', fontWeight: '700', color: '#1D4ED8', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '999px', padding: '8px 12px' }
const warningText = { fontSize: '12px', color: '#F59E0B', fontWeight: '600' }
const iconBadge = { width: '42px', height: '42px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #EFF6FF, #DBEAFE)', border: '1px solid #BFDBFE', fontSize: '18px', flexShrink: 0 }
const helperTopText = { fontSize: '12px', color: '#64748B', lineHeight: '1.5' }
const fieldHint = { fontSize: '11px', color: '#94A3B8', lineHeight: '1.4' }
const dualInfo = { marginTop: '8px', fontSize: '11px', fontWeight: '600', background: '#F0FDF4', color: '#166534', border: '1px solid #BBF7D0', borderRadius: '8px', padding: '6px 10px', display: 'inline-block' }
const classTag = { fontSize: '12px', fontWeight: '700', background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE', borderRadius: '999px', padding: '6px 12px' }
const sectionTitle = { fontSize: '15px', fontWeight: '700', color: '#1B2A3B' }
const sectionSub = { fontSize: '12px', color: '#64748B', marginTop: '2px' }
const countPill = { fontSize: '12px', fontWeight: '700', color: '#1D4ED8', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '999px', padding: '6px 12px' }
const subjectAvatar = (type) => ({ width: '34px', height: '34px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', flexShrink: 0, background: type === 'lab' ? 'linear-gradient(135deg, #FEF3C7, #FDE68A)' : 'linear-gradient(135deg, #DBEAFE, #BFDBFE)', color: type === 'lab' ? '#92400E' : '#1D4ED8' })
const miniMeta = { fontSize: '11px', color: '#94A3B8', marginTop: '2px' }
const periodBadge = (type) => ({ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: '38px', padding: '4px 10px', borderRadius: '999px', background: type === 'lab' ? '#FFFBEB' : '#EFF6FF', border: type === 'lab' ? '1px solid #FDE68A' : '1px solid #BFDBFE', color: type === 'lab' ? '#92400E' : '#1D4ED8', fontSize: '12px', fontWeight: '700' })
const emptyStateCard = { background: '#FFFFFF', borderRadius: '16px', border: '1px dashed #CBD5E1', padding: '42px 24px', textAlign: 'center' }
const emptyIcon = { fontSize: '28px', marginBottom: '10px' }
const emptyTitle = { fontSize: '14px', fontWeight: '700', color: '#1B2A3B', marginBottom: '6px' }
const emptyText = { fontSize: '12px', color: '#64748B' }
const cancelBtn = { background: 'none', border: '1px solid #CBD5E1', borderRadius: '8px', padding: '4px 10px', fontSize: '12px', color: '#64748B', cursor: 'pointer', flexShrink: 0 }
const editBtn = { padding: '4px 12px', fontSize: '12px', fontWeight: '600', color: '#1D4ED8', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '8px', cursor: 'pointer' }
const deleteBtn = { padding: '4px 12px', fontSize: '12px', fontWeight: '600', color: '#DC2626', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', cursor: 'pointer' }