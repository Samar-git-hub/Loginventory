import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import ConfirmModal from '../components/ConfirmModal'

export default function Requests() {
    const qc = useQueryClient()
    const [dispatchTarget, setDispatchTarget] = useState(null)
    const [dispatcherName, setDispatcherName] = useState('')
    const [dispatchError, setDispatchError] = useState(null)

    const { data: requests, isLoading } = useQuery({
        queryKey: ['requests'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('requests')
                .select('*')
                .order('created_at', { ascending: false })
            if (error) throw error
            return data
        },
        refetchInterval: 5000 // poll every 5s for new requests
    })

    const dispatchRunner = useMutation({
        mutationFn: async ({ requestId, dispatcher }) => {
            const { error } = await supabase.rpc('dispatch_request', {
                p_request_id: requestId,
                p_dispatcher: dispatcher
            })
            if (error) throw error
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['requests'] })
            qc.invalidateQueries({ queryKey: ['main_inventory'] })
            qc.invalidateQueries({ queryKey: ['dispatch_log'] })
            setDispatchTarget(null)
            setDispatcherName('')
            setDispatchError(null)
        },
        onError: (err) => setDispatchError(err.message)
    })

    function formatTime(ts) {
        return new Date(ts).toLocaleString('en-IN', {
            day: '2-digit', month: 'short',
            hour: '2-digit', minute: '2-digit',
            hour12: true
        })
    }

    function statusPill(status, isReRequest) {
        if (isReRequest && status === 'requested') {
            return (
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide font-montserrat bg-purple-100 text-purple-700">
                    Re-Request
                </span>
            )
        }
        const styles = {
            requested: 'bg-amber-100 text-amber-700',
            dispatched: 'bg-blue-100 text-blue-700',
            fulfilled: 'bg-emerald-100 text-emerald-700'
        }
        const labels = {
            requested: 'Requested',
            dispatched: 'Runner Dispatched',
            fulfilled: 'Fulfilled'
        }
        return (
            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide font-montserrat ${styles[status] || 'bg-gray-100 text-gray-500'}`}>
                {labels[status] || status}
            </span>
        )
    }

    const pendingCount = requests?.filter(r => r.status === 'requested').length || 0

    if (isLoading) {
        return (
            <div className="flex items-center gap-3 text-lapis font-montserrat">
                <div className="w-5 h-5 border-2 border-maya border-t-lapis rounded-full animate-spin"></div>
                Loading...
            </div>
        )
    }

    return (
        <div>
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-6">
                <div>
                    <h1 className="text-2xl font-bold font-montserrat text-yale">
                        Requests
                        {pendingCount > 0 && (
                            <span className="ml-3 bg-amber-100 text-amber-700 text-sm px-3 py-1 rounded-full font-montserrat">
                                {pendingCount} pending
                            </span>
                        )}
                    </h1>
                    <p className="text-gray-400 text-sm mt-1 font-raleway">Incoming item requests from floor in-charges.</p>
                </div>
            </div>

            {/* Dispatch runner modal */}
            {dispatchTarget && (
                <div
                    className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                    onClick={() => { setDispatchTarget(null); setDispatchError(null) }}
                >
                    <div
                        className="bg-white p-8 rounded-2xl w-full max-w-sm shadow-xl mx-auto"
                        onClick={e => e.stopPropagation()}
                    >
                        <h2 className="text-xl font-bold font-montserrat text-yale mb-1">Dispatch Runner</h2>
                        <p className="text-gray-400 text-sm mb-5 font-raleway">
                            {dispatchTarget.item_name === 'Note'
                                ? <>Note request to <span className="text-lapis font-semibold">{dispatchTarget.committee_name}</span>: <span className="text-gray-800 font-medium italic">"{dispatchTarget.note}"</span></>
                                : <>Sending <span className="text-gray-800 font-semibold">{dispatchTarget.item_name}</span> ×{dispatchTarget.quantity} to <span className="text-lapis font-semibold">{dispatchTarget.committee_name}</span></>
                            }
                        </p>
                        {dispatchError && (
                            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-4 text-sm border border-red-200 font-raleway">
                                {dispatchError}
                            </div>
                        )}
                        <input
                            type="text"
                            placeholder="Runner name (who is carrying)"
                            value={dispatcherName}
                            onChange={e => setDispatcherName(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && dispatcherName.trim() && dispatchRunner.mutate({ requestId: dispatchTarget.id, dispatcher: dispatcherName.trim() })}
                            autoFocus
                            className="w-full bg-gray-50 border border-gray-200 text-gray-800 px-4 py-3 rounded-lg mb-4 text-sm outline-none focus:border-celestial focus:ring-2 focus:ring-maya/30 font-raleway"
                        />
                        <div className="flex gap-3">
                            <button
                                onClick={() => dispatchRunner.mutate({ requestId: dispatchTarget.id, dispatcher: dispatcherName.trim() })}
                                disabled={!dispatcherName.trim() || dispatchRunner.isPending}
                                className="flex-1 bg-lapis hover:bg-celestial text-white py-3 rounded-lg font-semibold font-montserrat text-sm disabled:opacity-50 transition-colors"
                            >
                                {dispatchRunner.isPending ? 'Dispatching...' : 'Send Runner'}
                            </button>
                            <button
                                onClick={() => { setDispatchTarget(null); setDispatchError(null) }}
                                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 py-3 rounded-lg font-montserrat text-sm transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-2xl shadow-sm overflow-x-auto">
                <table className="w-full min-w-[700px]">
                    <thead>
                        <tr className="border-b border-gray-100 bg-water/40">
                            <th className="text-left px-5 py-3.5 text-lapis font-semibold text-xs uppercase tracking-wider font-montserrat">Status</th>
                            <th className="text-left px-5 py-3.5 text-lapis font-semibold text-xs uppercase tracking-wider font-montserrat">Committee</th>
                            <th className="text-left px-5 py-3.5 text-lapis font-semibold text-xs uppercase tracking-wider font-montserrat">Item</th>
                            <th className="text-left px-5 py-3.5 text-lapis font-semibold text-xs uppercase tracking-wider font-montserrat">Qty</th>
                            <th className="text-left px-5 py-3.5 text-lapis font-semibold text-xs uppercase tracking-wider font-montserrat">Requester</th>
                            <th className="text-left px-5 py-3.5 text-lapis font-semibold text-xs uppercase tracking-wider font-montserrat">Time</th>
                            <th className="text-left px-5 py-3.5 text-lapis font-semibold text-xs uppercase tracking-wider font-montserrat">Runner</th>
                        </tr>
                    </thead>
                    <tbody>
                        {requests?.filter(r => r.status !== 'cancelled').map(req => {
                            const isReRequest = req.note?.startsWith('[RE-REQUEST]')
                            const displayNote = isReRequest ? req.note.replace('[RE-REQUEST] ', '').replace('[RE-REQUEST]', '') : req.note
                            return (
                                <tr key={req.id} className={`border-b border-gray-50 transition-colors ${isReRequest && req.status === 'requested' ? 'bg-purple-50/40' : req.status === 'requested' ? 'bg-amber-50/40' : 'hover:bg-water/20'}`}>
                                    <td className="px-5 py-3.5">{statusPill(req.status, isReRequest)}</td>
                                    <td className="px-5 py-3.5 text-gray-800 font-semibold font-montserrat text-sm">{req.committee_name ?? '—'}</td>
                                    <td className="px-5 py-3.5 text-gray-600 font-raleway text-sm">
                                        {req.item_name === 'Note'
                                            ? <span className="italic text-gray-500">{displayNote || '—'}</span>
                                            : (req.item_name ?? '—')
                                        }
                                    </td>
                                    <td className="px-5 py-3.5">
                                        {req.item_name === 'Note'
                                            ? <span className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase font-montserrat">Note</span>
                                            : <span className="bg-lapis/10 text-lapis px-3 py-1 rounded-full text-xs font-semibold font-montserrat">{req.quantity}</span>
                                        }
                                    </td>
                                    <td className="px-5 py-3.5 text-gray-500 font-raleway text-sm">{req.requester_name ?? '—'}</td>
                                    <td className="px-5 py-3.5 text-gray-400 text-xs font-raleway">{formatTime(req.created_at)}</td>
                                    <td className="px-5 py-3.5">
                                        {req.status === 'requested' && (
                                            <button
                                                onClick={() => setDispatchTarget(req)}
                                                className="bg-lapis hover:bg-celestial text-white px-3 py-2 rounded-lg text-xs font-semibold font-montserrat transition-colors whitespace-nowrap"
                                            >
                                                Send Runner
                                            </button>
                                        )}
                                        {(req.status === 'dispatched' || req.status === 'fulfilled') && (
                                            <span className="text-gray-400 text-xs font-raleway">{req.dispatcher_name}</span>
                                        )}
                                    </td>
                                </tr>
                            )
                        })}
                        {requests?.length === 0 && (
                            <tr>
                                <td colSpan={7} className="px-5 py-16 text-center text-gray-400 font-raleway">
                                    No requests yet.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
