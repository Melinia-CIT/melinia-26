import { User } from "iconoir-react"
import type { RoundResultWithParticipant } from "@/api/events"
import { TypeBadge } from "./TablePagination"

const STATUS_COLOR: Record<string, string> = {
    QUALIFIED: "text-emerald-400 border-emerald-800 bg-emerald-950/40",
    ELIMINATED: "text-amber-400 border-amber-800 bg-amber-950/40",
    DISQUALIFIED: "text-red-400 border-red-900 bg-red-950/40",
}
const DOT_COLOR: Record<string, string> = {
    QUALIFIED: "bg-emerald-400",
    ELIMINATED: "bg-amber-400",
    DISQUALIFIED: "bg-red-400",
}

// ── Desktop row group ─────────────────────────────────────────────────────────

export function ResultRowGroup({
    members,
    participationType,
}: {
    members: RoundResultWithParticipant[]
    participationType?: string
}) {
    const first = members[0]
    const s = first.status

    return (
        <>
            {members.map((r, idx) => (
                <tr
                    key={r.id}
                    className={`hover:bg-neutral-900/20 transition-colors duration-150 border-b border-neutral-800/60 last:border-0 ${idx === 0 ? "" : "border-t-0"}`}
                >
                    {participationType?.toUpperCase() === "SOLO" ? (
                        idx === 0 && (
                            <td colSpan={2} className="px-6 py-6 align-top bg-neutral-950/10 border-r border-neutral-800/60">
                                <div className="flex items-center gap-6">
                                    <div className="flex flex-col items-center justify-center space-y-1.5 min-w-[70px]">
                                        <TypeBadge type="SOLO" />
                                        <div className="text-[10px] text-neutral-500 font-medium uppercase tracking-tight">Individual</div>
                                    </div>
                                    <div className="h-10 w-px bg-neutral-800/40" />
                                    <div className="flex flex-col">
                                        <div className="text-sm font-bold text-white uppercase tracking-wider leading-tight">{r.name}</div>
                                        <div className="flex items-center gap-3 mt-1.5">
                                            <span className="text-[10px] text-neutral-500 font-mono uppercase">{r.user_id}</span>
                                            <span className="w-1 h-1 rounded-full bg-neutral-800" />
                                            <span className="text-[10px] text-emerald-500/80 font-mono font-medium">{r.ph_no}</span>
                                        </div>
                                    </div>
                                </div>
                            </td>
                        )
                    ) : (
                        <>
                            {idx === 0 && (
                                <td className="px-6 py-6 align-top bg-neutral-950/10 border-r border-neutral-800/60" rowSpan={members.length}>
                                    <div className="flex flex-col gap-4 sticky top-4">
                                        {first.team_id ? (
                                            <div className="space-y-1.5">
                                                <TypeBadge type="TEAM" />
                                                <div className="text-sm font-black text-white uppercase tracking-widest leading-none">{first.team_name ?? first.team_id}</div>
                                                <div className="text-[10px] text-neutral-600 font-mono tracking-tight">{first.team_id}</div>
                                            </div>
                                        ) : (
                                            <div className="space-y-1.5">
                                                <TypeBadge type="SOLO" />
                                                <div className="text-[10px] text-neutral-500 font-medium uppercase tracking-tight">Individual Entry</div>
                                            </div>
                                        )}
                                    </div>
                                </td>
                            )}
                            <td className="px-6 py-5 align-top">
                                <div className="flex flex-col">
                                    <div className="text-sm font-semibold text-neutral-200">{r.name}</div>
                                    <div className="flex items-center gap-3 mt-1.5">
                                        <span className="text-[10px] text-neutral-500 font-mono uppercase">{r.user_id}</span>
                                        <span className="w-1 h-1 rounded-full bg-neutral-800" />
                                        <span className="text-[10px] text-emerald-500/80 font-mono font-medium">{r.ph_no}</span>
                                    </div>
                                </div>
                            </td>
                        </>
                    )}

                    {idx === 0 && (
                        <td className="px-6 py-6 align-top bg-neutral-950/30 border-l border-neutral-800/60" rowSpan={members.length}>
                            <div className="flex flex-col gap-4 sticky top-4">
                                <div className="flex items-center gap-3 py-3 border-b border-neutral-800/50">
                                    <div className="shrink-0">
                                        <div className="text-xl font-black text-white tabular-nums leading-none">{first.points}</div>
                                        <div className="text-[9px] text-neutral-600 uppercase tracking-widest font-bold mt-1">Points</div>
                                    </div>
                                    <div className="h-8 w-px bg-neutral-800/50" />
                                    <span className={`inline-flex items-center gap-1.5 px-2 py-1 text-[10px] font-bold uppercase tracking-widest border ${STATUS_COLOR[s] ?? "border-neutral-700 text-neutral-400"}`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${DOT_COLOR[s] ?? "bg-neutral-400"}`} />
                                        {s}
                                    </span>
                                </div>
                                <div className="space-y-1">
                                    <div className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest flex items-center gap-2">
                                        <User className="w-3.5 h-3.5 text-neutral-700" />
                                        {first.eval_by}
                                    </div>
                                    <div className="text-[10px] text-neutral-600 font-mono pl-5">
                                        {new Date(first.eval_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true }).toUpperCase()}
                                    </div>
                                </div>
                            </div>
                        </td>
                    )}
                </tr>
            ))}
        </>
    )
}

// ── Mobile card group ─────────────────────────────────────────────────────────

export function ResultCardGroup({ members }: { members: RoundResultWithParticipant[] }) {
    const CARD_STATUS_COLOR: Record<string, string> = {
        QUALIFIED: "text-emerald-400",
        ELIMINATED: "text-amber-400",
        DISQUALIFIED: "text-red-400",
    }
    const first = members[0]

    return (
        <div className="p-5 space-y-6">
            <div className="flex items-start justify-between gap-4">
                <div className="space-y-2 flex-1">
                    {first.team_id ? (
                        <>
                            <TypeBadge type="TEAM" />
                            <div className="text-base font-black text-white uppercase tracking-widest leading-tight">{first.team_name ?? first.team_id}</div>
                            <div className="text-[10px] text-neutral-600 font-mono tracking-tighter">{first.team_id}</div>
                        </>
                    ) : (
                        <div className="space-y-2">
                            <TypeBadge type="SOLO" />
                            <div className="text-sm font-black text-white uppercase tracking-widest">Individual Result</div>
                        </div>
                    )}
                </div>
                <div className="text-right shrink-0">
                    <div className="text-[9px] font-bold uppercase tracking-widest text-neutral-600 mb-1">Raw Score</div>
                    <div className="text-2xl font-black text-white tabular-nums leading-none tracking-tighter">{first.points}</div>
                    <div className={`text-[10px] font-black uppercase tracking-widest mt-2 px-1.5 py-0.5 border ${CARD_STATUS_COLOR[first.status] ? "border-current opacity-90" : "border-neutral-800 text-neutral-500"} ${CARD_STATUS_COLOR[first.status] ?? ""}`}>
                        {first.status}
                    </div>
                </div>
            </div>

            <div className="space-y-5 pl-4 border-l-2 border-neutral-900">
                <div className="text-[9px] font-bold uppercase tracking-[0.2em] text-neutral-700">
                    {members.length === 1 ? "PARTICIPANT" : `MEMBERS (${members.length})`}
                </div>
                <div className="space-y-4">
                    {members.map(m => (
                        <div key={m.id} className="group">
                            <div className="flex items-center justify-between gap-3">
                                <div className="text-xs font-bold text-neutral-200">{m.name}</div>
                                <div className="text-[10px] text-emerald-500/60 font-mono font-medium">{m.ph_no}</div>
                            </div>
                            <div className="text-[10px] text-neutral-600 font-mono mt-0.5 uppercase tracking-tighter">{m.user_id}</div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex flex-col gap-1 pt-4 border-t border-neutral-800/50">
                <div className="flex items-center gap-2 text-[10px] text-neutral-500 font-bold uppercase tracking-widest">
                    <User className="w-3.5 h-3.5 text-neutral-800" />
                    Evaluated by {first.eval_by}
                </div>
                <div className="text-[10px] text-neutral-700 font-mono pl-5 italic">
                    {new Date(first.eval_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true }).toUpperCase()}
                </div>
            </div>
        </div>
    )
}
