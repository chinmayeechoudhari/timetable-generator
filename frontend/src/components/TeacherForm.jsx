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
      setError(
        'Could not load teachers. Please check that the backend is running.'
      )
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

    const duplicate = teachers.some(
      teacher =>
        teacher.teacher_id !== editingId &&
        teacher.teacher_name.trim().toLowerCase() ===
          trimmedName.toLowerCase()
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

      await fetchTeachers()

      setCurrentPage(previousPage => {
        const remainingItems = Math.max(0, teachers.length - 1)
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
          ACADEMIC BACKGROUND
      ============================================================ */}

      <div style={academicBackground} aria-hidden="true">
        <div style={backgroundGrid} />

        <div style={backgroundRoom}>
          <div style={roomWall} />
          <div style={roomBoard} />

          <div style={roomDoor} />

          <div style={roomDeskRow}>
            <span style={roomDesk} />
            <span style={roomDesk} />
            <span style={roomDesk} />
            <span style={roomDesk} />
          </div>

          <div style={roomDeskRow}>
            <span style={roomDesk} />
            <span style={roomDesk} />
            <span style={roomDesk} />
            <span style={roomDesk} />
          </div>
        </div>
      </div>

      {/* ============================================================
          HEADER
      ============================================================ */}

      <div style={pageHeader}>
        <div style={headingBlock}>
          <div style={eyebrow}>
            ACADEMIC SCHEDULING
          </div>

          <div style={pageTitle}>
            Teachers
          </div>

          <div style={pageSubtitle}>
            Manage faculty members and their daily teaching limits.
          </div>
        </div>

        <div style={statsContainer}>
          <div style={statCard}>
            <span style={statLabel}>TOTAL</span>
            <span style={statValue}>{teachers.length}</span>
            <span style={statHint}>Faculty members</span>
          </div>

          <div style={statCard}>
            <span style={statLabel}>AVG LOAD</span>
            <span style={statValue}>{avgLoad}</span>
            <span style={statHint}>Periods / day</span>
          </div>
        </div>
      </div>

      {/* ============================================================
          MESSAGES
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
          ADD TEACHER
      ============================================================ */}

      <section style={addSection}>
        <div style={addSectionInner}>
          <div style={addIcon}>
            +
          </div>

          <div style={addText}>
            <div style={addTitle}>
              Add Teacher
            </div>

            <div style={addSubtitle}>
              Add a faculty member and define their daily teaching capacity.
            </div>
          </div>

          <button
            type="button"
            onClick={openAddModal}
            style={primaryButton}
          >
            <span style={buttonPlus}>+</span>
            Add Teacher
          </button>
        </div>
      </section>

      {/* ============================================================
          DIRECTORY
      ============================================================ */}

      <section style={directoryCard}>
        <div style={directoryHeader}>
          <div>
            <div style={directoryTitle}>
              Teacher Directory
            </div>

            <div style={directorySubtitle}>
              Faculty available for timetable scheduling.
            </div>
          </div>

          <div style={teacherCountPill}>
            {filteredTeachers.length} result
            {filteredTeachers.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* SEARCH */}

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

        {/* TABLE */}

        {loading ? (
          <div style={stateCard}>
            <div style={loadingSpinner} />
            <div style={stateTitle}>
              Loading teachers...
            </div>
          </div>
        ) : filteredTeachers.length === 0 ? (
          <div style={stateCard}>
            <div style={emptyIcon}>◌</div>

            <div style={stateTitle}>
              {search
                ? 'No teachers found'
                : 'No teachers added yet'}
            </div>

            <div style={stateText}>
              {search
                ? `No teacher matches "${search}".`
                : 'Add your first teacher to the directory.'}
            </div>

            {!search && (
              <button
                type="button"
                onClick={openAddModal}
                style={emptyActionButton}
              >
                + Add Teacher
              </button>
            )}
          </div>
        ) : (
          <>
            <div style={tableWrapper}>
              <table style={S.table}>
                <thead>
                  <tr>
                    <th
                      style={{
                        ...S.th,
                        width: '80px',
                        textAlign: 'center',
                      }}
                    >
                      #
                    </th>

                    <th style={S.th}>
                      TEACHER
                    </th>

                    <th
                      style={{
                        ...S.th,
                        width: '220px',
                        textAlign: 'center',
                      }}
                    >
                      DAILY CAPACITY
                    </th>

                    <th
                      style={{
                        ...S.th,
                        width: '190px',
                        textAlign: 'center',
                      }}
                    >
                      ACTIONS
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
                            : '#FBFCFE',
                      }}
                    >
                      <td
                        style={{
                          ...S.td,
                          textAlign: 'center',
                        }}
                      >
                        <span style={idText}>
                          {String(
                            (safeCurrentPage - 1) * PAGE_SIZE +
                              index +
                              1
                          ).padStart(2, '0')}
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
                              Faculty member
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
                        <div style={capacityWrapper}>
                          <span style={loadBadge}>
                            {teacher.max_periods_per_day}
                          </span>

                          <span style={capacityText}>
                            periods / day
                          </span>
                        </div>
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
                            onClick={() =>
                              openEditModal(teacher)
                            }
                            style={editButton}
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              promptDelete(teacher)
                            }
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

            {/* PAGINATION */}

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
                        onClick={() =>
                          setCurrentPage(page)
                        }
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
                      <span style={paginationDots}>
                        ...
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          setCurrentPage(totalPages)
                        }
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
                    disabled={
                      safeCurrentPage === totalPages
                    }
                    onClick={() =>
                      setCurrentPage(previous => previous + 1)
                    }
                    style={{
                      ...paginationButton,
                      opacity:
                        safeCurrentPage === totalPages
                          ? 0.45
                          : 1,
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
          SMALL FOOTER NOTE
      ============================================================ */}

      <div style={infoBanner}>
        <span style={infoIcon}>i</span>

        <div>
          Teacher names are unique and cannot be added twice.
        </div>
      </div>

      {/* ============================================================
          ADD / EDIT MODAL
      ============================================================ */}

      {isModalOpen && (
        <div
          style={modalOverlay}
          onMouseDown={e => {
            if (
              e.target === e.currentTarget &&
              !saving
            ) {
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
                    : 'Add Teacher'}
                </div>

                <div style={modalSubtitle}>
                  {editingId
                    ? 'Update the faculty details.'
                    : 'Create a faculty member and set their daily capacity.'}
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
                    placeholder="e.g. Prof. Sharma"
                    style={modalInput}
                    disabled={saving}
                    maxLength={100}
                  />

                  <div style={fieldHint}>
                    Faculty display name.
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
                    1–8 periods per day.
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
                    minWidth: '145px',
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
          DELETE MODAL
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
   HEADER
================================================================ */

const headingBlock = {
  position: 'relative',
  zIndex: 2,
}

const eyebrow = {
  marginBottom: '7px',
  fontSize: '11px',
  fontWeight: '800',
  letterSpacing: '0.14em',
  color: '#2563EB',
}

const pageTitle = {
  fontSize: '32px',
  lineHeight: '1.1',
  fontWeight: '850',
  letterSpacing: '-0.025em',
  color: 'var(--text-main)',
  marginBottom: '7px',
}

const pageSubtitle = {
  fontSize: '14px',
  lineHeight: '1.5',
  color: 'var(--text-muted)',
}

const pageHeader = {
  position: 'relative',
  display: 'flex',
  alignItems: 'flex-end',
  justifyContent: 'space-between',
  gap: '30px',
  marginBottom: '28px',
  padding: '12px 2px',
  flexWrap: 'wrap',
}

const statsContainer = {
  display: 'flex',
  gap: '10px',
  flexWrap: 'wrap',
}

const statCard = {
  minWidth: '128px',
  padding: '14px 17px',
  borderRadius: '14px',
  background: 'rgba(255,255,255,0.86)',
  border: '1px solid rgba(203,213,225,0.8)',
  boxShadow: '0 8px 25px rgba(15,23,42,0.05)',
  backdropFilter: 'blur(8px)',
}

const statLabel = {
  display: 'block',
  marginBottom: '3px',
  fontSize: '10px',
  fontWeight: '800',
  letterSpacing: '0.09em',
  color: '#64748B',
}

const statValue = {
  display: 'block',
  fontSize: '21px',
  lineHeight: '1.2',
  fontWeight: '850',
  color: '#0F172A',
}

const statHint = {
  display: 'block',
  marginTop: '3px',
  fontSize: '10px',
  color: '#94A3B8',
}

/* ================================================================
   MESSAGES
================================================================ */

const successBanner = {
  display: 'flex',
  alignItems: 'center',
  gap: '9px',
  marginBottom: '18px',
  padding: '12px 15px',
  borderRadius: '11px',
  background: '#F0FDF4',
  border: '1px solid #BBF7D0',
  color: '#166534',
  fontSize: '13px',
  fontWeight: '600',
}

const errorBanner = {
  display: 'flex',
  alignItems: 'center',
  gap: '9px',
  marginBottom: '18px',
  padding: '12px 15px',
  borderRadius: '11px',
  background: '#FEF2F2',
  border: '1px solid #FECACA',
  color: '#991B1B',
  fontSize: '13px',
  fontWeight: '600',
}

const messageIcon = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '21px',
  height: '21px',
  flexShrink: 0,
  borderRadius: '50%',
  background: 'rgba(255,255,255,0.7)',
  fontWeight: '800',
}

/* ================================================================
   ADD SECTION
================================================================ */

const addSection = {
  marginBottom: '24px',
  padding: '10px',
  borderRadius: '17px',
  background: 'rgba(255,255,255,0.82)',
  border: '1px solid rgba(203,213,225,0.85)',
  boxShadow: '0 10px 30px rgba(15,23,42,0.045)',
  backdropFilter: 'blur(8px)',
}

const addSectionInner = {
  minHeight: '82px',
  display: 'flex',
  alignItems: 'center',
  gap: '17px',
  padding: '17px 20px',
  borderRadius: '12px',
  background:
    'linear-gradient(135deg, rgba(239,246,255,0.78), rgba(248,250,252,0.72))',
  border: '1px solid rgba(191,219,254,0.8)',
}

const addIcon = {
  width: '46px',
  height: '46px',
  flexShrink: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '13px',
  background: '#EFF6FF',
  border: '1px solid #BFDBFE',
  color: '#2563EB',
  fontSize: '27px',
  fontWeight: '400',
}

const addText = {
  flex: 1,
  minWidth: '180px',
}

const addTitle = {
  marginBottom: '3px',
  fontSize: '16px',
  fontWeight: '800',
  color: '#0F172A',
}

const addSubtitle = {
  fontSize: '12px',
  lineHeight: '1.5',
  color: '#64748B',
}

const buttonPlus = {
  fontSize: '20px',
  lineHeight: 1,
  fontWeight: '400',
}

const primaryButton = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  minHeight: '43px',
  padding: '11px 18px',
  border: 'none',
  borderRadius: '10px',
  background: '#2563EB',
  color: '#FFFFFF',
  fontSize: '13px',
  fontWeight: '750',
  cursor: 'pointer',
  boxShadow: '0 7px 18px rgba(37,99,235,0.2)',
}

/* ================================================================
   DIRECTORY
================================================================ */

const directoryCard = {
  position: 'relative',
  background: 'rgba(255,255,255,0.94)',
  border: '1px solid rgba(203,213,225,0.85)',
  borderRadius: '17px',
  overflow: 'hidden',
  boxShadow: '0 12px 34px rgba(15,23,42,0.055)',
  backdropFilter: 'blur(8px)',
}

const directoryHeader = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '16px',
  padding: '22px 24px 17px',
  flexWrap: 'wrap',
}

const directoryTitle = {
  fontSize: '19px',
  fontWeight: '850',
  letterSpacing: '-0.015em',
  color: '#0F172A',
}

const directorySubtitle = {
  marginTop: '4px',
  fontSize: '12px',
  color: '#64748B',
}

const teacherCountPill = {
  padding: '7px 12px',
  borderRadius: '999px',
  background: '#F8FAFC',
  border: '1px solid #CBD5E1',
  color: '#475569',
  fontSize: '11px',
  fontWeight: '750',
}

const searchContainer = {
  padding: '0 24px 19px',
}

const searchWrapper = {
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  width: '100%',
}

const searchIcon = {
  position: 'absolute',
  left: '15px',
  zIndex: 1,
  fontSize: '23px',
  lineHeight: 1,
  color: '#64748B',
  transform: 'rotate(-20deg)',
}

const searchInput = {
  width: '100%',
  height: '47px',
  boxSizing: 'border-box',
  padding: '0 44px',
  border: '1px solid #CBD5E1',
  borderRadius: '11px',
  background: '#F8FAFC',
  color: '#0F172A',
  fontSize: '14px',
  outline: 'none',
  fontFamily: 'inherit',
}

const clearSearchButton = {
  position: 'absolute',
  right: '10px',
  width: '27px',
  height: '27px',
  border: 'none',
  borderRadius: '50%',
  background: '#E2E8F0',
  color: '#475569',
  cursor: 'pointer',
  fontSize: '18px',
  lineHeight: 1,
}

/* ================================================================
   TABLE
================================================================ */

const tableWrapper = {
  width: '100%',
  overflowX: 'auto',
  borderTop: '1px solid #E2E8F0',
  borderBottom: '1px solid #E2E8F0',
}

const idText = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: '30px',
  height: '30px',
  borderRadius: '8px',
  background: '#F8FAFC',
  color: '#64748B',
  fontSize: '12px',
  fontWeight: '750',
}

const teacherIdentity = {
  display: 'flex',
  alignItems: 'center',
  gap: '13px',
}

const avatarCircle = {
  width: '40px',
  height: '40px',
  flexShrink: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '12px',
  background:
    'linear-gradient(135deg, #DBEAFE 0%, #E0E7FF 100%)',
  border: '1px solid #BFDBFE',
  color: '#1D4ED8',
  fontSize: '12px',
  fontWeight: '850',
}

const teacherName = {
  fontSize: '14px',
  fontWeight: '750',
  color: '#0F172A',
}

const teacherRole = {
  marginTop: '3px',
  fontSize: '11px',
  color: '#94A3B8',
}

const capacityWrapper = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
}

