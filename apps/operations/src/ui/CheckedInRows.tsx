import { Xmark } from "iconoir-react"
import type { RoundCheckInEntry } from "@/api/events"
import { TypeBadge } from "./TablePagination"
import { PLACE_ICONS, PLACE_LABELS, type PrizeSlot } from "./round-types"

// ── Shared props ──────────────────────────────────────────────────────────────

interface RowProps {
    entry: RoundCheckInEntry
    checked: boolean
    onToggle: () => void
    assignedPlace?: PrizeSlot | null
    isLastRound?: boolean
    onDelete?: () => void
}

// ── Desktop row group ─────────────────────────────────────────────────────────

export function CheckedInRowGroup({
    entry,
    checked,
    onToggle,
    assignedPlace,
    isLastRound,
    onDelete,
}: RowProps) {
    const rowHighlight = checked ? "bg-neutral-900/50" : ""
    const winnerBorderCls = assignedPlace
        ? assignedPlace === 1
            ? "ring-1 ring-inset ring-yellow-700/60"
            : assignedPlace === 2
                ? "ring-1 ring-inset ring-neutral-500/40"
                : "ring-1 ring-inset ring-amber-800/50"
        : ""

    const deleteBtn = onDelete ? (
        <td className="w-16 px-4 align-middle text-center">
            <button
                type="button"
                onClick={onDelete}
                title="Remove check-in"
                className="p-1.5 text-neutral-600 hover:text-red-400 hover:bg-red-950/40 border border-transparent hover:border-red-900 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-red-500"
            >
                <Xmark className="w-3.5 h-3.5" />
            </button>
        </td>
    ) : null

    if (entry.type === "SOLO") {
        return (
            <tr className={`hover:bg-neutral-900/40 transition-colors duration-150 border-b border-neutral-800/60 last:border-0 ${rowHighlight} ${winnerBorderCls}`}>
                <td className="w-12 px-6 py-4 border-r border-neutral-800/60 bg-neutral-950/20 align-middle text-center">
                    <input
                        type="checkbox"
                        checked={checked}
                        onChange={onToggle}
                        className="w-4 h-4 bg-black border-neutral-800 rounded-none checked:bg-white checked:border-white transition-all cursor-pointer accent-white mt-1"
                    />
                </td>
                <td colSpan={2} className="px-6 py-4 border-r border-neutral-800/60 bg-neutral-950/30 align-middle">
                    <div className="flex items-center gap-4">
                        <div className="flex flex-col items-center justify-center space-y-1.5 min-w-[70px]">
                            <TypeBadge type="SOLO" />
                            {isLastRound && assignedPlace ? (
                                <span className={`text-[10px] font-black uppercase tracking-widest ${PLACE_ICONS[assignedPlace].cls} border px-1.5 py-0.5`}>
                                    {PLACE_ICONS[assignedPlace].label} {PLACE_LABELS[assignedPlace]}
                                </span>
                            ) : (
                                <p className="text-[9px] text-neutral-600 font-mono uppercase tracking-tighter">
                                    {new Date(entry.checkedin_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                </p>
                            )}
                        </div>
                        <div className="h-8 w-px bg-neutral-800/40" />
                        <div className="space-y-1">
                            <div className="text-sm font-bold text-white uppercase tracking-wider leading-tight">
                                {entry.first_name} {entry.last_name}
                            </div>
                            <div className="text-[10px] text-neutral-500 font-mono">{entry.participant_id}</div>
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
                {deleteBtn}
            </tr>
        )
    }

    return (
        <>
            {entry.members.map((member, mIdx) => (
                <tr
                    key={member.participant_id}
                    className={`hover:bg-neutral-900/20 transition-colors duration-150 border-b border-neutral-800/60 last:border-0 ${checked ? "bg-neutral-900/30" : ""} ${winnerBorderCls}`}
                >
                    {mIdx === 0 && (
                        <>
                            <td rowSpan={entry.members.length} className="w-12 px-6 py-4 border-r border-neutral-800/60 bg-neutral-950/20 align-middle">
                                <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={onToggle}
                                    className="w-4 h-4 bg-black border-neutral-800 rounded-none checked:bg-white checked:border-white transition-all cursor-pointer accent-white"
                                />
                            </td>
                            <td rowSpan={entry.members.length} className="px-6 py-4 border-r border-neutral-800/60 bg-neutral-950/30 align-middle">
                                <div className="flex flex-col items-center justify-center space-y-2 sticky top-4 text-center">
                                    <TypeBadge type="TEAM" />
                                    <div className="text-sm font-black text-white uppercase tracking-widest leading-none">{entry.name}</div>
                                    <div className="text-[9px] text-neutral-600 uppercase tracking-widest font-bold">{entry.members.length} members</div>
                                    {isLastRound && assignedPlace ? (
                                        <span className={`text-[10px] font-black uppercase tracking-widest ${PLACE_ICONS[assignedPlace].cls} border px-1.5 py-0.5 mt-1`}>
                                            {PLACE_ICONS[assignedPlace].label} {PLACE_LABELS[assignedPlace]}
                                        </span>
                                    ) : (
                                        <p className="text-[10px] text-neutral-600 mt-0.5 uppercase tracking-wider">
                                            {new Date(entry.checkedin_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                        </p>
                                    )}
                                </div>
                            </td>
                        </>
                    )}
                    <td className="px-6 py-4">
                        <div className="text-sm text-neutral-300">{member.first_name} {member.last_name}</div>
                        <div className="text-[10px] text-neutral-600 font-mono mt-0.5">{member.participant_id}</div>
                    </td>
                    <td className="px-6 py-4">
                        <div className="text-xs text-neutral-500">
                            <div className="truncate max-w-[240px]">{member.college}</div>
                            <div className="text-[10px] text-neutral-700 mt-0.5">{member.degree}</div>
                        </div>
                    </td>
                    <td className="px-6 py-4">
                        <div className="text-xs text-neutral-500 font-mono">{member.ph_no}</div>
                    </td>
                    {mIdx === 0 && onDelete ? (
                        <td rowSpan={entry.members.length} className="w-16 px-4 align-middle text-center">
                            <button
                                type="button"
                                onClick={onDelete}
                                title="Remove team check-in"
                                className="p-1.5 text-neutral-600 hover:text-red-400 hover:bg-red-950/40 border border-transparent hover:border-red-900 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-red-500"
                            >
                                <Xmark className="w-3.5 h-3.5" />
                            </button>
                        </td>
                    ) : null}
                </tr>
            ))}
        </>
    )
}

// ── Mobile card ───────────────────────────────────────────────────────────────

export function CheckedInCard({ entry, checked, onToggle, assignedPlace, isLastRound, onDelete }: RowProps) {
    const cardBase = `p-4 space-y-3 relative transition-colors duration-150 ${checked ? "bg-neutral-900/60" : ""}${assignedPlace && isLastRound
        ? assignedPlace === 1
            ? " ring-1 ring-inset ring-yellow-700/50"
            : assignedPlace === 2
                ? " ring-1 ring-inset ring-neutral-500/30"
                : " ring-1 ring-inset ring-amber-800/40"
        : ""
        }`

    const header = (
        <div className="flex items-center gap-3">
            <input
                type="checkbox"
                checked={checked}
                onChange={onToggle}
                className="w-5 h-5 bg-black border-neutral-700 rounded-none checked:bg-white checked:border-white transition-all cursor-pointer accent-white shrink-0"
            />
            {entry.type === "TEAM" ? (
                <>
                    <TypeBadge type="TEAM" />
                    <span className="font-semibold text-white truncate flex-1">{entry.name}</span>
                </>
            ) : (
                <>
                    <TypeBadge type="SOLO" />
                    <span className="font-semibold text-white truncate flex-1">{entry.first_name} {entry.last_name}</span>
                </>
            )}
            {isLastRound && assignedPlace && (
                <span className={`shrink-0 text-[10px] font-black border px-1.5 py-0.5 ${PLACE_ICONS[assignedPlace].cls}`}>
                    {PLACE_ICONS[assignedPlace].label}
                </span>
            )}
            {onDelete && (
                <button
                    type="button"
                    onClick={onDelete}
                    title="Remove check-in"
                    className="shrink-0 p-1.5 text-neutral-600 hover:text-red-400 hover:bg-red-950/40 border border-transparent hover:border-red-900 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-red-500"
                >
                    <Xmark className="w-3.5 h-3.5" />
                </button>
            )}
        </div>
    )

    if (entry.type === "TEAM") {
        return (
            <div className={cardBase}>
                {header}
                <div className="space-y-1 pl-8">
                    {entry.members.map(m => (
                        <div key={m.participant_id} className="text-xs text-neutral-400 font-mono">
                            {m.first_name} {m.last_name} • {m.ph_no}
                        </div>
                    ))}
                </div>
                <div className="flex gap-4 text-xs text-neutral-500 items-center pl-8">
                    <span>{entry.members[0]?.college ?? "—"}</span>
                    <span className="ml-auto">{new Date(entry.checkedin_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                </div>
            </div>
        )
    }

    return (
        <div className={cardBase}>
            {header}
            <div className="text-xs text-neutral-400 font-mono pl-8">{entry.participant_id} • {entry.ph_no}</div>
            <div className="flex gap-4 text-xs text-neutral-500 items-center pl-8">
                <span>{entry.college}</span>
                <span className="ml-auto">{new Date(entry.checkedin_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
            </div>
        </div>
    )
}
