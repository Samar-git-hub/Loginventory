import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

export default function NewRequestModal({ onConfirm, onClose, isLoading, error }) {
    const [committeeId, setCommitteeId] = useState('')
    const [itemId, setItemId] = useState('')
    const [quantity, setQuantity] = useState(1)
    const [requesterName, setRequesterName] = useState('')
    const [note, setNote] = useState('')

    const { data: committees } = useQuery({
        queryKey: ['committees'],
        queryFn: async () => {
            const { data, error } = await supabase.from('committees').select('id, name').order('name')
            if (error) throw error
            return data
        }
    })

    const { data: items } = useQuery({
        queryKey: ['items_list'],
        queryFn: async () => {
            const { data, error } = await supabase.from('items').select('id, name').order('name')
            if (error) throw error
            return data
        }
    })

    const canSubmit = committeeId && itemId && requesterName.trim() && quantity > 0

    return (
        <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={onClose}
        >
            <div
                className="bg-white p-6 sm:p-8 rounded-2xl w-full max-w-sm shadow-xl mx-auto"
                onClick={e => e.stopPropagation()}
            >
                <h2 className="text-xl font-bold font-montserrat text-yale mb-1">New Request</h2>
                <p className="text-gray-400 text-sm mb-5 font-raleway">Request items from the inventory.</p>

                {error && (
                    <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-4 text-sm border border-red-200 font-raleway">
                        {error}
                    </div>
                )}

                {/* Your name */}
                <input
                    type="text"
                    placeholder="Your name"
                    value={requesterName}
                    onChange={e => setRequesterName(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 text-gray-800 px-4 py-3 rounded-lg mb-3 text-sm outline-none focus:border-celestial focus:ring-2 focus:ring-maya/30 font-raleway"
                />

                {/* Committee */}
                <select
                    value={committeeId}
                    onChange={e => setCommitteeId(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 text-gray-800 px-4 py-3 rounded-lg mb-3 text-sm outline-none focus:border-celestial focus:ring-2 focus:ring-maya/30 font-raleway appearance-none"
                >
                    <option value="">Select committee</option>
                    {committees?.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                </select>

                {/* Item */}
                <select
                    value={itemId}
                    onChange={e => setItemId(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 text-gray-800 px-4 py-3 rounded-lg mb-3 text-sm outline-none focus:border-celestial focus:ring-2 focus:ring-maya/30 font-raleway appearance-none"
                >
                    <option value="">Select item</option>
                    {items?.map(i => (
                        <option key={i.id} value={i.id}>{i.name}</option>
                    ))}
                </select>

                {/* Quantity */}
                <div className="flex items-center gap-3 mb-3">
                    <button
                        onClick={() => setQuantity(q => Math.max(1, q - 1))}
                        className="w-11 h-11 bg-gray-100 hover:bg-gray-200 text-gray-600 text-lg rounded-lg font-bold transition-colors flex items-center justify-center"
                    >
                        −
                    </button>
                    <input
                        type="number"
                        min={1}
                        value={quantity}
                        onChange={e => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                        className="flex-1 bg-gray-50 border border-gray-200 text-gray-800 text-center text-xl font-bold font-montserrat py-2.5 rounded-lg outline-none focus:border-celestial focus:ring-2 focus:ring-maya/30"
                    />
                    <button
                        onClick={() => setQuantity(q => q + 1)}
                        className="w-11 h-11 bg-gray-100 hover:bg-gray-200 text-gray-600 text-lg rounded-lg font-bold transition-colors flex items-center justify-center"
                    >
                        +
                    </button>
                </div>

                {/* Note */}
                <input
                    type="text"
                    placeholder="Note (optional)"
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 text-gray-800 px-4 py-3 rounded-lg mb-5 text-sm outline-none focus:border-celestial focus:ring-2 focus:ring-maya/30 font-raleway"
                />

                <div className="flex gap-3">
                    <button
                        onClick={() => onConfirm({ committeeId, itemId, quantity, requesterName: requesterName.trim(), note: note.trim() })}
                        disabled={!canSubmit || isLoading}
                        className="flex-1 bg-lapis hover:bg-celestial text-white py-3 rounded-lg font-semibold font-montserrat text-sm disabled:opacity-50 transition-colors"
                    >
                        {isLoading ? 'Submitting...' : 'Submit Request'}
                    </button>
                    <button
                        onClick={onClose}
                        className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 py-3 rounded-lg font-montserrat text-sm transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    )
}
