import { useState } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import CommitteePage from './pages/CommitteePage'
import DispatchLog from './pages/DispatchLog'
import Navbar from './components/Navbar'

export default function App() {
  const { session, loading } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()

  // Close menu on route change
  const closeMenu = () => setMenuOpen(false)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#F0F8FF]">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-maya border-t-lapis rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-lapis font-montserrat font-semibold">Loading...</p>
        </div>
      </div>
    )
  }

  if (!session) return <Login />

  return (
    <div className="flex h-screen bg-[#F0F8FF] text-gray-800 overflow-hidden">
      {/* Mobile hamburger button */}
      <button
        onClick={() => setMenuOpen(true)}
        className="fixed top-4 left-4 z-40 md:hidden w-10 h-10 bg-yale text-white rounded-lg flex items-center justify-center shadow-lg"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>

      {/* Sidebar — always visible on md+, overlay on mobile */}
      <div className={`
        fixed inset-0 z-50 md:relative md:inset-auto
        ${menuOpen ? 'block' : 'hidden'} md:block
      `}>
        {/* Backdrop on mobile */}
        <div
          className="absolute inset-0 bg-black/40 md:hidden"
          onClick={closeMenu}
        />
        <div className="relative z-10 h-full">
          <Navbar onNavigate={closeMenu} />
        </div>
      </div>

      <main className="flex-1 overflow-auto p-4 pt-16 md:p-8 md:pt-8">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/committee/:committeeId" element={<CommitteePage />} />
          <Route path="/log" element={<DispatchLog />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </div>
  )
}