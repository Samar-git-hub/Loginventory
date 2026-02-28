import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import ConfirmModal from '../components/ConfirmModal'

export default function DispatchLog() {
  const qc = useQueryClient()
  const [showClear, setShowClear] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)

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

  const deleteLog = useMutation({
    mutationFn: async (logId) => {
      const { error } = await supabase.from('dispatch_log').delete().eq('id', logId)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['dispatch_log'] })
      setDeleteTarget(null)
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
        Loading...
      </div>
    )
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold font-montserrat text-yale">Activity Log</h1>
          <p className="text-gray-400 text-sm mt-1 font-raleway">All dispatches, returns, and request activity.</p>
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

      {showClear && (
        <ConfirmModal
          title="Clear Activity Log"
          message={`This will permanently delete all ${logs?.length} records. Type "CONFIRM" to proceed.`}
          confirmLabel="Clear All"
          type="typed"
          confirmText="CONFIRM"
          placeholder='Type "CONFIRM" to proceed'
          onConfirm={() => clearLogs.mutate()}
          onClose={() => setShowClear(false)}
          isLoading={clearLogs.isPending}
        />
      )}

      {deleteTarget && (
        <ConfirmModal
          title="Delete Record"
          message={`Delete this record? (${deleteTarget.item_name ?? 'Unknown'} × ${deleteTarget.quantity} — ${deleteTarget.committee_name ?? 'Unknown'})`}
          confirmLabel="Delete"
          onConfirm={() => deleteLog.mutate(deleteTarget.id)}
          onClose={() => setDeleteTarget(null)}
          isLoading={deleteLog.isPending}
        />
      )}

      <div className="bg-white rounded-2xl shadow-sm overflow-x-auto">
        <table className="w-full min-w-[750px]">
          <thead>
            <tr className="border-b border-gray-100 bg-water/40">
              <th className="text-left px-5 py-3.5 text-lapis font-semibold text-xs uppercase tracking-wider font-montserrat">Action</th>
              <th className="text-left px-5 py-3.5 text-lapis font-semibold text-xs uppercase tracking-wider font-montserrat">Committee</th>
              <th className="text-left px-5 py-3.5 text-lapis font-semibold text-xs uppercase tracking-wider font-montserrat">Item</th>
              <th className="text-left px-5 py-3.5 text-lapis font-semibold text-xs uppercase tracking-wider font-montserrat">Qty</th>
              <th className="text-left px-5 py-3.5 text-lapis font-semibold text-xs uppercase tracking-wider font-montserrat">Runner</th>
              <th className="text-left px-5 py-3.5 text-lapis font-semibold text-xs uppercase tracking-wider font-montserrat">Time</th>
              <th className="w-10"></th>
            </tr>
          </thead>
          <tbody>
            {logs?.map(log => {
              const isReturn = log.action_type === 'return'
              const isRequest = log.action_type === 'request'
              const pillStyle = isReturn
                ? 'bg-rose-100 text-rose-600'
                : isRequest
                  ? 'bg-blue-100 text-blue-600'
                  : 'bg-emerald-100 text-emerald-600'
              const qtyStyle = isReturn
                ? 'bg-rose-100 text-rose-600'
                : 'bg-emerald-100 text-emerald-600'
              const label = isReturn ? 'Return' : isRequest ? 'Request' : 'Dispatch'

              return (
                <tr key={log.id} className="border-b border-gray-50 hover:bg-water/20 transition-colors group">
                  <td className="px-5 py-3.5">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide font-montserrat ${pillStyle}`}>
                      {label}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-gray-800 font-semibold font-montserrat text-sm">{log.committee_name ?? '—'}</td>
                  <td className="px-5 py-3.5 text-gray-600 font-raleway text-sm">
                    {log.item_name === 'Note'
                      ? <span className="italic text-gray-500">{log.note || '—'}</span>
                      : (log.item_name ?? '—')
                    }
                  </td>
                  <td className="px-5 py-3.5">
                    {log.item_name === 'Note'
                      ? <span className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase font-montserrat">Note</span>
                      : <span className={`px-3 py-1 rounded-full text-xs font-semibold font-montserrat ${qtyStyle}`}>
                        {isReturn ? '+' : ''}{log.quantity}
                      </span>
                    }
                  </td>
                  <td className="px-5 py-3.5 text-gray-500 font-raleway text-sm">{log.dispatcher_name ?? '—'}</td>
                  <td className="px-5 py-3.5 text-gray-400 text-xs font-raleway">{formatTime(log.dispatched_at)}</td>
                  <td className="px-2 py-3.5">
                    <button
                      onClick={() => setDeleteTarget(log)}
                      className="w-7 h-7 rounded-full text-gray-300 hover:text-red-500 hover:bg-red-50 text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                      title="Delete this record"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              )
            })}
            {logs?.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-16 text-center text-gray-400 font-raleway">
                  No activity recorded yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}