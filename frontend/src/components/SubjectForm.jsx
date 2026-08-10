import { useState, useEffect } from 'react'
import axios from 'axios'
import * as S from '../styles/formStyles'
import SubjectTypeBadge from './SubjectTypeBadge'
import ConfirmModal from './ConfirmModal'

const BASE = 'http://localhost:8000'

export default function SubjectForm() {
  const [classes, setClasses] = useState([])
  const [subjects, setSubjects] = useState([])

  const [selectedClassId, setSelectedClassId] = useState('')

  const [subjectName, setSubjectName] = useState('')
  const [selectedTypes, setSelectedTypes] = useState({
    theory: true,
    lab: false,
  })

  const [theoryPeriods, setTheoryPeriods] = useState(1)
  const [labPeriods, setLabPeriods] = useState(1)

  const [filterType, setFilterType] = useState('all')

  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const [deleteTarget, setDeleteTarget] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const [editingId, setEditingId] = useState(null)
  const [editingType, setEditingType] = useState(null)

  useEffect(() => {
    fetchAll()
  }, [])

  async function fetchAll() {
    try {
      const [cRes, sRes] = await Promise.all([
        axios.get(`${BASE}/classes`),
        axios.get(`${BASE}/subjects`),
      ])

      setClasses(cRes.data)
      setSubjects(sRes.data)
    } catch {
      setError(
        'Could not load data. Make sure the backend is running.'
      )
    }
  }

  function toggleType(type) {
    setSelectedTypes(prev => {
      const next = {
        ...prev,
        [type]: !prev[type],
      }

      if (!next.theory && !next.lab) {
        return prev
      }

      return next
    })
  }

  function handleEdit(subject) {
    setEditingId(subject.subject_id)
    setEditingType(subject.subject_type)

    setSubjectName(subject.subject_name)

    if (subject.subject_type === 'theory') {
      setSelectedTypes({
        theory: true,
        lab: false,
      })

      setTheoryPeriods(subject.periods_per_week)
    } else {
      setSelectedTypes({
        theory: false,
        lab: true,
      })

      setLabPeriods(subject.periods_per_week)
    }

    setMessage('')
    setError('')

    window.scrollTo({
      top: 250,
      behavior: 'smooth',
    })
  }

  function handleCancelEdit() {
    setEditingId(null)
    setEditingType(null)

    setSubjectName('')
    setTheoryPeriods(1)
    setLabPeriods(1)

    setSelectedTypes({
      theory: true,
      lab: false,
    })

    setMessage('')
    setError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()

    if (!selectedClassId || !subjectName.trim()) {
      return
    }

    setMessage('')
    setError('')

    try {
      if (editingId) {
        const periods =
          editingType === 'theory'
            ? parseInt(theoryPeriods)
            : parseInt(labPeriods)

        await axios.put(`${BASE}/subjects/${editingId}`, {
          subject_name: subjectName.trim(),
          periods_per_week: periods,
          subject_type: editingType,
          class_id: parseInt(selectedClassId),
        })

        setMessage(
          `"${subjectName.trim()}" updated successfully`
        )

        handleCancelEdit()
      } else {
        const entries = []

        if (selectedTypes.theory) {
          entries.push({
            subject_type: 'theory',
            periods_per_week: parseInt(theoryPeriods),
          })
        }

        if (selectedTypes.lab) {
          entries.push({
            subject_type: 'lab',
            periods_per_week: parseInt(labPeriods),
          })
        }

        for (const entry of entries) {
          await axios.post(`${BASE}/subjects`, {
            subject_name: subjectName.trim(),
            periods_per_week: entry.periods_per_week,
            subject_type: entry.subject_type,
            class_id: parseInt(selectedClassId),
          })
        }

        const both =
          selectedTypes.theory && selectedTypes.lab

        setMessage(
          both
            ? `"${subjectName.trim()}" added as Theory + Lab to ${getClassName(
                parseInt(selectedClassId)
              )}`
            : `"${subjectName.trim()}" added to ${getClassName(
                parseInt(selectedClassId)
              )}`
        )

        setSubjectName('')
        setTheoryPeriods(1)
        setLabPeriods(1)

        setSelectedTypes({
          theory: true,
          lab: false,
        })
      }

      await fetchAll()
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          'Error saving subject'
      )
    }
  }

  function promptDelete(subject) {
    setDeleteTarget(subject)
  }

  async function confirmDelete() {
    if (!deleteTarget) return

    setIsDeleting(true)
    setMessage('')
    setError('')

    try {
      await axios.delete(
        `${BASE}/subjects/${deleteTarget.subject_id}`
      )

      setMessage(
        `"${deleteTarget.subject_name}" (${deleteTarget.subject_type}) deleted successfully`
      )

      if (
        editingId === deleteTarget.subject_id
      ) {
        handleCancelEdit()
      }

      await fetchAll()
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          'Error deleting subject.'
      )
    } finally {
      setIsDeleting(false)
      setDeleteTarget(null)
    }
  }

  function handleClassSwitch(id) {
    setSelectedClassId(String(id))

    setFilterType('all')

    handleCancelEdit()

    setMessage('')
    setError('')
  }

  function getClassName(id) {
    return (
      classes.find(c => c.class_id === id)?.class_name ||
      `Class ${id}`
    )
  }

  const hasClass = !!selectedClassId

  const selectedClass = classes.find(
    c => c.class_id === parseInt(selectedClassId)
  )

  const classSubjects = hasClass
    ? subjects.filter(
        s => s.class_id === parseInt(selectedClassId)
      )
    : []

  const theoryCount = classSubjects.filter(
    s => s.subject_type === 'theory'
  ).length

  const labCount = classSubjects.filter(
    s => s.subject_type === 'lab'
  ).length

  const filteredSubjects =
    filterType === 'all'
      ? classSubjects
      : classSubjects.filter(
          s => s.subject_type === filterType
        )

  const bothTypes =
    selectedTypes.theory && selectedTypes.lab

  const canSubmit =
    hasClass &&
    subjectName.trim() &&
    (selectedTypes.theory || selectedTypes.lab)

  const typeToggleLocked = !!editingId

  return (
    <div
      style={{
        ...S.page,
        paddingBottom: '60px',
      }}
    >
      {/* =========================================================
          PAGE HERO
      ========================================================= */}

      <div
        style={{
          background:
            'linear-gradient(135deg, #FFFFFF 0%, #F8FBFF 100%)',
          border: '1px solid #CBD5E1',
          borderRadius: '24px',
          padding: '32px 28px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '24px',
          flexWrap: 'wrap',
          boxShadow:
            '0 8px 28px rgba(15, 23, 42, 0.04)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Subtle background decoration */}

        <div
          style={{
            position: 'absolute',
            right: '-60px',
            top: '-80px',
            width: '240px',
            height: '240px',
            borderRadius: '50%',
            border: '1px solid #DBEAFE',
            opacity: 0.6,
            pointerEvents: 'none',
          }}
        />

        {/* Heading content */}

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '18px',
            position: 'relative',
            zIndex: 1,
          }}
        >
          {/* Page icon */}

          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background:
                'linear-gradient(135deg, #EFF6FF, #DBEAFE)',
              border: '1px solid #BFDBFE',
              boxShadow:
                '0 8px 20px rgba(37, 99, 235, 0.08)',
              fontSize: '28px',
              flexShrink: 0,
            }}
          >
            📚
          </div>

          {/* Heading */}

          <div>
            <div
              style={{
                fontSize: '11px',
                fontWeight: '800',
                color: '#2563EB',
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                marginBottom: '7px',
              }}
            >
              ACADEMIC SCHEDULING
            </div>

            <div
              style={{
                fontSize: '30px',
                lineHeight: '1.1',
                fontWeight: '800',
                color: '#0F172A',
                marginBottom: '6px',
                letterSpacing: '-0.02em',
              }}
            >
              Subjects
            </div>

            <div
              style={{
                fontSize: '15px',
                lineHeight: '1.4',
                fontWeight: '700',
                color: '#1E3A5F',
                marginBottom: '5px',
              }}
            >
              Subject Configuration
            </div>

            <div
              style={{
                fontSize: '12px',
                lineHeight: '1.5',
                color: '#64748B',
              }}
            >
              Configure theory and laboratory subjects for each class.
            </div>
          </div>
        </div>

        {/* Stats */}

        <div
          style={{
            display: 'flex',
            gap: '8px',
            flexWrap: 'wrap',
            position: 'relative',
            zIndex: 1,
          }}
        >
          <div style={statChip}>
            <span style={statChipLabel}>
              Classes
            </span>

            <span style={statChipValue}>
              {classes.length}
            </span>
          </div>

          {hasClass && (
            <>
              <div
                style={{
                  ...statChip,
                  background: '#F8FAFC',
                }}
              >
                <span style={statChipLabel}>
                  Subjects
                </span>

                <span style={statChipValue}>
                  {classSubjects.length}
                </span>
              </div>

              <div
                style={{
                  ...statChip,
                  background: '#EFF6FF',
                  border: '1px solid #BFDBFE',
                }}
              >
                <span
                  style={{
                    ...statChipLabel,
                    color: '#1D4ED8',
                  }}
                >
                  Theory
                </span>

                <span
                  style={{
                    ...statChipValue,
                    color: '#1D4ED8',
                  }}
                >
                  {theoryCount}
                </span>
              </div>

              <div
                style={{
                  ...statChip,
                  background: '#FFFBEB',
                  border: '1px solid #FDE68A',
                }}
              >
                <span
                  style={{
                    ...statChipLabel,
                    color: '#A16207',
                  }}
                >
                  Labs
                </span>

                <span
                  style={{
                    ...statChipValue,
                    color: '#92400E',
                  }}
                >
                  {labCount}
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* =========================================================
          ACTIVE CLASS / CONTEXT
      ========================================================= */}

      <div
        style={{
          ...activeClassSection,
          borderColor: hasClass
            ? '#BFDBFE'
            : '#E2E8F0',
          background: hasClass
            ? 'linear-gradient(135deg, #F8FBFF 0%, #EFF6FF 100%)'
            : '#FFFFFF',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
          }}
        >
          <div style={selectorIcon}>
            🏫
          </div>

          <div>
            <div style={activeLabel}>
              ACTIVE CLASS
            </div>

            <div style={activeDescription}>
              All subjects below belong to the selected
              class.
            </div>
          </div>
        </div>

        {/* Class buttons */}

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            flexWrap: 'wrap',
            marginLeft: 'auto',
          }}
        >
          {classes.map(c => {
            const active =
              parseInt(selectedClassId) === c.class_id

            return (
              <button
                key={c.class_id}
                type="button"
                onClick={() =>
                  handleClassSwitch(c.class_id)
                }
                style={{
                  ...classSelectorButton,
                  ...(active
                    ? activeClassButton
                    : inactiveClassButton),
                }}
              >
                <span
                  style={{
                    fontSize: '12px',
                    opacity: active ? 0.8 : 0.55,
                  }}
                >
                  CLASS
                </span>

                <span
                  style={{
                    fontSize: '20px',
                    fontWeight: '800',
                    lineHeight: 1,
                  }}
                >
                  {c.class_name}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* =========================================================
          CURRENT CLASS DISPLAY
      ========================================================= */}

      {hasClass && (
        <div
          style={{
            ...currentClassBanner,
            borderColor: '#BFDBFE',
          }}
        >
          <div>
            <div style={currentClassSmall}>
              CURRENTLY MANAGING SUBJECTS FOR
            </div>

            <div style={currentClassName}>
              {selectedClass?.class_name}
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              flexWrap: 'wrap',
            }}
          >
            <span style={contextBadge}>
              {classSubjects.length} Subjects
            </span>

            <span
              style={{
                ...contextBadge,
                color: '#1D4ED8',
                background: '#EFF6FF',
                borderColor: '#BFDBFE',
              }}
            >
              {theoryCount} Theory
            </span>

            <span
              style={{
                ...contextBadge,
                color: '#92400E',
                background: '#FFFBEB',
                borderColor: '#FDE68A',
              }}
            >
              {labCount} Labs
            </span>
          </div>
        </div>
      )}

      {!hasClass && (
        <div style={noClassNotice}>
          <span style={{ fontSize: '18px' }}>
            👆
          </span>

          <div>
            <strong>Select a class first</strong>

            <div>
              Choose CS-A, CS-B or another class above
              before adding subjects.
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          ADD / EDIT SUBJECT
      ========================================================= */}

      <div
        style={{
          ...S.card,
          width: '100%',
          maxWidth: 'none',
          marginTop: '20px',
          marginBottom: '24px',
          padding: '26px',
          borderRadius: '16px',
          border: editingId
            ? '1px solid #93C5FD'
            : '1px solid #E2E8F0',
          boxShadow:
            '0 10px 30px rgba(15, 23, 42, 0.05)',
          opacity: hasClass ? 1 : 0.55,
          pointerEvents: hasClass
            ? 'auto'
            : 'none',
        }}
      >
        {/* Form heading */}

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '15px',
            flexWrap: 'wrap',
            marginBottom: '22px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <div style={iconBadge}>
              {editingId ? '✏️' : '📚'}
            </div>

            <div>
              <div
                style={{
                  ...S.heading,
                  fontSize: '17px',
                  marginBottom: '3px',
                }}
              >
                {editingId
                  ? 'Edit Subject'
                  : 'Add Subject'}
              </div>

              <div style={helperTopText}>
                {editingId
                  ? `Editing ${editingType} subject for ${getClassName(
                      parseInt(selectedClassId)
                    )}.`
                  : `Add a subject for ${getClassName(
                      parseInt(selectedClassId)
                    )} as theory, lab, or both.`}
              </div>
            </div>
          </div>

          {hasClass && (
            <div style={largeClassBadge}>
              <span>CLASS</span>

              <strong>
                {getClassName(
                  parseInt(selectedClassId)
                )}
              </strong>
            </div>
          )}
        </div>

        {/* Form fields */}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              'minmax(260px, 1.5fr) minmax(260px, 1fr) minmax(220px, 0.8fr)',
            gap: '18px',
            alignItems: 'start',
          }}
        >
          {/* Subject name */}

          <div style={S.fieldWrap}>
            <label style={S.label}>
              Subject Name
            </label>

            <input
              value={subjectName}
              onChange={e =>
                setSubjectName(e.target.value)
              }
              placeholder="e.g. Programming"
              style={{
                ...S.input,
                height: '46px',
                borderRadius: '10px',
                background: '#F8FAFC',
                border: '1px solid #CBD5E1',
              }}
              required
            />

            <div style={fieldHint}>
              Use the exact subject name you want
              displayed in the timetable.
            </div>
          </div>

          {/* Subject type */}

          <div style={S.fieldWrap}>
            <label style={S.label}>
              Subject Type
            </label>

            <div
              style={{
                display: 'flex',
                gap: '8px',
              }}
            >
              {[
                {
                  key: 'theory',
                  icon: '📖',
                  label: 'Theory',
                  activeBg: '#EFF6FF',
                  activeBorder: '#2563EB',
                  activeText: '#1D4ED8',
                },
                {
                  key: 'lab',
                  icon: '🔬',
                  label: 'Lab',
                  activeBg: '#FFFBEB',
                  activeBorder: '#D97706',
                  activeText: '#92400E',
                },
              ].map(
                ({
                  key,
                  icon,
                  label,
                  activeBg,
                  activeBorder,
                  activeText,
                }) => {
                  const active =
                    selectedTypes[key]

                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() =>
                        !typeToggleLocked &&
                        toggleType(key)
                      }
                      style={{
                        flex: 1,
                        minHeight: '70px',
                        padding: '10px',
                        borderRadius: '10px',
                        border: active
                          ? `1.5px solid ${activeBorder}`
                          : '1px solid #CBD5E1',
                        background: active
                          ? activeBg
                          : '#F8FAFC',
                        color: active
                          ? activeText
                          : '#64748B',
                        fontWeight: '700',
                        fontSize: '12px',
                        cursor: typeToggleLocked
                          ? 'not-allowed'
                          : 'pointer',
                        opacity:
                          typeToggleLocked &&
                          !active
                            ? 0.4
                            : 1,
                      }}
                    >
                      <div
                        style={{
                          fontSize: '17px',
                          marginBottom: '5px',
                        }}
                      >
                        {icon}
                      </div>

                      {label}
                    </button>
                  )
                }
              )}
            </div>

            {bothTypes && !editingId && (
              <div style={dualInfo}>
                ✓ This creates Theory + Lab entries
                for the same subject.
              </div>
            )}

            {typeToggleLocked && (
              <div
                style={{
                  ...dualInfo,
                  background: '#EFF6FF',
                  color: '#1D4ED8',
                  borderColor: '#BFDBFE',
                }}
              >
                ℹ️ Type is locked while editing.
              </div>
            )}
          </div>

          {/* Periods */}

          <div style={S.fieldWrap}>
            <label style={S.label}>
              Periods Per Week
            </label>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns:
                  bothTypes ? '1fr 1fr' : '1fr',
                gap: '8px',
              }}
            >
              {selectedTypes.theory && (
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={theoryPeriods}
                  onChange={e =>
                    setTheoryPeriods(
                      e.target.value
                    )
                  }
                  placeholder="Theory"
                  style={{
                    ...S.input,
                    height: '46px',
                    borderRadius: '10px',
                    borderColor: '#93C5FD',
                    background: '#EFF6FF',
                  }}
                />
              )}

              {selectedTypes.lab && (
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={labPeriods}
                  onChange={e =>
                    setLabPeriods(
                      e.target.value
                    )
                  }
                  placeholder="Lab"
                  style={{
                    ...S.input,
                    height: '46px',
                    borderRadius: '10px',
                    borderColor: '#FCD34D',
                    background: '#FFFBEB',
                  }}
                />
              )}
            </div>

            <div style={fieldHint}>
              Weekly periods allocated to the selected
              subject type.
            </div>
          </div>
        </div>

        {/* Messages */}

        {message && (
          <div
            style={{
              ...S.successBox,
              marginTop: '18px',
              borderRadius: '10px',
            }}
          >
            {message}
          </div>
        )}

        {error && (
          <div
            style={{
              ...S.errorBox,
              marginTop: '18px',
              borderRadius: '10px',
            }}
          >
            {error}
          </div>
        )}

        {/* Buttons */}

        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '10px',
            marginTop: '20px',
          }}
        >
          {editingId && (
            <button
              type="button"
              onClick={handleCancelEdit}
              style={cancelBtn}
            >
              Cancel
            </button>
          )}

          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            style={{
              ...S.btn,
              minWidth: '180px',
              height: '46px',
              borderRadius: '10px',
              fontSize: '13px',
              fontWeight: '700',
              opacity: canSubmit ? 1 : 0.55,
              cursor: canSubmit
                ? 'pointer'
                : 'not-allowed',
              boxShadow: canSubmit
                ? '0 10px 20px rgba(37, 99, 235, 0.18)'
                : 'none',
            }}
          >
            {editingId
              ? '✓ Update Subject'
              : `+ Add Subject${
                  bothTypes
                    ? ' (Theory + Lab)'
                    : ''
                }`}
          </button>
        </div>
      </div>

      {/* =========================================================
          SUBJECT DIRECTORY
      ========================================================= */}

      <div
        style={{
          background: '#FFFFFF',
          borderRadius: '16px',
          border: '1px solid #E2E8F0',
          boxShadow:
            '0 10px 30px rgba(15, 23, 42, 0.04)',
          overflow: 'hidden',
        }}
      >
        {/* Directory Header */}

        <div
          style={{
            padding: '22px 24px',
            borderBottom: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '15px',
            flexWrap: 'wrap',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <div style={directoryIcon}>
              📚
            </div>

            <div>
              <div style={sectionTitle}>
                Subject Directory
              </div>

              <div style={sectionSub}>
                Subjects configured for{' '}
                <strong>
                  {hasClass
                    ? getClassName(
                        parseInt(
                          selectedClassId
                        )
                      )
                    : 'the selected class'}
                </strong>
                .
              </div>
            </div>
          </div>

          {hasClass && (
            <div style={countPill}>
              {filteredSubjects.length}{' '}
              {filteredSubjects.length === 1
                ? 'subject'
                : 'subjects'}
            </div>
          )}
        </div>

        {/* Filters */}

        {hasClass && (
          <div
            style={{
              padding: '14px 24px',
              background: '#F8FAFC',
              borderBottom:
                '1px solid #E2E8F0',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              flexWrap: 'wrap',
            }}
          >
            <span
              style={{
                fontSize: '11px',
                fontWeight: '700',
                color: '#64748B',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginRight: '4px',
              }}
            >
              Show:
            </span>

            {[
              {
                key: 'all',
                label: 'All Subjects',
                count: classSubjects.length,
              },
              {
                key: 'theory',
                label: 'Theory',
                count: theoryCount,
              },
              {
                key: 'lab',
                label: 'Labs',
                count: labCount,
              },
            ].map(filter => {
              const active =
                filterType === filter.key

              return (
                <button
                  key={filter.key}
                  type="button"
                  onClick={() =>
                    setFilterType(filter.key)
                  }
                  style={{
                    ...filterButton,
                    ...(active
                      ? filterActive
                      : {}),
                  }}
                >
                  {filter.label}

                  <span
                    style={{
                      ...filterCount,
                      ...(active
                        ? filterCountActive
                        : {}),
                    }}
                  >
                    {filter.count}
                  </span>
                </button>
              )
            })}
          </div>
        )}

        {/* Directory body */}

        {!hasClass ? (
          <div style={emptyStateCard}>
            <div style={emptyIcon}>
              🏫
            </div>

            <div style={emptyTitle}>
              No class selected
            </div>

            <div style={emptyText}>
              Select a class above to view and manage
              its subjects.
            </div>
          </div>
        ) : filteredSubjects.length === 0 ? (
          <div style={emptyStateCard}>
            <div style={emptyIcon}>
              {filterType === 'lab'
                ? '🔬'
                : filterType === 'theory'
                ? '📖'
                : '📚'}
            </div>

            <div style={emptyTitle}>
              {filterType === 'all'
                ? `No subjects for ${getClassName(
                    parseInt(selectedClassId)
                  )} yet`
                : `No ${
                    filterType === 'lab'
                      ? 'lab'
                      : 'theory'
                  } subjects found`}
            </div>

            <div style={emptyText}>
              {filterType === 'all'
                ? 'Use the form above to add the first subject for this class.'
                : 'Try another filter or add a new subject above.'}
            </div>
          </div>
        ) : (
          <div
            style={{
              overflowX: 'auto',
            }}
          >
            <table
              style={{
                ...S.table,
                border: 'none',
                width: '100%',
              }}
            >
              <thead>
                <tr>
                  <th style={S.th}>
                    #
                  </th>

                  <th style={S.th}>
                    Subject
                  </th>

                  <th style={S.th}>
                    Type
                  </th>

                  <th
                    style={{
                      ...S.th,
                      textAlign: 'center',
                    }}
                  >
                    Periods / Week
                  </th>

                  <th
                    style={{
                      ...S.th,
                      textAlign: 'center',
                    }}
                  >
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredSubjects.map(
                  (subject, index) => (
                    <tr
                      key={subject.subject_id}
                      style={{
                        background:
                          editingId ===
                          subject.subject_id
                            ? '#EFF6FF'
                            : index % 2 === 0
                            ? '#FFFFFF'
                            : '#FCFDFE',
                      }}
                    >
                      <td
                        style={{
                          ...S.td,
                          color: '#94A3B8',
                          fontWeight: '700',
                          fontSize: '12px',
                          width: '60px',
                        }}
                      >
                        {String(
                          index + 1
                        ).padStart(2, '0')}
                      </td>

                      <td style={S.td}>
                        <div
                          style={{
                            display: 'flex',
                            alignItems:
                              'center',
                            gap: '11px',
                          }}
                        >
                          <div
                            style={subjectAvatar(
                              subject.subject_type
                            )}
                          >
                            {subject.subject_type ===
                            'lab'
                              ? '🔬'
                              : '📖'}
                          </div>

                          <div>
                            <div
                              style={{
                                fontWeight: '700',
                                color: '#1B2A3B',
                                fontSize:
                                  '13px',
                              }}
                            >
                              {
                                subject.subject_name
                              }
                            </div>

                            <div
                              style={miniMeta}
                            >
                              {subject.subject_type ===
                              'lab'
                                ? 'Practical session'
                                : 'Theory session'}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td style={S.td}>
                        <SubjectTypeBadge
                          type={
                            subject.subject_type
                          }
                          showName={true}
                        />
                      </td>

                      <td
                        style={{
                          ...S.td,
                          textAlign: 'center',
                        }}
                      >
                        <span
                          style={periodBadge(
                            subject.subject_type
                          )}
                        >
                          {
                            subject.periods_per_week
                          }
                        </span>
                      </td>

                      <td
                        style={{
                          ...S.td,
                          textAlign: 'center',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            gap: '7px',
                            justifyContent:
                              'center',
                          }}
                        >
                          <button
                            onClick={() =>
                              handleEdit(
                                subject
                              )
                            }
                            style={editBtn}
                          >
                            Edit
                          </button>

                          <button
                            onClick={() =>
                              promptDelete(
                                subject
                              )
                            }
                            style={deleteBtn}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer */}

        {hasClass &&
          filteredSubjects.length > 0 && (
            <div
              style={{
                padding: '12px 24px',
                borderTop:
                  '1px solid #E2E8F0',
                display: 'flex',
                alignItems: 'center',
                justifyContent:
                  'space-between',
                fontSize: '11px',
                color: '#94A3B8',
              }}
            >
              <span>
                Showing {filteredSubjects.length}{' '}
                of {classSubjects.length}{' '}
                subjects
              </span>

              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: '#16A34A',
                  fontWeight: '600',
                }}
              >
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: '#22C55E',
                  }}
                />

                Ready for scheduling
              </span>
            </div>
          )}
      </div>

      {/* =========================================================
          DELETE MODAL
      ========================================================= */}

      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Delete Subject"
        itemName={
          deleteTarget
            ? `${deleteTarget.subject_name} (${deleteTarget.subject_type})`
            : ''
        }
        message="Are you sure you want to delete this subject? This will disassociate any teacher links and timetable entries."
        onConfirm={confirmDelete}
        onCancel={() =>
          setDeleteTarget(null)
        }
        isDeleting={isDeleting}
      />
    </div>
  )
}

