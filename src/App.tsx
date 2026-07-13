import { useState, useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import LandingPage from './apps/marketplace/LandingPage'
import AuthModal from './apps/marketplace/components/AuthModal'
import ChatWidget from './apps/marketplace/components/ChatWidget'
import OrganizerDashboard from './apps/organizer/OrganizerDashboard'
import EventDetailPage from './apps/marketplace/EventDetailPage'
import EventsPage from './apps/marketplace/EventsPage'
import AdminDashboard from './apps/admin/AdminDashboard'
import AdminLoginPage from './apps/admin/AdminLoginPage'
import CartPage from './apps/marketplace/CartPage'
import RequireAuth from './components/RequireAuth'
import MaintenancePage from './components/MaintenancePage'
import OrganizerAuthPage from './apps/organizer/OrganizerAuthPage'
import { ProfilePage, MyTicketsPage } from './apps/marketplace/UserAccountPages'
import { useAuth } from './context/AuthContext'

function App() {
  const [maintenance, setMaintenance] = useState(false)
  const [checked, setChecked] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    fetch('/api/settings/maintenance-mode')
      .then(r => r.json())
      .then(d => { setMaintenance(d.maintenance); setChecked(true) })
      .catch(() => setChecked(true))
  }, [])

  if (!checked) return null
  if (maintenance && user?.role !== 'admin') return <MaintenancePage />

  return (
    <>
      <AnimatePresence mode='wait'>
        <Routes>
          <Route path='/' element={<LandingPage />} />
          <Route path='/events' element={<EventsPage />} />
          <Route path='/event/:id' element={<EventDetailPage />} />
          <Route path='/cart' element={<CartPage />} />
          <Route path='/organizer/auth' element={<OrganizerAuthPage />} />
          <Route path='/admin/login' element={<AdminLoginPage />} />
          
          {/* Public Protected Routes */}
          <Route path='/profile' element={<RequireAuth><ProfilePage /></RequireAuth>} />
          <Route path='/tickets' element={<RequireAuth><MyTicketsPage /></RequireAuth>} />
          
          {/* Business Routes */}
          <Route path='/manage/*' element={<RequireAuth allowedRoles={['organizer', 'admin']}><OrganizerDashboard /></RequireAuth>} />
          <Route path='/admin/*' element={<RequireAuth allowedRoles={['admin']}><AdminDashboard /></RequireAuth>} />
        </Routes>
      </AnimatePresence>
      <AuthModal />
      <ChatWidget />
    </>
  )
}

export default App
