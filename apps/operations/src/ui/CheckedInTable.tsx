import { Search, Xmark } from "iconoir-react"
import type { RoundCheckInEntry } from "@/api/events"
import { ConfirmDialog } from "./ConfirmDialog"
import { TablePagination } from "./TablePagination"
import { WinnerAssignmentPanel } from "./WinnerAssignmentPanel"
import { CheckedInCard, CheckedInRowGroup } from "./CheckedInRows"
import { useCheckedInBatch } from "./useCheckedInBatch"
import type { PrizeSlot } from "./round-types"

// Stable helper used by sibling files
export function entryId(entry: RoundCheckInEntry): string {
    return entry.type === "TEAM" ? `team:${entry.name}` : `solo:${entry.participant_id}`
}

export type { CheckedInTableProps }

interface CheckedInTableProps {
    eventId: string
    roundNo: string
    data: RoundCheckInEntry[]
    allData: RoundCheckInEntry[]
    isLoading: boolean
    error: Error | null
    page: number
    totalPages: number
    total: number
    pageLimit: number
    onPrev: () => void
    onNext: () => void
    onSetPage: (page: number) => void
    onSetLimit: (limit: number) => void
    participationType?: string
    searchInput: string
    onSearchInputChange: (value: string) => void
    activeSearch: string
    onSearch: () => void
    onClearSearch: () => void
    isLastRound?: boolean
}