const loadBadge = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: '36px',
  height: '32px',
  padding: '0 10px',
  borderRadius: '9px',
  background: '#EFF6FF',
  border: '1px solid #BFDBFE',
  color: '#1D4ED8',
  fontSize: '13px',
  fontWeight: '850',
}

const capacityText = {
  fontSize: '11px',
  color: '#64748B',
}

const actionGroup = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '7px',
}

const editButton = {
  padding: '8px 14px',
  borderRadius: '8px',
  border: '1px solid #CBD5E1',
  background: '#FFFFFF',
  color: '#334155',
  fontSize: '11px',
  fontWeight: '750',
  cursor: 'pointer',
}

const deleteButton = {
  padding: '8px 14px',
  borderRadius: '8px',
  border: '1px solid #FECACA',
  background: '#FFF7F7',
  color: '#DC2626',
  fontSize: '11px',
  fontWeight: '750',
  cursor: 'pointer',
}

/* ================================================================
   PAGINATION
================================================================ */

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
  boxShadow: '0 4px 10px rgba(37,99,235,0.18)',
}

const paginationDots = {
  padding: '0 3px',
  color: '#94A3B8',
}

/* ================================================================
   STATES
================================================================ */

const stateCard = {
  margin: '0 24px 24px',
  padding: '55px 24px',
  textAlign: 'center',
  border: '1px dashed #CBD5E1',
  borderRadius: '13px',
  background: '#FAFCFF',
}

