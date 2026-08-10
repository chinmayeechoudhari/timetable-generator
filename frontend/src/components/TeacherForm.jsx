import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import ConfirmModal from './ConfirmModal'
import * as S from '../styles/formStyles'

const BASE = 'http://localhost:8000'
const PAGE_SIZE = 8

export default function TeacherForm() {
  const [teachers, setTeachers] = useState([])

  const [name, setName] = useState('')
  const [maxPeriods, setMaxPeriods] = useState(4)

  const [search, setSearch] = useState('')

  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)

  const [currentPage, setCurrentPage] = useState(1)

  const [deleteTarget, setDeleteTarget] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    fetchTeachers()
  }, [])

  async function fetchTeachers() {
    setLoading(true)
    setError('')

    try {
      const res = await axios.get(`${BASE}/teachers`)
      setTeachers(res.data)
    } catch {
      setError('Could not load teachers. Please check that the backend is running.')
    } finally {
      setLoading(false)
    }
  }

  function resetForm() {
    setName('')
    setMaxPeriods(4)
    setEditingId(null)
  }

  function openAddModal() {
    resetForm()
    setMessage('')
    setError('')
    setIsModalOpen(true)
  }

  function openEditModal(teacher) {
    setEditingId(teacher.teacher_id)
    setName(teacher.teacher_name)
    setMaxPeriods(teacher.max_periods_per_day)

    setMessage('')
    setError('')
    setIsModalOpen(true)
  }

  function closeModal() {
    if (saving) return

    setIsModalOpen(false)
    resetForm()
    setError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()

    setMessage('')
    setError('')

    const trimmedName = name.trim()
    const parsedMaxPeriods = Number(maxPeriods)

    if (!trimmedName) {
      setError('Teacher name is required.')
      return
    }

    if (
      !Number.isInteger(parsedMaxPeriods) ||
      parsedMaxPeriods < 1 ||
      parsedMaxPeriods > 8
    ) {
      setError('Max periods per day must be between 1 and 8.')
      return
    }

    // Immediate frontend duplicate check.
    // Backend validation remains the final authority.
    const duplicate = teachers.some(
      teacher =>
        teacher.teacher_id !== editingId &&
        teacher.teacher_name.trim().toLowerCase() === trimmedName.toLowerCase()
    )

    if (duplicate) {
      setError(`A teacher named "${trimmedName}" already exists.`)
      return
    }

    setSaving(true)

    try {
      if (editingId) {
        await axios.put(`${BASE}/teachers/${editingId}`, {
          teacher_name: trimmedName,
          max_periods_per_day: parsedMaxPeriods,
        })

        setMessage(`"${trimmedName}" updated successfully.`)
      } else {
        await axios.post(`${BASE}/teachers`, {
          teacher_name: trimmedName,
          max_periods_per_day: parsedMaxPeriods,
        })

        setMessage(`"${trimmedName}" added successfully.`)
      }

      setIsModalOpen(false)
      resetForm()

      await fetchTeachers()

      // Return to first page so a newly added teacher is easy to find.
      setCurrentPage(1)
    } catch (err) {
      const detail = err.response?.data?.detail

      if (err.response?.status === 409) {
        setError(detail || 'A teacher with this name already exists.')
      } else {
        setError(detail || 'Error saving teacher.')
      }
    } finally {
      setSaving(false)
    }
  }

  function promptDelete(teacher) {
    setDeleteTarget(teacher)
    setMessage('')
    setError('')
  }

  async function confirmDelete() {
    if (!deleteTarget) return

    setIsDeleting(true)
    setMessage('')
    setError('')

    try {
      await axios.delete(`${BASE}/teachers/${deleteTarget.teacher_id}`)

      setMessage(`"${deleteTarget.teacher_name}" deleted successfully.`)

      if (editingId === deleteTarget.teacher_id) {
        closeModal()
      }

      await fetchTeachers()

      // Make sure pagination doesn't point to an empty page.
      setCurrentPage(previousPage => {
        const remainingItems = teachers.length - 1
        const remainingPages = Math.max(
          1,
          Math.ceil(remainingItems / PAGE_SIZE)
        )

        return Math.min(previousPage, remainingPages)
      })
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          'Error deleting teacher. Please try again.'
      )
    } finally {
      setIsDeleting(false)
      setDeleteTarget(null)
    }
  }

  const filteredTeachers = useMemo(() => {
    const query = search.trim().toLowerCase()

    if (!query) return teachers

    return teachers.filter(teacher =>
      teacher.teacher_name.toLowerCase().includes(query)
    )
  }, [teachers, search])

  const totalPages = Math.max(
    1,
    Math.ceil(filteredTeachers.length / PAGE_SIZE)
  )

  const safeCurrentPage = Math.min(currentPage, totalPages)

  const paginatedTeachers = filteredTeachers.slice(
    (safeCurrentPage - 1) * PAGE_SIZE,
    safeCurrentPage * PAGE_SIZE
  )

  const avgLoad =
    teachers.length > 0
      ? (
          teachers.reduce(
            (sum, teacher) => sum + teacher.max_periods_per_day,
            0
          ) / teachers.length
        ).toFixed(1)
      : '0.0'

  const firstVisible =
    filteredTeachers.length === 0
      ? 0
      : (safeCurrentPage - 1) * PAGE_SIZE + 1

  const lastVisible = Math.min(
    safeCurrentPage * PAGE_SIZE,
    filteredTeachers.length
  )

  function handleSearchChange(e) {
    setSearch(e.target.value)
    setCurrentPage(1)
  }

  return (
    <div style={S.page}>
      {/* ============================================================
          PAGE HEADER
      ============================================================ */}
      <div style={pageHeader}>
        <div>
          <div style={pageTitle}>
            Teachers
          </div>

          <div style={pageSubtitle}>
            Manage your faculty members and their daily teaching limits.
          </div>
        </div>

        <div style={statsContainer}>
          <div style={statCard}>
            <span style={statLabel}>TOTAL</span>
            <span style={statValue}>{teachers.length}</span>
          </div>

          <div style={statCard}>
            <span style={statLabel}>AVG LOAD</span>
            <span style={statValue}>{avgLoad}/day</span>
          </div>
        </div>
      </div>

      {/* ============================================================
          GLOBAL MESSAGE
      ============================================================ */}
      {message && (
        <div style={successBanner}>
          <span style={messageIcon}>✓</span>
          {message}
        </div>
      )}

      {error && !isModalOpen && (
        <div style={errorBanner}>
          <span style={messageIcon}>!</span>
          {error}
        </div>
      )}

      {/* ============================================================
          ADD TEACHER CTA
      ============================================================ */}
      <section style={addSection}>
        <div style={addSectionInner}>
          <div style={addIcon}>
            +
          </div>

          <div style={addText}>
            <div style={addTitle}>
              Add a Teacher
            </div>

            <div style={addSubtitle}>
              Create a new faculty member and define their maximum
              teaching periods per day.
            </div>
          </div>

          <button
            type="button"
            onClick={openAddModal}
            style={primaryButton}
          >
            <span style={{ fontSize: '20px', lineHeight: 1 }}>+</span>
            Add a Teacher
          </button>
        </div>
      </section>

      {/* ============================================================
          TEACHER DIRECTORY
      ============================================================ */}
      <section style={directoryCard}>
        <div style={directoryHeader}>
          <div>
            <div style={directoryTitle}>
              Teacher Directory
            </div>

            <div style={directorySubtitle}>
              View, search and manage all teachers in the system.
            </div>
          </div>

          <div style={teacherCountPill}>
            {filteredTeachers.length} result
            {filteredTeachers.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Search */}
        <div style={searchContainer}>
          <div style={searchWrapper}>
            <span style={searchIcon}>⌕</span>

            <input
              type="text"
              value={search}
              onChange={handleSearchChange}
              placeholder="Search teachers by name..."
              style={searchInput}
            />

            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch('')
                  setCurrentPage(1)
                }}
                style={clearSearchButton}
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div style={stateCard}>
            <div style={loadingSpinner} />
            <div style={stateTitle}>Loading teachers...</div>
            <div style={stateText}>
              Fetching the latest teacher directory.
            </div>
          </div>
        ) : filteredTeachers.length === 0 ? (
          <div style={stateCard}>
            <div style={emptyIcon}>👨‍🏫</div>

            <div style={stateTitle}>
              {search
                ? 'No teachers found'
                : 'No teachers added yet'}
            </div>

            <div style={stateText}>
              {search
                ? `No teacher matches "${search}". Try another search.`
                : 'Add your first teacher using the button above.'}
            </div>

            {!search && (
              <button
                type="button"
                onClick={openAddModal}
                style={emptyActionButton}
              >
                + Add a Teacher
              </button>
            )}
          </div>
        ) : (
          <>
            <div style={tableWrapper}>
              <table style={S.table}>
                <thead>
                  <tr>
                    <th style={{ ...S.th, width: '80px' }}>
                      ID
                    </th>

                    <th style={S.th}>
                      Teacher Name
                    </th>

                    <th
                      style={{
                        ...S.th,
                        textAlign: 'center',
                        width: '220px',
                      }}
                    >
                      Max Periods / Day
                    </th>

                    <th
                      style={{
                        ...S.th,
                        textAlign: 'center',
                        width: '220px',
                      }}
                    >
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {paginatedTeachers.map((teacher, index) => (
                    <tr
                      key={teacher.teacher_id}
                      style={{
                        background:
                          index % 2 === 0
                            ? '#FFFFFF'
                            : '#FAFCFF',
                      }}
                    >
                      <td style={S.td}>
                        <span style={idText}>
                          #{teacher.teacher_id}
                        </span>
                      </td>

                      <td style={S.td}>
                        <div style={teacherIdentity}>
                          <div style={avatarCircle}>
                            {getInitials(teacher.teacher_name)}
                          </div>

                          <div>
                            <div style={teacherName}>
                              {teacher.teacher_name}
                            </div>

                            <div style={teacherRole}>
                              Faculty Member
                            </div>
                          </div>
                        </div>
                      </td>

                      <td
                        style={{
                          ...S.td,
                          textAlign: 'center',
                        }}
                      >
                        <span style={loadBadge}>
                          {teacher.max_periods_per_day}
                        </span>
                      </td>

                      <td
                        style={{
                          ...S.td,
                          textAlign: 'center',
                        }}
                      >
                        <div style={actionGroup}>
                          <button
                            type="button"
                            onClick={() => openEditModal(teacher)}
                            style={editButton}
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() => promptDelete(teacher)}
                            style={deleteButton}
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

            {/* Pagination */}
            <div style={paginationContainer}>
              <div style={paginationInfo}>
                Showing {firstVisible}–{lastVisible} of{' '}
                {filteredTeachers.length} teacher
                {filteredTeachers.length !== 1 ? 's' : ''}
              </div>

              {totalPages > 1 && (
                <div style={paginationControls}>
                  <button
                    type="button"
                    disabled={safeCurrentPage === 1}
                    onClick={() =>
                      setCurrentPage(previous => previous - 1)
                    }
                    style={{
                      ...paginationButton,
                      opacity:
                        safeCurrentPage === 1 ? 0.45 : 1,
                      cursor:
                        safeCurrentPage === 1
                          ? 'not-allowed'
                          : 'pointer',
                    }}
                  >
                    Previous
                  </button>

                  {Array.from(
                    { length: totalPages },
                    (_, index) => index + 1
                  )
                    .slice(0, 5)
                    .map(page => (
                      <button
                        key={page}
                        type="button"
                        onClick={() => setCurrentPage(page)}
                        style={{
                          ...paginationButton,
                          ...(safeCurrentPage === page
                            ? activePaginationButton
                            : {}),
                        }}
                      >
                        {page}
                      </button>
                    ))}

                  {totalPages > 5 && (
                    <>
                      <span style={paginationDots}>...</span>

                      <button
                        type="button"
                        onClick={() => setCurrentPage(totalPages)}
                        style={{
                          ...paginationButton,
                          ...(safeCurrentPage === totalPages
                            ? activePaginationButton
                            : {}),
                        }}
                      >
                        {totalPages}
                      </button>
                    </>
                  )}

                  <button
                    type="button"
                    disabled={safeCurrentPage === totalPages}
                    onClick={() =>
                      setCurrentPage(previous => previous + 1)
                    }
                    style={{
                      ...paginationButton,
                      opacity:
                        safeCurrentPage === totalPages ? 0.45 : 1,
                      cursor:
                        safeCurrentPage === totalPages
                          ? 'not-allowed'
                          : 'pointer',
                    }}
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </section>

      {/* ============================================================
          DUPLICATE PREVENTION NOTICE
      ============================================================ */}
      <div style={infoBanner}>
        <span style={infoIcon}>i</span>

        <div>
          <strong>Duplicate prevention:</strong>{' '}
          Teacher names are unique. A teacher with the same name
          cannot be added again.
        </div>
      </div>

      {/* ============================================================
          ADD / EDIT MODAL
      ============================================================ */}
      {isModalOpen && (
        <div
          style={modalOverlay}
          onMouseDown={e => {
            if (e.target === e.currentTarget && !saving) {
              closeModal()
            }
          }}
        >
          <div style={modalCard}>
            <div style={modalHeader}>
              <div>
                <div style={modalTitle}>
                  {editingId
                    ? 'Edit Teacher'
                    : 'Add a Teacher'}
                </div>

                <div style={modalSubtitle}>
                  {editingId
                    ? 'Update the teacher details below.'
                    : 'Create a faculty member and set their daily teaching limit.'}
                </div>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                style={modalCloseButton}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={modalBody}>
                <div style={S.fieldWrap}>
                  <label style={S.label}>
                    Teacher Name
                  </label>

                  <input
                    autoFocus
                    type="text"
                    value={name}
                    onChange={e => {
                      setName(e.target.value)
                      setError('')
                    }}
                    placeholder="e.g., Prof. Sharma"
                    style={modalInput}
                    disabled={saving}
                    maxLength={100}
                  />

                  <div style={fieldHint}>
                    Use the faculty member's display name.
                  </div>
                </div>

                <div style={S.fieldWrap}>
                  <label style={S.label}>
                    Max Periods Per Day
                  </label>

                  <input
                    type="number"
                    min="1"
                    max="8"
                    value={maxPeriods}
                    onChange={e => {
                      setMaxPeriods(e.target.value)
                      setError('')
                    }}
                    style={modalInput}
                    disabled={saving}
                  />

                  <div style={fieldHint}>
                    Allowed range: 1–8 periods per day.
                  </div>
                </div>

                {error && (
                  <div style={modalError}>
                    <span>!</span>
                    {error}
                  </div>
                )}
              </div>

              <div style={modalFooter}>
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  style={cancelButton}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    ...primaryButton,
                    minWidth: '150px',
                    opacity: saving ? 0.7 : 1,
                  }}
                >
                  {saving
                    ? 'Saving...'
                    : editingId
                      ? 'Save Changes'
                      : 'Add Teacher'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================
          DELETE CONFIRMATION
      ============================================================ */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Delete Teacher"
        itemName={deleteTarget?.teacher_name}
        message="Are you sure you want to delete this teacher? This will disassociate any assigned subjects and timetable entries."
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
        isDeleting={isDeleting}
      />
    </div>
  )
}

/* ================================================================
   HELPERS
================================================================ */

function getInitials(name) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase())
    .join('')
}

/* ================================================================
   PAGE STYLES
================================================================ */

const pageTitle = {
  fontSize: '28px',
  fontWeight: '800',
  color: 'var(--text-main)',
  marginBottom: '6px',
}

const pageSubtitle = {
  fontSize: '13px',
  color: 'var(--text-muted)',
}

const pageHeader = {
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: '24px',
  marginBottom: '24px',
  flexWrap: 'wrap',
}

const statsContainer = {
  display: 'flex',
  gap: '10px',
  flexWrap: 'wrap',
}

const statCard = {
  display: 'flex',
  flexDirection: 'column',
  gap: '3px',
  minWidth: '105px',
  padding: '12px 16px',
  background: 'var(--bg-card)',
  border: '1px solid var(--border-color)',
  borderRadius: '14px',
  boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
}

const statLabel = {
  fontSize: '10px',
  fontWeight: '700',
  letterSpacing: '0.06em',
  color: 'var(--text-muted)',
}

const statValue = {
  fontSize: '17px',
  fontWeight: '800',
  color: 'var(--text-main)',
}

const successBanner = {
  display: 'flex',
  alignItems: 'center',
  gap: '9px',
  marginBottom: '16px',
  padding: '11px 14px',
  borderRadius: '10px',
  background: '#F0FDF4',
  border: '1px solid #BBF7D0',
  color: '#166534',
  fontSize: '12px',
  fontWeight: '600',
}

const errorBanner = {
  display: 'flex',
  alignItems: 'center',
  gap: '9px',
  marginBottom: '16px',
  padding: '11px 14px',
  borderRadius: '10px',
  background: '#FEF2F2',
  border: '1px solid #FECACA',
  color: '#991B1B',
  fontSize: '12px',
  fontWeight: '600',
}

const messageIcon = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '20px',
  height: '20px',
  borderRadius: '50%',
  background: 'rgba(255,255,255,0.7)',
  fontWeight: '800',
}

const addSection = {
  marginBottom: '24px',
  padding: '12px',
  background: 'var(--bg-card)',
  border: '1px solid var(--border-color)',
  borderRadius: '16px',
  boxShadow: '0 6px 20px rgba(15, 23, 42, 0.04)',
}

const addSectionInner = {
  minHeight: '92px',
  display: 'flex',
  alignItems: 'center',
  gap: '18px',
  padding: '18px 22px',
  border: '1px dashed #BFDBFE',
  borderRadius: '12px',
  background: 'linear-gradient(135deg, #FAFCFF, #F8FBFF)',
}

const addIcon = {
  width: '48px',
  height: '48px',
  flexShrink: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '14px',
  background: '#EFF6FF',
  color: '#2563EB',
  border: '1px solid #BFDBFE',
  fontSize: '28px',
  fontWeight: '400',
}

const addText = {
  flex: 1,
  minWidth: '180px',
}

const addTitle = {
  fontSize: '16px',
  fontWeight: '800',
  color: 'var(--text-main)',
  marginBottom: '4px',
}

const addSubtitle = {
  fontSize: '12px',
  lineHeight: '1.5',
  color: 'var(--text-muted)',
}

const primaryButton = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '9px',
  padding: '12px 20px',
  minHeight: '44px',
  border: 'none',
  borderRadius: '10px',
  background: '#2563EB',
  color: '#FFFFFF',
  fontSize: '13px',
  fontWeight: '700',
  cursor: 'pointer',
  boxShadow: '0 8px 18px rgba(37, 99, 235, 0.18)',
}

