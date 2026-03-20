import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'

const API_BASE_URL = 'http://localhost:8000'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8]

export default function TimetableGrid() {
  const [timetable, setTimetable] = useState([])
  const [timeslots, setTimeslots] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  async function fetchData() {
    setIsLoading(true)
    setError(null)
    try {
      const [ttRes, tsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/timetable`),
        axios.get(`${API_BASE_URL}/timeslots`),
      ])

      setTimetable(ttRes.data || [])
      setTimeslots(tsRes.data || [])
    } catch (err) {
      const detail =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.message ||
        'Failed to load timetable'
      setError(detail)
      setTimetable([])
      setTimeslots([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const slotIdToDayPeriod = useMemo(() => {
    const map = new Map()
    for (const t of timeslots) {
      if (t?.slot_id == null) continue
      map.set(Number(t.slot_id), {
        day: t.day,
        period_number: Number(t.period_number),
      })
    }
    return map
  }, [timeslots])

  const grid = useMemo(() => {
    // 8 rows x 5 columns (Mon-Fri).
    const emptyCell = null
    const cells = Array.from({ length: PERIODS.length }, () =>
      Array.from({ length: DAYS.length }, () => emptyCell),
    )

    const dayToCol = new Map(DAYS.map((d, i) => [d, i]))

    for (const entry of timetable) {
      const slotId = entry?.slot_id
      if (slotId == null) continue

      const meta = slotIdToDayPeriod.get(Number(slotId))
      if (!meta) continue

      const col = dayToCol.get(meta.day)
      const row = PERIODS.indexOf(meta.period_number)
      if (col == null || row < 0) continue

      cells[row][col] = {
        subject_id: entry.subject_id,
        teacher_id: entry.teacher_id,
        room_id: entry.room_id,
      }
    }

    return cells
  }, [timetable, slotIdToDayPeriod])

  const isEmpty = !timetable || timetable.length === 0

  return (
    <div className="w-full max-w-6xl mx-auto px-4 pb-10">
      <h2 className="text-2xl font-semibold text-gray-900 mb-4">
        Generated Timetable
      </h2>

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 mb-4">
          {error}
        </div>
      ) : null}

      {isLoading ? (
        <div className="rounded-md border border-purple-200 bg-white/80 px-3 py-2 text-sm text-purple-800 mb-4">
          Loading timetable...
        </div>
      ) : null}

      {isEmpty && !isLoading ? (
        <div className="rounded-md border border-gray-200 bg-white/80 px-3 py-4 text-sm text-gray-600">
          No timetable generated yet
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white/80">
          <div className="grid grid-cols-[80px_repeat(5,minmax(0,1fr))]">
            {/* Header row */}
            <div className="bg-gray-50 px-3 py-3 text-xs font-medium text-gray-600 border-b border-gray-200" />
            {DAYS.map((d) => (
              <div
                key={d}
                className="bg-gray-50 px-3 py-3 text-xs font-medium text-gray-600 border-b border-gray-200 text-left"
              >
                {d}
              </div>
            ))}

            {/* Body */}
            {PERIODS.map((p, rowIdx) => {
              const rowBg = rowIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50'
              return (
                <>
                  <div
                    className={`${rowBg} px-3 py-3 text-sm font-medium text-gray-700 border-b border-gray-200 text-left`}
                  >
                    Period {p}
                  </div>
                  {DAYS.map((d, colIdx) => {
                    const cell = grid[rowIdx][colIdx]
                    return (
                      <div
                        key={`${p}-${d}`}
                        className={`${rowBg} px-3 py-2 border-b border-gray-200 border-l ${
                          colIdx === 0 ? 'border-l-0' : 'border-gray-200'
                        }`}
                      >
                        {cell ? (
                          <div className="text-xs leading-4 text-gray-900 space-y-0.5">
                            <div>
                              <span className="font-medium">S:</span>{' '}
                              {cell.subject_id}
                            </div>
                            <div>
                              <span className="font-medium">T:</span>{' '}
                              {cell.teacher_id}
                            </div>
                            <div>
                              <span className="font-medium">R:</span>{' '}
                              {cell.room_id}
                            </div>
                          </div>
                        ) : (
                          <div className="text-xs text-gray-400">-</div>
                        )}
                      </div>
                    )
                  })}
                </>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

