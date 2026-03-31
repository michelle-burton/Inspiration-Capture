import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { AuthGuard } from './components/layout/AuthGuard'
import Login from './pages/Login'
import Events from './pages/Events'
import EventDetail from './pages/EventDetail'
import Home from './pages/Home'
import NewEntry from './pages/NewEntry'
import Gallery from './pages/Gallery'
import EntryDetail from './pages/EntryDetail'
import EditEntry from './pages/EditEntry'
import CuratePage from './pages/CuratePage'
import CuratedSetDetail from './pages/CuratedSetDetail'
import QuestionSets from './pages/QuestionSets'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="login" element={<Login />} />

        {/* Protected */}
        <Route element={<AuthGuard />}>
          {/* Events hub — landing page after login */}
          <Route path="events" element={<Events />} />
          <Route path="events/:eventId" element={<EventDetail />} />

          {/* Curate pages — own full-screen layout */}
          <Route path="events/:eventId/curate" element={<CuratePage />} />
          <Route path="events/:eventId/curated-sets/:setId" element={<CuratedSetDetail />} />

          {/* AppShell pages — bottom nav visible */}
          <Route element={<AppShell />}>
            <Route index element={<Home />} />
            <Route path="events/:eventId/capture" element={<NewEntry />} />
            <Route path="events/:eventId/gallery" element={<Gallery />} />
            <Route path="entry/:id" element={<EntryDetail />} />
            <Route path="entry/:id/edit" element={<EditEntry />} />
            <Route path="question-sets" element={<QuestionSets />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
