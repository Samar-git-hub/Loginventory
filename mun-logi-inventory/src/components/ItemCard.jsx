import { useState } from 'react'

export default function ItemCard({ item, quantity, onDispatch, onReturn, onUpdateQuantity, onDelete, showDispatch, showReturn, showEdit, showDelete, showLowStock = true }) {
  const [editing, setEditing] = useState(false)
  const [editVal, setEditVal] = useState(quantity)

  function handleSave() {
    onUpdateQuantity(Math.max(0, parseInt(editVal) || 0))
    setEditing(false)
  }

  const isLow = showLowStock && quantity <= 2
  const borderColor = isLow ? 'border-l-red-400' : 'border-l-celestial'

  return (
    <div className={`bg-white rounded-xl p-5 flex flex-col gap-3 border border-gray-100 border-l-4 ${borderColor} shadow-sm hover:shadow-md transition-shadow relative group`}>
      {/* Delete button — top-right, visible on hover */}
      {showDelete && (
        <button
          onClick={onDelete}
          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-gray-100 hover:bg-red-50 text-gray-400 hover:text-red-500 text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
          title="Delete item"
        >
          ✕
        </button>
      )}

      {/* Item name */}
      <p className="text-gray-800 font-semibold text-sm leading-tight font-montserrat">{item?.name}</p>

      {/* Quantity display or edit input */}
      <div className="mt-auto">
        {editing ? (
          <div className="flex gap-2">
            <input
              autoFocus
              type="number"
              min={0}
              value={editVal}
              onChange={e => setEditVal(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setEditing(false) }}
              className="w-full bg-gray-50 border border-gray-200 text-gray-800 px-2 py-2 rounded-lg text-center text-lg font-bold outline-none focus:border-celestial"
            />
            <button
              onClick={handleSave}
              className="bg-lapis hover:bg-celestial text-white px-3 rounded-lg text-lg transition-colors"
            >
              ✓
            </button>
          </div>
        ) : (
          <div className="flex items-end justify-between">
            <div>
              <span className={`text-2xl font-bold font-montserrat ${isLow ? 'text-red-500' : 'text-yale'}`}>
                {quantity}
              </span>
              {isLow && <p className="text-red-400 text-[10px] font-raleway">Low stock</p>}
            </div>
            {showEdit && (
              <button
                onClick={() => { setEditVal(quantity); setEditing(true) }}
                className="text-celestial hover:text-lapis text-xs font-medium pb-1 transition-colors font-raleway"
              >
                Edit
              </button>
            )}
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        {showDispatch && (
          <button
            onClick={onDispatch}
            className="flex-1 bg-lapis hover:bg-celestial active:bg-yale text-white py-2.5 rounded-lg text-xs font-semibold font-montserrat transition-colors"
          >
            Dispatch
          </button>
        )}
        {showReturn && quantity > 0 && (
          <button
            onClick={onReturn}
            className="flex-1 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white py-2.5 rounded-lg text-xs font-semibold font-montserrat transition-colors"
          >
            ↩ Return
          </button>
        )}
      </div>
      {/* Dispatch & Return buttons */}
      {(showDispatch || showReturn) && (
        <div className="flex gap-2">
          {showDispatch && (
            <button
              onClick={onDispatch}
              className="flex-1 bg-lapis hover:bg-celestial active:bg-yale text-white py-2.5 rounded-lg text-xs font-semibold font-montserrat transition-colors"
            >
              Dispatch
            </button>
          )}
          {showReturn && quantity > 0 && (
            <button
              onClick={onReturn}
              className="flex-1 bg-white border border-celestial text-celestial hover:bg-celestial hover:text-white py-2.5 rounded-lg text-xs font-semibold font-montserrat transition-colors"
            >
              Return
            </button>
          )}
        </div>
      )}
    </div>
  )
}