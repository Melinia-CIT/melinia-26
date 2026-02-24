import { Search, Xmark } from "iconoir-react"
import type { RoundQualifiedParticipant } from "@/api/events"
import { TablePagination, TypeBadge } from "./TablePagination"

// ── Qualified Table ───────────────────────────────────────────────────────────

interface QualifiedTableProps {
    data: RoundQualifiedParticipant[]
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
}

export function QualifiedTable({
    data,
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
}: QualifiedTableProps) {
    return (
        <>
            {/* ── Search Bar ── */}
            <div className="flex items-center gap-2 px-4 md:px-6 py-3 border-b border-neutral-800 bg-neutral-900/30">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                    <input
                        type="text"
                        placeholder="Search by name, ID, or phone..."
                        value={searchInput}
                        onChange={e => onSearchInputChange(e.target.value)}
                        onKeyDown={e => {
                            if (e.key === "Enter") {
                                e.preventDefault()
                                onSearch()
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

            {/* Loading state */}
            {isLoading && (
                <div className="p-12 text-center text-neutral-500">
                    Loading qualified participants...
                </div>
            )}

            {/* Error state */}
            {error && !isLoading && (
                <div className="p-12 text-center">
                    <p className="text-red-500 mb-2">Failed to load qualified participants</p>
                    <p className="text-xs text-neutral-500">{String(error)}</p>
                </div>
            )}

            {/* Empty state */}
            {!isLoading && !error && data.length === 0 && (
                <div className="p-12 text-center text-neutral-500">
                    {activeSearch
                        ? `No results found for "${activeSearch}"`
                        : "No qualified participants for this round yet."}
                </div>
            )}

            {/* Mobile card view */}
            {!isLoading && !error && data.length > 0 && (
                <div className="md:hidden divide-y divide-neutral-800">
                    {data.map((entry, idx) => (
                        <QualifiedCard key={idx} entry={entry} />
                    ))}
                </div>
            )}

            {/* Desktop table view */}
            {!isLoading && !error && data.length > 0 && (
                <div className="hidden md:block border border-neutral-800 bg-neutral-950 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-neutral-800 bg-neutral-900/60">
                                    {participationType?.toUpperCase() === "TEAM" && (
                                        <th className="px-6 py-3 text-left text-[10px] font-semibold text-neutral-400 uppercase tracking-widest border-r border-neutral-800/60 w-[200px]">
                                            Team / Entry
                                        </th>
                                    )}
                                    <th className="px-6 py-3 text-left text-[10px] font-semibold text-neutral-400 uppercase tracking-widest">
                                        Participant Name
                                    </th>
                                    <th className="px-6 py-3 text-left text-[10px] font-semibold text-neutral-400 uppercase tracking-widest">
                                        College & Degree
                                    </th>
                                    <th className="px-6 py-3 text-left text-[10px] font-semibold text-neutral-400 uppercase tracking-widest">
                                        Phone Number
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.map((entry, idx) => (
                                    <QualifiedRowGroup
                                        key={idx}
                                        entry={entry}
                                        showTeamColumn={participationType?.toUpperCase() === "TEAM"}
                                    />
                                ))}
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
        </>
    )
}

// ── Qualified Row Group ───────────────────────────────────────────────────────

function QualifiedRowGroup({
    entry,
    showTeamColumn,
}: {
    entry: RoundQualifiedParticipant
    showTeamColumn?: boolean
}) {
    if (entry.type === "SOLO") {
        return (
            <tr className="hover:bg-neutral-900/40 transition-colors duration-150 border-b border-neutral-800/60 last:border-0">
                {showTeamColumn && (
                    <td className="px-6 py-4 border-r border-neutral-800/60 bg-neutral-950/20 align-middle">
                        <div className="flex flex-col items-center justify-center">
                            <TypeBadge type="SOLO" />
                        </div>
                    </td>
                )}
                <td className="px-6 py-4">
                    <div className="flex flex-col gap-2">
                        {!showTeamColumn && <TypeBadge type="SOLO" />}
                        <div className="text-sm font-bold text-white uppercase tracking-wider leading-tight">
                            {entry.first_name} {entry.last_name}
                        </div>
                        <div className="text-[10px] text-neutral-500 font-mono">
                            {entry.participant_id}
                        </div>
                    </div>
                </td>
                <td className="px-6 py-4">
                    <div className="text-xs text-neutral-400">
                        <div className="truncate max-w-[240px]">{entry.college}</div>
                        <div className="text-[10px] text-neutral-600 mt-0.5">{entry.degree}</div>
                    </div>
                </td>
                <td className="px-6 py-4">
                    <div className="text-xs text-neutral-500 font-mono">{entry.ph_no}</div>
                </td>
            </tr>
        )
    }

    return (
        <>
            {entry.members.map((member, mIdx) => (
                <tr
                    key={member.participant_id}
                    className="hover:bg-neutral-900/20 transition-colors duration-150 border-b border-neutral-800/60 last:border-0"
                >
                    {showTeamColumn && mIdx === 0 && (
                        <td
                            rowSpan={entry.members.length}
                            className="px-6 py-4 border-r border-neutral-800/60 bg-neutral-950/30 align-middle"
                        >
                            <div className="flex flex-col items-center justify-center space-y-2 sticky top-4 text-center">
                                <TypeBadge type="TEAM" />
                                <div className="text-sm font-black text-white uppercase tracking-widest leading-none">
                                    {entry.name}
                                </div>
                                <div className="text-[9px] text-neutral-600 uppercase tracking-widest font-bold">
                                    {entry.members.length} members
                                </div>
                            </div>
                        </td>
                    )}
                    <td className="px-6 py-4">
                        <div className="text-sm text-neutral-300">
                            {member.first_name} {member.last_name}
                        </div>
                        <div className="text-[10px] text-neutral-600 font-mono mt-0.5">
                            {member.participant_id}
                        </div>
                    </td>
                    <td className="px-6 py-4">
                        <div className="text-xs text-neutral-500">
                            <div className="truncate max-w-[240px]">{member.college}</div>
                            <div className="text-[10px] text-neutral-700 mt-0.5">
                                {member.degree}
                            </div>
                        </div>
                    </td>
                    <td className="px-6 py-4">
                        <div className="text-xs text-neutral-500 font-mono">{member.ph_no}</div>
                    </td>
                </tr>
            ))}
        </>
    )
}

// ── Qualified Card (mobile) ───────────────────────────────────────────────────

function QualifiedCard({ entry }: { entry: RoundQualifiedParticipant }) {
    if (entry.type === "TEAM") {
        return (
            <div className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                    <TypeBadge type="TEAM" />
                    <span className="font-semibold text-white">{entry.name}</span>
                </div>
                <div className="space-y-1">
                    {entry.members.map(m => (
                        <div key={m.participant_id} className="text-xs text-neutral-400 font-mono">
                            {m.first_name} {m.last_name} • {m.ph_no}
                        </div>
                    ))}
                </div>
                <div className="flex gap-4 text-xs text-neutral-500">
                    <span>{entry.members[0]?.college ?? "—"}</span>
                </div>
            </div>
        )
    }
    return (
        <div className="p-4 space-y-2">
            <div className="flex items-center gap-2">
                <TypeBadge type="SOLO" />
                <span className="font-semibold text-white">
                    {entry.first_name} {entry.last_name}
                </span>
            </div>
            <div className="text-xs text-neutral-400 font-mono">
                {entry.participant_id} • {entry.ph_no}
            </div>
            <div className="flex gap-4 text-xs text-neutral-500">
                <span>{entry.college}</span>
            </div>
        </div>
    )
}
