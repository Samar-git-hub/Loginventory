import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export default function RoleSelect() {
    const { session, setRole } = useAuth()
    const [showPinInput, setShowPinInput] = useState(false)
    const [pin, setPin] = useState('')
    const [error, setError] = useState(null)
    const [loading, setLoading] = useState(false)

    async function handleAdminLogin() {
        if (!showPinInput) {
            setShowPinInput(true)
            return
        }

        setLoading(true)
        setError(null)

        // Fetch admin PIN from profiles
        const { data, error: fetchErr } = await supabase
            .from('profiles')
            .select('admin_pin')
            .eq('user_id', session.user.id)
            .single()

        if (fetchErr || !data) {
            setError('Profile not found. Please sign up again.')
            setLoading(false)
            return
        }

        if (data.admin_pin !== pin.trim()) {
            setError('Incorrect admin PIN.')
            setLoading(false)
            return
        }

        setRole('admin')
    }

    async function handleSignOut() {
        await supabase.auth.signOut()
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-yale via-lapis to-yale2 p-4">
            <div className="w-full max-w-md">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold font-montserrat text-white">Select Role</h1>
                    <p className="text-water/60 text-sm font-raleway mt-1">{session?.user?.email}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    {/* Admin Card */}
                    <div className="bg-white rounded-2xl p-6 shadow-xl flex flex-col items-center gap-3">
                        <div className="w-16 h-16 rounded-full bg-yale/10 flex items-center justify-center">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#0D3B66" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                <path d="M7 11V7a5 5 0 0110 0v4" />
                            </svg>
                        </div>
                        <h2 className="font-bold font-montserrat text-yale text-sm">Admin</h2>
                        <p className="text-gray-400 text-[11px] font-raleway text-center leading-tight">
                            Inventory management, dispatch runners
                        </p>

                        {showPinInput && (
                            <>
                                <input
                                    type="password"
                                    placeholder="Enter admin PIN"
                                    value={pin}
                                    onChange={e => setPin(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleAdminLogin()}
                                    autoFocus
                                    className="w-full bg-gray-50 border border-gray-200 text-gray-800 px-3 py-2.5 rounded-lg text-sm text-center outline-none focus:border-celestial focus:ring-2 focus:ring-maya/30 font-raleway"
                                />
                                {error && (
                                    <p className="text-red-500 text-[11px] font-raleway">{error}</p>
                                )}
                            </>
                        )}

                        <button
                            onClick={handleAdminLogin}
                            disabled={loading}
                            className="w-full bg-yale hover:bg-lapis text-white py-2.5 rounded-lg text-xs font-semibold font-montserrat transition-colors disabled:opacity-50"
                        >
                            {loading ? 'Verifying...' : (showPinInput ? 'Unlock' : 'Enter as Admin')}
                        </button>
                    </div>

                    {/* Requester Card */}
                    <div className="bg-white rounded-2xl p-6 shadow-xl flex flex-col items-center gap-3">
                        <div className="w-16 h-16 rounded-full bg-celestial/10 flex items-center justify-center">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#4A90D9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M9 11l3 3L22 4" />
                                <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
                            </svg>
                        </div>
                        <h2 className="font-bold font-montserrat text-celestial text-sm">Requester</h2>
                        <p className="text-gray-400 text-[11px] font-raleway text-center leading-tight">
                            Request items, track deliveries
                        </p>

                        <div className="flex-1" />

                        <button
                            onClick={() => setRole('requester')}
                            className="w-full bg-celestial hover:bg-maya text-white py-2.5 rounded-lg text-xs font-semibold font-montserrat transition-colors mt-auto"
                        >
                            Enter as Requester
                        </button>
                    </div>
                </div>

                {/* Sign out */}
                <button
                    onClick={handleSignOut}
                    className="block mx-auto mt-6 text-water/40 hover:text-white text-sm font-raleway transition-colors"
                >
                    Sign Out
                </button>
            </div>
        </div>
    )
}
