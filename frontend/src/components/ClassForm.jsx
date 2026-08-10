import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import ConfirmModal from './ConfirmModal'
import * as S from '../styles/formStyles'

const BASE = 'http://localhost:8000'

export default function ClassForm() {
  const [classes, setClasses] = useState([])

  const [name, setName] = useState('')
  const [search, setSearch] = useState('')

  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)

  const [deleteTarget, setDeleteTarget] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    fetchClasses()
  }, [])

  async function fetchClasses() {
    setLoading(true)
    setError('')

    try {
      const res = await axios.get(`${BASE}/classes`)
      setClasses(res.data)
    } catch {
      setError(
        'Could not load classes. Please check that the backend is running.'
      )
    } finally {
      setLoading(false)
    }
  }

  function resetForm() {
    setName('')
    setEditingId(null)
  }

  function openAddModal() {
    resetForm()
    setMessage('')
    setError('')
    setIsModalOpen(true)
  }

  function openEditModal(classItem) {
    setEditingId(classItem.class_id)
    setName(classItem.class_name)

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

    if (!trimmedName) {
      setError('Class name is required.')
      return
    }

    const duplicate = classes.some(
      classItem =>
        classItem.class_id !== editingId &&
        classItem.class_name.trim().toLowerCase() ===
          trimmedName.toLowerCase()
    )

    if (duplicate) {
      setError(`A class named "${trimmedName}" already exists.`)
      return
    }

    setSaving(true)

    try {
      if (editingId) {
        await axios.put(`${BASE}/classes/${editingId}`, {
          class_name: trimmedName,
        })

        setMessage(`"${trimmedName}" updated successfully.`)
      } else {
        await axios.post(`${BASE}/classes`, {
          class_name: trimmedName,
        })

        setMessage(`"${trimmedName}" added successfully.`)
      }

      setIsModalOpen(false)
      resetForm()

      await fetchClasses()
    } catch (err) {
      const detail = err.response?.data?.detail

      if (err.response?.status === 409) {
        setError(detail || 'A class with this name already exists.')
      } else {
        setError(detail || 'Error saving class.')
      }
    } finally {
      setSaving(false)
    }
  }

  function promptDelete(classItem) {
    setDeleteTarget(classItem)
    setMessage('')
    setError('')
  }

  async function confirmDelete() {
    if (!deleteTarget) return

    setIsDeleting(true)
    setMessage('')
    setError('')

    try {
      await axios.delete(`${BASE}/classes/${deleteTarget.class_id}`)

      setMessage(
        `"${deleteTarget.class_name}" deleted successfully.`
      )

      await fetchClasses()
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          'Error deleting class. Please try again.'
      )
    } finally {
      setIsDeleting(false)
      setDeleteTarget(null)
    }
  }

  const filteredClasses = useMemo(() => {
    const query = search.trim().toLowerCase()

    if (!query) return classes

    return classes.filter(classItem =>
      classItem.class_name.toLowerCase().includes(query)
    )
  }, [classes, search])

  const totalClasses = classes.length
  const configured = totalClasses > 0

  return (
    <div style={page}>

      {/* =========================================================
          ACADEMIC BACKGROUND
      ========================================================= */}

      <div style={academicBackground} aria-hidden="true">
        <div style={backgroundGlowOne} />
        <div style={backgroundGlowTwo} />

        <div style={blueprintGrid} />

        <div style={blueprintScene}>

          <div style={blueprintBuilding}>
            <div style={buildingRoof} />

            <div style={buildingBody}>
              <div style={buildingDoor} />

              <div style={buildingWindows}>
                <span />
                <span />
                <span />
                <span />
                <span />
                <span />
                <span />
                <span />
              </div>
            </div>
          </div>

          <div style={classroomPlan}>
            <div style={classroomBoard} />

            <div style={classroomDesks}>
              <span />
              <span />
              <span />
              <span />
              <span />
              <span />
              <span />
              <span />
              <span />
              <span />
              <span />
              <span />
            </div>
          </div>

          <div style={blueprintLineOne} />
          <div style={blueprintLineTwo} />
          <div style={blueprintCircleOne} />
          <div style={blueprintCircleTwo} />

        </div>
      </div>


      {/* =========================================================
          HERO HEADER
      ========================================================= */}

      <section style={heroCard}>

        <div style={heroContent}>

          <div style={heroIcon}>
            <span style={heroIconBuilding}>▦</span>
          </div>

          <div>
            <div style={heroEyebrow}>
              ACADEMIC SCHEDULING
            </div>

            <h1 style={heroTitle}>
              Classes
            </h1>

            <div style={heroSubtitle}>
              Class Group Management
            </div>

            <p style={heroDescription}>
              Organize student groups used by the automated timetable system.
            </p>
          </div>

        </div>

        <button
          type="button"
          onClick={openAddModal}
          style={heroButton}
        >
          <span style={heroButtonPlus}>+</span>
          Add Class
        </button>

      </section>


      {/* =========================================================
          STATS
      ========================================================= */}

      <section style={statsGrid}>

        <div style={statCardBlue}>
          <div style={statIconBlue}>
            ▦
          </div>

          <div>
            <div style={statLabel}>
              TOTAL CLASSES
            </div>

            <div style={statNumberBlue}>
              {totalClasses}
            </div>
          </div>

          <div style={statDecorationBlue} />
        </div>


        <div style={statCardGreen}>
          <div style={statIconGreen}>
            ✓
          </div>

          <div>
            <div style={statLabel}>
              CONFIGURATION
            </div>

            <div style={statNumberGreen}>
              {configured ? 'Ready' : 'Pending'}
            </div>
          </div>

          <div style={statDecorationGreen} />
        </div>


        <div style={statCardPurple}>
          <div style={statIconPurple}>
            ◇
          </div>

          <div>
            <div style={statLabel}>
              SCHEDULING ROLE
            </div>

            <div style={statNumberPurple}>
              Class Groups
            </div>
          </div>

          <div style={statDecorationPurple} />
        </div>

      </section>


      {/* =========================================================
          MESSAGES
      ========================================================= */}

      {message && (
        <div style={successBanner}>
          <span style={successIcon}>✓</span>
          {message}
        </div>
      )}

      {error && !isModalOpen && (
        <div style={errorBanner}>
          <span style={errorIcon}>!</span>
          {error}
        </div>
      )}


      {/* =========================================================
          CLASS DIRECTORY
      ========================================================= */}

      <section style={directoryCard}>

        {/* DIRECTORY HEADER */}

        <div style={directoryHeader}>

          <div style={directoryHeaderLeft}>

            <div style={directoryIcon}>
              ▦
            </div>

            <div>
              <div style={directoryEyebrow}>
                CLASS DIRECTORY
              </div>

              <h2 style={directoryTitle}>
                Class Groups
              </h2>

              <p style={directorySubtitle}>
                Student groups available for timetable scheduling.
              </p>
            </div>

          </div>


          <div style={directoryHeaderRight}>

            <div style={countPill}>
              {filteredClasses.length} class
              {filteredClasses.length !== 1 ? 'es' : ''}
            </div>

            <button
              type="button"
              onClick={openAddModal}
              style={smallAddButton}
            >
              <span>+</span>
              Add
            </button>

          </div>

        </div>


        {/* SEARCH */}

        <div style={searchArea}>

          <div style={searchWrapper}>

            <span style={searchIcon}>
              ⌕
            </span>

            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search classes by name..."
              style={searchInput}
            />

            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                style={clearButton}
              >
                ×
              </button>
            )}

          </div>

        </div>


        {/* =====================================================
            CONTENT
        ===================================================== */}

        {loading ? (

          <div style={stateCard}>

            <div style={spinner} />

            <div style={stateTitle}>
              Loading classes...
            </div>

            <div style={stateText}>
              Fetching the latest class directory.
            </div>

          </div>

        ) : filteredClasses.length === 0 ? (

          <div style={emptyState}>

            <div style={emptyVisual}>

              <div style={emptyBlockOne}>
                A
              </div>

              <div style={emptyBlockTwo}>
                B
              </div>

              <div style={emptyBlockThree}>
                C
              </div>

            </div>

            <div style={stateTitle}>
              {search
                ? 'No classes found'
                : 'No classes added yet'}
            </div>

            <div style={stateText}>
              {search
                ? `No class matches "${search}".`
                : 'Create your first class group to start scheduling.'}
            </div>

            {!search && (
              <button
                type="button"
                onClick={openAddModal}
                style={secondaryButton}
              >
                + Add Class
              </button>
            )}

          </div>

        ) : (

          <div style={tableWrapper}>

            <table style={S.table}>

              <thead>
                <tr>

                  <th
                    style={{
                      ...S.th,
                      width: '75px',
                      textAlign: 'center',
                    }}
                  >
                    #
                  </th>

                  <th style={S.th}>
                    CLASS GROUP
                  </th>

                  <th
                    style={{
                      ...S.th,
                      width: '250px',
                    }}
                  >
                    SCHEDULING ROLE
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

                {filteredClasses.map((classItem, index) => (

                  <tr
                    key={classItem.class_id}
                    style={{
                      background:
                        index % 2 === 0
                          ? '#FFFFFF'
                          : '#FBFDFF',
                    }}
                  >

                    {/* NUMBER */}

                    <td
                      style={{
                        ...S.td,
                        textAlign: 'center',
                      }}
                    >
                      <span style={rowNumber}>
                        {String(index + 1).padStart(2, '0')}
                      </span>
                    </td>


                    {/* CLASS */}

                    <td style={S.td}>

                      <div style={classIdentity}>

                        <div style={classAvatar}>
                          {getInitials(classItem.class_name)}
                        </div>

                        <div>

                          <div style={className}>
                            {classItem.class_name}
                          </div>

                          <div style={classDescription}>
                            Scheduled class group
                          </div>

                        </div>

                      </div>

                    </td>


                    {/* ROLE */}

                    <td style={S.td}>

                      <span style={roleBadge}>

                        <span style={roleDot} />

                        CLASS GROUP

                      </span>

                    </td>


                    {/* ACTIONS */}

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
                            openEditModal(classItem)
                          }
                          style={editButton}
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            promptDelete(classItem)
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

        )}


        {/* FOOTER */}

        {!loading && filteredClasses.length > 0 && (

          <div style={directoryFooter}>

            <span>
              Showing {filteredClasses.length} of {classes.length}{' '}
              class{classes.length !== 1 ? 'es' : ''}
            </span>

            <span style={footerStatus}>

              <span style={footerDot} />

              Ready for scheduling

            </span>

          </div>

        )}

      </section>


      {/* =========================================================
          ADD / EDIT MODAL
      ========================================================= */}

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

            <div style={modalAccent} />

            <div style={modalHeader}>

              <div>

                <div style={modalEyebrow}>
                  CLASS GROUP
                </div>

                <div style={modalTitle}>
                  {editingId
                    ? 'Edit Class'
                    : 'Add Class'}
                </div>

                <div style={modalSubtitle}>
                  {editingId
                    ? 'Update the class group name.'
                    : 'Create a class group for timetable scheduling.'}
                </div>

              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                style={modalCloseButton}
              >
                ×
              </button>

            </div>


            <form onSubmit={handleSubmit}>

              <div style={modalBody}>

                <div style={S.fieldWrap}>

                  <label style={S.label}>
                    Class Name
                  </label>

                  <input
                    autoFocus
                    type="text"
                    value={name}
                    onChange={e => {
                      setName(e.target.value)
                      setError('')
                    }}
                    placeholder="e.g. CS-A"
                    maxLength={100}
                    disabled={saving}
                    style={modalInput}
                  />

                  <div style={fieldHint}>
                    Example: CS-A, CS-B, AI-A
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
                    minWidth: '130px',
                    opacity: saving ? 0.7 : 1,
                  }}
                >
                  {saving
                    ? 'Saving...'
                    : editingId
                      ? 'Save Changes'
                      : '+ Add Class'}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}


      {/* =========================================================
          DELETE MODAL
      ========================================================= */}

      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Delete Class"
        itemName={deleteTarget?.class_name}
        message="Are you sure you want to delete this class? This may affect associated timetable entries."
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
    .split(/[\s-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase())
    .join('')
}


