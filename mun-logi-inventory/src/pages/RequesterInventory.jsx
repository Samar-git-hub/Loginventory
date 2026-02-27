import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

export default function RequesterInventory() {
    const [search, setSearch] = useState('')

    const { data: inventory, isLoading } = useQuery({
        queryKey: ['main_inventory'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('main_inventory')
                .select('*, items(name)')
                .order('id')
            if (error) throw error
            return data
        },
        refetchInterval: 10000 // refresh every 10s for live stock
    })

    const filtered = inventory?.filter(inv =>
        inv.items?.name.toLowerCase().includes(search.toLowerCase())
    )

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
                <h1 className="text-2xl font-bold font-montserrat text-yale">Inventory</h1>
                <p className="text-gray-400 text-sm mt-1 font-raleway">Live stock levels. Check availability before requesting.</p>
            </div>

            <input
                type="text"
                placeholder="Search items..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-white border border-gray-200 text-gray-800 px-5 py-3 rounded-xl mb-6 text-sm outline-none focus:border-celestial focus:ring-2 focus:ring-maya/30 shadow-sm font-raleway transition-all"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {filtered?.map(inv => {
                    const isLow = inv.quantity <= 2
                    return (
                        <div key={inv.id} className={`bg-white rounded-xl p-5 border border-gray-100 border-l-4 ${isLow ? 'border-l-red-400' : 'border-l-celestial'} shadow-sm`}>
                            <p className="text-gray-800 font-semibold text-sm font-montserrat">{inv.items?.name}</p>
                            <div className="mt-3">
                                <span className={`text-2xl font-bold font-montserrat ${isLow ? 'text-red-500' : 'text-yale'}`}>
                                    {inv.quantity}
                                </span>
                                <span className="text-gray-400 text-xs font-raleway ml-2">in stock</span>
                                {isLow && <p className="text-red-400 text-[10px] font-raleway mt-0.5">Low stock</p>}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
