import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import ConfirmModal from '../components/ConfirmModal'

export default function DispatchLog() {
  const qc = useQueryClient()
  const [showClear, setShowClear] = useState(false)

  const { data: logs, isLoading } = useQuery({
    queryKey: ['dispatch_log'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dispatch_log')
        .select('*')
        .order('dispatched_at', { ascending: false })
        .limit(300)
      if (error) throw error
      return data
    }
  })

  const clearLogs = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('dispatch_log').delete().gte('id', '00000000-0000-0000-0000-000000000000')
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['dispatch_log'] })
      setShowClear(false)
    }
  })

  function formatTime(ts) {
    return new Date(ts).toLocaleString('en-IN', {
      day: '2-digit', month: 'short',
      hour: '2-digit', minute: '2-digit',
      hour12: true
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-3 text-lapis font-montserrat">
        <div className="w-5 h-5 border-2 border-maya border-t-lapis rounded-full animate-spin"></div>
        Loading log...
      </div>
    )
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold font-montserrat text-yale">Dispatch Log</h1>
          <p className="text-gray-400 text-sm mt-1 font-raleway">Complete history of every item sent out, newest first.</p>
        </div>
        {logs?.length > 0 && (
          <button
            onClick={() => setShowClear(true)}
            className="text-gray-400 hover:text-red-500 text-sm font-raleway transition-colors shrink-0 px-3 py-2 rounded-lg hover:bg-red-50"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Clear all logs confirmation */}
      {showClear && (
        <ConfirmModal
          title="Clear Dispatch Log"
          message={`This will permanently delete all ${logs?.length} dispatch records. This cannot be undone. Type "CONFIRM" below to proceed.`}
          confirmLabel="Clear All Logs"
          type="typed"
          confirmText="CONFIRM"
          placeholder='Type "CONFIRM" to proceed'
          onConfirm={() => clearLogs.mutate()}
          onClose={() => setShowClear(false)}
          isLoading={clearLogs.isPending}
        />
      )}

      <div className="bg-white rounded-2xl shadow-sm overflow-x-auto">
        <table className="w-full min-w-[600px]">
          <thead>
            <tr className="border-b border-gray-100 bg-water/40">
              <th className="text-left px-6 py-3.5 text-lapis font-semibold text-xs uppercase tracking-wider font-montserrat">Committee</th>
              <th className="text-left px-6 py-3.5 text-lapis font-semibold text-xs uppercase tracking-wider font-montserrat">Item</th>
              <th className="text-left px-6 py-3.5 text-lapis font-semibold text-xs uppercase tracking-wider font-montserrat">Qty</th>
              <th className="text-left px-6 py-3.5 text-lapis font-semibold text-xs uppercase tracking-wider font-montserrat">Status</th>
              <th className="text-left px-6 py-3.5 text-lapis font-semibold text-xs uppercase tracking-wider font-montserrat">Time</th>
            </tr>
          </thead>
          <tbody>
            {logs?.map(log => {
              const isReturn = log.quantity < 0
              return (
                <tr key={log.id} className={`border-b border-gray-50 hover:bg-water/20 transition-colors group ${isReturn ? 'bg-emerald-50/40' : ''}`}>
                  <td className="px-6 py-3.5 text-gray-800 font-semibold font-montserrat text-sm">{log.committee_name ?? '—'}</td>
                  <td className="px-6 py-3.5 text-gray-600 font-raleway text-sm">{log.item_name ?? '—'}</td>
                  <td className="px-6 py-3.5">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold font-montserrat ${isReturn
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-lapis/10 text-lapis'
                      }`}>
                      {isReturn ? `+${Math.abs(log.quantity)}` : log.quantity}
                    </span>
                  </td>
                  <td className="px-6 py-3.5">
                    {isReturn ? (
                      <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full text-xs font-semibold font-montserrat">
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="shrink-0">
                          <path d="M2 6L5 9L10 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        Returned
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full text-xs font-semibold font-montserrat">
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="shrink-0">
                          <path d="M6 2V10M6 10L3 7M6 10L9 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        Dispatched
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-3.5 text-gray-400 text-xs font-raleway">{formatTime(log.dispatched_at)}</td>
                </tr>
              )
            })}
            {logs?.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-16 text-center text-gray-400 font-raleway">
                  No dispatches recorded yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}