import { Link, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

export default function Navbar() {
  const location = useLocation()

  const { data: committees } = useQuery({
    queryKey: ['committees'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('committees')
        .select('id, name')
        .order('name')
      if (error) throw error
      return data
    }
  })

  async function handleSignOut() {
    await supabase.auth.signOut()
  }

  function linkClass(path) {
    const isActive = location.pathname === path
    return `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${isActive
      ? 'bg-white/15 text-white'
      : 'text-water/70 hover:bg-white/10 hover:text-white'
      }`
  }

  return (
    <nav className="w-60 bg-gradient-to-b from-yale to-yale2 flex flex-col p-4 gap-1 shrink-0">
      {/* App header */}
      <div className="mb-6 px-2 pt-2">
        <h1 className="text-lg font-bold text-white font-montserrat">Logi Inventory</h1>
        <p className="text-maya/60 text-xs mt-0.5 font-raleway">MUN Logistics System</p>
      </div>

      {/* Main navigation */}
      <Link to="/" className={linkClass('/')}>
        Main Inventory
      </Link>
      <Link to="/log" className={linkClass('/log')}>
        Dispatch Log
      </Link>

      {/* Committee section */}
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
        >
          {c.name}
        </Link>
      ))}

      {committees?.length === 0 && (
        <p className="text-water/40 text-xs px-4 font-raleway">No committees yet.</p>
      )}

      {/* Sign out */}
      <div className="mt-auto">
        <button
          onClick={handleSignOut}
          className="w-full text-left px-4 py-2.5 text-water/50 hover:text-red-300 text-sm transition-colors rounded-lg hover:bg-white/5 font-raleway"
        >
          Sign Out
        </button>
      </div>
    </nav>
  )
}