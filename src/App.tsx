import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import Home from './pages/Home'
import NewEntry from './pages/NewEntry'
import Gallery from './pages/Gallery'
import EntryDetail from './pages/EntryDetail'
import EditEntry from './pages/EditEntry'

// Root router — AppShell wraps all routes and renders <Outlet>.
// Entry detail sits outside the bottom-nav layout concept but still
// uses AppShell so the top bar + nav remain visible.
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<Home />} />
          <Route path="capture" element={<NewEntry />} />
          <Route path="gallery" element={<Gallery />} />
          <Route path="entry/:id" element={<EntryDetail />} />
          <Route path="entry/:id/edit" element={<EditEntry />} />
          {/* Catch-all → home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
