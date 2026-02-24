import type { RoundResultStatus } from "@/api/events"

// ── Participant / Result status ───────────────────────────────────────────────

export type ParticipantStatus = RoundResultStatus

// ── Prize slot types ──────────────────────────────────────────────────────────

export type PrizeSlot = 1 | 2 | 3

export interface WinnerSlot {
    entryId: string
    label: string
    userId?: string
    teamId?: string
}

export type WinnerAssignments = Map<PrizeSlot, WinnerSlot>

// ── Result feedback ───────────────────────────────────────────────────────────

export type ResultFeedback =
    | { kind: "success"; count: number }
    | { kind: "delete-success"; message: string }
    | { kind: "delete-failure"; message: string }
    | {
        kind: "partial"
        count: number
        total: number
        userErrors: { user_id: string; error: string }[]
        teamErrors: { team_id: string; error: string }[]
    }
    | {
        kind: "failure"
        userErrors: { user_id: string; error: string }[]
        teamErrors: { team_id: string; error: string }[]
    }

// ── Prize feedback ────────────────────────────────────────────────────────────

export type PrizeFeedback =
    | { kind: "success"; count: number }
    | { kind: "partial"; count: number; total: number; errors: { error: string; id: string }[] }
    | { kind: "failure"; errors: { error: string; id: string }[] }

// ── Place label / icon constants ──────────────────────────────────────────────

export const PLACE_LABELS: Record<PrizeSlot, string> = {
    1: "1st Place",
    2: "2nd Place",
    3: "3rd Place",
}

export const PLACE_ICONS: Record<PrizeSlot, { label: string; cls: string }> = {
    1: { label: "🥇", cls: "text-yellow-400 border-yellow-700 bg-yellow-950/40" },
    2: { label: "🥈", cls: "text-neutral-300 border-neutral-600 bg-neutral-800/50" },
    3: { label: "🥉", cls: "text-amber-600 border-amber-800 bg-amber-950/40" },
}
