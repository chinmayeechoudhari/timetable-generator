import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send, X, Sparkles, BarChart3, Users, Building2,
  Calendar, HelpCircle, Home, Clock, Settings, TrendingUp,
  AlertTriangle, CheckCircle2, ChevronRight, Bot
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
  { icon: "📊", label: "Workload & Conflicts" },
  { icon: "👩‍🏫", label: "Teacher Availability" },
  { icon: "🏢", label: "Room Occupancy" },
  { icon: "📅", label: "Timetable Insights" },
  { icon: "💬", label: "General Help" },
];

const QUICK_ACTIONS = [
  {
    id: "workload",
    icon: <BarChart3 className="w-4 h-4" style={{ color: "#6366F1" }} />,
    title: "Workload Summary",
    desc: "View teacher workload",
    query: "Teacher workload summary",
    color: "#EEF2FF",
    accent: "#6366F1",
  },
  {
    id: "rooms",
    icon: <Building2 className="w-4 h-4" style={{ color: "#10B981" }} />,
    title: "Free Rooms",
    desc: "Find available rooms",
    query: "Which rooms are free on Monday Period 1?",
    color: "#ECFDF5",
    accent: "#10B981",
  },
  {
    id: "conflicts",
    icon: <AlertTriangle className="w-4 h-4" style={{ color: "#F59E0B" }} />,
    title: "Conflicts",
    desc: "Check scheduling conflicts",
    query: "Check for scheduling conflicts",
    color: "#FFFBEB",
    accent: "#F59E0B",
  },
];