/* =============================================================
   STYLES
============================================================= */

const statChip = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  background: '#FFFFFF',
  border: '1px solid #E2E8F0',
  borderRadius: '999px',
  padding: '8px 12px',
  boxShadow:
    '0 1px 2px rgba(15, 23, 42, 0.04)',
}

const statChipLabel = {
  fontSize: '10px',
  fontWeight: '700',
  color: '#64748B',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
}

const statChipValue = {
  fontSize: '12px',
  fontWeight: '700',
  color: '#1B2A3B',
}

const activeClassSection = {
  minHeight: '86px',
  borderRadius: '16px',
  border: '1px solid #E2E8F0',
  padding: '16px 20px',
  display: 'flex',
  alignItems: 'center',
  gap: '20px',
  flexWrap: 'wrap',
  boxShadow:
    '0 8px 24px rgba(15, 23, 42, 0.04)',
  transition: 'all 0.2s ease',
}

const selectorIcon = {
  width: '46px',
  height: '46px',
  borderRadius: '12px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background:
    'linear-gradient(135deg, #EFF6FF, #DBEAFE)',
  border: '1px solid #BFDBFE',
  fontSize: '20px',
  flexShrink: 0,
}

const activeLabel = {
  fontSize: '11px',
  fontWeight: '800',
  color: '#2563EB',
  letterSpacing: '0.08em',
  marginBottom: '3px',
}

