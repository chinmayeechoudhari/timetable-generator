import { useState } from 'react'
import axios from 'axios'

const API_BASE_URL = 'http://localhost:8000'

export default function TeacherForm() {
  const [teacherName, setTeacherName] = useState('')
  const [maxPeriodsPerDay, setMaxPeriodsPerDay] = useState(6)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [createdTeacher, setCreatedTeacher] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    setCreatedTeacher(null)

    try {
      const res = await axios.post(`${API_BASE_URL}/teachers`, {
        teacher_name: teacherName,
        max_periods_per_day: Number(maxPeriodsPerDay),
      })

      setCreatedTeacher(res.data)
      setTeacherName('')
      setMaxPeriodsPerDay(6)
    } catch (err) {
      const detail =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.message ||
        'Failed to create teacher'
      setError(detail)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto mt-10 px-4">
      <div className="rounded-xl border border-purple-200 bg-white/80 p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-gray-900">Add Teacher</h2>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Teacher name
            </label>
            <input
              type="text"
              value={teacherName}
              onChange={(e) => setTeacherName(e.target.value)}
              required
              className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200"
              placeholder="e.g., Mr. Sharma"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Max periods per day
            </label>
            <input
              type="number"
              value={maxPeriodsPerDay}
              min={0}
              step={1}
              onChange={(e) => setMaxPeriodsPerDay(e.target.value)}
              required
              className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200"
            />
          </div>

          {error ? (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          {createdTeacher ? (
            <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
              Created: {createdTeacher.teacher_name} (ID: {createdTeacher.teacher_id})
            </div>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-md bg-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? 'Creating...' : 'Create teacher'}
          </button>
        </form>
      </div>
    </div>
  )
}

