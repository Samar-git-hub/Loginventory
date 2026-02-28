import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import NewRequestModal from '../components/NewRequestModal'

export default function RequesterDashboard() {
    const qc = useQueryClient()
    const [showNewRequest, setShowNewRequest] = useState(false)
    const [fulfillTarget, setFulfillTarget] = useState(null)

    const { data: requests, isLoading } = useQuery({
        queryKey: ['my_requests'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('requests')
                .select('*')
                .order('created_at', { ascending: false })
            if (error) throw error
            return data
        },
        refetchInterval: 5000
    })

    const createRequest = useMutation({
        mutationFn: async ({ committeeId, itemId, quantity, requesterName, note, isNoteOnly }) => {
            const { data: cData } = await supabase.from('committees').select('name').eq('id', committeeId).single()

            let itemName = null
            if (!isNoteOnly && itemId) {
                const { data: iData } = await supabase.from('items').select('name').eq('id', itemId).single()
                itemName = iData?.name
            }

            const { error } = await supabase.from('requests').insert({
                committee_id: committeeId,
                item_id: isNoteOnly ? null : itemId,
                quantity: isNoteOnly ? 0 : quantity,
                requester_name: requesterName,
                note: note || null,
                status: 'requested',
                item_name: isNoteOnly ? 'Note' : itemName,
                committee_name: cData?.name
            })
            if (error) throw error
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['my_requests'] })
            setShowNewRequest(false)
        }
    })

    const fulfillRequest = useMutation({
        mutationFn: async (requestId) => {
            const { error } = await supabase.rpc('fulfill_request', { p_request_id: requestId })
            if (error) throw error
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['my_requests'] })
            qc.invalidateQueries({ queryKey: ['transit'] })
            setFulfillTarget(null)
        }
    })

    const reRequest = useMutation({
        mutationFn: async (req) => {
            // Cancel the old request
            const { error: cancelErr } = await supabase
                .from('requests')
                .update({ status: 'cancelled', updated_at: new Date().toISOString() })
                .eq('id', req.id)
            if (cancelErr) throw cancelErr

            // Create a fresh one
            const { error } = await supabase.from('requests').insert({
                committee_id: req.committee_id,
                item_id: req.item_id,
                quantity: req.quantity,
                requester_name: req.requester_name,
                note: '[RE-REQUEST] ' + (req.note || ''),
                status: 'requested',
                item_name: req.item_name,
                committee_name: req.committee_name
            })
            if (error) throw error
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['my_requests'] })
        }
    })

    function formatTime(ts) {
        return new Date(ts).toLocaleString('en-IN', {
            day: '2-digit', month: 'short',
            hour: '2-digit', minute: '2-digit',
            hour12: true
        })
    }

    function statusPill(status) {
        const styles = {
            requested: 'bg-amber-100 text-amber-700',
            dispatched: 'bg-blue-100 text-blue-700',
            fulfilled: 'bg-emerald-100 text-emerald-700',
            cancelled: 'bg-gray-100 text-gray-400'
        }
        const labels = {
            requested: 'Pending',
            dispatched: 'Runner On The Way',
            fulfilled: 'Fulfilled',
            cancelled: 'Cancelled'
        }
        return (
            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide font-montserrat ${styles[status] || ''}`}>
                {labels[status] || status}
            </span>
        )
    }

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
                    <h1 className="text-2xl font-bold font-montserrat text-yale">Floor In-Charge Requests</h1>
                    <p className="text-gray-400 text-sm mt-1 font-raleway">Request items and track their delivery status.</p>
                </div>
                <button
                    onClick={() => setShowNewRequest(true)}
                    className="bg-lapis hover:bg-celestial text-white px-5 py-2.5 rounded-lg text-sm font-semibold font-montserrat transition-colors shrink-0"
                >
                    New Request
                </button>
            </div>

            {showNewRequest && (
                <NewRequestModal
                    onConfirm={(data) => createRequest.mutate(data)}
                    onClose={() => setShowNewRequest(false)}
                    isLoading={createRequest.isPending}
                    error={createRequest.error?.message}
                />
            )}

            {/* Fulfill confirmation */}
            {fulfillTarget && (
                <div
                    className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                    onClick={() => setFulfillTarget(null)}
                >
                    <div
                        className="bg-white p-8 rounded-2xl w-full max-w-sm shadow-xl mx-auto"
                        onClick={e => e.stopPropagation()}
                    >
                        <h2 className="text-xl font-bold font-montserrat text-yale mb-1">Confirm Receipt</h2>
                        <p className="text-gray-400 text-sm mb-2 font-raleway">
                            {fulfillTarget.item_name === 'Note'
                                ? <>Confirm that this note request has been fulfilled?</>
                                : <>Did you receive <span className="text-gray-800 font-semibold">{fulfillTarget.item_name}</span> ×{fulfillTarget.quantity}?</>
                            }
                        </p>
                        <p className="text-amber-600 text-xs mb-5 font-raleway bg-amber-50 px-3 py-2 rounded-lg">Please confirm only if this is your request and you have received the items.</p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => fulfillRequest.mutate(fulfillTarget.id)}
                                disabled={fulfillRequest.isPending}
                                className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-lg font-semibold font-montserrat text-sm disabled:opacity-50 transition-colors"
                            >
                                {fulfillRequest.isPending ? 'Confirming...' : 'Yes, Received'}
                            </button>
                            <button
                                onClick={() => setFulfillTarget(null)}
                                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 py-3 rounded-lg font-montserrat text-sm transition-colors"
                            >
                                Not Yet
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Requests list */}
            <div className="space-y-3">
                {requests?.filter(r => r.status !== 'cancelled').map(req => {
                    const isNote = req.item_name === 'Note'
                    return (
                        <div key={req.id} className={`bg-white rounded-xl p-5 border shadow-sm ${req.status === 'dispatched' ? 'border-blue-200 border-l-4 border-l-celestial' :
                            req.status === 'requested' ? 'border-amber-200 border-l-4 border-l-amber-400' :
                                'border-gray-100 border-l-4 border-l-emerald-400'
                            }`}>
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 flex-wrap mb-1">
                                        {statusPill(req.status)}
                                        {isNote && <span className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase font-montserrat">Note</span>}
                                        <span className="text-gray-400 text-xs font-raleway">{formatTime(req.created_at)}</span>
                                    </div>
                                    {isNote ? (
                                        <p className="text-gray-800 font-medium text-sm font-raleway mt-1">{req.note}</p>
                                    ) : (
                                        <>
                                            <p className="text-gray-800 font-semibold text-sm font-montserrat">
                                                {req.item_name} <span className="text-lapis">×{req.quantity}</span>
                                            </p>
                                            {req.note && <p className="text-gray-400 text-xs font-raleway mt-1 italic">{req.note}</p>}
                                        </>
                                    )}
                                    <p className="text-gray-400 text-xs font-raleway mt-0.5">
                                        To {req.committee_name}
                                        {req.dispatcher_name && <span> — Runner: <span className="text-gray-600 font-semibold">{req.dispatcher_name}</span></span>}
                                    </p>
                                </div>
                                <div className="flex flex-col gap-2 shrink-0 items-end">
                                    {req.status === 'dispatched' && (
                                        <button
                                            onClick={() => setFulfillTarget(req)}
                                            className="bg-amber-100 hover:bg-amber-200 text-amber-700 px-4 py-2 rounded-lg text-xs font-semibold font-montserrat transition-colors"
                                        >
                                            Confirm Receipt
                                        </button>
                                    )}
                                    {req.status !== 'fulfilled' && (Date.now() - new Date(req.created_at).getTime()) > 15 * 60 * 1000 && (
                                        <button
                                            onClick={() => reRequest.mutate(req)}
                                            disabled={reRequest.isPending}
                                            className="bg-purple-50 hover:bg-purple-100 text-purple-500 px-4 py-2 rounded-lg text-[10px] font-semibold font-montserrat transition-colors"
                                        >
                                            {reRequest.isPending ? 'Sending...' : 'Re-Request'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    )
                })}
                {requests?.length === 0 && (
                    <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
                        <p className="text-gray-400 font-raleway">No requests yet. Tap "New Request" to get started.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