/* ================================================================
   PAGE
================================================================ */

const page = {
  position: 'relative',
  minHeight: '100%',
  padding: '8px 4px 50px',
  boxSizing: 'border-box',
}


/* ================================================================
   ACADEMIC BACKGROUND
================================================================ */

const academicBackground = {
  position: 'absolute',
  inset: 0,
  overflow: 'hidden',
  pointerEvents: 'none',
  zIndex: 0,
}

const backgroundGlowOne = {
  position: 'absolute',
  top: '-160px',
  right: '-100px',
  width: '600px',
  height: '600px',
  borderRadius: '50%',
  background:
    'radial-gradient(circle, rgba(59,130,246,0.12) 0%, rgba(96,165,250,0.045) 42%, transparent 72%)',
}

const backgroundGlowTwo = {
  position: 'absolute',
  bottom: '-250px',
  left: '25%',
  width: '700px',
  height: '500px',
  borderRadius: '50%',
  background:
    'radial-gradient(circle, rgba(99,102,241,0.07) 0%, rgba(129,140,248,0.025) 45%, transparent 72%)',
}

const blueprintGrid = {
  position: 'absolute',
  inset: 0,
  opacity: 0.17,
  backgroundImage: `
    linear-gradient(
      rgba(37,99,235,0.045) 1px,
      transparent 1px
    ),
    linear-gradient(
      90deg,
      rgba(37,99,235,0.045) 1px,
      transparent 1px
    )
  `,
  backgroundSize: '44px 44px',
  maskImage:
    'linear-gradient(to bottom right, transparent 5%, black 45%, transparent 100%)',
}