const activeDescription = {
  fontSize: '11px',
  color: '#64748B',
}

const classSelectorButton = {
  minWidth: '92px',
  minHeight: '54px',
  padding: '7px 14px',
  borderRadius: '11px',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  gap: '3px',
  cursor: 'pointer',
  transition: 'all 0.15s ease',
}

const activeClassButton = {
  background: '#2563EB',
  color: '#FFFFFF',
  border: '1px solid #2563EB',
  boxShadow:
    '0 7px 16px rgba(37, 99, 235, 0.22)',
}

const inactiveClassButton = {
  background: '#FFFFFF',
  color: '#334155',
  border: '1px solid #CBD5E1',
}

const currentClassBanner = {
  marginTop: '12px',
  padding: '14px 18px',
  borderRadius: '14px',
  background: '#FFFFFF',
  border: '1px solid #E2E8F0',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '15px',
  flexWrap: 'wrap',
  boxShadow:
    '0 4px 16px rgba(15, 23, 42, 0.03)',
}

const currentClassSmall = {
  fontSize: '10px',
  fontWeight: '800',
  color: '#64748B',
  letterSpacing: '0.07em',
  marginBottom: '2px',
}

const currentClassName = {
  fontSize: '22px',
  fontWeight: '800',
  color: '#1D4ED8',
  lineHeight: 1.2,
}

