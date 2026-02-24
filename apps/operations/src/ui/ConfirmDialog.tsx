export interface ConfirmDialogProps {
    open: boolean
    title: string
    description: string
    confirmLabel?: string
    isPending?: boolean
    onConfirm: () => void
    onCancel: () => void
}

export function ConfirmDialog({
    open,
    title,
    description,
    confirmLabel = "Confirm",
    isPending = false,
    onConfirm,
    onCancel,
}: ConfirmDialogProps) {
    if (!open) return null
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="bg-neutral-950 border border-neutral-800 w-full max-w-sm mx-4 shadow-2xl">
                <div className="px-6 pt-6 pb-4 border-b border-neutral-800">
                    <p className="text-sm font-bold text-white uppercase tracking-widest">
                        {title}
                    </p>
                </div>
                <div className="px-6 py-5">
                    <p className="text-sm text-neutral-400 leading-relaxed">{description}</p>
                </div>
                <div className="px-6 pb-6 flex items-center justify-end gap-3">
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={isPending}
                        className="px-4 py-2 text-xs font-bold uppercase tracking-widest border border-neutral-700 text-neutral-400 hover:bg-neutral-900 hover:text-white disabled:opacity-40 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={isPending}
                        className="px-4 py-2 text-xs font-bold uppercase tracking-widest border border-red-800 bg-red-950/60 text-red-400 hover:bg-red-900/60 hover:border-red-600 hover:text-red-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-red-500"
                    >
                        {isPending ? "Removing…" : confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    )
}
