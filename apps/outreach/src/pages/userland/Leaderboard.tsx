import { useEffect, useMemo, useRef, useState } from "react"
import { Spark, Xmark } from "iconoir-react"
import katex from "katex"
import "katex/dist/katex.min.css"
import apiClient from "../../lib/axios"

type LeaderboardRow = {
    college_id: number
    college_name: string
    total_points: number
    participant_count: number
    avg_points_per_user: number
    rank: number
}

type LeaderboardPayload = {
    data: LeaderboardRow[]
    pagination: {
        from: number
        limit: number
        total: number
        returned: number
        has_more: boolean
    }
}

type StreamState = {
    rows: LeaderboardRow[]
    pagination: LeaderboardPayload["pagination"] | null
    status: "connecting" | "live" | "error"
    lastUpdatedAt: number | null
}

const useLeaderboardStream = (enabled: boolean) => {
    const [state, setState] = useState<StreamState>({
        rows: [],
        pagination: null,
        status: "connecting",
        lastUpdatedAt: null,
    })

    const eventSourceRef = useRef<EventSource | null>(null)
    const retryTimerRef = useRef<number | null>(null)
    const backoffRef = useRef(500)
    const pendingPayloadRef = useRef<LeaderboardPayload | null>(null)
    const flushTimerRef = useRef<number | null>(null)

    useEffect(() => {
        if (!enabled) {
            setState(prev => ({ ...prev, status: "connecting" }))
            return
        }
        const baseUrl =
            (apiClient.defaults.baseURL as string | undefined) ||
            import.meta.env.VITE_API_BASE_URL ||
            "http://localhost:3000/api/v1"
        const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`
        const url = new URL("colleges/leaderboard", normalizedBase)
        url.searchParams.set("from", "0")
        url.searchParams.set("limit", "200")

        const closeStream = () => {
            if (eventSourceRef.current) {
                eventSourceRef.current.close()
                eventSourceRef.current = null
            }
        }

        const clearTimers = () => {
            if (retryTimerRef.current) {
                window.clearTimeout(retryTimerRef.current)
                retryTimerRef.current = null
            }
            if (flushTimerRef.current) {
                window.clearTimeout(flushTimerRef.current)
                flushTimerRef.current = null
            }
        }

        const scheduleFlush = () => {
            if (flushTimerRef.current) return
            flushTimerRef.current = window.setTimeout(() => {
                flushTimerRef.current = null
                if (!pendingPayloadRef.current) return
                const payload = pendingPayloadRef.current
                pendingPayloadRef.current = null
                setState(prev => ({
                    ...prev,
                    rows: payload.data,
                    pagination: payload.pagination,
                    status: "live",
                    lastUpdatedAt: Date.now(),
                }))
            }, 200)
        }

        const connect = () => {
            closeStream()
            setState(prev => ({ ...prev, status: "connecting" }))

            const source = new EventSource(url.toString(), { withCredentials: true })
            eventSourceRef.current = source

            source.addEventListener("leaderboard", event => {
                try {
                    const payload = JSON.parse((event as MessageEvent).data) as LeaderboardPayload
                    pendingPayloadRef.current = payload
                    scheduleFlush()
                    backoffRef.current = 500
                } catch {
                    setState(prev => ({ ...prev, status: "error" }))
                }
            })

            source.addEventListener("error", () => {
                closeStream()
                setState(prev => ({ ...prev, status: "error" }))
                retryTimerRef.current = window.setTimeout(() => {
                    backoffRef.current = Math.min(backoffRef.current * 2, 5000)
                    connect()
                }, backoffRef.current)
            })
        }

        const handleVisibility = () => {
            if (document.visibilityState === "hidden") {
                closeStream()
            } else {
                connect()
            }
        }

        connect()
        document.addEventListener("visibilitychange", handleVisibility)

        return () => {
            document.removeEventListener("visibilitychange", handleVisibility)
            clearTimers()
            closeStream()
        }
    }, [enabled])

    return state
}

const renderLatex = (latex: string) => {
    try {
        return katex.renderToString(latex, {
            throwOnError: false,
            displayMode: true,
        })
    } catch {
        return latex
    }
}

const Leaderboard = () => {
    const targetTime = useMemo(() => new Date("2026-02-25T09:00:00+05:30"), [])
    const [now, setNow] = useState(() => new Date())
    const forceLeaderboard = import.meta.env.VITE_FORCE_LEADERBOARD === "true"
    const showLeaderboard = forceLeaderboard || now >= targetTime
    const { rows, pagination, status, lastUpdatedAt } = useLeaderboardStream(showLeaderboard)
    const [tooltip, setTooltip] = useState<{
        id: number | null
        x: number
        y: number
        locked: boolean
    }>({ id: null, x: 0, y: 0, locked: false })
    const [showInfoModal, setShowInfoModal] = useState(false)

    useEffect(() => {
        if (forceLeaderboard || showLeaderboard) return
        const timer = window.setInterval(() => setNow(new Date()), 1000)
        return () => window.clearInterval(timer)
    }, [])

    useEffect(() => {
        const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
            const target = e.target as HTMLElement
            if (!target.closest("button")) {
                setTooltip(prev => (prev.locked ? { ...prev, id: null, locked: false } : prev))
            }
        }
        document.addEventListener("click", handleOutsideClick)
        document.addEventListener("touchend", handleOutsideClick)
        return () => {
            document.removeEventListener("click", handleOutsideClick)
            document.removeEventListener("touchend", handleOutsideClick)
        }
    }, [])

    const topThree = rows.slice(0, 3)
    const rest = rows.slice(3)

    const maxPoints = useMemo(() => {
        return topThree.reduce((max, row) => Math.max(max, row.avg_points_per_user), 1)
    }, [topThree])

    const statusTone =
        status === "live"
            ? "text-emerald-400"
            : status === "error"
              ? "text-amber-300"
              : "text-zinc-400"
    const dotTone =
        status === "live" ? "bg-emerald-400" : status === "error" ? "bg-amber-300" : "bg-zinc-500"

    const diffMs = Math.max(0, targetTime.getTime() - now.getTime())
    const totalSeconds = Math.floor(diffMs / 1000)
    const days = Math.floor(totalSeconds / 86400)
    const hours = Math.floor((totalSeconds % 86400) / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60

    return (
        <div className="flex-1 w-full text-white font-geist">
            <div className="relative">
                <div className="absolute inset-0 -z-10 opacity-40">
                    <div className="absolute -top-16 -left-10 h-60 w-60 rounded-full bg-gradient-to-br from-pink-500/30 via-orange-300/10 to-transparent blur-3xl" />
                    <div className="absolute top-24 right-0 h-72 w-72 rounded-full bg-gradient-to-br from-cyan-400/30 via-blue-500/10 to-transparent blur-3xl" />
                </div>

                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl md:text-3xl font-inst tracking-wide">
                            Leaderboard
                        </h1>
                        <button
                            type="button"
                            onClick={() => setShowInfoModal(true)}
                            className="px-2 py-1 rounded-md border border-zinc-400 bg-zinc-800/40 text-[10px] text-zinc-200 hover:text-zinc-200 hover:border-zinc-500 hover:bg-zinc-700/50 transition-all font-sans"
                        >
                            How it works?
                        </button>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-zinc-400">
                        {showLeaderboard ? (
                            <>
                                <span className={`flex items-center gap-2 ${statusTone}`}>
                                    <span className="relative flex h-2 w-2">
                                        <span
                                            className={`absolute inline-flex h-full w-full animate-ping rounded-full ${dotTone} opacity-60`}
                                        />
                                        <span
                                            className={`relative inline-flex h-2 w-2 rounded-full ${dotTone}`}
                                        />
                                    </span>
                                    {status === "connecting"
                                        ? "Connecting"
                                        : status === "error"
                                          ? "Reconnecting"
                                          : "Live"}
                                </span>
                                {lastUpdatedAt && (
                                    <span>
                                        · Updated {new Date(lastUpdatedAt).toLocaleTimeString()}
                                    </span>
                                )}
                            </>
                        ) : (
                            <span className="text-grey-300">Opens Feb 25, 8:00 AM IST</span>
                        )}
                    </div>
                </div>

                {!showLeaderboard ? (
                    <section className="min-h-[80vh] flex items-center justify-center">
                        <div className="flex flex-col items-center justify-center text-center py-10">
                            <div className="mt-6 flex items-end justify-center gap-1 md:gap-2 font-inst">
                                {[
                                    { value: days, label: "Days" },
                                    { value: hours, label: "Hours" },
                                    { value: minutes, label: "Mins" },
                                    { value: seconds, label: "Secs" },
                                ].map((item, index) => (
                                    <div key={item.label} className="flex items-center gap-2">
                                        <span className="text-4xl md:text-6xl tracking-tight w-16 md:w-20 text-center">
                                            {String(item.value).padStart(2, "0")}
                                        </span>
                                        {index < 3 && (
                                            <span className="text-xl md:text-2xl text-zinc-500 pb-1">
                                                :
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                            <div className="mt-4 flex items-center justify-center gap-5 text-[10px] md:text-xs uppercase tracking-[0.3em] text-zinc-400 font-inst">
                                <span className="w-16 md:w-20 text-center">Days</span>
                                <span className="w-16 md:w-20 text-center">Hours</span>
                                <span className="w-16 md:w-20 text-center">Mins</span>
                                <span className="w-16 md:w-20 text-center">Secs</span>
                            </div>
                        </div>
                    </section>
                ) : (
                    <section className="mb-10">
                        <div className="rounded-2xl border-2 border-dashed border-white/15 bg-zinc-900/60 p-5 shadow-lg">
                            <div className="flex items-center justify-between">
                                <span className="text-xs uppercase tracking-widest text-zinc-400">
                                    Top 3
                                </span>
                                <Spark className="text-zinc-400" width={18} height={18} />
                            </div>

                            <div className="mt-5 grid grid-cols-3 gap-4">
                                {topThree.length === 0
                                    ? [0, 1, 2].map(index => (
                                          <div
                                              key={`skeleton-${index}`}
                                              className="h-48 rounded-xl border border-white/10 bg-zinc-900/50 animate-pulse"
                                          />
                                      ))
                                    : topThree.map((row, index) => {
                                          const height = Math.max(
                                              20,
                                              Math.round(
                                                  (row.avg_points_per_user / maxPoints) * 160
                                              )
                                          )
                                          const colors = [
                                              "from-[#FFD700]/90 via-[#FFC04D]/70 to-[#FFE57A]/80",
                                              "from-[#C0C0C0]/90 via-[#D6D6D6]/70 to-[#F2F2F2]/80",
                                              "from-[#E8B4B8]/90 via-[#D79AA0]/70 to-[#F3C7CB]/80",
                                          ]
                                          return (
                                              <div
                                                  key={row.college_id}
                                                  className="flex flex-col items-center gap-3"
                                              >
                                                  <div className="text-xs text-zinc-400">
                                                      #{row.rank}
                                                  </div>
                                                  <div className="h-44 flex items-end w-full">
                                                      <button
                                                          type="button"
                                                          className="relative w-full group"
                                                          onMouseEnter={event =>
                                                              setTooltip({
                                                                  id: row.college_id,
                                                                  x: event.clientX,
                                                                  y: event.clientY,
                                                                  locked: false,
                                                              })
                                                          }
                                                          onMouseMove={event =>
                                                              setTooltip(prev =>
                                                                  prev.id === row.college_id &&
                                                                  !prev.locked
                                                                      ? {
                                                                            ...prev,
                                                                            x: event.clientX,
                                                                            y: event.clientY,
                                                                        }
                                                                      : prev
                                                              )
                                                          }
                                                          onMouseLeave={() =>
                                                              setTooltip(prev =>
                                                                  prev.locked
                                                                      ? prev
                                                                      : { ...prev, id: null }
                                                              )
                                                          }
                                                          onClick={event =>
                                                              setTooltip(prev =>
                                                                  prev.id === row.college_id &&
                                                                  prev.locked
                                                                      ? {
                                                                            ...prev,
                                                                            id: null,
                                                                            locked: false,
                                                                        }
                                                                      : {
                                                                            id: row.college_id,
                                                                            x: event.clientX,
                                                                            y: event.clientY,
                                                                            locked: true,
                                                                        }
                                                              )
                                                          }
                                                      >
                                                          <div
                                                              className={`mx-auto w-4/5 rounded-xl bg-gradient-to-b ${colors[index]} border border-white/20 shadow-[0_0_20px_rgba(255,255,255,0.1)]`}
                                                              style={{ height }}
                                                          />
                                                          <div className="absolute inset-0 mx-auto w-4/5 rounded-xl pointer-events-none bg-[repeating-linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.08)_6px,transparent_6px,transparent_12px)]" />
                                                      </button>
                                                  </div>
                                                  <div className="text-center">
                                                      <div className="text-sm font-semibold text-white line-clamp-2 min-h-[40px]">
                                                          {row.college_name}
                                                      </div>
                                                      <div className="text-xs text-zinc-400">
                                                          {row.avg_points_per_user} pts
                                                      </div>
                                                  </div>
                                              </div>
                                          )
                                      })}
                            </div>
                        </div>
                    </section>
                )}

                {showLeaderboard && (
                    <section className="rounded-2xl border border-white/10 bg-zinc-900/60">
                        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                            <h2 className="text-lg font-semibold">All rankings</h2>
                            {pagination && (
                                <span className="text-xs text-zinc-400">
                                    Showing {pagination.returned} of {pagination.total}
                                </span>
                            )}
                        </div>
                        <div className="divide-y divide-white/5">
                            {rest.length === 0 && topThree.length > 0 ? (
                                <div className="px-4 py-6 text-sm text-zinc-400">
                                    No more colleges yet
                                </div>
                            ) : rest.length === 0 ? (
                                <div className="px-4 py-6 text-sm text-zinc-400">
                                    Loading leaderboard
                                </div>
                            ) : (
                                rest.map(row => (
                                    <div key={row.college_id} className="px-4 py-3">
                                        <button
                                            type="button"
                                            className="relative w-full flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-left group"
                                            onMouseEnter={event =>
                                                setTooltip({
                                                    id: row.college_id,
                                                    x: event.clientX,
                                                    y: event.clientY,
                                                    locked: false,
                                                })
                                            }
                                            onMouseMove={event =>
                                                setTooltip(prev =>
                                                    prev.id === row.college_id && !prev.locked
                                                        ? {
                                                              ...prev,
                                                              x: event.clientX,
                                                              y: event.clientY,
                                                          }
                                                        : prev
                                                )
                                            }
                                            onMouseLeave={() =>
                                                setTooltip(prev =>
                                                    prev.locked ? prev : { ...prev, id: null }
                                                )
                                            }
                                            onClick={event =>
                                                setTooltip(prev =>
                                                    prev.id === row.college_id && prev.locked
                                                        ? { ...prev, id: null, locked: false }
                                                        : {
                                                              id: row.college_id,
                                                              x: event.clientX,
                                                              y: event.clientY,
                                                              locked: true,
                                                          }
                                                )
                                            }
                                        >
                                            <div className="flex items-center gap-3 min-w-0 sm:flex-1">
                                                <span className="text-sm text-zinc-400 w-10">
                                                    #{row.rank}
                                                </span>
                                                <span className="text-sm text-white truncate hidden sm:block">
                                                    {row.college_name}
                                                </span>
                                            </div>
                                            <div className="text-sm text-zinc-300">
                                                {row.avg_points_per_user} pts
                                            </div>
                                            <span className="text-sm text-white truncate sm:hidden">
                                                {row.college_name}
                                            </span>
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </section>
                )}
            </div>
            {tooltip.id && (
                <div
                    className="fixed z-50 rounded-xl border border-white/15 bg-zinc-950/95 px-3 py-2 text-xs text-zinc-200 shadow-xl pointer-events-none"
                    style={{ left: tooltip.x + 12, top: tooltip.y + 12 }}
                >
                    <div className="whitespace-nowrap">
                        Avg pts/user:{" "}
                        {rows.find(row => row.college_id === tooltip.id)?.avg_points_per_user}
                    </div>
                    <div className="whitespace-nowrap">
                        Participants:{" "}
                        {rows.find(row => row.college_id === tooltip.id)?.participant_count}
                    </div>
                    <div className="whitespace-nowrap">
                        Total: {rows.find(row => row.college_id === tooltip.id)?.total_points}
                    </div>
                </div>
            )}

            {showInfoModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
                    <button
                        type="button"
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm cursor-default"
                        onClick={() => setShowInfoModal(false)}
                        aria-label="Close modal"
                    />
                    <div
                        className="relative bg-zinc-900 rounded-2xl p-4 sm:p-6 max-w-lg w-full max-h-[85dvh] overflow-hidden overflow-y-auto shadow-2xl border border-zinc-800"
                        onClick={e => e.stopPropagation()}
                        onKeyDown={e => e.key === "Escape" && setShowInfoModal(false)}
                        role="dialog"
                        aria-modal="true"
                        tabIndex={-1}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-semibold text-white font-inst">
                                How Rankings Work
                            </h2>
                            <button
                                type="button"
                                onClick={() => setShowInfoModal(false)}
                                className="text-zinc-400 hover:text-white transition-colors"
                                aria-label="Close"
                            >
                                <Xmark className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={2} />
                            </button>
                        </div>
                        <div className="space-y-4 text-sm text-zinc-300 ">
                            <p>
                                Colleges are ranked by{" "}
                                <span className="text-white font-medium">Avg Points per User</span>{" "}
                                - the average points earned by each participant from respective
                                college.
                            </p>
                            <div className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-700/50">
                                <h3 className="text-white font-medium mb-3">Points Rubric</h3>
                                <div className="space-y-2 text-xs">
                                    <div className="flex justify-between">
                                        <span className="text-zinc-400">1st Prize</span>
                                        <span className="text-white">100 pts</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-zinc-400">2nd Prize</span>
                                        <span className="text-white">75 pts</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-zinc-400">3rd Prize</span>
                                        <span className="text-white">50 pts</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-zinc-400">Qualification</span>
                                        <span className="text-white">20 pts</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-zinc-400">
                                            Elimination (Participation)
                                        </span>
                                        <span className="text-white">10 pts</span>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-zinc-950 rounded-xl p-4 space-y-6 font-mono">
                                <div className="text-zinc-500 mb-2">Total Points</div>
                                <div
                                    className=" text-base text-zinc-200 overflow-x-auto"
                                    dangerouslySetInnerHTML={{
                                        __html: renderLatex("P = \\sum_{i=1}^{n} p_i"),
                                    }}
                                />
                                <div className="text-zinc-500 mt-1">
                                    Sum of all points from all participants
                                </div>
                                <div className="text-zinc-500 mb-2">Participant Count</div>
                                <div
                                    className="text-base text-zinc-200 overflow-x-auto"
                                    dangerouslySetInnerHTML={{
                                        __html: renderLatex(
                                            "N = \\left| \\{ p_i \\mid p_i > 0 \\} \\right|"
                                        ),
                                    }}
                                />
                                <div className="text-zinc-500 mt-1">
                                    Number of users who scored at least once
                                </div>
                                <div className="text-zinc-500 mb-2 ">Avg Points per User</div>
                                <div
                                    className=" text-base text-zinc-200 overflow-x-auto"
                                    dangerouslySetInnerHTML={{
                                        __html: renderLatex(
                                            "\\mu = \\frac{P}{N} = \\operatorname{round}\\left(\\frac{P}{N}, 2\\right)"
                                        ),
                                    }}
                                />
                                <div className="text-zinc-500 mt-1">
                                    Fair score: total points ÷ participants (rounded to 2 decimals)
                                </div>
                                <div className="text-zinc-500 mb-2">Rank</div>
                                <div
                                    className=" text-base text-zinc-200 overflow-x-auto"
                                    dangerouslySetInnerHTML={{
                                        __html: renderLatex(
                                            "\\operatorname{rank} = \\operatorname{DENSE\\\_RANK}(\\mu \\text{ DESC})"
                                        ),
                                    }}
                                />
                                <div className="text-zinc-500 mt-1">
                                    Dense rank ordered by avg_points_per_user descending
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Leaderboard
