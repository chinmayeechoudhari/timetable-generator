import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'

const API_BASE_URL = 'http://localhost:8000'

const DAY_OPTIONS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
]

export default function TimeSlotForm() {
  const [day, setDay] = useState('Monday')
  const [periodNumber, setPeriodNumber] = useState(1)

  const [timeslots, setTimeslots] = useState([])
  const [isLoadingTimeslots, setIsLoadingTimeslots] = useState(false)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const dayOrderIndex = useMemo(() => {
    const map = {}
    DAY_OPTIONS.forEach((d, i) => {
      map[d] = i
    })
    return map
  }, [])

  async function fetchTimeslots() {
    setIsLoadingTimeslots(true)
    setError(null)
    try {
      const res = await axios.get(`${API_BASE_URL}/timeslots`)
      setTimeslots(res.data || [])
    } catch (err) {
      const detail =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.message ||
        'Failed to fetch timeslots'
      setError(detail)
    } finally {
      setIsLoadingTimeslots(false)
    }
  }

  useEffect(() => {
    fetchTimeslots()
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      await axios.post(`${API_BASE_URL}/timeslots`, {
        day,
        period_number: Number(periodNumber),
      })

      setDay('Monday')
      setPeriodNumber(1)
      await fetchTimeslots()
    } catch (err) {
      const detail =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.message ||
        'Failed to create timeslot'
      setError(detail)
    } finally {
      setIsSubmitting(false)
    }
  }

  const sortedTimeslots = useMemo(() => {
    return [...timeslots].sort((a, b) => {
      const aDay = a.day
      const bDay = b.day
      const dayDiff = (dayOrderIndex[aDay] ?? 999) - (dayOrderIndex[bDay] ?? 999)
      if (dayDiff !== 0) return dayDiff
      return Number(a.period_number) - Number(b.period_number)
    })
  }, [timeslots, dayOrderIndex])

  return (
    <div className="w-full max-w-4xl mx-auto mt-10 px-4 pb-10">
      <div className="rounded-xl border border-purple-200 bg-white/80 p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-gray-900">Add TimeSlot</h2>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Day</label>
            <select
              value={day}
              onChange={(e) => setDay(e.target.value)}
              required
              className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200"
            >
              {DAY_OPTIONS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Period number
            </label>
            <input
              type="number"
              value={periodNumber}
              min={1}
              max={8}
              step={1}
              onChange={(e) => setPeriodNumber(e.target.value)}
              required
              className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200"
            />
            <div className="mt-1 text-xs text-gray-500">
              Range: 1 to 8
            </div>
          </div>

          {error ? (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-md bg-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? 'Creating...' : 'Create timeslot'}
          </button>
        </form>
      </div>

      <div className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">TimeSlots</h3>
          <div className="text-sm text-gray-500">
            {isLoadingTimeslots ? 'Loading...' : `${timeslots.length} timeslots`}
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white/80">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                >
                  Day
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                >
                  Period number
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {sortedTimeslots.map((t) => (
                <tr key={t.slot_id ?? `${t.day}-${t.period_number}`}>
                  <td className="px-4 py-3 text-sm text-gray-900">{t.day}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {t.period_number}
                  </td>
                </tr>
              ))}
              {sortedTimeslots.length === 0 && !isLoadingTimeslots ? (
                <tr>
                  <td
                    className="px-4 py-6 text-sm text-gray-500"
                    colSpan="2"
                  >
                    No timeslots found.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

