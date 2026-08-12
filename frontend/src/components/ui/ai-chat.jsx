import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send, X, BarChart3, Building2, AlertTriangle,
  CheckCircle2, ChevronRight, Bot, Users, Calendar,
  HelpCircle, ArrowLeft
} from "lucide-react";
import axios from "axios";
import { cn } from "@/lib/utils";

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";
const BASE_URL = "http://localhost:8000";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DAY_ALIAS = {
  mon: "Monday", monday: "Monday", modnay: "Monday", monady: "Monday", mondy: "Monday",
  tue: "Tuesday", tues: "Tuesday", tuesday: "Tuesday",
  wed: "Wednesday", wednesday: "Wednesday",
  thu: "Thursday", thur: "Thursday", thurs: "Thursday", thursday: "Thursday",
  fri: "Friday", friday: "Friday",
  sat: "Saturday", saturday: "Saturday",
};

function editDistance(s1, s2) {
  if (s1 === s2) return 0;
  const m = s1.length, n = s2.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  return dp[m][n];
}

const CAPABILITY_CHIPS = [
  { icon: <BarChart3 size={14} color="#6366F1" />, label: "Workload & Conflicts", color: "#EEF2FF", border: "#C7D2FE" },
  { icon: <Users size={14} color="#0EA5E9" />, label: "Teacher Availability", color: "#F0F9FF", border: "#BAE6FD" },
  { icon: <Building2 size={14} color="#10B981" />, label: "Room Occupancy", color: "#ECFDF5", border: "#A7F3D0" },
  { icon: <Calendar size={14} color="#F59E0B" />, label: "Timetable Insights", color: "#FFFBEB", border: "#FDE68A" },
  { icon: <HelpCircle size={14} color="#8B5CF6" />, label: "General Help", color: "#F5F3FF", border: "#DDD6FE" },
];

const QUICK_ACTIONS = [
  {
    id: "workload",
    icon: <BarChart3 size={16} color="#6366F1" />,
    title: "Workload Summary",
    desc: "View teacher workload",
    query: "Teacher workload summary",
    bg: "#EEF2FF",
    border: "#C7D2FE",
    iconBg: "#6366F1",
  },
  {
    id: "rooms",
    icon: <Building2 size={16} color="#10B981" />,
    title: "Free Rooms",
    desc: "Find available rooms",
    query: "Which rooms are free on Monday Period 1?",
    bg: "#ECFDF5",
    border: "#6EE7B7",
    iconBg: "#10B981",
  },
  {
    id: "conflicts",
    icon: <AlertTriangle size={16} color="#F59E0B" />,
    title: "Conflicts",
    desc: "Check scheduling conflicts",
    query: "Check for scheduling conflicts",
    bg: "#FFFBEB",
    border: "#FDE68A",
    iconBg: "#F59E0B",
  },
];

