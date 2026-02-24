import { Trophy, Xmark } from "iconoir-react"
import type { RoundCheckInEntry } from "@/api/events"
import { PLACE_ICONS, PLACE_LABELS } from "./round-types"
import type { PrizeFeedback, PrizeSlot, WinnerAssignments } from "./round-types"

export interface WinnerAssignmentPanelProps {
    winners: WinnerAssignments
    selectedCount: number
    selected: Set<string>
    entryMap: Map<string, RoundCheckInEntry>
    pendingPlaceTarget: PrizeSlot | null
    prizeFeedback: PrizeFeedback | null
    isSubmittingPrizes: boolean
    isPending: boolean
    onPlaceClick: (place: PrizeSlot) => void
    onClearSlot: (place: PrizeSlot) => void
    onSubmitWinners: () => void
    onDisqualify: () => void
    onClearSelection: () => void
    onDismissPrizeFeedback: () => void
}

export function WinnerAssignmentPanel({
    winners,
    selectedCount,
    pendingPlaceTarget,
    prizeFeedback,
    isSubmittingPrizes,
    isPending,
    onPlaceClick,
    onClearSlot,
    onSubmitWinners,
    onDisqualify,
    onClearSelection,
    onDismissPrizeFeedback,
}: WinnerAssignmentPanelProps) {
    const places: PrizeSlot[] = [1, 2, 3]
    const hasAnyWinner = winners.size > 0

    return (
        <div className="border-b border-neutral-800 bg-neutral-950">
            {/* ── Header ── */}
            <div className="flex items-center gap-3 px-4 md:px-6 py-3 border-b border-neutral-800/60 bg-neutral-900/40">
                <Trophy className="w-4 h-4 text-yellow-500 shrink-0" />
                <span className="text-xs font-bold text-white uppercase tracking-widest">
                    Final Round — Winner Selection
                </span>
                <span className="text-[10px] text-neutral-500 ml-auto">
                    Assign podium positions, then submit
                </span>
            </div>

            {/* ── Prize feedback banner ── */}
            {prizeFeedback && (
                <div
                    className={`px-4 md:px-6 py-3 border-b text-xs font-medium flex flex-col gap-2 ${prizeFeedback.kind === "success"
                        ? "bg-emerald-950/50 border-emerald-800 text-emerald-300"
                        : prizeFeedback.kind === "partial"
                            ? "bg-amber-950/50 border-amber-800 text-amber-300"
                            : "bg-red-950/50 border-red-900 text-red-400"
                        }`}
                >
                    <div className="flex items-start justify-between gap-3">
                        <span>
                            {prizeFeedback.kind === "success" &&
                                `✓ ${prizeFeedback.count} prize${prizeFeedback.count === 1 ? "" : "s"} assigned successfully!`}
                            {prizeFeedback.kind === "partial" &&
                                `⚠ ${prizeFeedback.count}/${prizeFeedback.total} prizes assigned. ${prizeFeedback.errors.length} failed:`}
                            {prizeFeedback.kind === "failure" &&
                                "✗ Failed to assign prizes. Please try again."}
                        </span>
                        <button
                            type="button"
                            onClick={onDismissPrizeFeedback}
                            className="text-current opacity-60 hover:opacity-100 shrink-0 text-base leading-none"
                        >
                            ✕
                        </button>
                    </div>
                    {(prizeFeedback.kind === "partial" || prizeFeedback.kind === "failure") &&
                        prizeFeedback.errors.length > 0 && (
                            <div className="space-y-0.5 pl-2 border-l-2 border-current/30">
                                {prizeFeedback.errors.map((e, i) => (
                                    <div key={i} className="font-mono opacity-80">
                                        {e.id ? `${e.id}: ` : ""}{e.error}
                                    </div>
                                ))}
                            </div>
                        )}
                </div>
            )}

            {/* ── Podium Slots ── */}
            <div className="px-4 md:px-6 py-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                {places.map((place) => {
                    const slot = winners.get(place)
                    const { label: medal, cls: slotCls } = PLACE_ICONS[place]
                    const isActive = pendingPlaceTarget === place

                    return (
                        <div
                            key={place}
                            className={`relative border transition-all duration-150 ${isActive
                                ? "border-white bg-neutral-900 ring-1 ring-white"
                                : slot
                                    ? `${slotCls} border-2`
                                    : "border-neutral-800 bg-neutral-900/20"
                                }`}
                        >
                            {/* Place label */}
                            <div className="flex items-center gap-2 px-3 pt-3 pb-2">
                                <span className="text-base leading-none">{medal}</span>
                                <span
                                    className={`text-[10px] font-black uppercase tracking-widest ${isActive ? "text-white" : slot ? "text-current" : "text-neutral-600"
                                        }`}
                                >
                                    {PLACE_LABELS[place]}
                                </span>
                                {isActive && (
                                    <span className="ml-auto text-[9px] text-white font-bold uppercase tracking-widest animate-pulse">
                                        Select a row ↓
                                    </span>
                                )}
                            </div>

                            {/* Assigned name or empty-state button */}
                            <div className="px-3 pb-3">
                                {slot ? (
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="text-sm font-bold text-white truncate">
                                            {slot.label}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => onClearSlot(place)}
                                            className="shrink-0 text-neutral-500 hover:text-red-400 transition-colors duration-150"
                                            aria-label={`Remove ${PLACE_LABELS[place]} winner`}
                                        >
                                            <Xmark className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => onPlaceClick(place)}
                                        disabled={isSubmittingPrizes}
                                        className={`w-full text-left text-[10px] uppercase tracking-widest py-1 border transition-colors duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white disabled:opacity-40 ${isActive
                                            ? "border-white text-white px-2"
                                            : "border-neutral-800 text-neutral-600 hover:border-neutral-600 hover:text-neutral-400 px-2"
                                            }`}
                                    >
                                        {isActive
                                            ? "Waiting for selection…"
                                            : selectedCount === 1
                                                ? "Assign selected"
                                                : "Click to assign"}
                                    </button>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* ── Guidance + Action Bar ── */}
            <div className="flex flex-col md:flex-row items-start md:items-center gap-3 px-4 md:px-6 py-3 border-t border-neutral-800/60 bg-neutral-900/30">
                {/* Guidance text */}
                <p className="text-[10px] text-neutral-500 flex-1">
                    {pendingPlaceTarget
                        ? `Click a row checkbox to assign it to ${PLACE_LABELS[pendingPlaceTarget]}. Or select a row first, then click a place slot.`
                        : selectedCount === 1
                            ? `${selectedCount} entry selected. Click a place slot above to assign it.`
                            : selectedCount > 1
                                ? `${selectedCount} entries selected. Select only 1 at a time to assign a place.`
                                : "Select a participant row, then click a podium slot above to assign their position."}
                </p>

                <div className="flex items-center gap-2 shrink-0">
                    {/* Disqualify (manual, rare) */}
                    {selectedCount > 0 && (
                        <>
                            <button
                                type="button"
                                disabled={isPending}
                                onClick={onDisqualify}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest border border-red-800 bg-red-950/60 text-red-400 hover:bg-red-900/60 hover:border-red-600 hover:text-red-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-150"
                            >
                                <span className="w-1.5 h-1.5 rounded-full bg-red-400 inline-block" />
                                Disqualify
                            </button>
                            <button
                                type="button"
                                onClick={onClearSelection}
                                className="px-2 py-1.5 text-[11px] text-neutral-600 hover:text-neutral-400 transition-colors duration-150"
                            >
                                ✕
                            </button>
                        </>
                    )}

                    {/* Submit Winners */}
                    <button
                        type="button"
                        disabled={!hasAnyWinner || isSubmittingPrizes || isPending}
                        onClick={onSubmitWinners}
                        className={`inline-flex items-center gap-2 px-4 py-1.5 text-[11px] font-black uppercase tracking-widest border transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white ${hasAnyWinner
                            ? "border-white bg-white text-black hover:bg-neutral-200"
                            : "border-neutral-700 bg-neutral-900 text-neutral-300 hover:bg-neutral-800"
                            }`}
                    >
                        <Trophy className="w-3.5 h-3.5" />
                        {isSubmittingPrizes
                            ? "Submitting…"
                            : hasAnyWinner
                                ? `Submit ${winners.size} Winner${winners.size > 1 ? "s" : ""}`
                                : "Submit Winners"}
                    </button>
                </div>
            </div>
        </div>
    )
}
