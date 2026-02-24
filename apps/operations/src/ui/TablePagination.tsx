import { Group, NavArrowLeft, NavArrowRight, User } from "iconoir-react"
import { useState } from "react"

// ── Type Badge ────────────────────────────────────────────────────────────────

export function TypeBadge({ type }: { type: "TEAM" | "SOLO" }) {
    if (type === "TEAM") {
        return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider border border-blue-800 bg-blue-950/50 text-blue-400 w-fit">
                <Group className="w-2.5 h-2.5" />
                Team
            </span>
        )
    }
    return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider border border-blue-800 bg-blue-950/50 text-blue-400 w-fit">
            <User className="w-2.5 h-2.5" />
            Solo
        </span>
    )
}

// ── Table Pagination ──────────────────────────────────────────────────────────

export interface TablePaginationProps {
    page: number
    totalPages: number
    total: number
    pageLimit: number
    onPrev: () => void
    onNext: () => void
    onSetPage?: (page: number) => void
    onSetLimit?: (limit: number) => void
    limitOptions?: number[]
}

export function TablePagination({
    page,
    totalPages,
    total,
    pageLimit,
    onPrev,
    onNext,
    onSetPage,
    onSetLimit,
    limitOptions = [10, 20, 50, 100],
}: TablePaginationProps) {
    const from = total === 0 ? 0 : page * pageLimit + 1
    const to = Math.min((page + 1) * pageLimit, total)
    const [gotoInput, setGotoInput] = useState("")

    const renderPageNumbers = () => {
        if (!onSetPage || totalPages <= 1) return null

        const pages: (number | string)[] = []

        if (totalPages <= 7) {
            for (let i = 0; i < totalPages; i++) pages.push(i)
        } else {
            if (page < 3) {
                pages.push(0, 1, 2, 3, "...", totalPages - 1)
            } else if (page > totalPages - 4) {
                pages.push(0, "...", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1)
            } else {
                pages.push(0, "...", page - 1, page, page + 1, "...", totalPages - 1)
            }
        }

        return (
            <div className="flex items-center gap-1 hidden sm:flex">
                {pages.map((p, i) => {
                    if (p === "...") {
                        return (
                            <span
                                key={`ellipsis-${i}`}
                                className="px-2 text-[10px] text-neutral-600"
                            >
                                ...
                            </span>
                        )
                    }
                    const isCurrent = p === page
                    return (
                        <button
                            key={p}
                            type="button"
                            onClick={() => onSetPage(p as number)}
                            className={`min-w-[28px] h-[28px] flex items-center justify-center text-[10px] font-bold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white border ${isCurrent
                                ? "bg-white text-black border-white"
                                : "border-neutral-800 text-neutral-400 bg-transparent hover:bg-neutral-900 hover:text-white"
                                }`}
                        >
                            {(p as number) + 1}
                        </button>
                    )
                })}
            </div>
        )
    }

    const handleGotoPage = () => {
        if (!onSetPage) return
        const pageNum = parseInt(gotoInput, 10)
        if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
            onSetPage(pageNum - 1)
            setGotoInput("")
        }
    }

    return (
        <div className="px-6 py-3 border-t border-neutral-800 bg-neutral-950 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
                <span className="text-[10px] text-neutral-600 uppercase tracking-widest font-mono">
                    {total === 0 ? "No results" : `${from}–${to} of ${total} entries`}
                </span>
                {onSetLimit && (
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] text-neutral-600 uppercase tracking-widest">
                            Per page
                        </span>
                        <select
                            value={pageLimit}
                            onChange={e => {
                                onSetLimit(parseInt(e.target.value, 10))
                                onSetPage?.(0)
                            }}
                            className="bg-neutral-950 border border-neutral-800 text-neutral-400 text-[10px] uppercase tracking-widest px-2 py-1 focus:outline-none focus:border-neutral-600"
                        >
                            {limitOptions.map(opt => (
                                <option key={opt} value={opt}>
                                    {opt}
                                </option>
                            ))}
                        </select>
                    </div>
                )}
            </div>
            {total > 0 && (
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={onPrev}
                        disabled={page === 0}
                        className="inline-flex items-center gap-1 px-2 py-1.5 text-[10px] font-bold uppercase tracking-widest border border-neutral-800 text-neutral-500 hover:bg-neutral-900 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-colors duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white"
                    >
                        <NavArrowLeft className="w-3.5 h-3.5" />
                        Prev
                    </button>

                    {renderPageNumbers()}

                    <button
                        type="button"
                        onClick={onNext}
                        disabled={page >= totalPages - 1}
                        className="inline-flex items-center gap-1 px-2 py-1.5 text-[10px] font-bold uppercase tracking-widest border border-neutral-800 text-neutral-500 hover:bg-neutral-900 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-colors duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white"
                    >
                        Next
                        <NavArrowRight className="w-3.5 h-3.5" />
                    </button>

                    {onSetPage && totalPages > 1 && (
                        <div className="flex items-center gap-1 ml-2">
                            <span className="text-[10px] text-neutral-600 uppercase tracking-widest">
                                Go to
                            </span>
                            <input
                                type="number"
                                min={1}
                                max={totalPages}
                                value={gotoInput}
                                onChange={e => setGotoInput(e.target.value)}
                                onKeyDown={e => {
                                    if (e.key === "Enter") {
                                        e.preventDefault()
                                        handleGotoPage()
                                    }
                                }}
                                onBlur={handleGotoPage}
                                placeholder={String(page + 1)}
                                className="w-14 bg-neutral-950 border border-neutral-800 text-neutral-400 text-[10px] px-2 py-1 focus:outline-none focus:border-neutral-600 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
