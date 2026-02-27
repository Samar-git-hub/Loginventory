import { useState } from 'react'

export default function ReturnModal({ itemName, committeeName, maxQuantity, onConfirm, onClose, isLoading, error }) {
  const [quantity, setQuantity] = useState(maxQuantity)

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white p-8 rounded-2xl w-full max-w-sm shadow-xl mx-auto"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold font-montserrat text-yale mb-1">Return Items</h2>
        <p className="text-gray-400 text-sm mb-6 font-raleway">
          Returning <span className="text-gray-800 font-semibold">{itemName}</span> from{' '}
          <span className="text-lapis font-semibold">{committeeName}</span> back to inventory
        </p>

        {error && (
          <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-4 text-sm border border-red-200 font-raleway">
            {error}
          </div>
        )}

        {/* Quantity selector */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => setQuantity(q => Math.max(1, q - 1))}
            className="w-11 h-11 bg-gray-100 hover:bg-gray-200 text-gray-600 text-lg rounded-lg font-bold transition-colors flex items-center justify-center"
          >
            −
          </button>
          <input
            type="number"
            min={1}
            max={maxQuantity}
            value={quantity}
            onChange={e => setQuantity(Math.max(1, Math.min(maxQuantity, parseInt(e.target.value) || 1)))}
            className="flex-1 bg-gray-50 border border-gray-200 text-gray-800 text-center text-xl font-bold font-montserrat py-2.5 rounded-lg outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
          />
          <button
            onClick={() => setQuantity(q => Math.min(maxQuantity, q + 1))}
            className="w-11 h-11 bg-gray-100 hover:bg-gray-200 text-gray-600 text-lg rounded-lg font-bold transition-colors flex items-center justify-center"
          >
            +
          </button>
        </div>

        <p className="text-xs text-gray-400 text-center mb-4 font-raleway">
          Max returnable: {maxQuantity}
        </p>

        <div className="flex gap-3">
          <button
            onClick={() => onConfirm(quantity)}
            disabled={isLoading}
            className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-lg font-semibold font-montserrat text-sm disabled:opacity-50 transition-colors"
          >
            {isLoading ? 'Returning...' : `Return ${quantity}`}
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 py-3 rounded-lg font-montserrat text-sm transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
