import { useQuery, useQueryClient } from "@tanstack/react-query"
import type { AxiosError } from "axios"
import { Search, Xmark } from "iconoir-react"
import { useMemo, useState } from "react"
import { Route } from "@/routes/app/events.$eventId.$roundNo"
import { ConfirmDialog } from "./ConfirmDialog"
import { TablePagination } from "./TablePagination"
import { WinnersPodium } from "./WinnersPodium"
import { ResultRowGroup, ResultCardGroup } from "./ResultRows"
import type { RoundResultWithParticipant } from "@/api/events"

interface ResultsTabProps {
    eventId: string
    roundNo: string
    participationType?: string
    searchInput: string
    onSearchInputChange: (value: string) => void
    activeSearch: string
    onSearch: () => void
    onClearSearch: () => void
    page: number
    onSetPage: (page: number) => void
    limit: number
    onSetLimit: (limit: number) => void
    isLastRound?: boolean
}

export function ResultsTab({
    eventId,
    roundNo,
    participationType,
    searchInput,
    onSearchInputChange,
    activeSearch,
    onSearch,
    onClearSearch,
    page,
    onSetPage,
    limit,
    onSetLimit,
    isLastRound = false,
}: ResultsTabProps) {
    const { api } = Route.useRouteContext()
    const queryClient = useQueryClient()
    const [isFlushing, setIsFlushing] = useState(false)
    const [showFlushConfirm, setShowFlushConfirm] = useState(false)
    const [statusFilter, setStatusFilter] = useState<
        "all" | "QUALIFIED" | "ELIMINATED" | "DISQUALIFIED"
    >("all")
    const [sort, setSort] = useState<"points_desc" | "points_asc" | "name_asc">("points_desc")

    async function handleFlushWinners() {
        setIsFlushing(true)
        try {
            await api.events.deleteEventPrizes(eventId)
            queryClient.invalidateQueries({ queryKey: ["event-winners", eventId] })
            queryClient.invalidateQueries({ queryKey: ["round-results"] })
            setShowFlushConfirm(false)
        } catch (err) {
            const msg =
                (err as AxiosError<{ message?: string }>).response?.data?.message ??
                "Failed to flush winners"
            console.error(msg)
            setShowFlushConfirm(false)
        } finally {
            setIsFlushing(false)
        }
    }

    // Winners query (last round only)
    const {
        data: winnersData,
        isLoading: isWinnersLoading,
        error: winnersError,
        refetch: refetchWinners,
    } = useQuery({
        queryKey: ["event-winners", eventId],
        queryFn: () => api.events.getEventWinners(eventId),
        enabled: isLastRound,
        staleTime: 1000 * 60,
    })

    // Paginated results
    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ["round-results", eventId, roundNo, statusFilter, sort, page, limit],
        queryFn: () =>
            api.events.getRoundResults(eventId, roundNo, {
                status: statusFilter === "all" ? undefined : statusFilter,
                sort,
                from: page * limit,
                limit,
            }),
        enabled: !activeSearch,
        staleTime: 1000 * 30,
    })

    // Full dump for search
    const { data: fullData, isLoading: isFullLoading } = useQuery({
        queryKey: ["round-results-full", eventId, roundNo, statusFilter, sort],
        queryFn: () =>
            api.events.getRoundResults(eventId, roundNo, {
                status: statusFilter === "all" ? undefined : statusFilter,
                sort,
                from: 0,
                limit: 9999,
            }),
        enabled: !!activeSearch,
        staleTime: 1000 * 30,
    })

    const filteredResults = useMemo(() => {
        if (!activeSearch || !fullData?.data) return []
        const q = activeSearch.toLowerCase()
        return fullData.data.filter(
            (r: RoundResultWithParticipant) =>
                r.name.toLowerCase().includes(q) ||
                r.user_id.toLowerCase().includes(q) ||
                r.ph_no.includes(q) ||
                r.team_name?.toLowerCase().includes(q) ||
                r.team_id?.toLowerCase().includes(q)
        )
    }, [activeSearch, fullData])

    const results = activeSearch ? filteredResults : (data?.data ?? [])
    const totalCount = activeSearch ? filteredResults.length : (data?.pagination.total ?? 0)
    const totalPages = Math.ceil(totalCount / limit) || 1
    const paginatedResults = activeSearch
        ? filteredResults.slice(page * limit, (page + 1) * limit)
        : results
    const isLoadingResults = activeSearch ? isFullLoading : isLoading

    const statusCounts = results.reduce<Record<string, number>>((acc, r) => {
        acc[r.status] = (acc[r.status] ?? 0) + 1
        return acc
    }, {})

    // Group by team
    const groupedResults: { id: string; members: RoundResultWithParticipant[] }[] = []
    paginatedResults.forEach(r => {
        if (r.team_id) {
            const key = `team:${r.team_id}`
            const g = groupedResults.find(g => g.id === key)
            if (g) g.members.push(r)
            else groupedResults.push({ id: key, members: [r] })
        } else {
            groupedResults.push({ id: `user:${r.user_id}`, members: [r] })
        }
    })

    return (
        <div>
            {/* Winners Podium */}
            {isLastRound && (
                <WinnersPodium
                    winners={winnersData?.data ?? []}
                    isLoading={isWinnersLoading}
                    error={winnersError as Error | null}
                    isFlushing={isFlushing}
                    onFlush={() => setShowFlushConfirm(true)}
                    onRefresh={() => refetchWinners()}
                />
            )}

            {/* Search Bar */}
            <div className="flex items-center gap-2 px-4 md:px-6 py-3 border-b border-neutral-800 bg-neutral-900/30">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                    <input
                        type="text"
                        placeholder="Search by name, ID, phone, or team..."
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
                    {paginatedResults.length > 0 ? (
                        <span className="text-xs text-neutral-500">
                            Showing {totalCount} result{totalCount !== 1 ? "s" : ""} for "
                            {activeSearch}"
                        </span>
                    ) : (
                        <span className="text-xs text-neutral-500">
                            No results found for "{activeSearch}"
                        </span>
                    )}
                </div>
            )}

            {/* Filter + Sort Bar */}
            <div className="flex flex-wrap items-center gap-2 px-4 md:px-6 py-3 border-b border-neutral-800 bg-neutral-900/30">
                <div className="flex items-center gap-1.5 flex-wrap">
                    {(["all", "QUALIFIED", "ELIMINATED", "DISQUALIFIED"] as const).map(s => {
                        const active = statusFilter === s
                        const colorMap: Record<string, string> = {
                            all: "border-neutral-700 text-neutral-300 bg-neutral-900",
                            QUALIFIED: "border-emerald-700 text-emerald-300 bg-emerald-950/40",
                            ELIMINATED: "border-amber-700 text-amber-300 bg-amber-950/40",
                            DISQUALIFIED: "border-red-800 text-red-300 bg-red-950/40",
                        }
                        return (
                            <button
                                key={s}
                                type="button"
                                onClick={() => {
                                    setStatusFilter(s)
                                    onSetPage(0)
                                }}
                                className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest border transition-colors duration-150 focus-visible:outline-none ${active ? colorMap[s] : "border-neutral-800 text-neutral-600 hover:text-neutral-400 hover:border-neutral-700"}`}
                            >
                                {s === "all" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
                                {s !== "all" && statusCounts[s] != null && (
                                    <span className="ml-1 opacity-70">({statusCounts[s]})</span>
                                )}
                                {s === "all" && totalCount > 0 && (
                                    <span className="ml-1 opacity-70">({totalCount})</span>
                                )}
                            </button>
                        )
                    })}
                </div>
                <div className="ml-auto flex items-center gap-2">
                    <span className="text-[10px] text-neutral-600 uppercase tracking-widest">
                        Sort
                    </span>
                    <select
                        value={sort}
                        onChange={e => {
                            setSort(e.target.value as typeof sort)
                            onSetPage(0)
                        }}
                        className="bg-neutral-950 border border-neutral-800 text-neutral-400 text-[10px] uppercase tracking-widest px-2 py-1.5 focus:outline-none focus:border-neutral-600"
                    >
                        <option value="points_desc">Points ↓</option>
                        <option value="points_asc">Points ↑</option>
                        <option value="name_asc">Name A→Z</option>
                    </select>
                </div>
                <button
                    type="button"
                    onClick={() => refetch()}
                    className="text-[10px] text-neutral-600 hover:text-neutral-300 uppercase tracking-widest transition-colors duration-150 border border-neutral-800 px-2 py-1.5 hover:border-neutral-600"
                >
                    Refresh
                </button>
            </div>

            {/* Content */}
            {isLoadingResults && (
                <div className="p-12 text-center text-neutral-500">Loading results…</div>
            )}
            {error && !isLoadingResults && (
                <div className="p-12 text-center">
                    <p className="text-red-500 mb-2">Failed to load results</p>
                    <p className="text-xs text-neutral-500">{String(error)}</p>
                </div>
            )}
            {!isLoadingResults && !error && paginatedResults.length === 0 && (
                <div className="p-12 text-center text-neutral-500">
                    {activeSearch
                        ? `No results found for "${activeSearch}"`
                        : statusFilter === "all"
                          ? "No results recorded for this round yet."
                          : `No ${statusFilter.toLowerCase()} participants.`}
                </div>
            )}
            {!isLoadingResults && !error && paginatedResults.length > 0 && (
                <>
                    {/* Mobile */}
                    <div className="md:hidden divide-y divide-neutral-800 border border-neutral-800 bg-neutral-950 shadow-xl overflow-hidden">
                        {groupedResults.map(g => (
                            <ResultCardGroup key={g.id} members={g.members} />
                        ))}
                    </div>
                    {/* Desktop */}
                    <div className="hidden md:block border border-neutral-800 bg-neutral-950 overflow-hidden shadow-2xl mt-4">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-neutral-800 bg-neutral-900/60">
                                        {participationType?.toUpperCase() === "SOLO" ? (
                                            <th
                                                colSpan={2}
                                                className="px-6 py-3 text-left text-[10px] font-semibold text-neutral-400 uppercase tracking-widest border-r border-neutral-800/60"
                                            >
                                                Participant Details
                                            </th>
                                        ) : (
                                            <>
                                                <th className="px-6 py-3 text-left text-[10px] font-semibold text-neutral-400 uppercase tracking-widest w-[200px] border-r border-neutral-800/60">
                                                    Entity
                                                </th>
                                                <th className="px-6 py-3 text-left text-[10px] font-semibold text-neutral-400 uppercase tracking-widest">
                                                    Participants
                                                </th>
                                            </>
                                        )}
                                        <th className="px-6 py-3 text-left text-[10px] font-semibold text-neutral-400 uppercase tracking-widest w-[240px] border-l border-neutral-800/60">
                                            Evaluation
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {groupedResults.map(g => (
                                        <ResultRowGroup
                                            key={g.id}
                                            members={g.members}
                                            participationType={participationType}
                                        />
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <TablePagination
                        page={page}
                        totalPages={totalPages}
                        total={totalCount}
                        pageLimit={limit}
                        onPrev={() => onSetPage(Math.max(0, page - 1))}
                        onNext={() => onSetPage(page + 1)}
                        onSetPage={onSetPage}
                        onSetLimit={onSetLimit}
                    />
                </>
            )}

            <ConfirmDialog
                open={showFlushConfirm}
                title="Flush Winners?"
                description="Are you sure you want to flush all assigned winners for this event? This will remove all prize allocations and cannot be undone."
                confirmLabel="Flush All"
                isPending={isFlushing}
                onConfirm={handleFlushWinners}
                onCancel={() => setShowFlushConfirm(false)}
            />
        </div>
    )
}
