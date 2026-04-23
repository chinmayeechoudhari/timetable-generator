import { useState, useEffect } from 'react'
import axios from 'axios'
import * as S from '../styles/formStyles'

const BASE = 'http://localhost:8000'
const ALL_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export default function TimeSlotForm() {
  const [slots, setSlots] = useState([])
  const [selectedDays, setSelectedDays] = useState(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'])
  const [periodsPerDay, setPeriodsPerDay] = useState(6)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [generating, setGenerating] = useState(false)

  useEffect(() => { fetchSlots() }, [])

  async function fetchSlots() {
    try {
      const res = await axios.get(`${BASE}/timeslots`)
      setSlots(res.data)
    } catch {
      setError('Could not load timeslots')
    }
  }

  function toggleDay(day) {
    setSelectedDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    )
  }

  async function handleGenerate() {
    if (selectedDays.length === 0) {
      setError('Please select at least one day')
      return
    }

    setGenerating(true)
    setMessage('')
    setError('')

    try {
      for (const slot of slots) {
        await axios.delete(`${BASE}/timeslots/${slot.slot_id}`)
      }

      const orderedDays = ALL_DAYS.filter(d => selectedDays.includes(d))

      for (const day of orderedDays) {
        for (let p = 1; p <= parseInt(periodsPerDay); p++) {
          await axios.post(`${BASE}/timeslots`, { day, period_number: p })
        }
      }

      setMessage(`Generated ${orderedDays.length * periodsPerDay} slots — ${orderedDays.length} days × ${periodsPerDay} periods`)
      fetchSlots()
    } catch (err) {
      setError(err.response?.data?.detail || 'Error generating slots')
    } finally {
      setGenerating(false)
    }
  }

  const sortedSlots = [...slots].sort((a, b) =>
    ALL_DAYS.indexOf(a.day) - ALL_DAYS.indexOf(b.day) || a.period_number - b.period_number
  )

  const slotsByDay = ALL_DAYS.reduce((acc, day) => {
    acc[day] = sortedSlots.filter(s => s.day === day)
    return acc
  }, {})

  const totalSlots = selectedDays.length * periodsPerDay

  return (
    <div style={{ ...S.page }}>

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
            Time Slots
          </div>
          <div style={{ ...S.pageSub, fontSize: '13px', marginBottom: '0' }}>
            Configure working days and the number of periods available each day.
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <div style={statChip}>
            <span style={statChipLabel}>Selected days</span>
            <span style={statChipValue}>{selectedDays.length}</span>
          </div>

          <div style={{ ...statChip, background: '#F8FAFC' }}>
            <span style={statChipLabel}>Periods/day</span>
            <span style={statChipValue}>{periodsPerDay}</span>
          </div>

          <div style={{ ...statChip, background: '#EFF6FF' }}>
            <span style={{ ...statChipLabel, color: '#1D4ED8' }}>Total slots</span>
            <span style={{ ...statChipValue, color: '#1D4ED8' }}>{totalSlots}</span>
          </div>
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

        <div
          style={{
            ...S.card,
            minWidth: '340px',
            maxWidth: '440px',
            width: '100%',
            gap: '16px',
            borderRadius: '16px',
            padding: '26px',
            boxShadow: '0 10px 30px rgba(15, 23, 42, 0.06)',
            border: '1px solid #E2E8F0'
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
            <div style={iconBadge}>🕒</div>
            <div>
              <div style={{ ...S.heading, fontSize: '16px', marginBottom: '2px' }}>
                Configure Schedule
              </div>
              <div style={helperTopText}>
                Select working days and choose how many periods each day should contain.
              </div>
            </div>
          </div>

          <div style={S.fieldWrap}>
            <label style={S.label}>Working days</label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {ALL_DAYS.map(day => {
                const active = selectedDays.includes(day)
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    style={{
                      minWidth: '60px',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      border: `1.5px solid ${active ? '#2563EB' : '#CBD5E1'}`,
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: '700',
                      background: active ? '#EFF6FF' : '#F8FAFC',
                      color: active ? '#1D4ED8' : '#64748B',
                      transition: 'all 0.12s',
                      boxShadow: active ? '0 4px 10px rgba(15, 23, 42, 0.04)' : 'none'
                    }}
                  >
                    {day.slice(0, 3)}
                  </button>
                )
              })}
            </div>
            <div style={fieldHint}>
              Choose the weekdays that should be available for timetable generation.
            </div>
          </div>

          <div style={S.fieldWrap}>
            <label style={S.label}>Periods per day</label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {[4, 5, 6, 7, 8, 9].map(n => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setPeriodsPerDay(n)}
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    border: `1.5px solid ${periodsPerDay === n ? '#2563EB' : '#CBD5E1'}`,
                    cursor: 'pointer',
                    fontSize: '15px',
                    fontWeight: '800',
                    background: periodsPerDay === n ? '#EFF6FF' : '#F8FAFC',
                    color: periodsPerDay === n ? '#1D4ED8' : '#64748B',
                    transition: 'all 0.12s',
                    boxShadow: periodsPerDay === n ? '0 4px 10px rgba(15, 23, 42, 0.04)' : 'none'
                  }}
                >
                  {n}
                </button>
              ))}
            </div>

            <div style={summaryStrip}>
              <span>{selectedDays.length} days</span>
              <span style={dot} />
              <span>{periodsPerDay} periods/day</span>
              <span style={dot} />
              <strong style={{ color: '#1D4ED8' }}>{totalSlots} total slots</strong>
            </div>
          </div>

          {selectedDays.length > 0 && (
            <div
              style={{
                background: '#F8FAFC',
                borderRadius: '12px',
                padding: '14px 14px',
                border: '1px solid #E2E8F0'
              }}
            >
              <div style={previewTitle}>Preview</div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {ALL_DAYS.filter(d => selectedDays.includes(d)).map(day => (
                  <div
                    key={day}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      flexWrap: 'wrap'
                    }}
                  >
                    <span style={previewDayLabel}>
                      {day}
                    </span>

                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      {Array.from({ length: periodsPerDay }, (_, i) => (
                        <span
                          key={i}
                          style={{
                            minWidth: '24px',
                            height: '24px',
                            padding: '0 6px',
                            background: '#EFF6FF',
                            border: '1px solid #BFDBFE',
                            borderRadius: '6px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '9px',
                            fontWeight: '700',
                            color: '#2563EB'
                          }}
                        >
                          P{i + 1}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {slots.length > 0 && (
            <div style={warningBox}>
              ⚠️ {slots.length} existing slots will be replaced when you generate a new schedule.
            </div>
          )}

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

          <button
            onClick={handleGenerate}
            disabled={generating || selectedDays.length === 0}
            style={{
              ...S.btn,
              height: '46px',
              borderRadius: '10px',
              fontSize: '14px',
              fontWeight: '700',
              opacity: generating || selectedDays.length === 0 ? 0.6 : 1,
              cursor: generating ? 'wait' : 'pointer',
              boxShadow: generating || selectedDays.length === 0
                ? 'none'
                : '0 10px 20px rgba(37, 99, 235, 0.18)'
            }}
          >
            {generating ? 'Generating...' : `Generate ${totalSlots} slots`}
          </button>
        </div>

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
              <div style={sectionTitle}>Configured Time Slots</div>
              <div style={sectionSub}>
                Review the currently active day and period structure.
              </div>
            </div>

            <div style={countPill}>
              {slots.length} slot{slots.length !== 1 ? 's' : ''}
            </div>
          </div>

          {sortedSlots.length > 0 ? (
            <div
              style={{
                background: '#FFFFFF',
                borderRadius: '16px',
                border: '1px solid #E2E8F0',
                padding: '18px',
                boxShadow: '0 10px 30px rgba(15, 23, 42, 0.04)'
              }}
            >
              <div style={slotsGrid}>
                {ALL_DAYS.filter(day => slotsByDay[day].length > 0).map(day => (
                  <div key={day} style={dayColumnCard}>
                    <div style={dayColumnTitle}>
                      {day}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {slotsByDay[day].map(s => (
                        <div
                          key={s.slot_id}
                          style={slotPill}
                        >
                          P{s.period_number}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={emptyStateCard}>
              <div style={emptyIcon}>🗓️</div>
              <div style={emptyTitle}>No time slots configured yet</div>
              <div style={emptyText}>
                Choose working days and periods, then generate your first schedule structure.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

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

const summaryStrip = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  flexWrap: 'wrap',
  fontSize: '11px',
  color: '#64748B',
  marginTop: '6px'
}

const dot = {
  width: '4px',
  height: '4px',
  borderRadius: '50%',
  background: '#CBD5E1'
}

const previewTitle = {
  fontSize: '10px',
  fontWeight: '700',
  color: '#475569',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  marginBottom: '10px'
}

const previewDayLabel = {
  fontSize: '11px',
  fontWeight: '700',
  color: '#475569',
  minWidth: '84px',
  flexShrink: 0
}

const warningBox = {
  fontSize: '11px',
  color: '#92400E',
  background: '#FFFBEB',
  border: '1px solid #FDE68A',
  borderRadius: '10px',
  padding: '10px 12px',
  lineHeight: '1.5'
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

const slotsGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
  gap: '16px'
}

const dayColumnCard = {
  background: '#FCFDFE',
  border: '1px solid #E2E8F0',
  borderRadius: '12px',
  padding: '12px'
}

const dayColumnTitle = {
  fontSize: '11px',
  fontWeight: '800',
  color: '#475569',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  marginBottom: '10px'
}

const slotPill = {
  padding: '7px 10px',
  borderRadius: '8px',
  background: '#EFF6FF',
  border: '1px solid #BFDBFE',
  fontSize: '11px',
  fontWeight: '700',
  color: '#1D4ED8',
  textAlign: 'center'
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