const contextBadge = {
  fontSize: '11px',
  fontWeight: '700',
  color: '#475569',
  background: '#F8FAFC',
  border: '1px solid #E2E8F0',
  borderRadius: '999px',
  padding: '6px 10px',
}

const noClassNotice = {
  marginTop: '12px',
  padding: '13px 16px',
  borderRadius: '12px',
  background: '#FFFBEB',
  border: '1px solid #FDE68A',
  color: '#92400E',
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  fontSize: '12px',
}

const largeClassBadge = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '8px 13px',
  borderRadius: '999px',
  background: '#EFF6FF',
  border: '1px solid #BFDBFE',
  color: '#1D4ED8',
}

const iconBadge = {
  width: '44px',
  height: '44px',
  borderRadius: '12px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background:
    'linear-gradient(135deg, #EFF6FF, #DBEAFE)',
  border: '1px solid #BFDBFE',
  fontSize: '18px',
  flexShrink: 0,
}

const helperTopText = {
  fontSize: '12px',
  color: '#64748B',
  lineHeight: '1.5',
}

const fieldHint = {
  fontSize: '11px',
  color: '#94A3B8',
  lineHeight: '1.4',
  marginTop: '4px',
}

const dualInfo = {
  marginTop: '7px',
  fontSize: '11px',
  fontWeight: '600',
  background: '#F0FDF4',
  color: '#166534',
  border: '1px solid #BBF7D0',
  borderRadius: '8px',
  padding: '6px 10px',
  display: 'inline-block',
}