export default function AIChatCard({ className, onClose }) {
  const [showHome, setShowHome] = useState(true);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);

  const [teachers, setTeachers] = useState([]);
  const [timeslots, setTimeslots] = useState([]);
  const [availabilities, setAvailabilities] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [timetable, setTimetable] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => { fetchContextData(); }, []);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  async function fetchContextData() {
    try {
      const [tRes, sRes, aRes, rRes, ttRes, subRes, cRes] = await Promise.all([
        axios.get(`${BASE_URL}/teachers`).catch(() => ({ data: [] })),
        axios.get(`${BASE_URL}/timeslots`).catch(() => ({ data: [] })),
        axios.get(`${BASE_URL}/teacher-availabilities`).catch(() => ({ data: [] })),
        axios.get(`${BASE_URL}/rooms`).catch(() => ({ data: [] })),
        axios.get(`${BASE_URL}/timetable`).catch(() => ({ data: [] })),
        axios.get(`${BASE_URL}/subjects`).catch(() => ({ data: [] })),
        axios.get(`${BASE_URL}/classes`).catch(() => ({ data: [] })),
      ]);
      setTeachers(tRes.data || []);
      setTimeslots(sRes.data || []);
      setAvailabilities(aRes.data || []);
      setRooms(rRes.data || []);
      setTimetable(ttRes.data || []);
      setSubjects(subRes.data || []);
      setClasses(cRes.data || []);
    } catch (err) {
      console.warn("Context data load warning:", err);
    }
  }

  function parseAvailabilityQuery(text) {
    const lower = text.toLowerCase().trim();
    const words = lower.replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter(Boolean);

    let foundDay = null;
    for (const w of words) {
      if (w.length < 3) continue;
      if (DAY_ALIAS[w]) { foundDay = DAY_ALIAS[w]; break; }
      for (const d of DAYS) {
        if (w.length >= 4 && editDistance(w, d.toLowerCase()) <= 2) { foundDay = d; break; }
      }
      if (foundDay) break;
    }

    let foundTeacher = null;
    if (teachers && teachers.length > 0) {
      for (const t of teachers) {
        const tNameLower = t.teacher_name.toLowerCase();
        if (lower.includes(tNameLower)) { foundTeacher = t; break; }
        const nameTokens = tNameLower.replace(/prof\.|dr\.|mr\.|mrs\.|ms\./gi, "").trim().split(/\s+/).filter(Boolean);
        for (const tok of nameTokens) {
          if (tok.length >= 3) {
            if (lower.includes(tok)) { foundTeacher = t; break; }
            for (const w of words) {
              if (w.length >= 3 && editDistance(w, tok) <= 1) { foundTeacher = t; break; }
            }
          }
          if (foundTeacher) break;
        }
        if (foundTeacher) break;
      }
    }

    let targetAvailable = null;
    const isUnavail = /not available|not availaible|not avialable|unavailable|absent|off|leave|can't teach|cant teach|no class/i.test(lower);
    const isAvail = /make available|set available|is available|mark available|available|free|can teach|present|on duty/i.test(lower);
    if (isUnavail) targetAvailable = false;
    else if (isAvail) targetAvailable = true;
    else if (foundTeacher && foundDay) targetAvailable = true;

    let foundPeriod = null;
    const periodMatch = lower.match(/\bp(\d+)\b|period\s*(\d+)/i);
    if (periodMatch) foundPeriod = parseInt(periodMatch[1] || periodMatch[2]);

    if (foundTeacher && foundDay && targetAvailable !== null) {
      return { teacher: foundTeacher, day: foundDay, period: foundPeriod, targetAvailable };
    }
    return null;
  }

  async function queryGeminiApi(promptText, history) {
    const modelsToTry = ["gemini-2.5-flash", "gemini-1.5-flash", "gemini-2.0-flash"];
    const systemPrompt = `You are a helpful AI Assistant for a College/School Timetable Generator.
Teachers: ${teachers.map(t => t.teacher_name).join(", ") || "None"}.
Available Days: Monday to Saturday.
Help with teacher availability, workload, conflicts, room occupancy. Be concise and friendly.`;
    for (const model of modelsToTry) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
        const contents = [
          ...history.slice(-4).map(m => ({ role: m.sender === "user" ? "user" : "model", parts: [{ text: m.text }] })),
          { role: "user", parts: [{ text: promptText }] }
        ];
        const response = await axios.post(url, { contents, systemInstruction: { parts: [{ text: systemPrompt }] } }, { headers: { "Content-Type": "application/json" } });
        if (response.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
          return response.data.candidates[0].content.parts[0].text;
        }
      } catch (e) {
        console.warn(`Gemini failed with ${model}:`, e?.response?.data || e.message);
      }
    }
    return null;
  }

  async function applyAvailability(teacherId, teacherName, day, period, targetAvailable) {
    try {
      const targetSlots = period
        ? timeslots.filter(s => s.day.toLowerCase() === day.toLowerCase() && s.period_number === period)
        : timeslots.filter(s => s.day.toLowerCase() === day.toLowerCase());
      if (targetSlots.length === 0) return `❌ No timeslots found for ${day}${period ? ` Period ${period}` : ""}. Check timeslot setup.`;
      let updatedCount = 0;
      for (const slot of targetSlots) {
        const existing = availabilities.find(a => a.teacher_id === teacherId && a.slot_id === slot.slot_id);
        if (targetAvailable) {
          if (existing) {
            await axios.delete(`${BASE_URL}/teacher-availabilities/${teacherId}/${slot.slot_id}`).catch(async () => {
              await axios.put(`${BASE_URL}/teacher-availabilities/${teacherId}/${slot.slot_id}`, { is_available: true }).catch(() => {});
            });
            updatedCount++;
          }
        } else {
          await axios.post(`${BASE_URL}/teacher-availabilities`, { teacher_id: teacherId, slot_id: slot.slot_id, is_available: false })
            .catch(async () => { await axios.put(`${BASE_URL}/teacher-availabilities/${teacherId}/${slot.slot_id}`, { is_available: false }).catch(() => {}); });
          updatedCount++;
        }
      }
      fetchContextData();
      window.dispatchEvent(new CustomEvent("availabilityUpdated", { detail: { teacherId, day } }));
      const periodLabel = period ? ` Period ${period}` : "";
      return targetAvailable
        ? `✅ ${teacherName} is now AVAILABLE on ${day}${periodLabel}.`
        : `✅ ${teacherName} marked UNAVAILABLE on ${day}${periodLabel} (${updatedCount} slot(s) updated).`;
    } catch (err) {
      return `❌ Failed to update. ${err?.response?.data?.detail || err.message}`;
    }
  }

  function getWorkloadAndConflictSummary() {
    if (!timetable || timetable.length === 0) return "📊 No timetable generated yet. Go to the Generate tab first.";
    const teacherCountMap = {}, teacherDayMap = {}, conflicts = [];
    const unavailableSet = new Set(availabilities.filter(a => !a.is_available).map(a => `${a.teacher_id}_${a.slot_id}`));
    timetable.forEach(entry => {
      const tId = entry.teacher_id;
      teacherCountMap[tId] = (teacherCountMap[tId] || 0) + 1;
      const slot = timeslots.find(s => s.slot_id === entry.slot_id);
      if (slot) {
        if (!teacherDayMap[tId]) teacherDayMap[tId] = {};
        teacherDayMap[tId][slot.day] = (teacherDayMap[tId][slot.day] || 0) + 1;
      }
      if (unavailableSet.has(`${tId}_${entry.slot_id}`)) {
        const teacherObj = teachers.find(t => t.teacher_id === tId);
        const tName = teacherObj ? teacherObj.teacher_name : `Teacher ${tId}`;
        const slotLabel = slot ? `${slot.day} P${slot.period_number}` : `Slot ${entry.slot_id}`;
        conflicts.push(`⚠️ ${tName} assigned on ${slotLabel} despite unavailability.`);
      }
    });
    let text = "📊 Teacher Workload Summary\n\n";
    teachers.forEach(t => {
      const count = teacherCountMap[t.teacher_id] || 0;
      const days = teacherDayMap[t.teacher_id] || {};
      let busiestDay = "N/A"; let maxD = 0;
      Object.entries(days).forEach(([d, num]) => { if (num > maxD) { maxD = num; busiestDay = `${d} (${num})`; } });
      text += `• ${t.teacher_name}: ${count} period(s) | Peak: ${busiestDay}\n`;
    });
    text += conflicts.length > 0 ? `\n🚨 Conflicts (${conflicts.length}):\n` + conflicts.join("\n") : "\n✅ No conflicts detected!";
    return text;
  }

  function getRoomOccupancySummary(inputQuery) {
    if (!rooms || rooms.length === 0) return "🏢 No rooms configured yet.";
    const lower = inputQuery.toLowerCase();
    let targetDay = "Monday";
    const words = lower.replace(/[^a-z0-9\s]/g, " ").split(/\s+/);
    for (const w of words) { if (DAY_ALIAS[w]) { targetDay = DAY_ALIAS[w]; break; } }
    let targetPeriod = null;
    const periodMatch = lower.match(/\bp(\d+)\b|period\s*(\d+)/i);
    if (periodMatch) targetPeriod = parseInt(periodMatch[1] || periodMatch[2]);
    if (targetPeriod) {
      const slot = timeslots.find(s => s.day.toLowerCase() === targetDay.toLowerCase() && s.period_number === targetPeriod);
      if (!slot) return `🏢 No Period ${targetPeriod} found for ${targetDay}.`;
      const occupiedSlotEntries = timetable.filter(e => e.slot_id === slot.slot_id);
      const occupiedRoomIds = new Set(occupiedSlotEntries.map(e => e.room_id));
      const freeList = [], occupiedList = [];
      rooms.forEach(r => {
        if (occupiedRoomIds.has(r.room_id)) {
          const entry = occupiedSlotEntries.find(e => e.room_id === r.room_id);
          const subObj = subjects.find(s => s.subject_id === entry?.subject_id);
          const clsObj = classes.find(c => c.class_id === entry?.class_id);
          occupiedList.push(`🔴 ${r.room_name}: ${clsObj?.class_name || "Class"} (${subObj?.subject_name || "Subject"})`);
        } else {
          freeList.push(`🟢 ${r.room_name} (Cap: ${r.capacity || "N/A"})`);
        }
      });
      return `🏢 ${targetDay} — Period ${targetPeriod}\n\nFree (${freeList.length}):\n${freeList.join("\n") || "None"}\n\nOccupied (${occupiedList.length}):\n${occupiedList.join("\n") || "None"}`;
    }
    const daySlots = timeslots.filter(s => s.day.toLowerCase() === targetDay.toLowerCase());
    if (daySlots.length === 0) return `🏢 No timeslots for ${targetDay}.`;
    let text = `🏢 Room Occupancy — ${targetDay}\n\n`;
    rooms.forEach(r => {
      const count = timetable.filter(e => e.room_id === r.room_id && daySlots.some(ds => ds.slot_id === e.slot_id)).length;
      text += `• ${r.room_name}: ${count}/${daySlots.length} periods occupied\n`;
    });
    return text;
  }

  const switchToChat = (query) => {
    setShowHome(false);
    if (query) setTimeout(() => handleSend(query), 80);
    else setTimeout(() => inputRef.current?.focus(), 80);
  };

  const handleSend = async (overrideText) => {
    const textToSend = overrideText || input;
    if (!textToSend.trim()) return;
    if (showHome) setShowHome(false);

    const userMsg = { sender: "user", text: textToSend, id: Date.now() };
    setMessages((prev) => [...prev, userMsg]);
    if (!overrideText) setInput("");
    setIsTyping(true);

    const lower = textToSend.trim().toLowerCase();

    if (pendingAction) {
      const isAffirmative = /^(yes|yeah|yep|sure|ok|okay|confirm|y|correct|please)$/i.test(lower) || lower.includes("yes") || lower.includes("sure");
      const isNegative = /^(no|nope|nah|cancel|don't|dont|n|stop)$/i.test(lower) || lower.includes("no") || lower.includes("cancel");
      if (isAffirmative) {
        const botReplyText = await applyAvailability(pendingAction.teacherId, pendingAction.teacherName, pendingAction.day, pendingAction.period, pendingAction.targetAvailable);
        setMessages((prev) => [...prev, { sender: "ai", text: botReplyText, id: Date.now() + 1 }]);
        setPendingAction(null); setIsTyping(false); return;
      } else if (isNegative) {
        setMessages((prev) => [...prev, { sender: "ai", text: `Cancelled. ${pendingAction.teacherName}'s availability is unchanged.`, id: Date.now() + 1 }]);
        setPendingAction(null); setIsTyping(false); return;
      } else {
        const periodText = pendingAction.period ? ` Period ${pendingAction.period}` : "";
        setMessages((prev) => [...prev, { sender: "ai", text: `Pending: Change ${pendingAction.teacherName} on ${pendingAction.day}${periodText} to ${pendingAction.targetAvailable ? "AVAILABLE" : "UNAVAILABLE"}. Reply Yes or No.`, id: Date.now() + 1 }]);
        setIsTyping(false); return;
      }
    }

    if (/workload|teacher load|busiest|check conflict|conflicts|highest load/i.test(lower)) {
      setMessages((prev) => [...prev, { sender: "ai", text: getWorkloadAndConflictSummary(), id: Date.now() + 1 }]);
      setIsTyping(false); return;
    }
    if (/room|occupancy|vacant|free room|empty room/i.test(lower)) {
      setMessages((prev) => [...prev, { sender: "ai", text: getRoomOccupancySummary(textToSend), id: Date.now() + 1 }]);
      setIsTyping(false); return;
    }

    const parsedQuery = parseAvailabilityQuery(textToSend);
    if (parsedQuery) {
      const { teacher, day, period, targetAvailable } = parsedQuery;
      setPendingAction({ type: "CHANGE_AVAILABILITY", teacherId: teacher.teacher_id, teacherName: teacher.teacher_name, day, period, targetAvailable });
      const periodText = period ? ` Period ${period}` : "";
      setMessages((prev) => [...prev, { sender: "ai", text: `Change **${teacher.teacher_name}** on **${day}${periodText}** to **${targetAvailable ? "AVAILABLE" : "UNAVAILABLE"}**?`, id: Date.now() + 1 }]);
      setIsTyping(false); return;
    }

    const geminiResponse = await queryGeminiApi(textToSend, messages);
    setMessages((prev) => [...prev, { sender: "ai", text: geminiResponse || "I'm here to help with your timetable! Ask about teacher availability, workload, or rooms.", id: Date.now() + 1 }]);
    setIsTyping(false);
  };

  return (
    <div
      className={cn(className)}
      style={{
        width: "310px",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: "#F8FAFC",
        borderLeft: "1px solid #E2E8F0",
        fontFamily: "'Inter', 'Segoe UI', sans-serif",
        flexShrink: 0,
      }}
    >
      {/* ─── Header ─── */}
      <div style={{
        padding: "13px 14px 11px",
        background: "#fff",
        borderBottom: "1px solid #E2E8F0",
        display: "flex",
        alignItems: "center",
        gap: "10px",
        flexShrink: 0,
      }}>
        {!showHome && (
          <button
            onClick={() => setShowHome(true)}
            style={{ width: 28, height: 28, borderRadius: 7, border: "1px solid #E2E8F0", background: "#F8FAFC", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: "#64748B" }}
          >
            <ArrowLeft size={13} />
          </button>
        )}
        <div style={{ width: 32, height: 32, borderRadius: 9, background: "linear-gradient(135deg,#6366F1,#8B5CF6)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Bot size={16} color="#fff" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontWeight: 700, fontSize: 13, color: "#0F172A", whiteSpace: "nowrap" }}>AI Timetable Assistant</span>
            <span style={{ fontSize: 9, fontWeight: 700, background: "#EEF2FF", color: "#6366F1", padding: "2px 6px", borderRadius: 4, letterSpacing: "0.04em" }}>BETA</span>
          </div>
          <p style={{ margin: 0, fontSize: 10.5, color: "#94A3B8" }}>Always here to help you manage your timetable.</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            style={{ width: 26, height: 26, borderRadius: 7, border: "1px solid #E2E8F0", background: "#F8FAFC", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: "#94A3B8" }}
          >
            <X size={12} />
          </button>
        )}
      </div>

      {/* ─── Body ─── */}
      <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>
        <AnimatePresence mode="wait">

          {/* ── HOME VIEW ── */}
          {showHome ? (
            <motion.div
              key="home"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.18 }}
              style={{ position: "absolute", inset: 0, overflowY: "auto", padding: "14px 12px 6px" }}
            >
              {/* Greeting card */}
              <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #E2E8F0", padding: "14px 14px 12px", marginBottom: 12, boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
                <p style={{ margin: "0 0 2px", fontSize: 13, fontWeight: 700, color: "#0F172A" }}>👋 Hello! I'm your <span style={{ color: "#6366F1" }}>AI Timetable Assistant.</span></p>
                <p style={{ margin: "6px 0 10px", fontSize: 11.5, color: "#64748B" }}>I can help you with:</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  {CAPABILITY_CHIPS.map((c) => (
                    <button
                      key={c.label}
                      onClick={() => switchToChat(c.label)}
                      style={{
                        display: "flex", alignItems: "center", gap: 9, padding: "7px 10px",
                        borderRadius: 9, border: `1px solid ${c.border}`, background: c.color,
                        cursor: "pointer", textAlign: "left", fontSize: 12, color: "#1E293B",
                        fontWeight: 500, transition: "opacity 0.15s",
                      }}
                      onMouseEnter={e => e.currentTarget.style.opacity = "0.85"}
                      onMouseLeave={e => e.currentTarget.style.opacity = "1"}
                    >
                      {c.icon}
                      {c.label}
                    </button>
                  ))}
                </div>
                <p style={{ margin: "10px 0 0", fontSize: 11.5, color: "#94A3B8" }}>What would you like to know?</p>
              </div>

              {/* Quick action cards */}
              <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                {QUICK_ACTIONS.map((action) => (
                  <motion.button
                    key={action.id}
                    onClick={() => switchToChat(action.query)}
                    whileHover={{ y: -1, boxShadow: "0 4px 14px rgba(0,0,0,0.10)" }}
                    style={{
                      display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
                      borderRadius: 11, border: `1px solid ${action.border}`, background: action.bg,
                      cursor: "pointer", textAlign: "left", width: "100%", boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                      transition: "box-shadow 0.15s",
                    }}
                  >
                    <div style={{ width: 34, height: 34, borderRadius: 9, background: "#fff", border: `1px solid ${action.border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      {action.icon}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: "#0F172A" }}>{action.title}</p>
                      <p style={{ margin: 0, fontSize: 11, color: "#64748B" }}>{action.desc}</p>
                    </div>
                    <ChevronRight size={14} color="#CBD5E1" />
                  </motion.button>
                ))}
              </div>
            </motion.div>
          ) : (

            /* ── CHAT VIEW ── */
            <motion.div
              key="chat"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.18 }}
              style={{ position: "absolute", inset: 0, overflowY: "auto", padding: "14px 12px 10px", display: "flex", flexDirection: "column", gap: 10 }}
            >
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 7 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.22 }}
                  style={{
                    alignSelf: msg.sender === "user" ? "flex-end" : "flex-start",
                    maxWidth: "86%",
                    padding: "9px 12px",
                    borderRadius: msg.sender === "user" ? "14px 14px 3px 14px" : "14px 14px 14px 3px",
                    background: msg.sender === "user"
                      ? "linear-gradient(135deg,#6366F1,#7C3AED)"
                      : "#fff",
                    color: msg.sender === "user" ? "#fff" : "#1E293B",
                    fontSize: 12,
                    lineHeight: 1.65,
                    boxShadow: msg.sender === "user"
                      ? "0 2px 10px rgba(99,102,241,0.35)"
                      : "0 1px 4px rgba(0,0,0,0.07)",
                    border: msg.sender === "user" ? "none" : "1px solid #E2E8F0",
                    whiteSpace: "pre-line",
                    wordBreak: "break-word",
                  }}
                >
                  {msg.text}
                </motion.div>
              ))}

              {/* Typing indicator */}
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={{ alignSelf: "flex-start", display: "flex", alignItems: "center", gap: 4, padding: "10px 14px", borderRadius: "14px 14px 14px 3px", background: "#fff", border: "1px solid #E2E8F0", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}
                >
                  {[0, 0.15, 0.3].map((delay, i) => (
                    <motion.span
                      key={i}
                      style={{ width: 6, height: 6, borderRadius: "50%", background: "#94A3B8", display: "block" }}
                      animate={{ y: [0, -4, 0] }}
                      transition={{ duration: 0.55, repeat: Infinity, delay }}
                    />
                  ))}
                </motion.div>
              )}

              {/* Confirm/Cancel buttons */}
              {pendingAction && !isTyping && (
                <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} style={{ display: "flex", gap: 7, alignSelf: "flex-start" }}>
                  <button
                    onClick={() => handleSend("Yes")}
                    style={{ padding: "7px 14px", borderRadius: 8, border: "none", background: "#10B981", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 5, boxShadow: "0 2px 6px rgba(16,185,129,0.35)" }}
                  >
                    <CheckCircle2 size={13} /> Yes, update
                  </button>
                  <button
                    onClick={() => handleSend("No")}
                    style={{ padding: "7px 14px", borderRadius: 8, border: "1px solid #E2E8F0", background: "#fff", color: "#475569", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                  >
                    Cancel
                  </button>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ─── Input Bar ─── */}
      <div style={{ padding: "10px 12px 12px", background: "#fff", borderTop: "1px solid #E2E8F0", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#F1F5F9", border: "1px solid #E2E8F0", borderRadius: 11, padding: "6px 6px 6px 12px" }}>
          <input
            ref={inputRef}
            style={{ flex: 1, border: "none", background: "transparent", fontSize: 12.5, color: "#0F172A", outline: "none" }}
            placeholder={pendingAction ? "Type Yes or No…" : "Ask me anything…"}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
          />
          <button
            onClick={() => handleSend()}
            style={{
              width: 30, height: 30, borderRadius: 8, border: "none",
              background: input.trim() ? "linear-gradient(135deg,#6366F1,#8B5CF6)" : "#E2E8F0",
              color: input.trim() ? "#fff" : "#94A3B8",
              cursor: input.trim() ? "pointer" : "default",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              transition: "background 0.2s",
            }}
          >
            <Send size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}