const blueprintScene = {
  position: 'absolute',
  right: '-15px',
  bottom: '-10px',
  width: '650px',
  height: '470px',
  opacity: 0.16,
  transform: 'rotate(-2deg)',
}

const blueprintBuilding = {
  position: 'absolute',
  top: '20px',
  right: '70px',
  width: '310px',
  height: '220px',
}

const buildingRoof = {
  position: 'absolute',
  top: 0,
  left: '50px',
  width: '210px',
  height: '100px',
  borderTop: '2px solid rgba(37,99,235,0.35)',
  borderLeft: '2px solid rgba(37,99,235,0.35)',
  borderRight: '2px solid rgba(37,99,235,0.35)',
  transform: 'perspective(300px) rotateX(25deg)',
  borderRadius: '8px 8px 0 0',
}

const buildingBody = {
  position: 'absolute',
  bottom: 0,
  left: 0,
  width: '310px',
  height: '145px',
  border:
    '2px solid rgba(37,99,235,0.30)',
  borderRadius: '8px',
  background: 'rgba(59,130,246,0.015)',
}

const buildingDoor = {
  position: 'absolute',
  bottom: 0,
  left: '50%',
  transform: 'translateX(-50%)',
  width: '42px',
  height: '70px',
  border:
    '2px solid rgba(37,99,235,0.28)',
  borderBottom: 'none',
  borderRadius: '6px 6px 0 0',
}

