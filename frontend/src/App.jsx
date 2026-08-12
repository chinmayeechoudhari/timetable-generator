import { useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import LandingScreen from './components/LandingScreen'
import TeacherForm from './components/TeacherForm.jsx'
import RoomForm from './components/RoomForm.jsx'
import ClassForm from './components/ClassForm.jsx'
import SubjectForm from './components/SubjectForm.jsx'
import TimeSlotForm from './components/TimeSlotForm.jsx'
import TeacherSubjectForm from './components/TeacherSubjectForm.jsx'
import TeacherAvailabilityForm from './components/TeacherAvailabilityForm.jsx'
import GenerateTimetable from './components/GenerateTimetable.jsx'
import TimetableGrid from './components/TimetableGrid.jsx'
import StatusDashboard from './components/StatusDashboard.jsx'
import AIChatCard from '@/components/ui/ai-chat'
import { Bot, X } from 'lucide-react'

export default function App() {
  const [enteredApp, setEnteredApp] = useState(false)
  const [chatOpen, setChatOpen] = useState(true)

  return (
    <BrowserRouter>
      {/* Landing screen sits above everything, unmounts after entry */}
      {!enteredApp && (
        <LandingScreen onEnter={() => setEnteredApp(true)} />
      )}

      {/* Dashboard — rendered underneath, becomes visible after landing fades */}
      <div style={{
        display:    'flex',
        height:     '100vh',
        width:      '100%',
        overflow:   'hidden',
        background: 'var(--bg-page)',
        fontFamily: "'Inter', 'Segoe UI', sans-serif",
        opacity:    enteredApp ? 1 : 0,
        transition: 'opacity 0.4s ease, background 0.3s ease',
      }}>
        {/* Left Navbar */}
        <Navbar />

        {/* Main Content Area */}
        <div style={{
          flex:       1,
          height:     '100vh',
          overflowY:  'auto',
          overflowX:  'hidden',
          background: 'var(--bg-page)',
          minWidth:   0,
        }}>
          <Routes>
            <Route path="/"                      element={<StatusDashboard />} />
            <Route path="/teachers"             element={<TeacherForm />} />
            <Route path="/rooms"                element={<RoomForm />} />
            <Route path="/classes"              element={<ClassForm />} />
            <Route path="/subjects"             element={<SubjectForm />} />
            <Route path="/timeslots"            element={<TimeSlotForm />} />
            <Route path="/teacher-subjects"     element={<TeacherSubjectForm />} />
            <Route path="/teacher-availability" element={<TeacherAvailabilityForm />} />
            <Route path="/generate"             element={<GenerateTimetable />} />
            <Route path="/timetable"            element={<TimetableGrid />} />
          </Routes>
        </div>

        {/* AI Chat Sidebar Panel */}
        {chatOpen ? (
          <AIChatCard onClose={() => setChatOpen(false)} />
        ) : (
          /* Collapsed toggle button on the right edge */
          <button
            onClick={() => setChatOpen(true)}
            title="Open AI Timetable Assistant"
            style={{
              position:        'fixed',
              right:           0,
              top:             '50%',
              transform:       'translateY(-50%)',
              zIndex:          9999,
              width:           '36px',
              height:          '80px',
              border:          'none',
              borderRadius:    '8px 0 0 8px',
              background:      'linear-gradient(180deg, #6366F1 0%, #8B5CF6 100%)',
              color:           '#fff',
              cursor:          'pointer',
              display:         'flex',
              flexDirection:   'column',
              alignItems:      'center',
              justifyContent:  'center',
              gap:             '4px',
              boxShadow:       '-2px 0 12px rgba(99,102,241,0.3)',
            }}
          >
            <Bot style={{ width: '16px', height: '16px' }} />
            <span style={{ fontSize: '9px', fontWeight: 700, writingMode: 'vertical-rl', textOrientation: 'mixed', transform: 'rotate(180deg)', letterSpacing: '0.05em' }}>AI</span>
          </button>
        )}
      </div>
    </BrowserRouter>
  )
}