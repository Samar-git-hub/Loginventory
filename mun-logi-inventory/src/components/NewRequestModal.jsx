import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

export default function NewRequestModal({ onConfirm, onClose, isLoading, error }) {
    const [mode, setMode] = useState('item') // 'item' | 'note'
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

    const canSubmitItem = committeeId && itemId && requesterName.trim() && quantity > 0
    const canSubmitNote = committeeId && requesterName.trim() && note.trim()
    const canSubmit = mode === 'item' ? canSubmitItem : canSubmitNote

    return (
        <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={onClose}
        >
            <div
                className="bg-white p-6 sm:p-8 rounded-2xl w-full max-w-sm shadow-xl mx-auto max-h-[90vh] overflow-y-auto"
                onClick={e => e.stopPropagation()}
            >
                <h2 className="text-xl font-bold font-montserrat text-yale mb-1">New Request</h2>
                <p className="text-gray-400 text-sm mb-4 font-raleway">Request items or send a note to inventory.</p>

                {error && (
                    <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-4 text-sm border border-red-200 font-raleway">
                        {error}
                    </div>
                )}

                {/* Mode toggle */}
                <div className="flex bg-gray-100 rounded-lg p-1 mb-4">
                    <button
                        onClick={() => setMode('item')}
                        className={`flex-1 py-2 rounded-md text-xs font-semibold font-montserrat transition-colors ${mode === 'item' ? 'bg-white text-yale shadow-sm' : 'text-gray-400'
                            }`}
                    >
                        Item
                    </button>
                    <button
                        onClick={() => setMode('note')}
                        className={`flex-1 py-2 rounded-md text-xs font-semibold font-montserrat transition-colors ${mode === 'note' ? 'bg-white text-yale shadow-sm' : 'text-gray-400'
                            }`}
                    >
                        Note / New Item
                    </button>
                </div>

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

                {mode === 'item' ? (
                    <>
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
                        <div className="flex items-center border border-lapis/20 rounded-xl overflow-hidden mb-3">
                            <button
                                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                                className="w-12 h-12 bg-lapis/5 hover:bg-lapis/15 text-lapis text-xl font-medium transition-colors flex items-center justify-center border-r border-lapis/20"
                            >
                                −
                            </button>
                            <input
                                type="number"
                                min={1}
                                value={quantity}
                                onChange={e => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                                className="flex-1 bg-white text-yale text-center text-xl font-bold font-montserrat py-2.5 outline-none"
                            />
                            <button
                                onClick={() => setQuantity(q => q + 1)}
                                className="w-12 h-12 bg-lapis/5 hover:bg-lapis/15 text-lapis text-xl font-medium transition-colors flex items-center justify-center border-l border-lapis/20"
                            >
                                +
                            </button>
                        </div>

                        {/* Optional note */}
                        <input
                            type="text"
                            placeholder="Note (optional)"
                            value={note}
                            onChange={e => setNote(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-200 text-gray-800 px-4 py-3 rounded-lg mb-5 text-sm outline-none focus:border-celestial focus:ring-2 focus:ring-maya/30 font-raleway"
                        />
                    </>
                ) : (
                    /* Note-only mode */
                    <textarea
                        placeholder="Describe what you need (e.g. 'Need 5 nameplates for delegates')"
                        value={note}
                        onChange={e => setNote(e.target.value)}
                        rows={3}
                        className="w-full bg-gray-50 border border-gray-200 text-gray-800 px-4 py-3 rounded-lg mb-5 text-sm outline-none focus:border-celestial focus:ring-2 focus:ring-maya/30 font-raleway resize-none"
                    />
                )}

                <div className="flex gap-3">
                    <button
                        onClick={() => onConfirm({
                            committeeId,
                            itemId: mode === 'item' ? itemId : null,
                            quantity: mode === 'item' ? quantity : 0,
                            requesterName: requesterName.trim(),
                            note: note.trim(),
                            isNoteOnly: mode === 'note'
                        })}
                        disabled={!canSubmit || isLoading}
                        className="flex-1 bg-lapis hover:bg-celestial text-white py-3 rounded-lg font-semibold font-montserrat text-sm disabled:opacity-50 transition-colors"
                    >
                        {isLoading ? 'Submitting...' : (mode === 'note' ? 'Send Note' : 'Submit Request')}
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
