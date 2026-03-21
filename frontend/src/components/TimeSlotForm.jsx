import { useState, useEffect } from 'react'
import axios from 'axios'
import * as S from '../styles/formStyles'

const BASE = 'http://localhost:8000'
const ALL_DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']

export default function TimeSlotForm() {
  const [slots, setSlots]               = useState([])
  const [selectedDays, setSelectedDays] = useState(['Monday','Tuesday','Wednesday','Thursday','Friday'])
  const [periodsPerDay, setPeriodsPerDay] = useState(6)
  const [message, setMessage]           = useState('')
  const [error, setError]               = useState('')
  const [generating, setGenerating]     = useState(false)

  useEffect(() => { fetchSlots() }, [])

  async function fetchSlots() {
    try {
      const res = await axios.get(`${BASE}/timeslots`)
      setSlots(res.data)
    } catch { setError('Could not load timeslots') }
  }

  function toggleDay(day) {
    setSelectedDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    )
  }

  async function handleGenerate() {
    if (selectedDays.length === 0) { setError('Please select at least one day'); return }
    setGenerating(true); setMessage(''); setError('')
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
      setGenerating(false) }
  }

  const sortedSlots = [...slots].sort((a, b) =>
    ALL_DAYS.indexOf(a.day) - ALL_DAYS.indexOf(b.day) || a.period_number - b.period_number
  )
  const slotsByDay = ALL_DAYS.reduce((acc, day) => {
    acc[day] = sortedSlots.filter(s => s.day === day); return acc
  }, {})
  const totalSlots = selectedDays.length * periodsPerDay

  return (
    <div style={{ padding: '28px 32px', background: '#F0F4F8', minHeight: '100vh' }}>

      {/* Page header */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontSize: '18px', fontWeight: '700', color: '#1B2A3B' }}>Time Slots</div>
        <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
          Configure working days and periods per day
        </div>
      </div>

      <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start', flexWrap: 'wrap' }}>

        {/* Form card */}
        <div style={S.card}>
          <div style={S.heading}>Configure Schedule</div>

          {/* Day selector */}
          <div style={S.fieldWrap}>
            <label style={S.label}>Working days</label>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {ALL_DAYS.map(day => {
                const active = selectedDays.includes(day)
                return (
                  <button key={day} type="button" onClick={() => toggleDay(day)} style={{
                    padding: '6px 12px', borderRadius: '6px',
                    border: `1.5px solid ${active ? '#2563EB' : '#CBD5E1'}`,
                    cursor: 'pointer', fontSize: '12px', fontWeight: '600',
                    background: active ? '#EFF6FF' : '#F8FAFC',
                    color: active ? '#1D4ED8' : '#94A3B8',
                    transition: 'all 0.12s'
                  }}>
                    {day.slice(0, 3)}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Periods per day */}
          <div style={S.fieldWrap}>
            <label style={S.label}>Periods per day</label>
            <div style={{ display: 'flex', gap: '6px' }}>
              {[4, 5, 6, 7, 8].map(n => (
                <button key={n} type="button" onClick={() => setPeriodsPerDay(n)} style={{
                  width: '44px', height: '44px', borderRadius: '7px',
                  border: `1.5px solid ${periodsPerDay === n ? '#2563EB' : '#CBD5E1'}`,
                  cursor: 'pointer', fontSize: '15px', fontWeight: '700',
                  background: periodsPerDay === n ? '#EFF6FF' : '#F8FAFC',
                  color: periodsPerDay === n ? '#1D4ED8' : '#94A3B8',
                  transition: 'all 0.12s'
                }}>
                  {n}
                </button>
              ))}
            </div>
            <div style={{ fontSize: '11px', color: '#64748B', marginTop: '4px' }}>
              {selectedDays.length} days × {periodsPerDay} periods =
              <strong style={{ color: '#2563EB' }}> {totalSlots} total slots</strong>
            </div>
          </div>

          {/* Compact preview */}
          {selectedDays.length > 0 && (
            <div style={{
              background: '#F8FAFC', borderRadius: '8px',
              padding: '12px 14px', border: '1px solid #E2E8F0'
            }}>
              <div style={{
                fontSize: '10px', fontWeight: '700', color: '#475569',
                textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px'
              }}>
                Preview
              </div>
              {ALL_DAYS.filter(d => selectedDays.includes(d)).map(day => (
                <div key={day} style={{
                  display: 'flex', alignItems: 'center',
                  gap: '8px', marginBottom: '5px'
                }}>
                  <span style={{
                    fontSize: '11px', fontWeight: '600',
                    color: '#475569', width: '84px', flexShrink: 0
                  }}>
                    {day}
                  </span>
                  <div style={{ display: 'flex', gap: '3px' }}>
                    {Array.from({ length: periodsPerDay }, (_, i) => (
                      <span key={i} style={{
                        width: '22px', height: '22px',
                        background: '#EFF6FF',
                        border: '1px solid #BFDBFE',
                        borderRadius: '4px',
                        display: 'flex', alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '8px', fontWeight: '700', color: '#2563EB'
                      }}>
                        P{i + 1}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {slots.length > 0 && (
            <div style={{
              fontSize: '11px', color: '#92400E',
              background: '#FFFBEB', border: '1px solid #FDE68A',
              borderRadius: '7px', padding: '8px 12px'
            }}>
              ⚠️ {slots.length} existing slots will be replaced
            </div>
          )}

          {message && <div style={S.successBox}>{message}</div>}
          {error   && <div style={S.errorBox}>{error}</div>}

          <button
            onClick={handleGenerate}
            disabled={generating || selectedDays.length === 0}
            style={{
              ...S.btn,
              opacity: generating || selectedDays.length === 0 ? 0.6 : 1,
              cursor: generating ? 'wait' : 'pointer'
            }}
          >
            {generating ? 'Generating...' : `Generate ${totalSlots} slots`}
          </button>
        </div>

        {/* Current slots grid */}
        {sortedSlots.length > 0 && (
          <div style={{ flex: 1, minWidth: '280px' }}>
            <div style={S.tableCount}>
              {slots.length} slots configured
            </div>
            <div style={{
              background: '#FFFFFF', borderRadius: '10px',
              border: '1px solid #E2E8F0', padding: '16px',
              display: 'flex', gap: '16px', flexWrap: 'wrap'
            }}>
              {ALL_DAYS.filter(day => slotsByDay[day].length > 0).map(day => (
                <div key={day}>
                  <div style={{
                    fontSize: '10px', fontWeight: '700', color: '#475569',
                    textTransform: 'uppercase', letterSpacing: '0.06em',
                    marginBottom: '6px'
                  }}>
                    {day.slice(0, 3)}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    {slotsByDay[day].map(s => (
                      <div key={s.slot_id} style={{
                        padding: '4px 10px', borderRadius: '5px',
                        background: '#EFF6FF', border: '1px solid #BFDBFE',
                        fontSize: '11px', fontWeight: '600', color: '#1D4ED8'
                      }}>
                        P{s.period_number}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}