const directoryCard = {
  background: 'var(--bg-card)',
  border: '1px solid var(--border-color)',
  borderRadius: '16px',
  overflow: 'hidden',
  boxShadow: '0 6px 24px rgba(15, 23, 42, 0.04)',
}

const directoryHeader = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '16px',
  padding: '22px 24px 18px',
  flexWrap: 'wrap',
}

const directoryTitle = {
  fontSize: '17px',
  fontWeight: '800',
  color: 'var(--text-main)',
}

const directorySubtitle = {
  marginTop: '4px',
  fontSize: '12px',
  color: 'var(--text-muted)',
}

const teacherCountPill = {
  padding: '7px 12px',
  borderRadius: '999px',
  background: '#EFF6FF',
  border: '1px solid #BFDBFE',
  color: '#1D4ED8',
  fontSize: '11px',
  fontWeight: '700',
}

const searchContainer = {
  padding: '0 24px 18px',
}

const searchWrapper = {
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  width: '100%',
}

const searchIcon = {
  position: 'absolute',
  left: '14px',
  zIndex: 1,
  fontSize: '22px',
  lineHeight: 1,
  color: '#64748B',
  transform: 'rotate(-20deg)',
}

const searchInput = {
  width: '100%',
  height: '44px',
  boxSizing: 'border-box',
  padding: '0 42px',
  border: '1px solid #CBD5E1',
  borderRadius: '10px',
  background: '#F8FAFC',
  color: 'var(--text-main)',
  fontSize: '13px',
  outline: 'none',
  fontFamily: 'inherit',
}