export function CheckedInTable({
    eventId,
    roundNo,
    data,
    allData,
    isLoading,
    error,
    page,
    totalPages,
    total,
    pageLimit,
    onPrev,
    onNext,
    onSetPage,
    onSetLimit,
    participationType,
    searchInput,
    onSearchInputChange,
    activeSearch,
    onSearch,
    onClearSearch,
    isLastRound = false,
}: CheckedInTableProps) {
    const {
        selected,
        allSelected,
        someSelected,
        entryMap,
        toggleAll,
        toggleEntry,
        clearSelection,
        handleToggleEntryWithPlaceContext,
        isAutoMode,
        toggleAutoMode,
        feedback,
        setFeedback,
        isPendingBatch,
        applyStatus,
        pendingDelete,
        setPendingDelete,
        deleteMutation,
        winners,
        pendingPlaceTarget,
        prizeFeedback,
        setPrizeFeedback,
        isSubmittingPrizes,
        handlePlaceClick,
        clearWinnerSlot,
        submitWinners,
    } = useCheckedInBatch({ eventId, roundNo, allData, pageData: data })

    const selectedCount = selected.size

    return (
        <div className="relative">
            {/* Search Bar */}
            <div className="flex items-center gap-2 px-4 md:px-6 py-3 border-b border-neutral-800 bg-neutral-900/30">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                    <input
                        type="search"
                        placeholder="Search by name, ID, or phone..."
                        value={searchInput}
                        onChange={e => onSearchInputChange(e.target.value)}
                        onKeyDown={e => {
                            if (e.key === "Enter") {
                                e.preventDefault()
                                onSearch()
                                e.currentTarget.blur()
                            }
                        }}
                        className="w-full bg-neutral-950 border border-neutral-800 text-white pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-neutral-600"
                    />
                    {searchInput && (
                        <button
                            type="button"
                            onClick={onClearSearch}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white"
                        >
                            <Xmark className="w-4 h-4" />
                        </button>
                    )}
                </div>
                <button
                    type="button"
                    onClick={onSearch}
                    className="hidden md:inline-flex px-4 py-2 text-xs font-bold uppercase tracking-widest border border-neutral-700 text-neutral-300 hover:bg-neutral-800 transition-colors"
                >
                    Search
                </button>
            </div>
            {activeSearch && (
                <div className="px-4 md:px-6 pb-2">
                    {data.length > 0 ? (
                        <span className="text-xs text-neutral-500">
                            Showing {total} result{total !== 1 ? "s" : ""} for "{activeSearch}"
                        </span>
                    ) : (
                        <span className="text-xs text-neutral-500">
                            No results found for "{activeSearch}"
                        </span>
                    )}
                </div>
            )}

            {/* Feedback Banner */}
            {feedback && (
                <div
                    className={`px-4 md:px-6 py-3 border-b text-xs font-medium flex flex-col gap-2 ${
                        feedback.kind === "success" || feedback.kind === "delete-success"
                            ? "bg-emerald-950/50 border-emerald-800 text-emerald-300"
                            : feedback.kind === "partial"
                              ? "bg-amber-950/50 border-amber-800 text-amber-300"
                              : "bg-red-950/50 border-red-900 text-red-400"
                    }`}
                >
                    <div className="flex items-start justify-between gap-3">
                        <span>
                            {feedback.kind === "success" &&
                                `✓ ${feedback.count} ${feedback.count === 1 ? "entry" : "entries"} updated successfully.`}
                            {feedback.kind === "delete-success" && `✓ ${feedback.message}`}
                            {feedback.kind === "delete-failure" && `✗ ${feedback.message}`}
                            {feedback.kind === "partial" &&
                                `⚠ ${feedback.count}/${feedback.total} entries updated. ${feedback.userErrors.length + feedback.teamErrors.length} failed:`}
                            {feedback.kind === "failure" &&
                                "✗ Failed to update any entries. Please try again."}
                        </span>
                        <button
                            type="button"
                            onClick={() => setFeedback(null)}
                            className="text-current opacity-60 hover:opacity-100 shrink-0 text-base leading-none"
                        >
                            ✕
                        </button>
                    </div>
                    {(feedback.kind === "partial" || feedback.kind === "failure") && (
                        <div className="space-y-0.5 pl-2 border-l-2 border-current/30">
                            {feedback.userErrors.map(e => (
                                <div key={e.user_id} className="font-mono opacity-80">
                                    {e.user_id}: {e.error}
                                </div>
                            ))}
                            {feedback.teamErrors.map(e => (
                                <div key={e.team_id} className="font-mono opacity-80">
                                    {e.team_id}: {e.error}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Winner Assignment Panel (last round) */}
            {isLastRound && (
                <WinnerAssignmentPanel
                    winners={winners}
                    selectedCount={selectedCount}
                    selected={selected}
                    entryMap={entryMap}
                    pendingPlaceTarget={pendingPlaceTarget}
                    prizeFeedback={prizeFeedback}
                    isSubmittingPrizes={isSubmittingPrizes}
                    isPending={isPendingBatch}
                    onPlaceClick={handlePlaceClick}
                    onClearSlot={clearWinnerSlot}
                    onSubmitWinners={submitWinners}
                    onDisqualify={() => applyStatus("DISQUALIFIED")}
                    onClearSelection={clearSelection}
                    onDismissPrizeFeedback={() => setPrizeFeedback(null)}
                />
            )}

            {/* Status Action Bar (non-last rounds) */}
            {!isLastRound && (
                <>
                    {/* Mode toggle */}
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 px-4 md:px-6 py-2 border-b border-neutral-800/60 bg-neutral-950">
                        <span className="text-[10px] text-neutral-600 uppercase tracking-widest font-bold">
                            Mode
                        </span>
                        <div className="flex items-center border border-neutral-800 overflow-hidden">
                            {(["Auto", "Manual"] as const).map((label, i) => {
                                const isActive = i === 0 ? isAutoMode : !isAutoMode
                                return (
                                    <button
                                        key={label}
                                        type="button"
                                        onClick={() => toggleAutoMode(i === 0)}
                                        className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest transition-colors duration-150 focus-visible:outline-none ${isActive ? "bg-white text-black" : "bg-transparent text-neutral-600 hover:text-neutral-300"}`}
                                    >
                                        {label}
                                    </button>
                                )
                            })}
                        </div>
                        <span className="hidden sm:block text-[10px] text-neutral-700 italic">
                            {isAutoMode
                                ? "Qualifying auto-eliminates others, and vice versa"
                                : "Only selected entries are updated"}
                        </span>
                        <span className="sm:hidden text-[10px] text-neutral-700 italic">
                            {isAutoMode ? "Auto mode" : "Manual mode"}
                        </span>
                    </div>

                    {/* Selection action bar */}
                    <div
                        className={`sticky top-0 z-20 transition-all duration-300 ease-out overflow-hidden ${selectedCount > 0 ? "max-h-48 md:max-h-32 opacity-100" : "max-h-0 opacity-0 pointer-events-none"}`}
                    >
                        <div className="bg-neutral-900 border-b border-neutral-700 px-4 md:px-6 py-3 flex flex-col md:flex-row items-start md:items-center gap-2 md:gap-3 shadow-lg shadow-black/40">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-white text-black text-[11px] font-black shrink-0">
                                    {selectedCount}
                                </span>
                                <span className="text-xs text-neutral-300 font-medium">
                                    {selectedCount === 1 ? "entry" : "entries"} selected
                                </span>
                            </div>
                            <div className="flex items-center gap-1.5 flex-wrap shrink-0 w-full md:w-auto">
                                {isPendingBatch && (
                                    <span className="text-[11px] text-neutral-500 uppercase tracking-widest animate-pulse mr-1">
                                        Saving…
                                    </span>
                                )}
                                {(["QUALIFIED", "ELIMINATED", "DISQUALIFIED"] as const).map(s => {
                                    const cls =
                                        s === "QUALIFIED"
                                            ? "border-emerald-700 bg-emerald-950/60 text-emerald-400 hover:bg-emerald-900/60 hover:border-emerald-500 hover:text-emerald-300 focus-visible:ring-emerald-400"
                                            : s === "ELIMINATED"
                                              ? "border-amber-700 bg-amber-950/60 text-amber-400 hover:bg-amber-900/60 hover:border-amber-500 hover:text-amber-300 focus-visible:ring-amber-400"
                                              : "border-red-800 bg-red-950/60 text-red-400 hover:bg-red-900/60 hover:border-red-600 hover:text-red-300 focus-visible:ring-red-400"
                                    const dot =
                                        s === "QUALIFIED"
                                            ? "bg-emerald-400"
                                            : s === "ELIMINATED"
                                              ? "bg-amber-400"
                                              : "bg-red-400"
                                    const label =
                                        s === "QUALIFIED"
                                            ? "Qual"
                                            : s === "ELIMINATED"
                                              ? "Elim"
                                              : "Disq"
                                    return (
                                        <button
                                            key={s}
                                            type="button"
                                            disabled={isPendingBatch}
                                            onClick={() => applyStatus(s)}
                                            className={`inline-flex items-center gap-1 px-2 md:px-3 py-1.5 text-[10px] md:text-[11px] font-bold uppercase tracking-widest border disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-150 focus-visible:outline-none focus-visible:ring-1 ${cls}`}
                                        >
                                            <span
                                                className={`w-1.5 h-1.5 rounded-full ${dot} inline-block`}
                                            />
                                            <span className="hidden sm:inline">
                                                {s.charAt(0) + s.slice(1).toLowerCase()}
                                            </span>
                                            <span className="sm:hidden">{label}</span>
                                            {s !== "DISQUALIFIED" && isAutoMode && (
                                                <span className="hidden md:inline opacity-50 text-[9px] normal-case tracking-normal font-normal ml-0.5">
                                                    +auto
                                                </span>
                                            )}
                                        </button>
                                    )
                                })}
                                <button
                                    type="button"
                                    disabled={isPendingBatch}
                                    onClick={clearSelection}
                                    className="px-2 py-1.5 text-[11px] text-neutral-600 hover:text-neutral-400 disabled:opacity-40 transition-colors duration-150 focus-visible:outline-none"
                                    aria-label="Clear selection"
                                >
                                    ✕
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* States */}
            {isLoading && (
                <div className="p-12 text-center text-neutral-500">
                    Loading checked-in participants...
                </div>
            )}
            {error && !isLoading && (
                <div className="p-12 text-center">
                    <p className="text-red-500 mb-2">Failed to load checked-in participants</p>
                    <p className="text-xs text-neutral-500">{String(error)}</p>
                </div>
            )}
            {!isLoading && !error && data.length === 0 && (
                <div className="p-12 text-center text-neutral-500">
                    {activeSearch
                        ? `No results found for "${activeSearch}"`
                        : "No participants have checked in yet."}
                </div>
            )}

            {/* Mobile cards */}
            {!isLoading && !error && data.length > 0 && (
                <div className="md:hidden divide-y divide-neutral-800">
                    {data.map((entry, idx) => {
                        const id = entryId(entry)
                        const assignedPlace = (() => {
                            for (const [p, s] of winners.entries()) {
                                if (s.entryId === id) return p as PrizeSlot
                            }
                            return null
                        })()
                        return (
                            <CheckedInCard
                                key={idx}
                                entry={entry}
                                checked={selected.has(id)}
                                onToggle={() =>
                                    isLastRound
                                        ? handleToggleEntryWithPlaceContext(id)
                                        : toggleEntry(id)
                                }
                                assignedPlace={assignedPlace}
                                isLastRound={isLastRound}
                                onDelete={() => setPendingDelete(entry)}
                            />
                        )
                    })}
                </div>
            )}

            {/* Desktop table */}
            {!isLoading && !error && data.length > 0 && (
                <div className="hidden md:block border border-neutral-800 bg-neutral-950 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-neutral-800 bg-neutral-900/60 font-mono">
                                    <th className="w-12 px-6 py-3 border-r border-neutral-800/60 bg-neutral-900/40">
                                        <input
                                            type="checkbox"
                                            checked={allSelected}
                                            ref={el => {
                                                if (el) el.indeterminate = someSelected
                                            }}
                                            onChange={toggleAll}
                                            className="w-4 h-4 bg-black border-neutral-700 rounded-none checked:bg-white checked:border-white transition-all cursor-pointer accent-white"
                                        />
                                    </th>
                                    {participationType?.toUpperCase() === "TEAM" && (
                                        <th className="px-6 py-3 text-left text-[10px] font-semibold text-neutral-400 uppercase tracking-widest border-r border-neutral-800/60 w-[200px]">
                                            Team / Entry
                                        </th>
                                    )}
                                    <th className="px-6 py-3 text-left text-[10px] font-semibold text-neutral-400 uppercase tracking-widest">
                                        Participant Name
                                    </th>
                                    <th className="px-6 py-3 text-left text-[10px] font-semibold text-neutral-400 uppercase tracking-widest">
                                        College &amp; Degree
                                    </th>
                                    <th className="px-6 py-3 text-left text-[10px] font-semibold text-neutral-400 uppercase tracking-widest">
                                        Phone Number
                                    </th>
                                    <th className="w-16 px-4 py-3" />
                                </tr>
                            </thead>
                            <tbody>
                                {data.map((entry, idx) => {
                                    const id = entryId(entry)
                                    const assignedPlace = (() => {
                                        for (const [p, s] of winners.entries()) {
                                            if (s.entryId === id) return p as PrizeSlot
                                        }
                                        return null
                                    })()
                                    return (
                                        <CheckedInRowGroup
                                            key={idx}
                                            entry={entry}
                                            checked={selected.has(id)}
                                            onToggle={() =>
                                                isLastRound
                                                    ? handleToggleEntryWithPlaceContext(id)
                                                    : toggleEntry(id)
                                            }
                                            assignedPlace={assignedPlace}
                                            isLastRound={isLastRound}
                                            onDelete={() => setPendingDelete(entry)}
                                            showTeamColumn={
                                                participationType?.toUpperCase() === "TEAM"
                                            }
                                        />
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <TablePagination
                page={page}
                totalPages={totalPages}
                total={total}
                pageLimit={pageLimit}
                onPrev={onPrev}
                onNext={onNext}
                onSetPage={onSetPage}
                onSetLimit={onSetLimit}
            />

            <ConfirmDialog
                open={!!pendingDelete}
                title="Remove check-in?"
                description={
                    pendingDelete?.type === "TEAM"
                        ? `This will uncheck the entire team "${pendingDelete.name}" (${pendingDelete.members.length} member${pendingDelete.members.length !== 1 ? "s" : ""}) from round ${roundNo}. This cannot be undone.`
                        : `This will uncheck "${pendingDelete?.type === "SOLO" ? `${pendingDelete.first_name} ${pendingDelete.last_name}` : ""}" from round ${roundNo}. This cannot be undone.`
                }
                confirmLabel="Remove"
                isPending={deleteMutation.isPending}
                onConfirm={() => pendingDelete && deleteMutation.mutate(pendingDelete)}
                onCancel={() => setPendingDelete(null)}
            />
        </div>
    )
}
