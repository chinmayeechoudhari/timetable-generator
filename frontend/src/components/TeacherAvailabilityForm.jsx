import { useEffect, useState } from 'react'
import axios from 'axios'

const API_BASE_URL = 'http://localhost:8000'

const AVAILABILITY_PATHS = [
  '/teacher-availabilities',
  '/teacher_availabilities',
]

export default function TeacherAvailabilityForm() {
  const [teacherId, setTeacherId] = useState('')
  const [slotId, setSlotId] = useState('')
  const [isAvailable, setIsAvailable] = useState(true)

  const [availability, setAvailability] = useState([])
  const [isLoading, setIsLoading] = useState(false)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)

  async function getAllAvailability() {
    setIsLoading(true)
    setError(null)

    let lastErr = null
    for (const path of AVAILABILITY_PATHS) {
      try {
        const res = await axios.get(`${API_BASE_URL}${path}`)
        setAvailability(res.data || [])
        setIsLoading(false)
        return
      } catch (err) {
        lastErr = err
      }
    }

    setIsLoading(false)
    const detail =
      lastErr?.response?.data?.detail ||
      lastErr?.response?.data?.message ||
      lastErr?.message ||
      'Failed to fetch teacher availability'
    setError(detail)
  }

  useEffect(() => {
    getAllAvailability()
  }, [])

  async function postAvailability(payload) {
    let lastErr = null
    for (const path of AVAILABILITY_PATHS) {
      try {
        await axios.post(`${API_BASE_URL}${path}`, payload)
        return
      } catch (err) {
        lastErr = err
      }
    }

    const detail =
      lastErr?.response?.data?.detail ||
      lastErr?.response?.data?.message ||
      lastErr?.message ||
      'Failed to create teacher availability'
    throw new Error(detail)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      await postAvailability({
        teacher_id: Number(teacherId),
        slot_id: Number(slotId),
        is_available: isAvailable,
      })

      setTeacherId('')
      setSlotId('')
      setIsAvailable(true)
      await getAllAvailability()
    } catch (err) {
      setError(err?.message || 'Failed to create teacher availability')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto mt-10 px-4 pb-10">
      <div className="rounded-xl border border-purple-200 bg-white/80 p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-gray-900">
          Set Teacher Availability
        </h2>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Teacher ID
            </label>
            <input
              type="number"
              value={teacherId}
              onChange={(e) => setTeacherId(e.target.value)}
              min={1}
              step={1}
              required
              className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200"
              placeholder="e.g., 1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Slot ID
            </label>
            <input
              type="number"
              value={slotId}
              onChange={(e) => setSlotId(e.target.value)}
              min={1}
              step={1}
              required
              className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200"
              placeholder="e.g., 3"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Is available
            </label>
            <select
              value={isAvailable ? 'true' : 'false'}
              onChange={(e) => setIsAvailable(e.target.value === 'true')}
              required
              className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200"
            >
              <option value="true">true</option>
              <option value="false">false</option>
            </select>
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
            {isSubmitting ? 'Setting...' : 'Set availability'}
          </button>
        </form>
      </div>

      <div className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Teacher Availability
          </h3>
          <div className="text-sm text-gray-500">
            {isLoading ? 'Loading...' : `${availability.length} records`}
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
                  Teacher ID
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                >
                  Slot ID
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                >
                  Is available
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {availability.map((r) => (
                <tr
                  key={
                    r.teacher_id ?? r.slot_id
                      ? `${r.teacher_id}-${r.slot_id}`
                      : `${r.teacher_id}`
                  }
                >
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {r.teacher_id}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {r.slot_id}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {String(r.is_available)}
                  </td>
                </tr>
              ))}
              {availability.length === 0 && !isLoading ? (
                <tr>
                  <td
                    className="px-4 py-6 text-sm text-gray-500"
                    colSpan="3"
                  >
                    No availability records found.
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