const buildingWindows = {
  position: 'absolute',
  top: '38px',
  left: '35px',
  right: '35px',
  display: 'grid',
  gridTemplateColumns: 'repeat(4, 1fr)',
  gap: '16px',
}

const buildingWindowsSpan = {
  display: 'block',
  height: '27px',
  border:
    '2px solid rgba(37,99,235,0.25)',
  borderRadius: '4px',
}

const classroomPlan = {
  position: 'absolute',
  right: '15px',
  bottom: '30px',
  width: '340px',
  height: '190px',
  border:
    '2px solid rgba(37,99,235,0.28)',
  borderRadius: '18px',
  background: 'rgba(37,99,235,0.012)',
}

const classroomBoard = {
  position: 'absolute',
  top: '20px',
  left: '50%',
  transform: 'translateX(-50%)',
  width: '150px',
  height: '38px',
  border:
    '2px solid rgba(37,99,235,0.30)',
  borderRadius: '5px',
}

const classroomDesks = {
  position: 'absolute',
  left: '50%',
  bottom: '25px',
  transform: 'translateX(-50%)',
  display: 'grid',
  gridTemplateColumns: 'repeat(4, 42px)',
  gap: '11px 13px',
}

const blueprintLineOne = {
  position: 'absolute',
  top: '275px',
  left: '0',
  width: '120px',
  height: '1px',
  background: 'rgba(37,99,235,0.28)',
  transform: 'rotate(-20deg)',
}

