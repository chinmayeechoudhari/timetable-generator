import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import TeacherForm from './components/TeacherForm.jsx'
import RoomForm from './components/RoomForm.jsx'
import ClassForm from './components/ClassForm.jsx'
import SubjectForm from './components/SubjectForm.jsx'
import TimeSlotForm from './components/TimeSlotForm.jsx'
import TeacherSubjectForm from './components/TeacherSubjectForm.jsx'
import TeacherAvailabilityForm from './components/TeacherAvailabilityForm.jsx'
import GenerateTimetable from './components/GenerateTimetable.jsx'
import TimetableGrid from './components/TimetableGrid.jsx'

export default function App() {
  return (
    <BrowserRouter>
      <div style={{ display: 'flex' }}>
        <Navbar />
        <div style={{ flex: 1, padding: '24px' }}>
          <Routes>
            <Route path="/" element={<TeacherForm />} />
            <Route path="/teachers" element={<TeacherForm />} />
            <Route path="/rooms" element={<RoomForm />} />
            <Route path="/classes" element={<ClassForm />} />
            <Route path="/subjects" element={<SubjectForm />} />
            <Route path="/timeslots" element={<TimeSlotForm />} />
            <Route path="/teacher-subjects" element={<TeacherSubjectForm />} />
            <Route path="/teacher-availability" element={<TeacherAvailabilityForm />} />
            <Route path="/generate" element={<GenerateTimetable />} />
            <Route path="/timetable" element={<TimetableGrid />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  )
}