const clearSearchButton = {
  position: 'absolute',
  right: '10px',
  width: '25px',
  height: '25px',
  border: 'none',
  borderRadius: '50%',
  background: '#E2E8F0',
  color: '#475569',
  cursor: 'pointer',
  fontSize: '17px',
  lineHeight: 1,
}

const tableWrapper = {
  width: '100%',
  overflowX: 'auto',
  borderTop: '1px solid var(--border-color)',
  borderBottom: '1px solid var(--border-color)',
}

const idText = {
  color: '#64748B',
  fontSize: '12px',
  fontWeight: '700',
}

const teacherIdentity = {
  display: 'flex',
  alignItems: 'center',
  gap: '11px',
}

const avatarCircle = {
  width: '36px',
  height: '36px',
  flexShrink: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '50%',
  background: 'linear-gradient(135deg, #DBEAFE, #BFDBFE)',
  color: '#1D4ED8',
  fontSize: '11px',
  fontWeight: '800',
}

const teacherName = {
  fontSize: '13px',
  fontWeight: '700',
  color: 'var(--text-main)',
}

const teacherRole = {
  marginTop: '2px',
  fontSize: '10px',
  color: '#94A3B8',
}

const loadBadge = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: '36px',
  padding: '5px 11px',
  borderRadius: '999px',
  background: '#F8FAFC',
  border: '1px solid #CBD5E1',
  color: '#1E293B',
  fontSize: '12px',
  fontWeight: '800',
}