const cancelBtn = {
  background: '#FFFFFF',
  border: '1px solid #CBD5E1',
  borderRadius: '9px',
  padding: '0 16px',
  height: '46px',
  fontSize: '12px',
  fontWeight: '600',
  color: '#64748B',
  cursor: 'pointer',
}

const directoryIcon = {
  width: '40px',
  height: '40px',
  borderRadius: '11px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background:
    'linear-gradient(135deg, #EFF6FF, #DBEAFE)',
  border: '1px solid #BFDBFE',
  fontSize: '17px',
}

const sectionTitle = {
  fontSize: '15px',
  fontWeight: '700',
  color: '#1B2A3B',
}

const sectionSub = {
  fontSize: '12px',
  color: '#64748B',
  marginTop: '3px',
}

const countPill = {
  fontSize: '11px',
  fontWeight: '700',
  color: '#1D4ED8',
  background: '#EFF6FF',
  border: '1px solid #BFDBFE',
  borderRadius: '999px',
  padding: '7px 12px',
}

const filterButton = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '7px',
  padding: '7px 11px',
  borderRadius: '8px',
  border: '1px solid #CBD5E1',
  background: '#FFFFFF',
  color: '#64748B',
  fontSize: '11px',
  fontWeight: '700',
  cursor: 'pointer',
  transition: 'all 0.15s ease',
}

