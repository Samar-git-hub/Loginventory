import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import ConfirmModal from './ConfirmModal'

export default function Navbar({ onNavigate }) {
  const location = useLocation()
  const { session, role, setRole } = useAuth()
  const [showDeleteAccount, setShowDeleteAccount] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Committees — only for admin
  const { data: committees } = useQuery({
    queryKey: ['committees'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('committees')
        .select('id, name')
        .order('name')
      if (error) throw error
      return data
    },
    enabled: role === 'admin'
  })

  // Pending request count
  const { data: pendingCount } = useQuery({
    queryKey: ['pending_requests_count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'requested')
      if (error) throw error
      return count || 0
    },
    refetchInterval: 5000
  })

  async function handleSignOut() {
    await supabase.auth.signOut()
  }

  async function handleDeleteAccount() {
    setDeleting(true)
    const { error } = await supabase.rpc('delete_own_account')
    if (error) {
      setDeleting(false)
    } else {
      await supabase.auth.signOut()
    }
  }

  function linkClass(path) {
    const isActive = location.pathname === path
    return `flex items-center justify-between px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${isActive
      ? 'bg-white/15 text-white'
      : 'text-water/70 hover:bg-white/10 hover:text-white'
      }`
  }

  function handleLinkClick() {
    if (onNavigate) onNavigate()
  }

  return (
    <nav className="w-60 h-full bg-gradient-to-b from-yale to-yale2 flex flex-col p-4 gap-1 shrink-0">
      {/* Header */}
      <div className="mb-6 px-2 pt-2">
        <h1 className="text-lg font-bold text-white font-montserrat">Logi Inventory</h1>
        <p className="text-maya/60 text-xs mt-0.5 font-raleway">
          {role === 'admin' ? 'Admin Panel' : 'Requester Panel'}
        </p>
      </div>

      {role === 'admin' ? (
        <>
          {/* Admin navigation */}
          <Link to="/" className={linkClass('/')} onClick={handleLinkClick}>
            Main Inventory
          </Link>
          <Link to="/requests" className={linkClass('/requests')} onClick={handleLinkClick}>
            <span>Requests</span>
            {pendingCount > 0 && (
              <span className="bg-amber-400 text-yale text-[10px] font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center">
                {pendingCount}
              </span>
            )}
          </Link>
          <Link to="/transit" className={linkClass('/transit')} onClick={handleLinkClick}>
            Transit
          </Link>
          <Link to="/log" className={linkClass('/log')} onClick={handleLinkClick}>
            Activity Log
          </Link>

          {/* Committees */}
          <div className="mt-5 mb-2 px-2">
            <p className="text-maya/50 text-[10px] font-semibold uppercase tracking-widest font-montserrat">
              Committees
            </p>
          </div>
          {committees?.map(c => (
            <Link
              key={c.id}
              to={`/committee/${c.id}`}
              className={linkClass(`/committee/${c.id}`)}
              onClick={handleLinkClick}
            >
              {c.name}
            </Link>
          ))}
          {committees?.length === 0 && (
            <p className="text-water/40 text-xs px-4 font-raleway">No committees yet.</p>
          )}
        </>
      ) : (
        <>
          {/* Requester navigation */}
          <Link to="/" className={linkClass('/')} onClick={handleLinkClick}>
            My Requests
          </Link>
          <Link to="/inventory" className={linkClass('/inventory')} onClick={handleLinkClick}>
            Inventory
          </Link>
          <Link to="/transit" className={linkClass('/transit')} onClick={handleLinkClick}>
            Transit
          </Link>
        </>
      )}

      {/* Account section */}
      <div className="mt-auto flex flex-col gap-1">
        <p className="text-water/40 text-[10px] px-2 mb-1 font-raleway truncate">
          {session?.user?.email}
        </p>
        <button
          onClick={() => { setRole(null); if (onNavigate) onNavigate() }}
          className="w-full text-left px-4 py-2 text-water/50 hover:text-white text-sm transition-colors rounded-lg hover:bg-white/5 font-raleway"
        >
          Switch Role
        </button>
        <button
          onClick={handleSignOut}
          className="w-full text-left px-4 py-2 text-water/50 hover:text-white text-sm transition-colors rounded-lg hover:bg-white/5 font-raleway"
        >
          Sign Out
        </button>
        <button
          onClick={() => setShowDeleteAccount(true)}
          className="w-full text-left px-4 py-2 text-water/30 hover:text-red-300 text-xs transition-colors rounded-lg hover:bg-white/5 font-raleway"
        >
          Delete Account
        </button>
      </div>

      {showDeleteAccount && (
        <ConfirmModal
          title="Delete Account"
          message={`This will permanently delete your account (${session?.user?.email}). Type "DELETE" to confirm.`}
          confirmLabel="Delete Account"
          type="typed"
          confirmText="DELETE"
          placeholder='Type "DELETE" to confirm'
          onConfirm={handleDeleteAccount}
          onClose={() => setShowDeleteAccount(false)}
          isLoading={deleting}
        />
      )}
    </nav>
  )
}