const actionGroup = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '7px',
}

const editButton = {
  padding: '7px 13px',
  borderRadius: '8px',
  border: '1px solid #BFDBFE',
  background: '#EFF6FF',
  color: '#1D4ED8',
  fontSize: '11px',
  fontWeight: '700',
  cursor: 'pointer',
}

const deleteButton = {
  padding: '7px 13px',
  borderRadius: '8px',
  border: '1px solid #FECACA',
  background: '#FEF2F2',
  color: '#DC2626',
  fontSize: '11px',
  fontWeight: '700',
  cursor: 'pointer',
}

const paginationContainer = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '16px',
  padding: '16px 24px',
  flexWrap: 'wrap',
}

const paginationInfo = {
  fontSize: '11px',
  color: '#64748B',
  fontWeight: '600',
}

const paginationControls = {
  display: 'flex',
  alignItems: 'center',
  gap: '5px',
}

const paginationButton = {
  minWidth: '34px',
  height: '34px',
  padding: '0 9px',
  borderRadius: '8px',
  border: '1px solid #CBD5E1',
  background: '#FFFFFF',
  color: '#334155',
  fontSize: '11px',
  fontWeight: '700',
  cursor: 'pointer',
}

const activePaginationButton = {
  background: '#2563EB',
  borderColor: '#2563EB',
  color: '#FFFFFF',
  boxShadow: '0 4px 10px rgba(37, 99, 235, 0.18)',
}