const filterActive = {
  background: '#EFF6FF',
  borderColor: '#93C5FD',
  color: '#1D4ED8',
}

const filterCount = {
  minWidth: '19px',
  height: '19px',
  padding: '0 5px',
  borderRadius: '999px',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: '#F1F5F9',
  color: '#64748B',
  fontSize: '10px',
}

const filterCountActive = {
  background: '#DBEAFE',
  color: '#1D4ED8',
}

const subjectAvatar = type => ({
  width: '36px',
  height: '36px',
  borderRadius: '10px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '15px',
  flexShrink: 0,
  background:
    type === 'lab'
      ? 'linear-gradient(135deg, #FEF3C7, #FDE68A)'
      : 'linear-gradient(135deg, #DBEAFE, #BFDBFE)',
})

const miniMeta = {
  fontSize: '10px',
  color: '#94A3B8',
  marginTop: '2px',
}

const periodBadge = type => ({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: '38px',
  padding: '5px 10px',
  borderRadius: '999px',
  background:
    type === 'lab'
      ? '#FFFBEB'
      : '#EFF6FF',
  border:
    type === 'lab'
      ? '1px solid #FDE68A'
      : '1px solid #BFDBFE',
  color:
    type === 'lab'
      ? '#92400E'
      : '#1D4ED8',
  fontSize: '12px',
  fontWeight: '700',
})

const emptyStateCard = {
  background: '#FFFFFF',
  padding: '55px 24px',
  textAlign: 'center',
}

const emptyIcon = {
  fontSize: '30px',
  marginBottom: '10px',
}

const emptyTitle = {
  fontSize: '14px',
  fontWeight: '700',
  color: '#1B2A3B',
  marginBottom: '6px',
}

const emptyText = {
  fontSize: '12px',
  color: '#64748B',
}

const editBtn = {
  padding: '6px 12px',
  fontSize: '11px',
  fontWeight: '600',
  color: '#1D4ED8',
  background: '#EFF6FF',
  border: '1px solid #BFDBFE',
  borderRadius: '8px',
  cursor: 'pointer',
}

const deleteBtn = {
  padding: '6px 12px',
  fontSize: '11px',
  fontWeight: '600',
  color: '#DC2626',
  background: '#FEF2F2',
  border: '1px solid #FECACA',
  borderRadius: '8px',
  cursor: 'pointer',
}