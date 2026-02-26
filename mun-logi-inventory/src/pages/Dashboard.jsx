import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import ItemCard from '../components/ItemCard'
import ConfirmModal from '../components/ConfirmModal'

export default function Dashboard() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [showAddCommittee, setShowAddCommittee] = useState(false)
  const [showAddItem, setShowAddItem] = useState(false)
  const [committeeName, setCommitteeName] = useState('')
  const [newItemName, setNewItemName] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)

  const { data: inventory, isLoading } = useQuery({
    queryKey: ['main_inventory'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('main_inventory')
        .select('id, quantity, item_id, items(id, name, image_url)')
      if (error) throw error
      return data.sort((a, b) => a.items?.name.localeCompare(b.items?.name))
    }
  })

  const updateQuantity = useMutation({
    mutationFn: async ({ id, quantity }) => {
      const { error } = await supabase
        .from('main_inventory')
        .update({ quantity })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['main_inventory'] })
  })

  const deleteItem = useMutation({
    mutationFn: async (itemId) => {
      const { error } = await supabase.from('items').delete().eq('id', itemId)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['main_inventory'] })
      qc.invalidateQueries({ queryKey: ['committee_inventory'] })
      qc.invalidateQueries({ queryKey: ['dispatch_log'] })
      setDeleteTarget(null)
    }
  })

  const addItem = useMutation({
    mutationFn: async (name) => {
      // Insert the item
      const { data: newItem, error: itemErr } = await supabase
        .from('items')
        .insert({ name: name.trim() })
        .select('id')
        .single()
      if (itemErr) throw itemErr
      // Insert into main_inventory with quantity 0
      const { error: invErr } = await supabase
        .from('main_inventory')
        .insert({ item_id: newItem.id, quantity: 0 })
      if (invErr) throw invErr
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['main_inventory'] })
      setNewItemName('')
      setShowAddItem(false)
    }
  })

  const addCommittee = useMutation({
    mutationFn: async (name) => {
      const { error } = await supabase
        .from('committees')
        .insert({ name: name.trim().toUpperCase() })
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['committees'] })
      setCommitteeName('')
      setShowAddCommittee(false)
    }
  })

  const filtered = inventory?.filter(inv =>
    inv.items?.name.toLowerCase().includes(search.toLowerCase())
  )

  if (isLoading) {
    return (
      <div className="flex items-center gap-3 text-lapis font-montserrat">
        <div className="w-5 h-5 border-2 border-maya border-t-lapis rounded-full animate-spin"></div>
        Loading inventory...
      </div>
    )
  }

  return (
    <div>
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold font-montserrat text-yale">Main Inventory</h1>
          <p className="text-gray-400 text-sm mt-1 font-raleway">Stock in the logistics room. Click Edit to update the count.</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => setShowAddItem(true)}
            className="bg-lapis hover:bg-celestial text-white px-5 py-2.5 rounded-lg font-semibold font-montserrat text-sm transition-colors"
          >
            + Add Item
          </button>
          <button
            onClick={() => setShowAddCommittee(true)}
            className="bg-white border border-gray-200 hover:border-celestial text-gray-700 hover:text-lapis px-5 py-2.5 rounded-lg font-semibold font-montserrat text-sm transition-colors"
          >
            + Add Committee
          </button>
        </div>
      </div>

      {/* Add Item Modal */}
      {showAddItem && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowAddItem(false)}
        >
          <div
            className="bg-white p-8 rounded-2xl w-full max-w-sm shadow-xl mx-auto"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold font-montserrat text-yale mb-4">Add Item</h2>
            <input
              autoFocus
              type="text"
              placeholder="e.g. Stapler, Tape, Scissors..."
              value={newItemName}
              onChange={e => setNewItemName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && newItemName.trim()) addItem.mutate(newItemName) }}
              className="w-full bg-gray-50 border border-gray-200 text-gray-800 px-4 py-3 rounded-lg mb-4 text-sm outline-none focus:border-celestial focus:ring-2 focus:ring-maya/30 font-raleway"
            />
            {addItem.error && (
              <p className="text-red-500 text-sm mb-3 font-raleway">{addItem.error.message}</p>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => addItem.mutate(newItemName)}
                disabled={!newItemName.trim() || addItem.isPending}
                className="flex-1 bg-lapis hover:bg-celestial text-white py-3 rounded-lg font-semibold font-montserrat text-sm disabled:opacity-50 transition-colors"
              >
                {addItem.isPending ? 'Adding...' : 'Add'}
              </button>
              <button
                onClick={() => { setShowAddItem(false); setNewItemName('') }}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 py-3 rounded-lg font-montserrat text-sm transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Committee Modal */}
      {showAddCommittee && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowAddCommittee(false)}
        >
          <div
            className="bg-white p-8 rounded-2xl w-full max-w-sm shadow-xl mx-auto"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold font-montserrat text-yale mb-4">Add Committee</h2>
            <input
              autoFocus
              type="text"
              placeholder="e.g. SOCHUM, DISEC, FIFA..."
              value={committeeName}
              onChange={e => setCommitteeName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && committeeName.trim()) addCommittee.mutate(committeeName) }}
              className="w-full bg-gray-50 border border-gray-200 text-gray-800 px-4 py-3 rounded-lg mb-4 text-sm outline-none focus:border-celestial focus:ring-2 focus:ring-maya/30 font-raleway"
            />
            {addCommittee.error && (
              <p className="text-red-500 text-sm mb-3 font-raleway">{addCommittee.error.message}</p>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => addCommittee.mutate(committeeName)}
                disabled={!committeeName.trim() || addCommittee.isPending}
                className="flex-1 bg-lapis hover:bg-celestial text-white py-3 rounded-lg font-semibold font-montserrat text-sm disabled:opacity-50 transition-colors"
              >
                {addCommittee.isPending ? 'Adding...' : 'Add'}
              </button>
              <button
                onClick={() => { setShowAddCommittee(false); setCommitteeName('') }}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 py-3 rounded-lg font-montserrat text-sm transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Item Confirmation */}
      {deleteTarget && (
        <ConfirmModal
          title="Delete Item"
          message={`Are you sure you want to delete "${deleteTarget.name}"? This will remove it from all committee inventories. Dispatch log records will be preserved.`}
          confirmLabel="Delete"
          onConfirm={() => deleteItem.mutate(deleteTarget.id)}
          onClose={() => setDeleteTarget(null)}
          isLoading={deleteItem.isPending}
        />
      )}

      {/* Search bar */}
      <input
        type="text"
        placeholder="Search items..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full bg-white border border-gray-200 text-gray-800 px-5 py-3 rounded-xl mb-6 text-sm outline-none focus:border-celestial focus:ring-2 focus:ring-maya/30 shadow-sm font-raleway transition-all"
      />

      {/* Item cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {filtered?.map(inv => (
          <ItemCard
            key={inv.id}
            item={inv.items}
            quantity={inv.quantity}
            showEdit
            showDelete
            onUpdateQuantity={(qty) => updateQuantity.mutate({ id: inv.id, quantity: qty })}
            onDelete={() => setDeleteTarget(inv.items)}
          />
        ))}
      </div>
    </div>
  )
}