const blueprintLineTwo = {
  position: 'absolute',
  bottom: '35px',
  left: '60px',
  width: '90px',
  height: '1px',
  background: 'rgba(37,99,235,0.22)',
}

const blueprintCircleOne = {
  position: 'absolute',
  top: '250px',
  left: '40px',
  width: '30px',
  height: '30px',
  borderRadius: '50%',
  border:
    '1px solid rgba(37,99,235,0.24)',
}

const blueprintCircleTwo = {
  position: 'absolute',
  bottom: '0',
  right: '25px',
  width: '42px',
  height: '42px',
  borderRadius: '50%',
  border:
    '1px solid rgba(37,99,235,0.20)',
}


/* ================================================================
   HERO
================================================================ */

const heroCard = {
  position: 'relative',
  zIndex: 2,
  minHeight: '180px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '30px',
  padding: '30px 28px',
  marginBottom: '20px',
  overflow: 'hidden',
  border:
    '1px solid rgba(203,213,225,0.82)',
  borderRadius: '20px',
  background:
    'linear-gradient(110deg, rgba(255,255,255,0.98) 0%, rgba(248,251,255,0.97) 58%, rgba(239,246,255,0.92) 100%)',
  boxShadow:
    '0 12px 35px rgba(15,23,42,0.045)',
  boxSizing: 'border-box',
}

const heroContent = {
  position: 'relative',
  zIndex: 2,
  display: 'flex',
  alignItems: 'center',
  gap: '18px',
}

const heroIcon = {
  width: '64px',
  height: '64px',
  flexShrink: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '17px',
  background:
    'linear-gradient(135deg, #EFF6FF, #DBEAFE)',
  border:
    '1px solid #BFDBFE',
  boxShadow:
    '0 8px 22px rgba(37,99,235,0.10)',
}

const heroIconBuilding = {
  fontSize: '30px',
  color: '#2563EB',
  lineHeight: 1,
}

const heroEyebrow = {
  marginBottom: '5px',
  fontSize: '10px',
  fontWeight: '850',
  letterSpacing: '0.16em',
  color: '#2563EB',
}

const heroTitle = {
  margin: 0,
  fontSize: '31px',
  lineHeight: 1.05,
  fontWeight: '850',
  letterSpacing: '-0.035em',
  color: '#10213F',
}

const heroSubtitle = {
  marginTop: '7px',
  fontSize: '15px',
  fontWeight: '750',
  color: '#29446F',
}

const heroDescription = {
  margin: '5px 0 0',
  fontSize: '12px',
  color: '#71829D',
}

const heroButton = {
  position: 'relative',
  zIndex: 3,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  minHeight: '44px',
  padding: '0 19px',
  flexShrink: 0,
  border: 'none',
  borderRadius: '10px',
  background: '#2563EB',
  color: '#FFFFFF',
  fontSize: '12px',
  fontWeight: '800',
  cursor: 'pointer',
  boxShadow:
    '0 9px 22px rgba(37,99,235,0.22)',
}

const heroButtonPlus = {
  fontSize: '18px',
  lineHeight: 1,
}


/* ================================================================
   STATS
================================================================ */

const statsGrid = {
  position: 'relative',
  zIndex: 2,
  display: 'grid',
  gridTemplateColumns:
    'repeat(3, minmax(0, 1fr))',
  gap: '14px',
  marginBottom: '20px',
}

const baseStatCard = {
  position: 'relative',
  minHeight: '88px',
  display: 'flex',
  alignItems: 'center',
  gap: '14px',
  overflow: 'hidden',
  padding: '18px 20px',
  border:
    '1px solid rgba(203,213,225,0.82)',
  borderRadius: '16px',
  background: 'rgba(255,255,255,0.94)',
  boxShadow:
    '0 8px 25px rgba(15,23,42,0.035)',
  boxSizing: 'border-box',
}

const statCardBlue = {
  ...baseStatCard,
}

const statCardGreen = {
  ...baseStatCard,
}

const statCardPurple = {
  ...baseStatCard,
}

