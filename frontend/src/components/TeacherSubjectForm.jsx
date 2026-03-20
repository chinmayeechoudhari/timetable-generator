import { useEffect, useState } from 'react'
import axios from 'axios'

const API_BASE_URL = 'http://localhost:8000'

const SUBJECT_LINK_PATHS = ['/teacher-subjects', '/teacher_subjects']

export default function TeacherSubjectForm() {
  const [teacherId, setTeacherId] = useState('')
  const [subjectId, setSubjectId] = useState('')

  const [links, setLinks] = useState([])
  const [isLoadingLinks, setIsLoadingLinks] = useState(false)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)

  async function fetchLinks() {
    setIsLoadingLinks(true)
    setError(null)

    let lastErr = null
    for (const path of SUBJECT_LINK_PATHS) {
      try {
        const res = await axios.get(`${API_BASE_URL}${path}`)
        setLinks(res.data || [])
        setIsLoadingLinks(false)
        return
      } catch (err) {
        lastErr = err
      }
    }

    setIsLoadingLinks(false)
    const detail =
      lastErr?.response?.data?.detail ||
      lastErr?.response?.data?.message ||
      lastErr?.message ||
      'Failed to fetch teacher-subject links'
    setError(detail)
  }

  useEffect(() => {
    fetchLinks()
  }, [])

  async function postLink(payload) {
    let lastErr = null
    for (const path of SUBJECT_LINK_PATHS) {
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
      'Failed to create teacher-subject link'
    throw new Error(detail)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      await postLink({
        teacher_id: Number(teacherId),
        subject_id: Number(subjectId),
      })

      setTeacherId('')
      setSubjectId('')
      await fetchLinks()
    } catch (err) {
      setError(err?.message || 'Failed to create teacher-subject link')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto mt-10 px-4 pb-10">
      <div className="rounded-xl border border-purple-200 bg-white/80 p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-gray-900">
          Assign Subject to Teacher
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
              Subject ID
            </label>
            <input
              type="number"
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              min={1}
              step={1}
              required
              className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200"
              placeholder="e.g., 2"
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
            {isSubmitting ? 'Assigning...' : 'Assign subject'}
          </button>
        </form>
      </div>

      <div className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Teacher-Subject Links
          </h3>
          <div className="text-sm text-gray-500">
            {isLoadingLinks ? 'Loading...' : `${links.length} links`}
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
                  Subject ID
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {links.map((l) => (
                <tr key={`${l.teacher_id}-${l.subject_id}`}>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {l.teacher_id}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {l.subject_id}
                  </td>
                </tr>
              ))}
              {links.length === 0 && !isLoadingLinks ? (
                <tr>
                  <td
                    className="px-4 py-6 text-sm text-gray-500"
                    colSpan="2"
                  >
                    No links found.
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