export default function AIChatCard({ className, onClose }) {
  const [activeTab, setActiveTab] = useState("home");
  const [messages, setMessages] = useState([]);
  const [showHome, setShowHome] = useState(true);
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
    const systemPrompt = `You are a helpful AI Assistant for a College/School Timetable Generator application.
Teachers: ${teachers.map(t => t.teacher_name).join(", ") || "None"}.
Available Days: Monday to Saturday.
Help with teacher availability, workload/conflicts, room occupancy, timetable generation. Be concise and professional.`;

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

      if (targetSlots.length === 0) {
        return `❌ No timeslots found for ${day}${period ? ` Period ${period}` : ""}. Please verify timeslot setup first.`;
      }

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
            .catch(async (err) => {
              await axios.put(`${BASE_URL}/teacher-availabilities/${teacherId}/${slot.slot_id}`, { is_available: false }).catch(() => {});
            });
          updatedCount++;
        }
      }

      fetchContextData();
      window.dispatchEvent(new CustomEvent("availabilityUpdated", { detail: { teacherId, day } }));
      const periodLabel = period ? ` Period ${period}` : "";
      return targetAvailable
        ? `✅ Done! ${teacherName} is now **AVAILABLE** on ${day}${periodLabel}.`
        : `✅ Done! ${teacherName} marked **UNAVAILABLE** on ${day}${periodLabel} (${updatedCount} slot(s) updated).`;
    } catch (err) {
      return `❌ Failed to update. Detail: ${err?.response?.data?.detail || err.message}`;
    }
  }

  function getWorkloadAndConflictSummary() {
    if (!timetable || timetable.length === 0) {
      return "📊 No timetable generated yet. Go to Generate tab and run the solver first.";
    }
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
        conflicts.push(`⚠️ ${tName} assigned on ${slotLabel} despite unavailability rule.`);
      }
    });

    let text = "📊 Teacher Workload Summary:\n\n";
    teachers.forEach(t => {
      const count = teacherCountMap[t.teacher_id] || 0;
      const days = teacherDayMap[t.teacher_id] || {};
      let busiestDay = "N/A"; let maxD = 0;
      Object.entries(days).forEach(([d, num]) => { if (num > maxD) { maxD = num; busiestDay = `${d} (${num})`; } });
      text += `• ${t.teacher_name}: ${count} period(s) | Peak: ${busiestDay}\n`;
    });
    text += conflicts.length > 0
      ? `\n🚨 Conflicts (${conflicts.length}):\n` + conflicts.join("\n")
      : "\n✅ No scheduling conflicts detected!";
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
      if (!slot) return `🏢 No Period ${targetPeriod} configured for ${targetDay}.`;
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
      return `🏢 ${targetDay} Period ${targetPeriod}:\n\nFree Rooms (${freeList.length}):\n${freeList.join("\n") || "None"}\n\nOccupied (${occupiedList.length}):\n${occupiedList.join("\n") || "None"}`;
    } else {
      const daySlots = timeslots.filter(s => s.day.toLowerCase() === targetDay.toLowerCase());
      if (daySlots.length === 0) return `🏢 No timeslots configured for ${targetDay}.`;
      let text = `🏢 Room Occupancy — ${targetDay}:\n\n`;
      rooms.forEach(r => {
        const count = timetable.filter(e => e.room_id === r.room_id && daySlots.some(ds => ds.slot_id === e.slot_id)).length;
        text += `• ${r.room_name}: ${count}/${daySlots.length} periods occupied\n`;
      });
      return text;
    }
  }

  const switchToChat = (query) => {
    setShowHome(false);
    setActiveTab("home");
    if (query) {
      setTimeout(() => handleSend(query), 100);
    }
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
      const isAffirmative = /^(yes|yeah|yep|sure|ok|okay|confirm|do it|y|correct|please)$/i.test(lower) || lower.includes("yes") || lower.includes("sure");
      const isNegative = /^(no|nope|nah|cancel|don't|dont|n|stop)$/i.test(lower) || lower.includes("no") || lower.includes("cancel");

      if (isAffirmative) {
        const botReplyText = await applyAvailability(pendingAction.teacherId, pendingAction.teacherName, pendingAction.day, pendingAction.period, pendingAction.targetAvailable);
        setMessages((prev) => [...prev, { sender: "ai", text: botReplyText, id: Date.now() + 1 }]);
        setPendingAction(null); setIsTyping(false); return;
      } else if (isNegative) {
        setMessages((prev) => [...prev, { sender: "ai", text: `Action cancelled. ${pendingAction.teacherName}'s availability unchanged. What else can I help with?`, id: Date.now() + 1 }]);
        setPendingAction(null); setIsTyping(false); return;
      } else {
        const periodText = pendingAction.period ? ` Period ${pendingAction.period}` : "";
        setMessages((prev) => [...prev, { sender: "ai", text: `Pending: Change ${pendingAction.teacherName} on ${pendingAction.day}${periodText} to ${pendingAction.targetAvailable ? "AVAILABLE" : "UNAVAILABLE"}. Reply Yes or No.`, id: Date.now() + 1 }]);
        setIsTyping(false); return;
      }
    }

    if (/workload|teacher load|busiest|check conflict|conflicts|highest load/i.test(lower)) {
      const summaryText = getWorkloadAndConflictSummary();
      setMessages((prev) => [...prev, { sender: "ai", text: summaryText, id: Date.now() + 1 }]);
      setIsTyping(false); return;
    }

    if (/room|occupancy|vacant|free room|empty room/i.test(lower)) {
      const summaryText = getRoomOccupancySummary(textToSend);
      setMessages((prev) => [...prev, { sender: "ai", text: summaryText, id: Date.now() + 1 }]);
      setIsTyping(false); return;
    }

    const parsedQuery = parseAvailabilityQuery(textToSend);
    if (parsedQuery) {
      const { teacher, day, period, targetAvailable } = parsedQuery;
      setPendingAction({ type: "CHANGE_AVAILABILITY", teacherId: teacher.teacher_id, teacherName: teacher.teacher_name, day, period, targetAvailable });
      const statusWord = targetAvailable ? "AVAILABLE" : "UNAVAILABLE";
      const periodText = period ? ` Period ${period}` : "";
      setMessages((prev) => [...prev, { sender: "ai", text: `Change availability of **${teacher.teacher_name}** on **${day}${periodText}** to **${statusWord}**?`, id: Date.now() + 1 }]);
      setIsTyping(false); return;
    }

    const geminiResponse = await queryGeminiApi(textToSend, messages);
    const finalBotText = geminiResponse || "I'm here to help manage your timetable! Ask me about teacher availability, workload, or room occupancy.";
    setMessages((prev) => [...prev, { sender: "ai", text: finalBotText, id: Date.now() + 1 }]);
    setIsTyping(false);
  };

  return (
    <div
      className={cn("flex flex-col bg-white border-l border-gray-200 shadow-xl", className)}
      style={{ width: "320px", height: "100%", fontFamily: "'Inter', 'Segoe UI', sans-serif" }}
    >
      {/* ── Header ── */}
      <div style={{ padding: "14px 16px", borderBottom: "1px solid #E5E7EB", background: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ width: "30px", height: "30px", borderRadius: "8px", background: "linear-gradient(135deg, #6366F1, #8B5CF6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Bot style={{ width: "16px", height: "16px", color: "#fff" }} />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontWeight: 700, fontSize: "13px", color: "#111827" }}>AI Timetable Assistant</span>
              <span style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.05em", background: "#EEF2FF", color: "#6366F1", padding: "1px 5px", borderRadius: "4px" }}>BETA</span>
            </div>
            <p style={{ fontSize: "10px", color: "#6B7280", margin: 0 }}>Always here to help you manage your timetable.</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} style={{ width: "24px", height: "24px", borderRadius: "6px", border: "1px solid #E5E7EB", background: "#F9FAFB", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#6B7280" }}>
            <X style={{ width: "12px", height: "12px" }} />
          </button>
        )}
      </div>

      {/* ── Body ── */}
      <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <AnimatePresence mode="wait">
          {showHome ? (
            /* ── HOME VIEW ── */
            <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
              {/* Greeting bubble */}
              <div style={{ background: "#F3F4F6", borderRadius: "12px", borderTopLeftRadius: "2px", padding: "12px 14px", marginBottom: "14px" }}>
                <p style={{ margin: 0, fontSize: "12px", color: "#374151", lineHeight: 1.6 }}>
                  👋 Hello! I'm your <strong>AI Timetable Assistant</strong>.
                </p>
                <p style={{ margin: "8px 0 0", fontSize: "12px", color: "#6B7280" }}>I can help you with:</p>
                <div style={{ marginTop: "10px", display: "flex", flexDirection: "column", gap: "6px" }}>
                  {CAPABILITY_CHIPS.map((c) => (
                    <button
                      key={c.label}
                      onClick={() => switchToChat(c.label)}
                      style={{ display: "flex", alignItems: "center", gap: "8px", padding: "6px 10px", borderRadius: "8px", border: "1px solid #E5E7EB", background: "#fff", cursor: "pointer", textAlign: "left", fontSize: "12px", color: "#374151", fontWeight: 500, transition: "background 0.15s" }}
                      onMouseEnter={e => e.currentTarget.style.background = "#F9FAFB"}
                      onMouseLeave={e => e.currentTarget.style.background = "#fff"}
                    >
                      <span style={{ fontSize: "14px" }}>{c.icon}</span>
                      {c.label}
                    </button>
                  ))}
                </div>
                <p style={{ margin: "12px 0 0", fontSize: "12px", color: "#6B7280" }}>What would you like to know?</p>
              </div>

              {/* Quick Action Cards */}
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {QUICK_ACTIONS.map((action) => (
                  <button
                    key={action.id}
                    onClick={() => switchToChat(action.query)}
                    style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 12px", borderRadius: "10px", border: `1px solid ${action.accent}22`, background: action.color, cursor: "pointer", textAlign: "left", transition: "box-shadow 0.15s", boxShadow: "none" }}
                    onMouseEnter={e => e.currentTarget.style.boxShadow = `0 2px 8px ${action.accent}33`}
                    onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}
                  >
                    <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "#fff", border: `1px solid ${action.accent}33`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      {action.icon}
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontSize: "12px", fontWeight: 600, color: "#111827" }}>{action.title}</p>
                      <p style={{ margin: 0, fontSize: "11px", color: "#6B7280" }}>{action.desc}</p>
                    </div>
                    <ChevronRight style={{ width: "14px", height: "14px", color: "#9CA3AF" }} />
                  </button>
                ))}
              </div>
            </motion.div>
          ) : (
            /* ── CHAT VIEW ── */
            <motion.div key="chat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: "10px" }}>
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  style={{
                    alignSelf: msg.sender === "user" ? "flex-end" : "flex-start",
                    maxWidth: "88%",
                    padding: "10px 13px",
                    borderRadius: msg.sender === "user" ? "14px 14px 2px 14px" : "14px 14px 14px 2px",
                    background: msg.sender === "user" ? "linear-gradient(135deg, #6366F1, #8B5CF6)" : "#F3F4F6",
                    color: msg.sender === "user" ? "#fff" : "#374151",
                    fontSize: "12px",
                    lineHeight: 1.6,
                    boxShadow: msg.sender === "user" ? "0 2px 8px rgba(99,102,241,0.3)" : "none",
                    whiteSpace: "pre-line",
                    wordBreak: "break-word",
                  }}
                >
                  {msg.text}
                </motion.div>
              ))}

              {isTyping && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ alignSelf: "flex-start", display: "flex", alignItems: "center", gap: "4px", padding: "10px 14px", borderRadius: "14px 14px 14px 2px", background: "#F3F4F6" }}>
                  {[0, 150, 300].map((delay, i) => (
                    <motion.span key={i} style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#9CA3AF", display: "block" }} animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: delay / 1000 }} />
                  ))}
                </motion.div>
              )}

              {/* Pending confirmation buttons */}
              {pendingAction && !isTyping && (
                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} style={{ display: "flex", gap: "8px", alignSelf: "flex-start" }}>
                  <button onClick={() => handleSend("Yes")} style={{ padding: "7px 16px", borderRadius: "8px", border: "none", background: "#10B981", color: "#fff", fontSize: "12px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
                    <CheckCircle2 style={{ width: "13px", height: "13px" }} /> Yes, update
                  </button>
                  <button onClick={() => handleSend("No")} style={{ padding: "7px 16px", borderRadius: "8px", border: "1px solid #E5E7EB", background: "#fff", color: "#374151", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>
                    No, cancel
                  </button>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Input Bar ── */}
      <div style={{ padding: "10px 12px", borderTop: "1px solid #E5E7EB", background: "#fff", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: "10px", padding: "6px 10px" }}>
          <input
            style={{ flex: 1, border: "none", background: "transparent", fontSize: "12px", color: "#111827", outline: "none" }}
            placeholder={pendingAction ? "Type Yes or No..." : "Ask me anything..."}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
          />
          <button
            onClick={() => handleSend()}
            style={{ width: "28px", height: "28px", borderRadius: "8px", border: "none", background: "linear-gradient(135deg, #6366F1, #8B5CF6)", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
          >
            <Send style={{ width: "13px", height: "13px" }} />
          </button>
        </div>
      </div>

      {/* ── Bottom Tab Bar ── */}
      <div style={{ display: "flex", borderTop: "1px solid #E5E7EB", background: "#FAFAFA", flexShrink: 0 }}>
        {[
          { id: "home", icon: <Home style={{ width: "15px", height: "15px" }} />, label: "Home" },
          { id: "history", icon: <Clock style={{ width: "15px", height: "15px" }} />, label: "History" },
          { id: "settings", icon: <Settings style={{ width: "15px", height: "15px" }} />, label: "Settings" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); if (tab.id === "home") setShowHome(true); }}
            style={{ flex: 1, padding: "10px 4px 8px", border: "none", background: "transparent", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: "3px", color: activeTab === tab.id ? "#6366F1" : "#9CA3AF", transition: "color 0.15s" }}
          >
            {tab.icon}
            <span style={{ fontSize: "10px", fontWeight: activeTab === tab.id ? 600 : 400 }}>{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
