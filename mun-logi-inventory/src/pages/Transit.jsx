import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

export default function Transit() {
    const { data: inTransit, isLoading } = useQuery({
        queryKey: ['transit'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('requests')
                .select('*')
                .eq('status', 'dispatched')
                .order('updated_at', { ascending: false })
            if (error) throw error
            return data
        },
        refetchInterval: 5000
    })

    function timeSince(ts) {
        const mins = Math.floor((Date.now() - new Date(ts).getTime()) / 60000)
        if (mins < 1) return 'Just now'
        if (mins < 60) return `${mins}m ago`
        return `${Math.floor(mins / 60)}h ${mins % 60}m ago`
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
            <div className="mb-6">
                <h1 className="text-2xl font-bold font-montserrat text-yale">In Transit</h1>
                <p className="text-gray-400 text-sm mt-1 font-raleway">Items currently being carried by runners.</p>
            </div>

            {inTransit?.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
                    <p className="text-gray-400 font-raleway">No items in transit right now.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {inTransit?.map(req => (
                        <div key={req.id} className="bg-white rounded-xl p-5 border border-blue-100 border-l-4 border-l-celestial shadow-sm">
                            <p className="text-gray-800 font-semibold text-sm font-montserrat">{req.item_name ?? '—'}</p>
                            <p className="text-gray-400 text-xs font-raleway mt-1">
                                To <span className="text-lapis font-semibold">{req.committee_name}</span>
                            </p>
                            <div className="mt-3 flex items-end justify-between">
                                <div>
                                    <span className="text-2xl font-bold font-montserrat text-celestial">{req.quantity}</span>
                                    <p className="text-gray-400 text-[10px] font-raleway">in transit</p>
                                </div>
                            </div>
                            <div className="mt-3 pt-3 border-t border-gray-100">
                                <p className="text-gray-500 text-xs font-raleway">
                                    Runner: <span className="font-semibold text-gray-700">{req.dispatcher_name ?? '—'}</span>
                                </p>
                                <p className="text-gray-300 text-[10px] font-raleway mt-1">
                                    Dispatched {timeSince(req.updated_at)}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
