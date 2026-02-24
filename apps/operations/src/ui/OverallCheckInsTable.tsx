import { NavArrowLeft, NavArrowRight } from "iconoir-react"
import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import type { Registration } from "@/api/registrations"
import { Button } from "@/ui/Button"
import { Input } from "@/ui/Input"

// ── Status Badge ──────────────────────────────────────────────────────────────

export function StatusBadge({ status }: { status: Registration["status"] }) {
    const styles = {
        pending: "bg-yellow-950/50 text-yellow-500 border-yellow-900",
        verified: "bg-green-950/50 text-green-500 border-green-900",
        rejected: "bg-red-950/50 text-red-500 border-red-900",
    }
    const labels = {
        pending: "Pending",
        verified: "Verified",
        rejected: "Rejected",
    }
    return (
        <span className={`inline-block px-2 py-1 text-xs font-medium border ${styles[status]}`}>
            {labels[status]}
        </span>
    )
}

// ── Overall Check-ins Table ───────────────────────────────────────────────────

type ApiShape = {
    registrations: {
        getOverallCheckIns: (params: { from?: number; limit?: number }) =>
            Promise<import("@/api/registrations").OverallCheckInsResponse>
    }
}

const LIMIT_OPTIONS = [10, 20, 50, 100]

export function OverallCheckInsTable({ api }: { api: ApiShape }) {
    const [limit, setLimit] = useState(20)
    const [page, setPage] = useState(1)
    const [pageInput, setPageInput] = useState("")
    const [search, setSearch] = useState("")
    const [searchInput, setSearchInput] = useState("")

    const isSearching = search.trim().length > 0
    const from = isSearching ? 0 : (page - 1) * limit
    const fetchLimit = isSearching ? 999999 : limit

    const { data, isLoading, error } = useQuery({
        queryKey: ["overall-checkins", from, fetchLimit, search],
        queryFn: () => api.registrations.getOverallCheckIns({ from, limit: fetchLimit }),
    })

    const allRows = data?.data ?? []
    const filteredRows = isSearching
        ? allRows.filter(r => {
            const q = search.toLowerCase()
            return (
                r.first_name.toLowerCase().includes(q) ||
                r.last_name.toLowerCase().includes(q) ||
                r.email.toLowerCase().includes(q) ||
                r.ph_no.toLowerCase().includes(q) ||
                r.college.toLowerCase().includes(q) ||
                r.degree.toLowerCase().includes(q) ||
                r.participant_id.toLowerCase().includes(q) ||
                r.checkedin_by.toLowerCase().includes(q)
            )
        })
        : allRows

    const totalItems = isSearching ? filteredRows.length : (data?.pagination.total ?? 0)
    const totalPages = Math.max(1, Math.ceil(totalItems / limit))
    const displayRows = isSearching
        ? filteredRows.slice((page - 1) * limit, page * limit)
        : filteredRows

    const applySearch = () => { setSearch(searchInput.trim()); setPage(1) }
    const clearSearch = () => { setSearchInput(""); setSearch(""); setPage(1) }
    const goToPage = (p: number) => setPage(Math.max(1, Math.min(p, totalPages)))

    const handlePageInputSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        const n = parseInt(pageInput, 10)
        if (!Number.isNaN(n)) goToPage(n)
        setPageInput("")
    }

    const formatDate = (d: string) => {
        try { return new Date(d).toLocaleString() } catch { return d }
    }

    return (
        <div className="bg-neutral-950 border border-neutral-800 space-y-0">
            {/* Header */}
            <div className="px-6 py-5 border-b border-neutral-800 space-y-4">
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <h3 className="text-lg font-semibold text-white">All Check-ins</h3>
                        <p className="text-sm text-neutral-500 mt-0.5">
                            {isLoading ? "Loading…" : `${totalItems} total check-ins`}
                        </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-neutral-500">Rows</span>
                        <select
                            value={limit}
                            onChange={e => { setLimit(Number(e.target.value)); setPage(1) }}
                            className="px-2 py-1.5 bg-neutral-900 border border-neutral-800 text-white text-sm focus:outline-none focus:ring-2 focus:ring-white"
                        >
                            {LIMIT_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Input
                        type="text"
                        placeholder="Search by name, email, college, ID…"
                        value={searchInput}
                        onChange={e => setSearchInput(e.target.value)}
                        onKeyDown={e => {
                            if (e.key === "Enter") { e.preventDefault(); applySearch() }
                            if (e.key === "Escape") clearSearch()
                        }}
                        className="flex-1"
                    />
                    <Button variant="primary" onClick={applySearch}>Search</Button>
                    {search && <Button variant="secondary" onClick={clearSearch}>Clear</Button>}
                </div>
            </div>

            {/* Body */}
            {isLoading ? (
                <div className="p-12 text-center text-neutral-500">Loading check-ins…</div>
            ) : error ? (
                <div className="p-12 text-center">
                    <p className="text-red-500 mb-2">Failed to load check-ins</p>
                    <p className="text-sm text-neutral-500">{String(error)}</p>
                </div>
            ) : displayRows.length === 0 ? (
                <div className="p-12 text-center text-neutral-500">
                    {search ? "No check-ins match your search." : "No check-ins yet."}
                </div>
            ) : (
                <>
                    {/* Mobile */}
                    <div className="md:hidden divide-y divide-neutral-800">
                        {displayRows.map(row => (
                            <div key={row.participant_id} className="p-4 space-y-2 hover:bg-neutral-900 transition-colors duration-150">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-medium text-white">{row.first_name} {row.last_name}</p>
                                        <p className="text-xs text-neutral-400">{row.participant_id}</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                                    {[
                                        ["Email", row.email],
                                        ["Phone", row.ph_no],
                                        ["College", row.college],
                                        ["Degree", row.degree],
                                        ["Checked in at", formatDate(row.checkedin_at)],
                                        ["Checked in by", row.checkedin_by],
                                    ].map(([label, val]) => (
                                        <div key={label}>
                                            <p className="text-neutral-500 uppercase tracking-wider">{label}</p>
                                            <p className="text-neutral-300 truncate">{val}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Desktop */}
                    <div className="hidden md:block overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-neutral-800">
                                    {["Participant ID", "Name", "Email", "Phone", "College", "Degree", "Checked in at", "Checked in by"].map(h => (
                                        <th key={h} className="px-6 py-4 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider whitespace-nowrap">
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-800">
                                {displayRows.map(row => (
                                    <tr key={row.participant_id} className="hover:bg-neutral-900 transition-colors duration-150">
                                        <td className="px-6 py-4 text-xs font-mono text-neutral-400 whitespace-nowrap">{row.participant_id}</td>
                                        <td className="px-6 py-4 text-sm text-white whitespace-nowrap">{row.first_name} {row.last_name}</td>
                                        <td className="px-6 py-4 text-sm text-neutral-400">{row.email}</td>
                                        <td className="px-6 py-4 text-sm text-neutral-400 whitespace-nowrap">{row.ph_no}</td>
                                        <td className="px-6 py-4 text-sm text-neutral-400 max-w-[200px] truncate">{row.college}</td>
                                        <td className="px-6 py-4 text-sm text-neutral-400 whitespace-nowrap">{row.degree}</td>
                                        <td className="px-6 py-4 text-sm text-neutral-400 whitespace-nowrap">{formatDate(row.checkedin_at)}</td>
                                        <td className="px-6 py-4 text-sm text-neutral-400">{row.checkedin_by}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}

            {/* Pagination */}
            {!isLoading && !error && totalItems > 0 && (
                <div className="px-6 py-4 border-t border-neutral-800 flex flex-wrap items-center justify-between gap-4">
                    <p className="text-sm text-neutral-500">
                        {isSearching
                            ? `${Math.min((page - 1) * limit + 1, totalItems)}–${Math.min(page * limit, totalItems)} of ${totalItems} results`
                            : `${(page - 1) * limit + 1}–${Math.min(page * limit, totalItems)} of ${totalItems} check-ins`}
                    </p>
                    <div className="flex items-center gap-2">
                        <button type="button" disabled={page === 1} onClick={() => goToPage(page - 1)}
                            className="p-1.5 border border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors duration-150"
                            aria-label="Previous page">
                            <NavArrowLeft className="w-4 h-4" />
                        </button>
                        <span className="text-sm text-neutral-400 px-1">Page {page} of {totalPages}</span>
                        <button type="button" disabled={page >= totalPages} onClick={() => goToPage(page + 1)}
                            className="p-1.5 border border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors duration-150"
                            aria-label="Next page">
                            <NavArrowRight className="w-4 h-4" />
                        </button>
                        <form onSubmit={handlePageInputSubmit} className="flex items-center gap-1.5 ml-2">
                            <span className="text-xs text-neutral-500">Go to</span>
                            <input
                                type="number" min={1} max={totalPages}
                                value={pageInput} onChange={e => setPageInput(e.target.value)}
                                placeholder="pg"
                                className="w-14 px-2 py-1 text-sm bg-neutral-900 border border-neutral-800 text-white text-center focus:outline-none focus:ring-2 focus:ring-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                            <Button variant="secondary" type="submit">Go</Button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
