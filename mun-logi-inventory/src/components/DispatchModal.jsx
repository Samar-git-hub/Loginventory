import { useState } from 'react'

export default function DispatchModal({ item, committeeName, mode = 'dispatch', onConfirm, onClose, isLoading, error }) {
  const [quantity, setQuantity] = useState(1)
  const [dispatcher, setDispatcher] = useState('')

  const isReturn = mode === 'return'
  const title = isReturn ? 'Return Items' : 'Dispatch Items'
  const desc = isReturn
    ? <p className="text-gray-400 text-sm mb-5 font-raleway">
      Returning <span className="text-gray-800 font-semibold">{item?.name}</span> from{' '}
      <span className="text-lapis font-semibold">{committeeName}</span> back to main inventory
    </p>
    : <p className="text-gray-400 text-sm mb-5 font-raleway">
      Sending <span className="text-gray-800 font-semibold">{item?.name}</span> to{' '}
      <span className="text-lapis font-semibold">{committeeName}</span>
    </p>

  const btnColor = isReturn
    ? 'bg-celestial hover:bg-maya text-white'
    : 'bg-lapis hover:bg-celestial text-white'
  const btnLabel = isReturn
    ? (isLoading ? 'Returning...' : `Return ${quantity}`)
    : (isLoading ? 'Dispatching...' : `Dispatch ${quantity}`)

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white p-8 rounded-2xl w-full max-w-sm shadow-xl mx-auto"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold font-montserrat text-yale mb-1">{title}</h2>
        {desc}

        {error && (
          <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-4 text-sm border border-red-200 font-raleway">
            {error}
          </div>
        )}

        {/* Dispatcher name */}
        <input
          type="text"
          placeholder="Dispatcher name (who is carrying)"
          value={dispatcher}
          onChange={e => setDispatcher(e.target.value)}
          className="w-full bg-gray-50 border border-gray-200 text-gray-800 px-4 py-3 rounded-lg mb-4 text-sm outline-none focus:border-celestial focus:ring-2 focus:ring-maya/30 font-raleway"
        />

        {/* Quantity selector */}
        <div className="flex items-center border border-lapis/20 rounded-xl overflow-hidden mb-6">
          <button
            onClick={() => setQuantity(q => Math.max(1, q - 1))}
            className="w-12 h-12 bg-lapis/5 hover:bg-lapis/15 text-lapis text-xl font-medium transition-colors flex items-center justify-center border-r border-lapis/20"
          >
            −
          </button>
          <input
            type="number"
            min={1}
            value={quantity}
            onChange={e => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
            className="flex-1 bg-white text-yale text-center text-xl font-bold font-montserrat py-2.5 outline-none"
          />
          <button
            onClick={() => setQuantity(q => q + 1)}
            className="w-12 h-12 bg-lapis/5 hover:bg-lapis/15 text-lapis text-xl font-medium transition-colors flex items-center justify-center border-l border-lapis/20"
          >
            +
          </button>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => onConfirm(quantity, dispatcher.trim())}
            disabled={isLoading || !dispatcher.trim()}
            className={`flex-1 py-3 rounded-lg font-semibold font-montserrat text-sm disabled:opacity-50 transition-colors ${btnColor}`}
          >
            {btnLabel}
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