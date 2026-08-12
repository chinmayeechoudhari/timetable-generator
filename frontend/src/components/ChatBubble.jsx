import { useState, useEffect, useRef } from 'react'
import axios from 'axios'

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || ''
const BASE_URL = 'http://localhost:8000'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const DAY_ALIAS = {
  mon: 'Monday', monday: 'Monday',
  tue: 'Tuesday', tues: 'Tuesday', tuesday: 'Tuesday',
  wed: 'Wednesday', wednesday: 'Wednesday',
  thu: 'Thursday', thur: 'Thursday', thurs: 'Thursday', thursday: 'Thursday',
  fri: 'Friday', friday: 'Friday',
  sat: 'Saturday', saturday: 'Saturday'
}

function editDistance(s1, s2) {
  if (s1 === s2) return 0
  const m = s1.length, n = s2.length
  if (m === 0) return n
  if (n === 0) return m
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0))
  for (let i = 0; i <= m; i++) dp[i][0] = i
  for (let j = 0; j <= n; j++) dp[0][j] = j
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost)
    }
  }
  return dp[m][n]
}

export default function ChatBubble() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      text: "Hello! I'm your Timetable AI Assistant. You can ask me to manage teacher availability (e.g., *'Prof. Sharma is not available on Monday'*), check **Workload & Conflicts**, or view **Room Occupancy**!",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [pendingAction, setPendingAction] = useState(null)

  const [teachers, setTeachers] = useState([])
  const [timeslots, setTimeslots] = useState([])
  const [availabilities, setAvailabilities] = useState([])
  const [rooms, setRooms] = useState([])
  const [timetable, setTimetable] = useState([])
  const [subjects, setSubjects] = useState([])
  const [classes, setClasses] = useState([])

  const messagesEndRef = useRef(null)

  // Fetch contextual timetable data from backend
  useEffect(() => {
    fetchContextData()
  }, [])

  useEffect(() => {
    if (isOpen) {
      scrollToBottom()
    }
  }, [messages, isOpen])

  async function fetchContextData() {
    try {
      const [tRes, sRes, aRes, rRes, ttRes, subRes, cRes] = await Promise.all([
        axios.get(`${BASE_URL}/teachers`).catch(() => ({ data: [] })),
        axios.get(`${BASE_URL}/timeslots`).catch(() => ({ data: [] })),
        axios.get(`${BASE_URL}/teacher-availabilities`).catch(() => ({ data: [] })),
        axios.get(`${BASE_URL}/rooms`).catch(() => ({ data: [] })),
        axios.get(`${BASE_URL}/timetable`).catch(() => ({ data: [] })),
        axios.get(`${BASE_URL}/subjects`).catch(() => ({ data: [] })),
        axios.get(`${BASE_URL}/classes`).catch(() => ({ data: [] }))
      ])
      setTeachers(tRes.data || [])
      setTimeslots(sRes.data || [])
      setAvailabilities(aRes.data || [])
      setRooms(rRes.data || [])
      setTimetable(ttRes.data || [])
      setSubjects(subRes.data || [])
      setClasses(cRes.data || [])
    } catch (err) {
      console.warn('Context data load warning:', err)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // Parse natural language for Teacher + Day availability query (Fuzzy & Typo Tolerant)
  function parseAvailabilityQuery(text) {
    const lower = text.toLowerCase().trim()
    const words = lower.replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean)
    
    // 1. Check day (exact or fuzzy edit distance <= 2)
    const ALL_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    let foundDay = null

    for (const w of words) {
      if (w.length < 3) continue
      if (DAY_ALIAS[w]) {
        foundDay = DAY_ALIAS[w]
        break
      }
      for (const d of ALL_DAYS) {
        const dLower = d.toLowerCase()
        if (w.length >= 4 && editDistance(w, dLower) <= 2) {
          foundDay = d
          break
        }
      }
      if (foundDay) break
    }

    // 2. Check teacher (exact or fuzzy token edit distance)
    let foundTeacher = null
    if (teachers && teachers.length > 0) {
      for (const t of teachers) {
        const tNameLower = t.teacher_name.toLowerCase()
        if (lower.includes(tNameLower)) {
          foundTeacher = t
          break
        }
        const nameTokens = tNameLower.replace(/prof\.|dr\.|mr\.|mrs\.|ms\./gi, '').trim().split(/\s+/).filter(Boolean)
        for (const tok of nameTokens) {
          if (tok.length >= 3) {
            if (lower.includes(tok)) {
              foundTeacher = t
              break
            }
            for (const w of words) {
              if (w.length >= 3 && editDistance(w, tok) <= 1) {
                foundTeacher = t
                break
              }
            }
          }
          if (foundTeacher) break
        }
        if (foundTeacher) break
      }
    }

    // 3. Determine target state (Available vs Unavailable with typo tolerance)
    let targetAvailable = null
    const isUnavail = /not available|not availaible|not avialable|unavailable|unavailaible|absent|off|leave|can't teach|cant teach|no class/i.test(lower)
    const isAvail = /make available|set available|is available|is availaible|mark available|available|availaible|avialable|avaiable|availible|free|can teach|present|on duty/i.test(lower)

    if (isUnavail) {
      targetAvailable = false
    } else if (isAvail) {
      targetAvailable = true
    } else if (foundTeacher && foundDay) {
      targetAvailable = true
    }

    if (foundTeacher && foundDay && targetAvailable !== null) {
      return { teacher: foundTeacher, day: foundDay, targetAvailable }
    }
    return null
  }

  // Gemini API call helper
  async function queryGeminiApi(promptText, history) {
    const modelsToTry = ['gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-2.0-flash']
    const systemPrompt = `You are a helpful AI Assistant for an automated College/School Timetable Generator application.
    Current Teachers in system: ${teachers.map(t => t.teacher_name).join(', ') || 'None'}.
    Available Days: Monday to Saturday.
    You can help users manage teacher availability (setting teachers to AVAILABLE or UNAVAILABLE), analyze workload & conflicts, check room occupancy, explain timetable generation, or check schedules.
    Be concise, helpful, friendly, and professional.`

    for (const model of modelsToTry) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`
        const contents = [
          ...history.slice(-4).map(m => ({
            role: m.sender === 'user' ? 'user' : 'model',
            parts: [{ text: m.text }]
          })),
          {
            role: 'user',
            parts: [{ text: promptText }]
          }
        ]

        const response = await axios.post(url, {
          contents,
          systemInstruction: { parts: [{ text: systemPrompt }] }
        }, { headers: { 'Content-Type': 'application/json' } })

        if (response.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
          return response.data.candidates[0].content.parts[0].text
        }
      } catch (e) {
        console.warn(`Gemini API call failed with model ${model}:`, e?.response?.data || e.message)
      }
    }
    return null
  }

  // Handle setting availability (true or false) in backend
  async function applyAvailability(teacherId, teacherName, day, targetAvailable) {
    try {
      const daySlots = timeslots.filter(s => s.day.toLowerCase() === day.toLowerCase())
      if (daySlots.length === 0) {
        return `I couldn't find configured timeslots for ${day}. Please verify timeslot setup first.`
      }

      let updatedCount = 0
      for (const slot of daySlots) {
        const existing = availabilities.find(
          a => a.teacher_id === teacherId && a.slot_id === slot.slot_id
        )

        if (targetAvailable) {
          if (existing) {
            await axios.delete(`${BASE_URL}/teacher-availabilities/${teacherId}/${slot.slot_id}`).catch(async () => {
              await axios.put(`${BASE_URL}/teacher-availabilities/${teacherId}/${slot.slot_id}`, { is_available: true })
            })
            updatedCount++
          }
        } else {
          if (existing) {
            await axios.put(`${BASE_URL}/teacher-availabilities/${teacherId}/${slot.slot_id}`, {
              is_available: false
            })
          } else {
            await axios.post(`${BASE_URL}/teacher-availabilities`, {
              teacher_id: teacherId,
              slot_id: slot.slot_id,
              is_available: false
            })
          }
          updatedCount++
        }
      }

      fetchContextData()

      if (targetAvailable) {
        return `Done! I have updated **${teacherName}** to be **AVAILABLE** on **${day}**. You can now go to the **Generate** tab to re-run the solver with updated constraints.`
      } else {
        return `Done! I have marked **${teacherName}** as **UNAVAILABLE** on **${day}** (${updatedCount} slot rules updated). You can now go to the **Generate** tab to re-run the solver.`
      }
    } catch (err) {
      console.error('Error applying availability:', err)
      return `Failed to update availability on backend. Make sure the backend server is running.`
    }
  }

  // Feature 1: Teacher Workload & Conflict Analyzer
  function getWorkloadAndConflictSummary() {
    if (!timetable || timetable.length === 0) {
      return "📊 **Teacher Workload & Conflict Analyzer**:\nNo timetable entries generated yet! Please go to the **Generate** tab and generate a timetable first."
    }

    const teacherCountMap = {}
    const teacherDayMap = {}
    const conflicts = []

    const unavailableSet = new Set(
      availabilities
        .filter(a => !a.is_available)
        .map(a => `${a.teacher_id}_${a.slot_id}`)
    )

    timetable.forEach(entry => {
      const tId = entry.teacher_id
      teacherCountMap[tId] = (teacherCountMap[tId] || 0) + 1

      const slot = timeslots.find(s => s.slot_id === entry.slot_id)
      if (slot) {
        if (!teacherDayMap[tId]) teacherDayMap[tId] = {}
        teacherDayMap[tId][slot.day] = (teacherDayMap[tId][slot.day] || 0) + 1
      }

      if (unavailableSet.has(`${tId}_${entry.slot_id}`)) {
        const teacherObj = teachers.find(t => t.teacher_id === tId)
        const tName = teacherObj ? teacherObj.teacher_name : `Teacher ${tId}`
        const slotLabel = slot ? `${slot.day} P${slot.period_number}` : `Slot ${entry.slot_id}`
        conflicts.push(`⚠️ **${tName}** is assigned on **${slotLabel}** despite an unavailability rule.`)
      }
    })

    let text = "📊 **Teacher Workload Summary**:\n\n"
    teachers.forEach(t => {
      const count = teacherCountMap[t.teacher_id] || 0
      const days = teacherDayMap[t.teacher_id] || {}
      let busiestDay = 'N/A'
      let maxD = 0
      Object.entries(days).forEach(([d, num]) => {
        if (num > maxD) { maxD = num; busiestDay = `${d} (${num} periods)` }
      })

      text += `• **${t.teacher_name}**: ${count} total period(s) | Peak: ${busiestDay}\n`
    })

    if (conflicts.length > 0) {
      text += `\n🚨 **Conflicts Detected (${conflicts.length})**:\n` + conflicts.join('\n')
    } else {
      text += `\n✅ **Conflicts**: No scheduling conflicts detected!`
    }

    return text
  }

  // Feature 2: Room Occupancy Query
  function getRoomOccupancySummary(inputQuery) {
    if (!rooms || rooms.length === 0) {
      return "🏢 **Room Occupancy**: No rooms configured yet."
    }

    const lower = inputQuery.toLowerCase()
    let targetDay = 'Monday'
    const words = lower.replace(/[^a-z0-9\s]/g, ' ').split(/\s+/)
    for (const w of words) {
      if (DAY_ALIAS[w]) {
        targetDay = DAY_ALIAS[w]
        break
      }
    }

    let targetPeriod = null
    const periodMatch = lower.match(/p(\d+)|period\s*(\d+)/i)
    if (periodMatch) {
      targetPeriod = parseInt(periodMatch[1] || periodMatch[2])
    }

    if (targetPeriod) {
      const slot = timeslots.find(s => s.day.toLowerCase() === targetDay.toLowerCase() && s.period_number === targetPeriod)
      if (!slot) {
        return `🏢 **Room Occupancy**: Could not find Period ${targetPeriod} for ${targetDay}.`
      }

      const occupiedSlotEntries = timetable.filter(e => e.slot_id === slot.slot_id)
      const occupiedRoomIds = new Set(occupiedSlotEntries.map(e => e.room_id))

      const occupiedList = []
      const freeList = []

      rooms.forEach(r => {
        if (occupiedRoomIds.has(r.room_id)) {
          const entry = occupiedSlotEntries.find(e => e.room_id === r.room_id)
          const subObj = subjects.find(s => s.subject_id === entry?.subject_id)
          const clsObj = classes.find(c => c.class_id === entry?.class_id)
          occupiedList.push(`🔴 **${r.room_name}**: ${clsObj?.class_name || 'Class'} (${subObj?.subject_name || 'Subject'})`)
        } else {
          freeList.push(`🟢 **${r.room_name}** (Cap: ${r.capacity || 'N/A'})`)
        }
      })

      return `🏢 **Room Occupancy for ${targetDay} Period ${targetPeriod}**:\n\n` +
        `**Vacant / Free Rooms (${freeList.length})**:\n${freeList.join('\n') || 'None'}\n\n` +
        `**Occupied Rooms (${occupiedList.length})**:\n${occupiedList.join('\n') || 'None'}`
    } else {
      const daySlots = timeslots.filter(s => s.day.toLowerCase() === targetDay.toLowerCase())
      if (daySlots.length === 0) {
        return `🏢 **Room Occupancy**: No timeslots configured for ${targetDay}.`
      }

      let text = `🏢 **Room Occupancy Overview for ${targetDay}**:\n\n`
      rooms.forEach(r => {
        const assignedSlots = timetable.filter(e => e.room_id === r.room_id && daySlots.some(ds => ds.slot_id === e.slot_id))
        text += `• **${r.room_name}**: ${assignedSlots.length} / ${daySlots.length} periods occupied\n`
      })
      text += `\n💡 *Tip: Try asking "Which room is free on ${targetDay} Period 1?" for period availability.*`
      return text
    }
  }

  const handleSend = async (overrideText) => {
    const textToSend = overrideText || inputValue
    if (!textToSend.trim()) return

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    setMessages(prev => [...prev, userMsg])
    if (!overrideText) setInputValue('')
    setIsTyping(true)

    const lower = textToSend.trim().toLowerCase()

    // 1. Check if there is a pending action waiting for confirmation
    if (pendingAction) {
      const isAffirmative = /^(yes|yeah|yep|sure|ok|okay|confirm|do it|true|y|correct|please)$/i.test(lower) || lower.includes('yes') || lower.includes('sure') || lower.includes('ok')
      const isNegative = /^(no|nope|nah|cancel|don't|dont|false|n|stop)$/i.test(lower) || lower.includes('no') || lower.includes('cancel')

      if (isAffirmative) {
        const botReplyText = await applyAvailability(
          pendingAction.teacherId,
          pendingAction.teacherName,
          pendingAction.day,
          pendingAction.targetAvailable
        )

        setMessages(prev => [
          ...prev,
          {
            id: Date.now() + 1,
            sender: 'bot',
            text: botReplyText,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ])
        setPendingAction(null)
        setIsTyping(false)
        return
      } else if (isNegative) {
        setMessages(prev => [
          ...prev,
          {
            id: Date.now() + 1,
            sender: 'bot',
            text: `Understood, decision reconsidered and action cancelled! I haven't modified the availability for ${pendingAction.teacherName}. What would you like me to do instead?`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ])
        setPendingAction(null)
        setIsTyping(false)
        return
      } else {
        setMessages(prev => [
          ...prev,
          {
            id: Date.now() + 1,
            sender: 'bot',
            text: `I have a pending action: change availability of **${pendingAction.teacherName}** on **${pendingAction.day}** to **${pendingAction.targetAvailable ? 'AVAILABLE' : 'UNAVAILABLE'}**. Please reply **Yes** to confirm or **No** to reconsider and cancel.`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ])
        setIsTyping(false)
        return
      }
    }

    // 2. Teacher Workload & Conflict query
    if (/workload|teacher load|busiest teacher|check conflict|conflicts|highest load/i.test(lower)) {
      const summaryText = getWorkloadAndConflictSummary()
      setMessages(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'bot',
          text: summaryText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ])
      setIsTyping(false)
      return
    }

    // 3. Room Occupancy query
    if (/room|occupancy|vacant|free room|empty room/i.test(lower)) {
      const summaryText = getRoomOccupancySummary(textToSend)
      setMessages(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'bot',
          text: summaryText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ])
      setIsTyping(false)
      return
    }

    // 4. Availability query
    const parsedQuery = parseAvailabilityQuery(textToSend)
    if (parsedQuery) {
      const { teacher, day, targetAvailable } = parsedQuery
      setPendingAction({
        type: 'CHANGE_AVAILABILITY',
        teacherId: teacher.teacher_id,
        teacherName: teacher.teacher_name,
        day: day,
        targetAvailable: targetAvailable
      })

      const statusWord = targetAvailable ? 'AVAILABLE' : 'UNAVAILABLE'
      setMessages(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'bot',
          text: `Do you want me to change the availability of **${teacher.teacher_name}** on **${day}** to **${statusWord}**?`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ])
      setIsTyping(false)
      return
    }

    // 5. General query to Gemini API with fallback
    const geminiResponse = await queryGeminiApi(textToSend, messages)

    let finalBotText = geminiResponse
    if (!finalBotText) {
      if (lower.includes('teacher') || lower.includes('availability')) {
        finalBotText = `To manage teacher availability, you can say e.g., *"Prof. Sharma is not available on Monday"* or navigate to the Teacher Availability page in the sidebar.`
      } else if (lower.includes('generate') || lower.includes('solve')) {
        finalBotText = `To generate a timetable, click on the **Generate** option in the navigation menu and hit the **Generate Timetable** button!`
      } else {
        finalBotText = `I'm here to help manage your timetable! You can ask me to update teacher availability, check **Workload & Conflicts**, or view **Room Occupancy**.`
      }
    }

    setMessages(prev => [
      ...prev,
      {
        id: Date.now() + 1,
        sender: 'bot',
        text: finalBotText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ])
    setIsTyping(false)
  }

  return (
    <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 99999, fontFamily: "'Inter', sans-serif" }}>
      
      {/* ── Expanded Chat Window ── */}
      {isOpen && (
        <div style={{
          width: '380px',
          height: '520px',
          maxHeight: 'calc(100vh - 100px)',
          background: 'var(--bg-card, #FFFFFF)',
          color: 'var(--text-main, #1B2A3B)',
          borderRadius: '16px',
          boxShadow: '0 12px 36px rgba(0, 0, 0, 0.25), 0 4px 12px rgba(0, 0, 0, 0.1)',
          border: '1px solid var(--border-color, #E2E8F0)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'chatSlideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
          marginBottom: '16px'
        }}>
          {/* Header */}
          <div style={{
            padding: '14px 18px',
            background: 'linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 2px 8px rgba(37, 99, 235, 0.2)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '32px', height: '32px', borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '16px'
              }}>
                ✨
              </div>
              <div>
                <div style={{ fontWeight: '700', fontSize: '14px', lineHeight: '1.2' }}>Timetable AI Assistant</div>
                <div style={{ fontSize: '11px', opacity: 0.85, display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4ADE80' }}></span>
                  Gemini Powered
                </div>
              </div>
            </div>
            
            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: 'rgba(255, 255, 255, 0.15)',
                border: 'none',
                color: '#FFFFFF',
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px',
                transition: 'background 0.2s'
              }}
              title="Close Chat"
            >
              ✕
            </button>
          </div>

          {/* Messages Area */}
          <div style={{
            flex: 1,
            padding: '16px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            background: 'var(--input-bg, #F8FAFC)'
          }}>
            {messages.map(m => (
              <div
                key={m.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: m.sender === 'user' ? 'flex-end' : 'flex-start'
                }}
              >
                <div style={{
                  maxWidth: '85%',
                  padding: '10px 14px',
                  borderRadius: m.sender === 'user' ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                  background: m.sender === 'user' 
                    ? 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)' 
                    : 'var(--bg-card, #FFFFFF)',
                  color: m.sender === 'user' ? '#FFFFFF' : 'var(--text-main, #1B2A3B)',
                  fontSize: '13px',
                  lineHeight: '1.5',
                  border: m.sender === 'bot' ? '1px solid var(--border-color, #E2E8F0)' : 'none',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  whiteSpace: 'pre-line',
                  wordBreak: 'break-word'
                }}>
                  {m.text}
                </div>
                <span style={{ fontSize: '10px', color: 'var(--text-muted, #94A3B8)', marginTop: '3px', padding: '0 4px' }}>
                  {m.timestamp}
                </span>
              </div>
            ))}

            {isTyping && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', background: 'var(--bg-card, #FFFFFF)', borderRadius: '12px', width: 'fit-content', border: '1px solid var(--border-color, #E2E8F0)' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted, #64748B)' }}>Thinking...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Prompt Quick Chips */}
          {pendingAction ? (
            <div style={{
              padding: '8px 12px',
              background: 'var(--bg-card, #FFFFFF)',
              borderTop: '1px solid var(--border-color, #E2E8F0)',
              display: 'flex',
              gap: '8px'
            }}>
              <button
                onClick={() => handleSend('Yes')}
                style={{
                  flex: 1, padding: '7px 12px', borderRadius: '8px', border: 'none',
                  background: '#166534', color: '#FFFFFF', fontSize: '12px', fontWeight: '700', cursor: 'pointer'
                }}
              >
                ✓ Yes, update availability
              </button>
              <button
                onClick={() => handleSend('No')}
                style={{
                  flex: 1, padding: '7px 12px', borderRadius: '8px', border: 'none',
                  background: '#991B1B', color: '#FFFFFF', fontSize: '12px', fontWeight: '700', cursor: 'pointer'
                }}
              >
                ✕ No, reconsider decision
              </button>
            </div>
          ) : (
            <div style={{
              padding: '6px 12px',
              background: 'var(--bg-card, #FFFFFF)',
              borderTop: '1px solid var(--border-color, #E2E8F0)',
              display: 'flex',
              gap: '6px',
              overflowX: 'auto',
              whiteSpace: 'nowrap'
            }}>
              <button
                onClick={() => handleSend('Teacher workload summary')}
                style={{
                  padding: '4px 10px',
                  borderRadius: '12px',
                  border: '1px solid #BFDBFE',
                  background: '#EFF6FF',
                  color: '#1D4ED8',
                  fontSize: '11px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                📊 Workload Summary
              </button>
              <button
                onClick={() => handleSend('Which rooms are free on Monday Period 1?')}
                style={{
                  padding: '4px 10px',
                  borderRadius: '12px',
                  border: '1px solid #BBF7D0',
                  background: '#F0FDF4',
                  color: '#166534',
                  fontSize: '11px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                🏢 Free Rooms Mon P1
              </button>
            </div>
          )}

          {/* Input Footer */}
          <div style={{
            padding: '12px',
            background: 'var(--bg-card, #FFFFFF)',
            borderTop: '1px solid var(--border-color, #E2E8F0)',
            display: 'flex',
            gap: '8px',
            alignItems: 'center'
          }}>
            <input
              type="text"
              placeholder={pendingAction ? "Type 'Yes' or 'No'..." : "Ask e.g. Prof. Sharma off Mon, Workload, Free Rooms..."}
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              style={{
                flex: 1,
                padding: '9px 12px',
                borderRadius: '8px',
                border: '1px solid var(--input-border, #CBD5E1)',
                background: 'var(--input-bg, #F8FAFC)',
                color: 'var(--text-main, #1B2A3B)',
                fontSize: '13px',
                outline: 'none'
              }}
            />
            <button
              onClick={() => handleSend()}
              style={{
                padding: '9px 14px',
                borderRadius: '8px',
                border: 'none',
                background: 'linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)',
                color: '#FFFFFF',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              ➔
            </button>
          </div>
        </div>
      )}

      {/* ── Floating Chat Trigger Button ── */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '56px',
          height: '56px',
          borderRadius: '28px',
          border: 'none',
          background: 'linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)',
          color: '#FFFFFF',
          fontSize: '24px',
          boxShadow: '0 8px 24px rgba(37, 99, 235, 0.4), 0 2px 6px rgba(0, 0, 0, 0.1)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s',
          transform: isOpen ? 'scale(0.9) rotate(90deg)' : 'scale(1)',
          marginLeft: 'auto'
        }}
        title="AI Timetable Assistant"
      >
        {isOpen ? '✕' : '💬'}
      </button>

      {/* CSS Animation keyframes */}
      <style>{`
        @keyframes chatSlideUp {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  )
}
