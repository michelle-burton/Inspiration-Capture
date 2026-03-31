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

          {/* Per-event shell */}
          <Route element={<AppShell />}>
            <Route index element={<Navigate to="/events" replace />} />
            <Route path="events/:eventId/capture" element={<NewEntry />} />
            <Route path="events/:eventId/gallery" element={<Gallery />} />
            <Route path="entry/:id" element={<EntryDetail />} />
            <Route path="entry/:id/edit" element={<EditEntry />} />
            <Route path="*" element={<Navigate to="/events" replace />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
