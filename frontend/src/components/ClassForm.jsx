import { useEffect, useState } from 'react'
import axios from 'axios'

const API_BASE_URL = 'http://localhost:8000'

export default function ClassForm() {
  const [className, setClassName] = useState('')

  const [classes, setClasses] = useState([])
  const [isLoadingClasses, setIsLoadingClasses] = useState(false)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)

  async function fetchClasses() {
    setIsLoadingClasses(true)
    setError(null)
    try {
      const res = await axios.get(`${API_BASE_URL}/classes`)
      setClasses(res.data || [])
    } catch (err) {
      const detail =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.message ||
        'Failed to fetch classes'
      setError(detail)
    } finally {
      setIsLoadingClasses(false)
    }
  }

  useEffect(() => {
    fetchClasses()
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      await axios.post(`${API_BASE_URL}/classes`, {
        class_name: className,
      })

      setClassName('')
      await fetchClasses()
    } catch (err) {
      const detail =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.message ||
        'Failed to create class'
      setError(detail)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="w-full max-w-3xl mx-auto mt-10 px-4 pb-10">
      <div className="rounded-xl border border-purple-200 bg-white/80 p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-gray-900">Add Class</h2>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Class name
            </label>
            <input
              type="text"
              value={className}
              onChange={(e) => setClassName(e.target.value)}
              required
              className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200"
              placeholder="e.g., Class 10"
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
            {isSubmitting ? 'Creating...' : 'Create class'}
          </button>
        </form>
      </div>

      <div className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Classes</h3>
          <div className="text-sm text-gray-500">
            {isLoadingClasses ? 'Loading...' : `${classes.length} classes`}
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
                  Class ID
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                >
                  Class name
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {classes.map((c) => (
                <tr key={c.class_id ?? c.class_name}>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {c.class_id}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {c.class_name}
                  </td>
                </tr>
              ))}
              {classes.length === 0 && !isLoadingClasses ? (
                <tr>
                  <td
                    className="px-4 py-6 text-sm text-gray-500"
                    colSpan="2"
                  >
                    No classes found.
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

