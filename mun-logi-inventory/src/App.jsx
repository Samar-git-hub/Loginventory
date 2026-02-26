import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import CommitteePage from './pages/CommitteePage'
import DispatchLog from './pages/DispatchLog'
import Navbar from './components/Navbar'

export default function App() {
  const { session, loading } = useAuth()

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
      <Navbar />
      <main className="flex-1 overflow-auto p-8">
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