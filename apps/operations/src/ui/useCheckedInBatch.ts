import { useMutation, useQueryClient } from "@tanstack/react-query"
import type { AxiosError } from "axios"
import { useMemo, useState } from "react"
import type { AssignPrizes, RoundCheckInEntry } from "@/api/events"
import { Route } from "@/routes/app/events.$eventId.$roundNo"
import {
    type ParticipantStatus,
    type PrizeFeedback,
    type PrizeSlot,
    type ResultFeedback,
    type WinnerAssignments,
} from "./round-types"

// Local copy — avoids circular dep with CheckedInTable.tsx
function entryId(entry: RoundCheckInEntry): string {
    return entry.type === "TEAM" ? `team:${entry.name}` : `solo:${entry.participant_id}`
}

// Re-export so consumers can import from one place
export type { ParticipantStatus, PrizeFeedback, PrizeSlot, ResultFeedback, WinnerAssignments }

function entryParticipantId(entry: RoundCheckInEntry): string {
    return entry.type === "TEAM" ? entry.members[0]!.participant_id : entry.participant_id
}

function entryLabel(entry: RoundCheckInEntry): string {
    return entry.type === "TEAM" ? entry.name : `${entry.first_name} ${entry.last_name}`
}

interface UseCheckedInBatchOptions {
    eventId: string
    roundNo: string
    allData: RoundCheckInEntry[]
    pageData: RoundCheckInEntry[]
}