const paginationDots = {
  padding: '0 3px',
  color: '#94A3B8',
}

const stateCard = {
  margin: '0 24px 24px',
  padding: '50px 24px',
  textAlign: 'center',
  border: '1px dashed #CBD5E1',
  borderRadius: '12px',
  background: '#FAFCFF',
}

const emptyIcon = {
  fontSize: '32px',
  marginBottom: '10px',
}

const stateTitle = {
  fontSize: '14px',
  fontWeight: '800',
  color: '#1E293B',
  marginBottom: '5px',
}

const stateText = {
  fontSize: '12px',
  lineHeight: '1.5',
  color: '#64748B',
}

const emptyActionButton = {
  marginTop: '18px',
  padding: '9px 16px',
  borderRadius: '8px',
  border: '1px solid #BFDBFE',
  background: '#EFF6FF',
  color: '#1D4ED8',
  fontSize: '12px',
  fontWeight: '700',
  cursor: 'pointer',
}

const loadingSpinner = {
  width: '26px',
  height: '26px',
  margin: '0 auto 14px',
  border: '3px solid #DBEAFE',
  borderTopColor: '#2563EB',
  borderRadius: '50%',
}

const infoBanner = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: '10px',
  marginTop: '16px',
  padding: '12px 14px',
  borderRadius: '10px',
  background: '#F8FAFC',
  border: '1px solid #CBD5E1',
  color: '#475569',
  fontSize: '11px',
  lineHeight: '1.5',
}

