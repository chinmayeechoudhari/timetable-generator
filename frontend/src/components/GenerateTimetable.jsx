import { useEffect, useRef, useState } from 'react'
import axios from 'axios'

const API_BASE_URL = 'http://localhost:8000'

export default function GenerateTimetable() {
  const [taskId, setTaskId] = useState(null)
  const [status, setStatus] = useState(null)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [isGenerating, setIsGenerating] = useState(false)

  const intervalRef = useRef(null)

  async function startGenerate() {
    setError(null)
    setResult(null)
    setStatus(null)

    // Clear any existing polling interval before starting a new generation.
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    setIsGenerating(true)
    try {
      const res = await axios.post(`${API_BASE_URL}/generate`)
      setTaskId(res.data?.task_id || null)
      setStatus(res.data?.status || 'running')
    } catch (err) {
      setError(
        err?.response?.data?.detail ||
          err?.response?.data?.message ||
          err?.message ||
          'Failed to start timetable generation',
      )
      setIsGenerating(false)
    }
  }

  async function pollStatus(currentTaskId) {
    try {
      const res = await axios.get(
        `${API_BASE_URL}/generate/status/${currentTaskId}`,
      )
      const nextStatus = res.data?.status
      setStatus(nextStatus)

      if (nextStatus === 'done') {
        setResult(res.data?.result ?? null)
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
          intervalRef.current = null
        }
        setIsGenerating(false)
      }
    } catch (err) {
      setError(
        err?.response?.data?.detail ||
          err?.response?.data?.message ||
          err?.message ||
          'Failed to fetch generation status',
      )
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      setIsGenerating(false)
    }
  }

  useEffect(() => {
    if (!taskId) return

    // Poll every 3 seconds until we hit "done".
    intervalRef.current = setInterval(() => {
      pollStatus(taskId)
    }, 3000)

    // Cleanup on unmount.
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [taskId])

  const showRunning = isGenerating && status !== 'done'

  return (
    <div className="w-full max-w-4xl mx-auto mt-10 px-4 pb-10">
      <div className="rounded-xl border border-purple-200 bg-white/80 p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-gray-900">
          Generate Timetable
        </h2>

        <div className="mt-4">
          <button
            type="button"
            onClick={startGenerate}
            disabled={isGenerating}
            className="w-full rounded-md bg-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isGenerating ? 'Generating...' : 'Generate Timetable'}
          </button>
        </div>

        {showRunning ? (
          <div className="mt-4 rounded-md border border-purple-200 bg-purple-50 px-3 py-2 text-sm text-purple-800">
            Solver is running...
          </div>
        ) : null}

        {status === 'done' ? (
          <div className="mt-4 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
            Timetable generated successfully
          </div>
        ) : null}

        {error ? (
          <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {status === 'done' && result ? (
          <div className="mt-5 overflow-auto rounded-lg border border-gray-200 bg-white p-4">
            <pre className="whitespace-pre-wrap break-words text-xs text-gray-800">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        ) : null}
      </div>
    </div>
  )
}

