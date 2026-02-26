import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import ConfirmModal from '../components/ConfirmModal'

export default function DispatchLog() {
  const qc = useQueryClient()
  const [showClear, setShowClear] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null) // single log to delete

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
        Loading log...
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
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

      {/* Delete single record confirmation */}
      {deleteTarget && (
        <ConfirmModal
          title="Delete Record"
          message={`Delete this dispatch record? (${deleteTarget.item_name ?? 'Unknown'} × ${deleteTarget.quantity} to ${deleteTarget.committee_name ?? 'Unknown'})`}
          confirmLabel="Delete"
          onConfirm={() => deleteLog.mutate(deleteTarget.id)}
          onClose={() => setDeleteTarget(null)}
          isLoading={deleteLog.isPending}
        />
      )}

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 bg-water/40">
              <th className="text-left px-6 py-3.5 text-lapis font-semibold text-xs uppercase tracking-wider font-montserrat">Committee</th>
              <th className="text-left px-6 py-3.5 text-lapis font-semibold text-xs uppercase tracking-wider font-montserrat">Item</th>
              <th className="text-left px-6 py-3.5 text-lapis font-semibold text-xs uppercase tracking-wider font-montserrat">Qty</th>
              <th className="text-left px-6 py-3.5 text-lapis font-semibold text-xs uppercase tracking-wider font-montserrat">Time</th>
              <th className="w-10"></th>
            </tr>
          </thead>
          <tbody>
            {logs?.map(log => (
              <tr key={log.id} className="border-b border-gray-50 hover:bg-water/20 transition-colors group">
                <td className="px-6 py-3.5 text-gray-800 font-semibold font-montserrat text-sm">{log.committee_name ?? '—'}</td>
                <td className="px-6 py-3.5 text-gray-600 font-raleway text-sm">{log.item_name ?? '—'}</td>
                <td className="px-6 py-3.5">
                  <span className="bg-lapis/10 text-lapis px-3 py-1 rounded-full text-xs font-semibold font-montserrat">
                    {log.quantity}
                  </span>
                </td>
                <td className="px-6 py-3.5 text-gray-400 text-xs font-raleway">{formatTime(log.dispatched_at)}</td>
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
            ))}
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