const statIconBlue = {
  width: '42px',
  height: '42px',
  flexShrink: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '12px',
  background: '#EFF6FF',
  border: '1px solid #DBEAFE',
  color: '#2563EB',
  fontSize: '19px',
}

const statIconGreen = {
  ...statIconBlue,
  background: '#ECFDF5',
  border: '1px solid #D1FAE5',
  color: '#059669',
}

const statIconPurple = {
  ...statIconBlue,
  background: '#F5F3FF',
  border: '1px solid #E9D5FF',
  color: '#7C3AED',
}

const statLabel = {
  marginBottom: '5px',
  fontSize: '9px',
  fontWeight: '850',
  letterSpacing: '0.12em',
  color: '#7A8BA5',
}

const statNumberBlue = {
  fontSize: '20px',
  fontWeight: '850',
  color: '#2563EB',
}

const statNumberGreen = {
  fontSize: '18px',
  fontWeight: '850',
  color: '#059669',
}

const statNumberPurple = {
  fontSize: '14px',
  fontWeight: '800',
  color: '#7C3AED',
}

const statDecorationBlue = {
  position: 'absolute',
  right: '-20px',
  bottom: '-35px',
  width: '120px',
  height: '80px',
  borderRadius: '50%',
  background: 'rgba(37,99,235,0.055)',
}

const statDecorationGreen = {
  ...statDecorationBlue,
  background: 'rgba(16,185,129,0.055)',
}

const statDecorationPurple = {
  ...statDecorationBlue,
  background: 'rgba(124,58,237,0.055)',
}


/* ================================================================
   MESSAGES
================================================================ */

const successBanner = {
  position: 'relative',
  zIndex: 3,
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
  position: 'relative',
  zIndex: 3,
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

const successIcon = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '20px',
  height: '20px',
  borderRadius: '50%',
  background: '#DCFCE7',
  color: '#15803D',
  fontWeight: '800',
}

const errorIcon = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '20px',
  height: '20px',
  borderRadius: '50%',
  background: '#FEE2E2',
  color: '#DC2626',
  fontWeight: '800',
}


/* ================================================================
   DIRECTORY
================================================================ */

const directoryCard = {
  position: 'relative',
  zIndex: 2,
  overflow: 'hidden',
  border:
    '1px solid rgba(203,213,225,0.82)',
  borderRadius: '18px',
  background: 'rgba(255,255,255,0.96)',
  boxShadow:
    '0 12px 35px rgba(15,23,42,0.045)',
}

const directoryHeader = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '20px',
  padding: '22px 24px 17px',
}

const directoryHeaderLeft = {
  display: 'flex',
  alignItems: 'center',
  gap: '13px',
}

const directoryHeaderRight = {
  display: 'flex',
  alignItems: 'center',
  gap: '9px',
}

const directoryIcon = {
  width: '42px',
  height: '42px',
  flexShrink: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '12px',
  background: '#EFF6FF',
  border: '1px solid #DBEAFE',
  color: '#2563EB',
  fontSize: '21px',
}

const directoryEyebrow = {
  marginBottom: '3px',
  fontSize: '9px',
  fontWeight: '850',
  letterSpacing: '0.13em',
  color: '#6B8FC5',
}

const directoryTitle = {
  margin: 0,
  fontSize: '17px',
  fontWeight: '850',
  color: '#162A4A',
}

const directorySubtitle = {
  margin: '4px 0 0',
  fontSize: '11px',
  color: '#8190A8',
}

const countPill = {
  padding: '8px 12px',
  borderRadius: '999px',
  background: '#F8FBFF',
  border: '1px solid #BFDBFE',
  color: '#2563EB',
  fontSize: '10px',
  fontWeight: '850',
}

const smallAddButton = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '6px',
  height: '35px',
  padding: '0 12px',
  borderRadius: '9px',
  border: '1px solid #BFDBFE',
  background: '#EFF6FF',
  color: '#1D4ED8',
  fontSize: '11px',
  fontWeight: '800',
  cursor: 'pointer',
}

const searchArea = {
  padding: '0 24px 17px',
}

const searchWrapper = {
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
}