const infoIcon = {
  width: '18px',
  height: '18px',
  flexShrink: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '50%',
  background: '#DBEAFE',
  color: '#1D4ED8',
  fontSize: '11px',
  fontWeight: '800',
}

const modalOverlay = {
  position: 'fixed',
  inset: 0,
  zIndex: 1000,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '24px',
  background: 'rgba(15, 23, 42, 0.45)',
  backdropFilter: 'blur(4px)',
}

const modalCard = {
  width: '100%',
  maxWidth: '500px',
  maxHeight: '90vh',
  overflowY: 'auto',
  background: '#FFFFFF',
  borderRadius: '18px',
  boxShadow: '0 24px 70px rgba(15, 23, 42, 0.22)',
}

const modalHeader = {
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: '16px',
  padding: '22px 24px',
  borderBottom: '1px solid #E2E8F0',
}

const modalTitle = {
  fontSize: '18px',
  fontWeight: '800',
  color: '#0F172A',
}

const modalSubtitle = {
  marginTop: '5px',
  fontSize: '12px',
  lineHeight: '1.5',
  color: '#64748B',
}

const modalCloseButton = {
  width: '32px',
  height: '32px',
  flexShrink: 0,
  border: 'none',
  borderRadius: '8px',
  background: '#F1F5F9',
  color: '#475569',
  fontSize: '22px',
  lineHeight: 1,
  cursor: 'pointer',
}

const modalBody = {
  display: 'flex',
  flexDirection: 'column',
  gap: '20px',
  padding: '24px',
}

const modalInput = {
  ...S.input,
  height: '44px',
  borderRadius: '10px',
  background: '#F8FAFC',
  border: '1px solid #CBD5E1',
}

const fieldHint = {
  fontSize: '11px',
  lineHeight: '1.4',
  color: '#94A3B8',
}

const modalError = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '10px 12px',
  borderRadius: '9px',
  background: '#FEF2F2',
  border: '1px solid #FECACA',
  color: '#991B1B',
  fontSize: '12px',
  fontWeight: '600',
}

const modalFooter = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  gap: '9px',
  padding: '16px 24px 20px',
  borderTop: '1px solid #E2E8F0',
}

const cancelButton = {
  padding: '11px 18px',
  borderRadius: '9px',
  border: '1px solid #CBD5E1',
  background: '#FFFFFF',
  color: '#475569',
  fontSize: '12px',
  fontWeight: '700',
  cursor: 'pointer',
}