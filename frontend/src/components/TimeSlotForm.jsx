import { useState, useEffect } from 'react'
import axios from 'axios'
import * as S from '../styles/formStyles'

const BASE = 'http://localhost:8000'
const ALL_DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']

export default function TimeSlotForm() {
  const [slots, setSlots]           = useState([])
  const [selectedDays, setSelectedDays] = useState(['Monday','Tuesday','Wednesday','Thursday','Friday'])
  const [periodsPerDay, setPeriodsPerDay] = useState(6)
  const [message, setMessage]       = useState('')
  const [error, setError]           = useState('')
  const [generating, setGenerating] = useState(false)

  useEffect(() => { fetchSlots() }, [])

  async function fetchSlots() {
    try {
      const res = await axios.get(`${BASE}/timeslots`)
      setSlots(res.data)
    } catch { setError('Could not load timeslots') }
  }

  function toggleDay(day) {
    setSelectedDays(prev =>
      prev.includes(day)
        ? prev.filter(d => d !== day)
        : [...prev, day]
    )
  }

  async function handleGenerate() {
    if (selectedDays.length === 0) {
      setError('Please select at least one day')
      return
    }
    setGenerating(true)
    setMessage(''); setError('')
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
      const total = orderedDays.length * parseInt(periodsPerDay)
      setMessage(`Generated ${total} slots — ${orderedDays.length} days × ${periodsPerDay} periods`)
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
    <div style={{ padding: '32px' }}>
      <div style={S.card}>
        <h2 style={S.heading}>Configure Time Slots</h2>

        {/* Day selector */}
        <div style={S.fieldWrap}>
          <label style={S.label}>Select working days</label>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '4px' }}>
            {ALL_DAYS.map(day => {
              const active = selectedDays.includes(day)
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(day)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '20px',
                    border: `1.5px solid ${active ? '#6C63FF' : '#e0e0e0'}`,
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: '600',
                    background: active ? '#ede9fe' : '#fff',
                    color: active ? '#5b21b6' : '#aaa',
                    transition: 'all 0.15s'
                  }}
                >
                  {day.slice(0, 3)}
                </button>
              )
            })}
          </div>
        </div>

        {/* Periods per day */}
        <div style={S.fieldWrap}>
          <label style={S.label}>Periods per day</label>
          <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
            {[4, 5, 6, 7, 8].map(n => (
              <button
                key={n}
                type="button"
                onClick={() => setPeriodsPerDay(n)}
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '10px',
                  border: `1.5px solid ${periodsPerDay === n ? '#6C63FF' : '#e0e0e0'}`,
                  cursor: 'pointer',
                  fontSize: '18px',
                  fontWeight: '700',
                  background: periodsPerDay === n ? '#ede9fe' : '#fff',
                  color: periodsPerDay === n ? '#5b21b6' : '#bbb',
                  transition: 'all 0.15s'
                }}
              >
                {n}
              </button>
            ))}
          </div>
          <span style={{ fontSize: '12px', color: '#aaa', marginTop: '6px' }}>
            {selectedDays.length} days × {periodsPerDay} periods = {totalSlots} total slots
          </span>
        </div>

        {/* Preview */}
        {selectedDays.length > 0 && (
          <div style={{
            background: '#f5f3ff',
            borderRadius: '10px',
            padding: '14px 16px',
            border: '1px solid #e0d9ff'
          }}>
            <div style={{
              fontSize: '11px', fontWeight: '700',
              color: '#7c3aed', marginBottom: '10px',
              textTransform: 'uppercase', letterSpacing: '0.06em'
            }}>
              Preview
            </div>
            {ALL_DAYS.filter(d => selectedDays.includes(d)).map(day => (
              <div key={day} style={{
                display: 'flex', alignItems: 'center',
                gap: '10px', marginBottom: '6px'
              }}>
                <span style={{
                  fontSize: '12px', fontWeight: '600',
                  color: '#555', width: '96px'
                }}>
                  {day}
                </span>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {Array.from({ length: periodsPerDay }, (_, i) => (
                    <span key={i} style={{
                      width: '26px', height: '26px',
                      background: '#6C63FF22',
                      border: '1px solid #6C63FF55',
                      borderRadius: '5px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '9px',
                      fontWeight: '700',
                      color: '#5b21b6'
                    }}>
                      P{i + 1}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {message && <div style={S.successBox}>{message}</div>}
        {error   && <div style={S.errorBox}>{error}</div>}

        {slots.length > 0 && (
          <div style={{
            fontSize: '12px', color: '#f59e0b',
            background: '#fffbeb', border: '1px solid #fde68a',
            borderRadius: '8px', padding: '8px 12px'
          }}>
            ⚠️ {slots.length} existing slots will be replaced when you click Generate
          </div>
        )}

        <button
          onClick={handleGenerate}
          disabled={generating || selectedDays.length === 0}
          style={{
            ...S.btn,
            opacity: generating || selectedDays.length === 0 ? 0.6 : 1,
            cursor: generating ? 'wait' : 'pointer'
          }}
        >
          {generating
            ? 'Generating slots...'
            : `Generate ${totalSlots} slots`}
        </button>
      </div>

      {/* Current slots grid */}
      {sortedSlots.length > 0 && (
        <div style={{ maxWidth: '640px', marginTop: '28px' }}>
          <div style={S.tableCount}>
            {slots.length} slots currently configured
          </div>
          <div style={{
            background: '#fff',
            borderRadius: '12px',
            border: '1px solid #e8e8e8',
            padding: '20px',
            display: 'flex',
            gap: '20px',
            flexWrap: 'wrap'
          }}>
            {ALL_DAYS.filter(day => slotsByDay[day].length > 0).map(day => (
              <div key={day}>
                <div style={{
                  fontSize: '11px', fontWeight: '700',
                  color: '#999', textTransform: 'uppercase',
                  letterSpacing: '0.06em', marginBottom: '8px'
                }}>
                  {day.slice(0, 3)}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {slotsByDay[day].map(s => (
                    <div key={s.slot_id} style={{
                      padding: '5px 12px',
                      borderRadius: '6px',
                      background: '#f5f3ff',
                      border: '1px solid #e0d9ff',
                      fontSize: '12px',
                      fontWeight: '600',
                      color: '#5b21b6'
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
  )
}