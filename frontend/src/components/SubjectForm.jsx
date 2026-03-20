import { useEffect, useState } from 'react'
import axios from 'axios'

const API_BASE_URL = 'http://localhost:8000'

export default function SubjectForm() {
  const [subjectName, setSubjectName] = useState('')
  const [periodsPerWeek, setPeriodsPerWeek] = useState(1)
  const [subjectType, setSubjectType] = useState('theory')
  const [classId, setClassId] = useState('')

  const [subjects, setSubjects] = useState([])
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(false)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)

  async function fetchSubjects() {
    setIsLoadingSubjects(true)
    setError(null)
    try {
      const res = await axios.get(`${API_BASE_URL}/subjects`)
      setSubjects(res.data || [])
    } catch (err) {
      const detail =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.message ||
        'Failed to fetch subjects'
      setError(detail)
    } finally {
      setIsLoadingSubjects(false)
    }
  }

  useEffect(() => {
    fetchSubjects()
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      await axios.post(`${API_BASE_URL}/subjects`, {
        subject_name: subjectName,
        periods_per_week: Number(periodsPerWeek),
        subject_type: subjectType,
        class_id: Number(classId),
      })

      setSubjectName('')
      setPeriodsPerWeek(1)
      setSubjectType('theory')
      setClassId('')
      await fetchSubjects()
    } catch (err) {
      const detail =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.message ||
        'Failed to create subject'
      setError(detail)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto mt-10 px-4 pb-10">
      <div className="rounded-xl border border-purple-200 bg-white/80 p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-gray-900">Add Subject</h2>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Subject name
            </label>
            <input
              type="text"
              value={subjectName}
              onChange={(e) => setSubjectName(e.target.value)}
              required
              className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200"
              placeholder="e.g., Mathematics"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Periods per week
            </label>
            <input
              type="number"
              value={periodsPerWeek}
              min={0}
              step={1}
              onChange={(e) => setPeriodsPerWeek(e.target.value)}
              required
              className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Subject type
            </label>
            <select
              value={subjectType}
              onChange={(e) => setSubjectType(e.target.value)}
              required
              className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200"
            >
              <option value="theory">theory</option>
              <option value="lab">lab</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Class ID
            </label>
            <input
              type="number"
              value={classId}
              min={1}
              step={1}
              onChange={(e) => setClassId(e.target.value)}
              required
              className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200"
              placeholder="e.g., 1"
            />
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
            {isSubmitting ? 'Creating...' : 'Create subject'}
          </button>
        </form>
      </div>

      <div className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Subjects</h3>
          <div className="text-sm text-gray-500">
            {isLoadingSubjects ? 'Loading...' : `${subjects.length} subjects`}
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
                  Subject name
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                >
                  Periods/week
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                >
                  Type
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                >
                  Class ID
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {subjects.map((s) => (
                <tr key={s.subject_id ?? `${s.subject_name}-${s.class_id}`}>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {s.subject_name}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {s.periods_per_week}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {s.subject_type}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {s.class_id}
                  </td>
                </tr>
              ))}
              {subjects.length === 0 && !isLoadingSubjects ? (
                <tr>
                  <td
                    className="px-4 py-6 text-sm text-gray-500"
                    colSpan="4"
                  >
                    No subjects found.
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

