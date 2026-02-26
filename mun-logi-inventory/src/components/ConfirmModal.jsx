import { useState } from 'react'

/**
 * Reusable confirmation modal.
 * - type="simple": just OK/Cancel buttons
 * - type="typed": user must type `confirmText` to enable confirm
 */
export default function ConfirmModal({
    title,
    message,
    confirmLabel = 'Confirm',
    type = 'simple',        // 'simple' | 'typed'
    confirmText = '',       // what the user must type (for type="typed")
    placeholder = '',
    onConfirm,
    onClose,
    isLoading = false,
    destructive = true,
}) {
    const [typed, setTyped] = useState('')
    const canConfirm = type === 'simple' || typed === confirmText

    return (
        <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={onClose}
        >
            <div
                className="bg-white p-8 rounded-2xl w-full max-w-sm shadow-xl"
                onClick={e => e.stopPropagation()}
            >
                <h2 className="text-xl font-bold font-montserrat text-yale mb-2">{title}</h2>
                <p className="text-gray-500 text-sm font-raleway mb-5 leading-relaxed">{message}</p>

                {type === 'typed' && (
                    <input
                        autoFocus
                        type="text"
                        placeholder={placeholder}
                        value={typed}
                        onChange={e => setTyped(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter' && canConfirm) onConfirm() }}
                        className="w-full bg-gray-50 border border-gray-200 text-gray-800 px-4 py-3 rounded-xl mb-4 text-sm outline-none focus:border-celestial focus:ring-2 focus:ring-maya/30 font-raleway"
                    />
                )}

                <div className="flex gap-3">
                    <button
                        onClick={onConfirm}
                        disabled={!canConfirm || isLoading}
                        className={`flex-1 py-3 rounded-xl font-semibold font-montserrat text-sm disabled:opacity-40 transition-colors ${destructive
                                ? 'bg-red-500 hover:bg-red-600 text-white'
                                : 'bg-lapis hover:bg-celestial text-white'
                            }`}
                    >
                        {isLoading ? 'Please wait...' : confirmLabel}
                    </button>
                    <button
                        onClick={onClose}
                        className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 py-3 rounded-xl font-montserrat text-sm transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    )
}
