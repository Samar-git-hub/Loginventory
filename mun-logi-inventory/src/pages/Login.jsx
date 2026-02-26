import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handleLogin() {
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError(error.message)
    setLoading(false)
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-yale via-lapis to-yale2">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-10">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold font-montserrat text-yale">Logi Inventory</h1>
          <p className="text-sm text-gray-400 font-raleway mt-1">Sign in to continue</p>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-4 text-sm border border-red-200">
            {error}
          </div>
        )}

        {/* Inputs */}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="w-full bg-gray-50 border border-gray-200 text-gray-800 px-4 py-3.5 rounded-xl mb-3 text-base outline-none focus:border-celestial focus:ring-2 focus:ring-maya/30 transition-all font-raleway"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleLogin()}
          className="w-full bg-gray-50 border border-gray-200 text-gray-800 px-4 py-3.5 rounded-xl mb-6 text-base outline-none focus:border-celestial focus:ring-2 focus:ring-maya/30 transition-all font-raleway"
        />

        {/* Submit */}
        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full bg-lapis hover:bg-celestial active:bg-yale text-white py-3.5 rounded-xl text-base font-semibold font-montserrat disabled:opacity-50 transition-colors"
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </div>
    </div>
  )
}