const searchIcon = {
  position: 'absolute',
  left: '14px',
  zIndex: 1,
  color: '#8292AA',
  fontSize: '20px',
  lineHeight: 1,
  transform: 'rotate(-20deg)',
}

const searchInput = {
  width: '100%',
  height: '43px',
  boxSizing: 'border-box',
  padding: '0 42px',
  border: '1px solid #CBD5E1',
  borderRadius: '10px',
  background: '#FAFCFF',
  color: '#172B4D',
  fontFamily: 'inherit',
  fontSize: '12px',
  outline: 'none',
}

const clearButton = {
  position: 'absolute',
  right: '11px',
  width: '24px',
  height: '24px',
  border: 'none',
  borderRadius: '50%',
  background: '#E2E8F0',
  color: '#475569',
  fontSize: '16px',
  cursor: 'pointer',
}

const tableWrapper = {
  width: '100%',
  overflowX: 'auto',
  borderTop: '1px solid #E2E8F0',
}

const rowNumber = {
  fontSize: '11px',
  fontWeight: '850',
  letterSpacing: '0.04em',
  color: '#2563EB',
}

const classIdentity = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
}

const classAvatar = {
  width: '40px',
  height: '40px',
  flexShrink: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '12px',
  background:
    'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)',
  border: '1px solid #BFDBFE',
  color: '#1D4ED8',
  fontSize: '11px',
  fontWeight: '850',
}

const className = {
  fontSize: '14px',
  fontWeight: '850',
  color: '#162A4A',
}

const classDescription = {
  marginTop: '3px',
  fontSize: '10px',
  color: '#94A3B8',
}

const roleBadge = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '7px',
  padding: '7px 11px',
  borderRadius: '999px',
  background: '#F8FAFC',
  border: '1px solid #E2E8F0',
  color: '#52637D',
  fontSize: '9px',
  fontWeight: '800',
  letterSpacing: '0.05em',
}

const roleDot = {
  width: '6px',
  height: '6px',
  borderRadius: '50%',
  background: '#3B82F6',
  boxShadow: '0 0 0 3px #DBEAFE',
}

const actionGroup = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  gap: '7px',
}

const editButton = {
  padding: '8px 13px',
  borderRadius: '8px',
  border: '1px solid #BFDBFE',
  background: '#EFF6FF',
  color: '#1D4ED8',
  fontSize: '11px',
  fontWeight: '800',
  cursor: 'pointer',
}

const deleteButton = {
  padding: '8px 13px',
  borderRadius: '8px',
  border: '1px solid #FECACA',
  background: '#FEF2F2',
  color: '#DC2626',
  fontSize: '11px',
  fontWeight: '800',
  cursor: 'pointer',
}

const directoryFooter = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '12px',
  padding: '13px 24px',
  borderTop: '1px solid #E2E8F0',
  fontSize: '10px',
  fontWeight: '600',
  color: '#8795AA',
}

const footerStatus = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '7px',
}

const footerDot = {
  width: '6px',
  height: '6px',
  borderRadius: '50%',
  background: '#22C55E',
  boxShadow: '0 0 0 3px #DCFCE7',
}


/* ================================================================
   STATES
================================================================ */

const stateCard = {
  margin: '0 24px 24px',
  padding: '55px 20px',
  textAlign: 'center',
  border: '1px dashed #CBD5E1',
  borderRadius: '13px',
  background: '#FAFCFF',
}

const emptyState = {
  margin: '0 24px 24px',
  padding: '60px 20px',
  textAlign: 'center',
  border: '1px dashed #CBD5E1',
  borderRadius: '14px',
  background:
    'linear-gradient(135deg, #FAFCFF, #F8FBFF)',
}

const emptyVisual = {
  display: 'flex',
  alignItems: 'flex-end',
  justifyContent: 'center',
  gap: '6px',
  height: '52px',
  marginBottom: '16px',
}

const emptyBlockOne = {
  width: '34px',
  height: '28px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: '1px solid #BFDBFE',
  borderRadius: '7px',
  background: '#EFF6FF',
  color: '#2563EB',
  fontSize: '10px',
  fontWeight: '800',
}

const emptyBlockTwo = {
  ...emptyBlockOne,
  height: '40px',
  background: '#DBEAFE',
}

