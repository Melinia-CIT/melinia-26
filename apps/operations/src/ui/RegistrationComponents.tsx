import { Clock } from "iconoir-react"
import { Link } from "@tanstack/react-router"
import type { EventDetail, EventRegistration } from "@/api/events"
import { TypeBadge } from "./TablePagination"

// ── helpers ───────────────────────────────────────────────────────────────────

function fmtTime(date: string | Date) {
    return new Date(date)
        .toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
        })
        .toUpperCase()
}

// ── Round Card ────────────────────────────────────────────────────────────────

export function RoundCard({
    round,
    eventId,
}: {
    round: EventDetail["rounds"][number]
    eventId: string
}) {
    return (
        <Link
            to="/app/events/$eventId/$roundNo"
            params={{ eventId, roundNo: round.round_no.toString() }}
            className="bg-neutral-950 border border-neutral-800 p-5 space-y-4 relative overflow-hidden group block hover:border-neutral-600 hover:bg-neutral-900 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
            <div
                className="absolute top-0 right-0 p-3 text-[48px] font-black leading-none pointer-events-none select-none italic transition-all duration-300 opacity-20 group-hover:opacity-40"
                style={{
                    WebkitTextStroke: "1px var(--color-blue-800)",
                    WebkitTextFillColor: "var(--color-blue-800)",
                }}
            >
                #{round.round_no}
            </div>

            <div className="space-y-1 relative z-10">
                <div className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest">
                    Round {round.round_no}
                </div>
                <h4 className="text-lg font-bold text-white leading-tight">{round.round_name}</h4>
            </div>

            <div className="relative z-10 pt-1">
                <div className="flex items-center gap-2 text-[11px] text-neutral-500">
                    <Clock className="w-3.5 h-3.5 text-neutral-700 shrink-0" />
                    <span>
                        {fmtTime(round.start_time)} – {fmtTime(round.end_time)}
                    </span>
                </div>
            </div>
        </Link>
    )
}

// ── Registration Row (desktop table) ─────────────────────────────────────────

export function RegistrationRow({
    reg,
    showTeamColumn,
}: {
    reg: EventRegistration
    showTeamColumn: boolean
}) {
    if (reg.type === "SOLO") {
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
                        <div className="text-sm font-semibold text-white">
                            {reg.first_name} {reg.last_name}
                        </div>
                        <div className="text-[10px] text-neutral-500 font-mono mt-0.5">
                            {reg.participant_id}
                        </div>
                    </div>
                </td>
                <td className="px-6 py-4 hidden md:table-cell">
                    <div className="text-xs text-neutral-400">
                        <div className="truncate max-w-[240px] font-medium text-neutral-300">
                            {reg.college}
                        </div>
                        <div className="text-[10px] text-neutral-600 mt-0.5">{reg.degree}</div>
                    </div>
                </td>
                <td className="px-6 py-4">
                    <div className="text-xs text-neutral-400 font-mono">{reg.ph_no}</div>
                </td>
            </tr>
        )
    }

    return (
        <>
            {reg.members.map((member, idx) => (
                <tr
                    key={member.participant_id}
                    className={`hover:bg-neutral-900/20 transition-colors duration-150 border-b border-neutral-800/60 last:border-0 ${idx === 0 ? "" : "border-t-0"}`}
                >
                    {idx === 0 && showTeamColumn && (
                        <td
                            rowSpan={reg.members.length}
                            className="px-6 py-6 border-r border-neutral-800/60 bg-neutral-950/30 align-middle"
                        >
                            <div className="flex flex-col items-center justify-center space-y-2 sticky top-4 text-center">
                                <TypeBadge type="TEAM" />
                                <div className="text-sm font-black text-white uppercase tracking-widest leading-none">
                                    {reg.name}
                                </div>
                                <div className="text-[9px] text-neutral-600 uppercase tracking-widest font-bold">
                                    {reg.members.length} members
                                </div>
                            </div>
                        </td>
                    )}
                    <td className="px-6 py-3.5">
                        <div className="text-sm text-neutral-300 font-medium">
                            {member.first_name} {member.last_name}
                        </div>
                        <div className="text-[10px] text-neutral-600 font-mono mt-0.5">
                            {member.participant_id}
                        </div>
                    </td>
                    <td className="px-6 py-3.5 hidden md:table-cell">
                        <div className="text-xs text-neutral-500">
                            <div className="truncate max-w-[240px] text-neutral-400">
                                {member.college}
                            </div>
                            <div className="text-[10px] text-neutral-700 mt-0.5">
                                {member.degree}
                            </div>
                        </div>
                    </td>
                    <td className="px-6 py-3.5">
                        <div className="text-xs text-neutral-500 font-mono">{member.ph_no}</div>
                    </td>
                </tr>
            ))}
        </>
    )
}

// ── Registration Mobile Card ──────────────────────────────────────────────────

export function RegistrationMobileCard({ reg }: { reg: EventRegistration }) {
    if (reg.type === "SOLO") {
        return (
            <div className="p-4 space-y-4">
                <div className="flex items-start justify-between">
                    <div className="space-y-1.5 flex-1 min-w-0">
                        <TypeBadge type="SOLO" />
                        <div className="text-sm font-bold text-white uppercase tracking-wider truncate">
                            {reg.first_name} {reg.last_name}
                        </div>
                        <div className="text-[10px] text-neutral-500 font-mono">
                            {reg.participant_id}
                        </div>
                    </div>
                    <div className="shrink-0 pl-4">
                        <div className="text-[11px] text-neutral-400 font-mono tracking-tight">
                            {reg.ph_no}
                        </div>
                    </div>
                </div>
                <div className="pt-3 border-t border-neutral-800/40">
                    <div className="text-[11px] text-neutral-300 font-medium leading-relaxed">
                        {reg.college}
                    </div>
                    <div className="text-[10px] text-neutral-600 mt-0.5">{reg.degree}</div>
                </div>
            </div>
        )
    }

    return (
        <div className="p-4 space-y-4">
            <div className="flex items-start justify-between">
                <div className="space-y-1.5">
                    <TypeBadge type="TEAM" />
                    <div className="text-sm font-black text-white uppercase tracking-widest">
                        {reg.name}
                    </div>
                    <div className="text-[9px] text-neutral-600 uppercase tracking-widest font-black">
                        {reg.members.length} members
                    </div>
                </div>
            </div>
            <div className="space-y-4 pl-3 border-l-2 border-neutral-800 ml-1">
                {reg.members.map(m => (
                    <div key={m.participant_id} className="space-y-1.5">
                        <div className="flex items-center justify-between gap-3">
                            <span className="text-xs font-bold text-neutral-300">
                                {m.first_name} {m.last_name}
                            </span>
                            <span className="text-[10px] text-neutral-600 font-mono shrink-0">
                                {m.ph_no}
                            </span>
                        </div>
                        <div className="text-[10px] leading-relaxed">
                            <span className="text-neutral-500 font-medium">{m.college}</span>
                            <span className="mx-1.5 text-neutral-800">·</span>
                            <span className="text-neutral-700">{m.degree}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
