import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import ItemCard from '../components/ItemCard'
import DispatchModal from '../components/DispatchModal'
import ConfirmModal from '../components/ConfirmModal'

export default function CommitteePage() {
  const { committeeId } = useParams()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [selectedItem, setSelectedItem] = useState(null)
  const [modalMode, setModalMode] = useState('dispatch') // 'dispatch' | 'return'
  const [showDeleteCommittee, setShowDeleteCommittee] = useState(false)

  const { data: committee } = useQuery({
    queryKey: ['committee', committeeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('committees')
        .select('id, name')
        .eq('id', committeeId)
        .single()
      if (error) throw error
      return data
    }
  })

  const { data: items, isLoading } = useQuery({
    queryKey: ['committee_inventory', committeeId],
    queryFn: async () => {
      const [itemsRes, ciRes] = await Promise.all([
        supabase.from('items').select('*').order('name'),
        supabase.from('committee_inventory')
          .select('item_id, quantity')
          .eq('committee_id', committeeId)
      ])

      if (itemsRes.error) throw itemsRes.error
      if (ciRes.error) throw ciRes.error

      const ciMap = Object.fromEntries(
        ciRes.data.map(row => [row.item_id, row.quantity])
      )

      return itemsRes.data.map(item => ({
        ...item,
        dispatched: ciMap[item.id] ?? 0
      }))
    }
  })

  const dispatch = useMutation({
    mutationFn: async ({ itemId, quantity, dispatcher }) => {
      const { error } = await supabase.rpc('dispatch_item', {
        p_committee_id: committeeId,
        p_item_id: itemId,
        p_quantity: quantity,
        p_dispatcher: dispatcher
      })
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['committee_inventory', committeeId] })
      qc.invalidateQueries({ queryKey: ['main_inventory'] })
      qc.invalidateQueries({ queryKey: ['dispatch_log'] })
      setSelectedItem(null)
    }
  })

  const returnItem = useMutation({
    mutationFn: async ({ itemId, quantity, dispatcher }) => {
      const { error } = await supabase.rpc('return_item', {
        p_committee_id: committeeId,
        p_item_id: itemId,
        p_quantity: quantity,
        p_dispatcher: dispatcher
      })
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['committee_inventory', committeeId] })
      qc.invalidateQueries({ queryKey: ['main_inventory'] })
      qc.invalidateQueries({ queryKey: ['dispatch_log'] })
      setSelectedItem(null)
    }
  })

  const deleteCommittee = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('committees').delete().eq('id', committeeId)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['committees'] })
      qc.invalidateQueries({ queryKey: ['dispatch_log'] })
      navigate('/')
    }
  })

  const filtered = items?.filter(item =>
    item.name.toLowerCase().includes(search.toLowerCase())
  )

  const activeMutation = modalMode === 'return' ? returnItem : dispatch

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
          <h1 className="text-2xl font-bold font-montserrat text-yale">{committee?.name}</h1>
          <p className="text-gray-400 text-sm mt-1 font-raleway">
            Items dispatched to this committee. Dispatch more or return items.
          </p>
        </div>
        <button
          onClick={() => setShowDeleteCommittee(true)}
          className="text-gray-400 hover:text-red-500 text-sm font-raleway transition-colors shrink-0 px-3 py-2 rounded-lg hover:bg-red-50"
        >
          Delete Committee
        </button>
      </div>

      {/* Delete Committee Confirmation */}
      {showDeleteCommittee && (
        <ConfirmModal
          title="Delete Committee"
          message={`This will permanently delete "${committee?.name}" and all its dispatched inventory. Type the committee name below to confirm.`}
          confirmLabel="Delete Forever"
          type="typed"
          confirmText={committee?.name}
          placeholder={`Type "${committee?.name}" to confirm`}
          onConfirm={() => deleteCommittee.mutate()}
          onClose={() => setShowDeleteCommittee(false)}
          isLoading={deleteCommittee.isPending}
        />
      )}

      <input
        type="text"
        placeholder="Search items..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full bg-white border border-gray-200 text-gray-800 px-5 py-3 rounded-xl mb-6 text-sm outline-none focus:border-celestial focus:ring-2 focus:ring-maya/30 shadow-sm font-raleway transition-all"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {filtered?.map(item => (
          <ItemCard
            key={item.id}
            item={item}
            quantity={item.dispatched}
            showDispatch
            showReturn
            showLowStock={false}
            onDispatch={() => { setSelectedItem(item); setModalMode('dispatch') }}
            onReturn={() => { setSelectedItem(item); setModalMode('return') }}
          />
        ))}
      </div>

      {selectedItem && (
        <DispatchModal
          item={selectedItem}
          committeeName={committee?.name}
          mode={modalMode}
          onConfirm={(qty, dispatcher) => activeMutation.mutate({ itemId: selectedItem.id, quantity: qty, dispatcher })}
          onClose={() => setSelectedItem(null)}
          isLoading={activeMutation.isPending}
          error={activeMutation.error?.message}
        />
      )}
    </div>
  )
}