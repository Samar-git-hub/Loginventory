import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [loading, setLoading] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)

  async function handleSubmit() {
    setLoading(true)
    setError(null)
    setSuccess(null)

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) {
        setError(error.message)
      } else {
        setSuccess('Account created. You can now sign in.')
        setIsSignUp(false)
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
    }

    setLoading(false)
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-yale via-lapis to-yale2">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-10">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold font-montserrat text-yale">Logi Inventory</h1>
          <p className="text-sm text-gray-400 font-raleway mt-1">
            {isSignUp ? 'Create a new account' : 'Sign in to continue'}
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-4 text-sm border border-red-200 font-raleway">
            {error}
          </div>
        )}

        {/* Success */}
        {success && (
          <div className="bg-green-50 text-green-700 px-4 py-3 rounded-lg mb-4 text-sm border border-green-200 font-raleway">
            {success}
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
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          className="w-full bg-gray-50 border border-gray-200 text-gray-800 px-4 py-3.5 rounded-xl mb-6 text-base outline-none focus:border-celestial focus:ring-2 focus:ring-maya/30 transition-all font-raleway"
        />

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-lapis hover:bg-celestial active:bg-yale text-white py-3.5 rounded-xl text-base font-semibold font-montserrat disabled:opacity-50 transition-colors"
        >
          {loading
            ? (isSignUp ? 'Creating account...' : 'Signing in...')
            : (isSignUp ? 'Create Account' : 'Sign In')
          }
        </button>

        {/* Toggle sign-in / sign-up */}
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