export function useCheckedInBatch({
    eventId,
    roundNo,
    allData,
    pageData,
}: UseCheckedInBatchOptions) {
    const { api } = Route.useRouteContext()
    const queryClient = useQueryClient()

    // ── Selection ─────────────────────────────────────────────────────────────
    const [selected, setSelected] = useState<Set<string>>(new Set())

    const allIds = pageData.map(entryId)
    const allSelected = allIds.length > 0 && allIds.every(id => selected.has(id))
    const someSelected = allIds.some(id => selected.has(id)) && !allSelected

    const entryMap = useMemo(() => new Map(allData.map(e => [entryId(e), e])), [allData])

    function toggleAll() {
        if (allSelected) setSelected(new Set())
        else setSelected(new Set(allIds))
    }

    function toggleEntry(id: string) {
        setSelected(prev => {
            const next = new Set(prev)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            return next
        })
    }

    function clearSelection() {
        setSelected(new Set())
    }

    // ── Auto/Manual mode ──────────────────────────────────────────────────────
    const [isAutoMode, setIsAutoMode] = useState<boolean>(() => {
        try {
            const stored = localStorage.getItem("checkin-assignment-mode")
            return stored === null ? true : stored === "auto"
        } catch {
            return true
        }
    })

    function toggleAutoMode(value: boolean) {
        setIsAutoMode(value)
        try { localStorage.setItem("checkin-assignment-mode", value ? "auto" : "manual") } catch { /* ignore */ }
    }

    // ── Feedback ──────────────────────────────────────────────────────────────
    const [feedback, setFeedback] = useState<ResultFeedback | null>(null)
    const [isPendingBatch, setIsPendingBatch] = useState(false)

    // ── Delete mutation ───────────────────────────────────────────────────────
    const [pendingDelete, setPendingDelete] = useState<RoundCheckInEntry | null>(null)

    const deleteMutation = useMutation({
        mutationFn: (entry: RoundCheckInEntry) =>
            api.events.deleteRoundCheckIn(eventId, roundNo, entryParticipantId(entry)),
        onSuccess: res => {
            setPendingDelete(null)
            setFeedback({ kind: "delete-success", message: res.message })
            setTimeout(() => setFeedback(null), 5000)
            queryClient.invalidateQueries({ queryKey: ["round-checkins"] })
        },
        onError: err => {
            const axiosErr = err as AxiosError<{ message?: string }>
            const msg = axiosErr.response?.data?.message ?? "Failed to remove check-in"
            setFeedback({ kind: "delete-failure", message: msg })
            setPendingDelete(null)
        },
    })

    // ── Batch helpers ─────────────────────────────────────────────────────────

    function buildResults(ids: string[], status: ParticipantStatus) {
        return ids
            .map(id => {
                const entry = entryMap.get(id)
                if (!entry) return null
                if (entry.type === "TEAM") return { team_id: entry.team_id ?? entry.name, status }
                return { user_id: entry.participant_id, status }
            })
            .filter(Boolean) as { user_id?: string; team_id?: string; status: ParticipantStatus }[]
    }

    async function postBatch(ids: string[], status: ParticipantStatus) {
        if (ids.length === 0) return { recorded: 0, userErrors: [] as { user_id: string; error: string }[], teamErrors: [] as { team_id: string; error: string }[] }
        try {
            const res = await api.events.postRoundResults(eventId, roundNo, {
                results: buildResults(ids, status),
            })
            return {
                recorded: res.data.recorded_count,
                userErrors: res.user_errors ?? [],
                teamErrors: res.team_errors ?? [],
            }
        } catch (err) {
            const body = (err as AxiosError<{ user_errors?: { user_id: string; error: string }[]; team_errors?: { team_id: string; error: string }[] }>).response?.data
            return { recorded: 0, userErrors: body?.user_errors ?? [], teamErrors: body?.team_errors ?? [] }
        }
    }

    async function applyStatus(status: ParticipantStatus) {
        setFeedback(null)
        setIsPendingBatch(true)
        const selectedIds = Array.from(selected)
        const selectedSet = new Set(selectedIds)
        try {
            if (status === "DISQUALIFIED" || !isAutoMode) {
                const { recorded, userErrors, teamErrors } = await postBatch(selectedIds, status)
                const total = selectedIds.length
                if (recorded === 0) {
                    setFeedback({ kind: "failure", userErrors, teamErrors })
                } else if (userErrors.length > 0 || teamErrors.length > 0) {
                    setFeedback({ kind: "partial", count: recorded, total, userErrors, teamErrors })
                } else {
                    setFeedback({ kind: "success", count: recorded })
                    setTimeout(() => setFeedback(null), 4000)
                }
            } else {
                const counterStatus: ParticipantStatus = status === "QUALIFIED" ? "ELIMINATED" : "QUALIFIED"
                const otherIds = allData.map(entryId).filter(id => !selectedSet.has(id))
                const [primary, counter] = await Promise.all([
                    postBatch(selectedIds, status),
                    postBatch(otherIds, counterStatus),
                ])
                const totalRecorded = primary.recorded + counter.recorded
                const totalSubmitted = selectedIds.length + otherIds.length
                const allUserErrors = [...primary.userErrors, ...counter.userErrors]
                const allTeamErrors = [...primary.teamErrors, ...counter.teamErrors]
                if (totalRecorded === 0) {
                    setFeedback({ kind: "failure", userErrors: allUserErrors, teamErrors: allTeamErrors })
                } else if (allUserErrors.length > 0 || allTeamErrors.length > 0) {
                    setFeedback({ kind: "partial", count: totalRecorded, total: totalSubmitted, userErrors: allUserErrors, teamErrors: allTeamErrors })
                } else {
                    setFeedback({ kind: "success", count: totalRecorded })
                    setTimeout(() => setFeedback(null), 4000)
                }
            }
            setSelected(new Set())
            queryClient.invalidateQueries({ queryKey: ["round-results"] })
        } finally {
            setIsPendingBatch(false)
        }
    }

    // ── Winner assignment ────────────────────────────────────────────────────
    const [winners, setWinners] = useState<WinnerAssignments>(new Map())
    const [pendingPlaceTarget, setPendingPlaceTarget] = useState<PrizeSlot | null>(null)
    const [prizeFeedback, setPrizeFeedback] = useState<PrizeFeedback | null>(null)
    const [isSubmittingPrizes, setIsSubmittingPrizes] = useState(false)

    function handlePlaceClick(place: PrizeSlot) {
        if (selected.size === 1) {
            const [eid] = Array.from(selected)
            const entry = entryMap.get(eid)
            if (!entry) return
            const next = new Map(winners)
            for (const [p, slot] of next.entries()) {
                if (slot.entryId === eid) next.delete(p)
            }
            next.set(place, {
                entryId: eid,
                label: entryLabel(entry),
                userId: entry.type === "SOLO" ? entry.participant_id : undefined,
                teamId: entry.type === "TEAM" ? (entry.team_id ?? undefined) : undefined,
            })
            setWinners(next)
            setSelected(new Set())
            setPendingPlaceTarget(null)
        } else {
            setPendingPlaceTarget(prev => (prev === place ? null : place))
        }
    }

    function clearWinnerSlot(place: PrizeSlot) {
        const next = new Map(winners)
        next.delete(place)
        setWinners(next)
        if (pendingPlaceTarget === place) setPendingPlaceTarget(null)
    }

    function handleToggleEntryWithPlaceContext(eid: string) {
        if (pendingPlaceTarget !== null) {
            const entry = entryMap.get(eid)
            if (!entry) return
            const next = new Map(winners)
            for (const [p, slot] of next.entries()) {
                if (slot.entryId === eid) next.delete(p)
            }
            next.set(pendingPlaceTarget, {
                entryId: eid,
                label: entryLabel(entry),
                userId: entry.type === "SOLO" ? entry.participant_id : undefined,
                teamId: entry.type === "TEAM" ? (entry.team_id ?? undefined) : undefined,
            })
            setWinners(next)
            setPendingPlaceTarget(null)
            return
        }
        toggleEntry(eid)
    }

    async function submitWinners() {
        if (winners.size === 0) return
        setPrizeFeedback(null)
        setIsSubmittingPrizes(true)
        const results: AssignPrizes["results"] = []
        for (const [position, slot] of winners.entries()) {
            if (slot.userId) results.push({ user_id: slot.userId, position })
            else if (slot.teamId) results.push({ team_id: slot.teamId, position })
        }
        const winnerEntryIds = new Set(Array.from(winners.values()).map(s => s.entryId))
        try {
            const res = await api.events.assignEventPrizes(eventId, { results })
            const recorded = res.data.recorded_count
            const errors = res.errors ?? res.data.errors ?? []
            if (recorded === 0) {
                setPrizeFeedback({ kind: "failure", errors: errors.map((e: any) => ({ error: e.error, id: e.user_id ?? e.team_id ?? "" })) })
                return
            }
            await Promise.all([
                postBatch(Array.from(winnerEntryIds), "QUALIFIED"),
                postBatch(allData.map(entryId).filter(id => !winnerEntryIds.has(id)), "ELIMINATED"),
            ])
            queryClient.invalidateQueries({ queryKey: ["round-results"] })
            if (errors.length > 0) {
                setPrizeFeedback({ kind: "partial", count: recorded, total: results.length, errors: errors.map((e: any) => ({ error: e.error, id: e.user_id ?? e.team_id ?? "" })) })
            } else {
                setPrizeFeedback({ kind: "success", count: recorded })
                setTimeout(() => setPrizeFeedback(null), 6000)
                setWinners(new Map())
            }
        } catch (err) {
            const body = (err as AxiosError<{ message?: string; errors?: any[] }>).response?.data
            setPrizeFeedback({ kind: "failure", errors: (body?.errors ?? []).map((e: any) => ({ error: e.error ?? body?.message ?? "Unknown error", id: e.user_id ?? e.team_id ?? "" })) })
        } finally {
            setIsSubmittingPrizes(false)
        }
    }

    return {
        // selection
        selected,
        allSelected,
        someSelected,
        entryMap,
        toggleAll,
        toggleEntry,
        clearSelection,
        handleToggleEntryWithPlaceContext,
        // auto mode
        isAutoMode,
        toggleAutoMode,
        // batch status
        feedback,
        setFeedback,
        isPendingBatch,
        applyStatus,
        // delete
        pendingDelete,
        setPendingDelete,
        deleteMutation,
        // winners
        winners,
        pendingPlaceTarget,
        prizeFeedback,
        setPrizeFeedback,
        isSubmittingPrizes,
        handlePlaceClick,
        clearWinnerSlot,
        submitWinners,
    }
}
