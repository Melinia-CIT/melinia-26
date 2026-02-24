import { Trash, User, Trophy } from "iconoir-react"
import type { PrizeAssignmentRecord } from "@/api/events"

const PODIUM_META: Record<number, { medal: string; label: string; ringCls: string; bgCls: string; textCls: string; borderCls: string }> = {
    1: { medal: "🥇", label: "1st Place", ringCls: "ring-yellow-600/40", bgCls: "bg-yellow-950/30", textCls: "text-yellow-300", borderCls: "border-yellow-700/60" },
    2: { medal: "🥈", label: "2nd Place", ringCls: "ring-neutral-500/30", bgCls: "bg-neutral-800/30", textCls: "text-neutral-300", borderCls: "border-neutral-600/60" },
    3: { medal: "🥉", label: "3rd Place", ringCls: "ring-amber-700/30", bgCls: "bg-amber-950/20", textCls: "text-amber-500", borderCls: "border-amber-800/50" },
}

interface WinnersPodiumProps {
    winners: PrizeAssignmentRecord[]
    isLoading: boolean
    error: Error | null
    isFlushing: boolean
    onFlush: () => void
    onRefresh: () => void
}

export function WinnersPodium({ winners, isLoading, error, isFlushing, onFlush, onRefresh }: WinnersPodiumProps) {
    const sorted = [...winners]
        .sort((a, b) => a.prize_position - b.prize_position)
        .filter((w, _i, arr) => arr.findIndex(x => x.prize_position === w.prize_position) === _i)

    return (
        <div className="border-b border-neutral-800">
            <div className="flex items-center justify-between gap-3 px-4 md:px-6 py-3 bg-neutral-900/60 border-b border-neutral-800/60">
                <div className="flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-yellow-500" />
                    <span className="text-xs font-black text-white uppercase tracking-widest">Event Winners</span>
                </div>
                <div className="flex items-center gap-2">
                    <button type="button" onClick={onFlush} disabled={isFlushing}
                        className="inline-flex items-center gap-1.5 text-[10px] text-red-900/60 hover:text-red-500 uppercase tracking-widest transition-colors border border-red-950/20 px-2 py-1 hover:border-red-900/40">
                        <Trash className="w-3 h-3" />
                        {isFlushing ? "Flushing..." : "Flush Winners"}
                    </button>
                    <button type="button" onClick={onRefresh}
                        className="text-[10px] text-neutral-600 hover:text-neutral-300 uppercase tracking-widest transition-colors border border-neutral-800 px-2 py-1 hover:border-neutral-600">
                        Refresh
                    </button>
                </div>
            </div>

            {isLoading && (
                <div className="px-4 md:px-6 py-8 text-center text-[11px] text-neutral-600 uppercase tracking-widest animate-pulse">Loading winners…</div>
            )}
            {error && !isLoading && (
                <div className="px-4 md:px-6 py-6 text-center">
                    <p className="text-xs text-red-500">Failed to load winners</p>
                    <p className="text-[10px] text-neutral-600 mt-1">{String(error)}</p>
                </div>
            )}
            {!isLoading && !error && sorted.length === 0 && (
                <div className="px-4 md:px-6 py-8 text-center">
                    <p className="text-[11px] text-neutral-600 uppercase tracking-widest">No winners assigned yet</p>
                    <p className="text-[10px] text-neutral-700 mt-1">Use the Checked-In tab to assign podium positions.</p>
                </div>
            )}
            {!isLoading && !error && sorted.length > 0 && (
                <div className="px-4 md:px-6 py-5 grid grid-cols-1 md:grid-cols-3 gap-4">
                    {sorted.map(w => {
                        const meta = PODIUM_META[w.prize_position] ?? PODIUM_META[1]
                        return (
                            <div key={w.id} className={`relative border-2 ${meta.borderCls} ${meta.bgCls} ring-1 ${meta.ringCls} p-5 flex flex-col gap-3`}>
                                <div className="flex items-center gap-2">
                                    <span className="text-2xl leading-none">{meta.medal}</span>
                                    <span className={`text-[10px] font-black uppercase tracking-widest ${meta.textCls}`}>{meta.label}</span>
                                </div>
                                <div className="space-y-0.5">
                                    <div className="text-sm font-black text-white uppercase tracking-wide leading-tight">
                                        {w.team_id ? (w.team_name || "Unknown Team") : (w.participant_name || "Unknown Participant")}
                                    </div>
                                    {w.team_id && <div className="text-[10px] text-neutral-500 font-mono">{w.team_id}</div>}
                                </div>
                                <div className={`flex items-center gap-4 pt-3 border-t ${meta.borderCls}`}>
                                    <div>
                                        <div className="text-lg font-black text-white tabular-nums leading-none">{w.points}</div>
                                        <div className="text-[9px] text-neutral-600 uppercase tracking-widest font-bold mt-0.5">Points</div>
                                    </div>
                                    <div className="h-6 w-px bg-neutral-800/60" />
                                    <div>
                                        <div className={`text-lg font-black tabular-nums leading-none ${meta.textCls}`}>₹{w.reward_value.toLocaleString()}</div>
                                        <div className="text-[9px] text-neutral-600 uppercase tracking-widest font-bold mt-0.5">Prize</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1.5 text-[9px] text-neutral-700 uppercase tracking-widest font-bold">
                                    <User className="w-3 h-3 shrink-0" />
                                    {w.awarded_by}
                                </div>
                            </div>
                        )
                    })}
                    {([1, 2, 3] as const).filter(pos => !sorted.find(w => w.prize_position === pos)).map(pos => {
                        const meta = PODIUM_META[pos]
                        return (
                            <div key={`empty-${pos}`} className="border border-neutral-800 p-5 flex flex-col gap-3 opacity-40">
                                <div className="flex items-center gap-2">
                                    <span className="text-2xl leading-none grayscale">{meta.medal}</span>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-neutral-600">{meta.label}</span>
                                </div>
                                <div className="text-[10px] text-neutral-700 uppercase tracking-widest">Not yet assigned</div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