const emptyIcon = {
  width: '48px',
  height: '48px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  margin: '0 auto 12px',
  borderRadius: '14px',
  background: '#EFF6FF',
  color: '#2563EB',
  fontSize: '26px',
}

const stateTitle = {
  fontSize: '15px',
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
  fontWeight: '750',
  cursor: 'pointer',
}

const loadingSpinner = {
  width: '27px',
  height: '27px',
  margin: '0 auto 14px',
  border: '3px solid #DBEAFE',
  borderTopColor: '#2563EB',
  borderRadius: '50%',
}

/* ================================================================
   INFO
================================================================ */

const infoBanner = {
  display: 'flex',
  alignItems: 'center',
  gap: '9px',
  marginTop: '15px',
  padding: '11px 14px',
  borderRadius: '10px',
  background: 'rgba(248,250,252,0.75)',
  border: '1px solid #E2E8F0',
  color: '#64748B',
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
  background: '#E0E7FF',
  color: '#4338CA',
  fontSize: '10px',
  fontWeight: '800',
}

/* ================================================================
   MODAL
================================================================ */

const modalOverlay = {
  position: 'fixed',
  inset: 0,
  zIndex: 1000,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '24px',
  background: 'rgba(15,23,42,0.45)',
  backdropFilter: 'blur(5px)',
}

