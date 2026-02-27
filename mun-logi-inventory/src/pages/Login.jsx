import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [adminPin, setAdminPin] = useState('')
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [loading, setLoading] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)

  async function handleSubmit() {
    setLoading(true)
    setError(null)
    setSuccess(null)

    if (isSignUp) {
      if (!adminPin.trim()) {
        setError('Admin PIN is required for sign-up.')
        setLoading(false)
        return
      }
      const { data, error: signUpErr } = await supabase.auth.signUp({ email, password })
      if (signUpErr) {
        setError(signUpErr.message)
      } else {
        // Store admin PIN in profiles table
        const { error: profileErr } = await supabase
          .from('profiles')
          .upsert({ user_id: data.user.id, admin_pin: adminPin.trim() })
        if (profileErr) {
          setError('Account created but failed to save admin PIN: ' + profileErr.message)
        } else {
          setSuccess('Account created. You can now sign in.')
          setIsSignUp(false)
          setAdminPin('')
        }
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
    }

    setLoading(false)
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-yale via-lapis to-yale2 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8 sm:p-10">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold font-montserrat text-yale">Logi Inventory</h1>
          <p className="text-sm text-gray-400 font-raleway mt-1">
            {isSignUp ? 'Create a new account' : 'Sign in to continue'}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-4 text-sm border border-red-200 font-raleway">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 text-green-700 px-4 py-3 rounded-lg mb-4 text-sm border border-green-200 font-raleway">
            {success}
          </div>
        )}

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
          onKeyDown={e => !isSignUp && e.key === 'Enter' && handleSubmit()}
          className="w-full bg-gray-50 border border-gray-200 text-gray-800 px-4 py-3.5 rounded-xl mb-3 text-base outline-none focus:border-celestial focus:ring-2 focus:ring-maya/30 transition-all font-raleway"
        />

        {isSignUp && (
          <input
            type="text"
            placeholder="Admin PIN (for admin access)"
            value={adminPin}
            onChange={e => setAdminPin(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            className="w-full bg-gray-50 border border-gray-200 text-gray-800 px-4 py-3.5 rounded-xl mb-3 text-base outline-none focus:border-celestial focus:ring-2 focus:ring-maya/30 transition-all font-raleway"
          />
        )}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-lapis hover:bg-celestial active:bg-yale text-white py-3.5 rounded-xl text-base font-semibold font-montserrat disabled:opacity-50 transition-colors mt-3"
        >
          {loading
            ? (isSignUp ? 'Creating account...' : 'Signing in...')
            : (isSignUp ? 'Create Account' : 'Sign In')
          }
        </button>

        <p className="text-center text-sm text-gray-400 mt-5 font-raleway">
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            onClick={() => { setIsSignUp(!isSignUp); setError(null); setSuccess(null) }}
            className="text-lapis hover:text-celestial font-semibold transition-colors"
          >
            {isSignUp ? 'Sign In' : 'Sign Up'}
          </button>
        </p>
      </div>
    </div>
  )
}