const emptyBlockThree = {
  ...emptyBlockOne,
  height: '34px',
}

const stateTitle = {
  marginBottom: '5px',
  fontSize: '14px',
  fontWeight: '800',
  color: '#1E293B',
}

const stateText = {
  fontSize: '12px',
  lineHeight: '1.5',
  color: '#64748B',
}

const secondaryButton = {
  marginTop: '18px',
  padding: '9px 16px',
  borderRadius: '9px',
  border: '1px solid #BFDBFE',
  background: '#EFF6FF',
  color: '#1D4ED8',
  fontSize: '12px',
  fontWeight: '800',
  cursor: 'pointer',
}

const spinner = {
  width: '27px',
  height: '27px',
  margin: '0 auto 14px',
  border: '3px solid #DBEAFE',
  borderTopColor: '#2563EB',
  borderRadius: '50%',
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
  background: 'rgba(15, 23, 42, 0.48)',
  backdropFilter: 'blur(7px)',
}

const modalCard = {
  position: 'relative',
  width: '100%',
  maxWidth: '470px',
  overflow: 'hidden',
  borderRadius: '19px',
  background: '#FFFFFF',
  boxShadow:
    '0 28px 80px rgba(15, 23, 42, 0.24)',
}

const modalAccent = {
  height: '4px',
  background:
    'linear-gradient(90deg, #2563EB, #60A5FA, #BFDBFE)',
}

const modalHeader = {
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: '16px',
  padding: '24px 25px 21px',
  borderBottom: '1px solid #E2E8F0',
}

const modalEyebrow = {
  marginBottom: '5px',
  fontSize: '9px',
  fontWeight: '850',
  letterSpacing: '0.12em',
  color: '#6B8FC5',
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
  width: '32px',
  height: '32px',
  flexShrink: 0,
  border: 'none',
  borderRadius: '9px',
  background: '#F1F5F9',
  color: '#475569',
  fontSize: '21px',
  cursor: 'pointer',
}

const modalBody = {
  padding: '25px',
}

const modalInput = {
  ...S.input,
  width: '100%',
  height: '46px',
  boxSizing: 'border-box',
  borderRadius: '10px',
  background: '#F8FAFC',
  border: '1px solid #CBD5E1',
  fontSize: '13px',
}

const fieldHint = {
  marginTop: '6px',
  fontSize: '10px',
  color: '#94A3B8',
}

const modalError = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  marginTop: '18px',
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
  justifyContent: 'flex-end',
  alignItems: 'center',
  gap: '9px',
  padding: '16px 25px 21px',
  borderTop: '1px solid #E2E8F0',
}

const cancelButton = {
  padding: '11px 18px',
  borderRadius: '9px',
  border: '1px solid #CBD5E1',
  background: '#FFFFFF',
  color: '#475569',
  fontSize: '12px',
  fontWeight: '750',
  cursor: 'pointer',
}

const primaryButton = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  minHeight: '44px',
  padding: '0 18px',
  border: 'none',
  borderRadius: '10px',
  background: '#2563EB',
  color: '#FFFFFF',
  fontSize: '12px',
  fontWeight: '800',
  cursor: 'pointer',
  boxShadow:
    '0 8px 20px rgba(37, 99, 235, 0.22)',
}


/* ================================================================
   RESPONSIVE
================================================================ */

if (typeof document !== 'undefined') {
  const styleId = 'classes-page-responsive-styles'

  if (!document.getElementById(styleId)) {
    const style = document.createElement('style')
    style.id = styleId

    style.innerHTML = `
      @media (max-width: 900px) {
        .classes-page-stats {
          grid-template-columns: 1fr 1fr !important;
        }
      }

      @media (max-width: 680px) {
        .classes-page-stats {
          grid-template-columns: 1fr !important;
        }

        .classes-page-hero {
          flex-direction: column !important;
          align-items: flex-start !important;
        }

        .classes-page-hero-button {
          width: 100% !important;
        }

        .classes-page-directory-header {
          flex-direction: column !important;
          align-items: flex-start !important;
        }

        .classes-page-directory-actions {
          width: 100% !important;
          justify-content: space-between !important;
        }
      }
    `

    document.head.appendChild(style)
  }
}