const modalCard = {
  width: '100%',
  maxWidth: '500px',
  maxHeight: '90vh',
  overflowY: 'auto',
  background: '#FFFFFF',
  borderRadius: '18px',
  boxShadow: '0 24px 70px rgba(15,23,42,0.22)',
}

const modalHeader = {
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: '16px',
  padding: '23px 24px',
  borderBottom: '1px solid #E2E8F0',
}

const modalTitle = {
  fontSize: '19px',
  fontWeight: '850',
  color: '#0F172A',
}

const modalSubtitle = {
  marginTop: '5px',
  fontSize: '12px',
  lineHeight: '1.5',
  color: '#64748B',
}

const modalCloseButton = {
  width: '33px',
  height: '33px',
  flexShrink: 0,
  border: 'none',
  borderRadius: '9px',
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
  height: '46px',
  borderRadius: '10px',
  background: '#F8FAFC',
  border: '1px solid #CBD5E1',
  fontSize: '14px',
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

/* ================================================================
   ACADEMIC BACKGROUND
================================================================ */

const academicBackground = {
  position: 'absolute',
  inset: 0,
  zIndex: -1,
  pointerEvents: 'none',
  overflow: 'hidden',
}

const backgroundGrid = {
  position: 'absolute',
  inset: 0,
  opacity: 0.14,
  backgroundImage: `
    linear-gradient(
      rgba(37, 99, 235, 0.08) 1px,
      transparent 1px
    ),
    linear-gradient(
      90deg,
      rgba(37, 99, 235, 0.08) 1px,
      transparent 1px
    )
  `,
  backgroundSize: '42px 42px',
  maskImage:
    'linear-gradient(to bottom right, transparent 12%, black 62%, transparent 100%)',
}

const backgroundRoom = {
  position: 'absolute',
  right: '-55px',
  bottom: '5px',
  width: '460px',
  height: '320px',
  opacity: 0.075,
  transform: 'rotate(-3deg)',
}

const roomWall = {
  position: 'absolute',
  inset: '18px 25px 55px 25px',
  border: '2px solid #2563EB',
  borderRadius: '10px',
  background:
    'linear-gradient(135deg, rgba(37,99,235,0.08), rgba(255,255,255,0.01))',
}

const roomBoard = {
  position: 'absolute',
  top: '42px',
  left: '85px',
  width: '205px',
  height: '78px',
  border: '2px solid #2563EB',
  borderRadius: '5px',
  background: 'rgba(37,99,235,0.04)',
  boxShadow:
    'inset 0 0 0 1px rgba(37,99,235,0.05)',
}

const roomDoor = {
  position: 'absolute',
  right: '53px',
  top: '42px',
  width: '48px',
  height: '105px',
  border: '2px solid #2563EB',
  borderBottom: 'none',
  borderRadius: '4px 4px 0 0',
  background: 'rgba(37,99,235,0.025)',
}

const roomDeskRow = {
  display: 'flex',
  gap: '18px',
  marginLeft: '65px',
  marginBottom: '18px',
  transform: 'translateY(165px)',
}

const roomDesk = {
  display: 'block',
  width: '62px',
  height: '30px',
  border: '2px solid #2563EB',
  borderRadius: '5px',
  background: 'rgba(37,99,235,0.025)',
}