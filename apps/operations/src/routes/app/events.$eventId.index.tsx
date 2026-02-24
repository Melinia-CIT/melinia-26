import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { ArrowLeft, Group, NavArrowDown, Plus, Search, User, Xmark } from "iconoir-react"
import { useMemo, useState } from "react"
import type { EventDetail, EventRegistration, EventRegistrationsResponse } from "@/api/events"
import { AddVolunteersModal } from "@/ui/AddVolunteersModal"
import { Button } from "@/ui/Button"
import { ConfirmDialog } from "@/ui/ConfirmDialog"
import { TablePagination } from "@/ui/TablePagination"
import { RegistrationMobileCard, RegistrationRow, RoundCard } from "@/ui/RegistrationComponents"

type CrewMember = {
    user_id: string
    first_name: string
    last_name: string
    ph_no: string
}

export const Route = createFileRoute("/app/events/$eventId/")({
    component: EventRegistrationsPage,
})

function EventRegistrationsPage() {
    const { eventId } = Route.useParams()
    const { api } = Route.useRouteContext()
    const queryClient = useQueryClient()
    const [page, setPage] = useState(0)
    const [limit, setLimit] = useState(10)
    const [searchInput, setSearchInput] = useState("")
    const [activeSearch, setActiveSearch] = useState("")
    const [showVolunteersModal, setShowVolunteersModal] = useState(false)
    const [showCrew, setShowCrew] = useState(false)
    const [addVolunteersError, setAddVolunteersError] = useState<string | null>(null)

    // Fetch detailed event data (includes rounds)
    const { data: event, isLoading: isEventLoading } = useQuery<EventDetail>({
        queryKey: ["event-detail", eventId],
        queryFn: () => api.events.getById(eventId),
        staleTime: 1000 * 60,
    })

    // Normal mode query
    const {
        data,
        isLoading: isRegistrationsLoading,
        error,
    } = useQuery<EventRegistrationsResponse>({
        queryKey: ["event-registrations", eventId, page, limit],
        queryFn: () => api.events.getRegistrations(eventId, { from: page * limit, limit }),
        enabled: !activeSearch,
        staleTime: 1000 * 30,
    })

    // Full dump query for search
    const { data: fullData, isLoading: isFullLoading } = useQuery<EventRegistrationsResponse>({
        queryKey: ["event-registrations-full", eventId],
        queryFn: () => api.events.getRegistrations(eventId, { from: 0, limit: 9999 }),
        enabled: !!activeSearch,
        staleTime: 1000 * 30,
    })

    const addVolunteersMutation = useMutation({
        mutationFn: (emails: string[]) => api.events.assignVolunteers(eventId, emails),
        onSuccess: () => {
            setAddVolunteersError(null)
            queryClient.invalidateQueries({ queryKey: ["event-detail", eventId] })
        },
        onError: (error: any) => {
            const message = error.response?.data?.message || "Failed to add volunteers."
            setAddVolunteersError(message)
        },
    })

    // Remove volunteer state and mutation
    const [pendingRemoveVolunteer, setPendingRemoveVolunteer] = useState<CrewMember | null>(null)
    const [removeVolunteerError, setRemoveVolunteerError] = useState<string | null>(null)

    const removeVolunteerMutation = useMutation({
        mutationFn: (volunteerId: string) => api.events.deleteVolunteer(eventId, volunteerId),
        onSuccess: () => {
            setPendingRemoveVolunteer(null)
            setRemoveVolunteerError(null)
            queryClient.invalidateQueries({ queryKey: ["event-detail", eventId] })
        },
        onError: (err: any) => {
            const message = err.response?.data?.message || "Failed to remove volunteer"
            setRemoveVolunteerError(message)
            setPendingRemoveVolunteer(null)
        },
    })

    // Filter registrations client-side when searching
    const filteredRegistrations = useMemo(() => {
        if (!activeSearch || !fullData?.data) return []
        const searchLower = activeSearch.toLowerCase()
        return fullData.data.filter((reg: EventRegistration) => {
            if (reg.type === "TEAM") {
                return (
                    reg.name.toLowerCase().includes(searchLower) ||
                    reg.members.some(
                        m =>
                            `${m.first_name} ${m.last_name}`.toLowerCase().includes(searchLower) ||
                            m.participant_id.toLowerCase().includes(searchLower) ||
                            m.ph_no.includes(searchLower)
                    )
                )
            }
            return (
                `${reg.first_name} ${reg.last_name}`.toLowerCase().includes(searchLower) ||
                reg.participant_id.toLowerCase().includes(searchLower) ||
                reg.ph_no.includes(searchLower)
            )
        })
    }, [activeSearch, fullData])

    const totalCount = activeSearch ? filteredRegistrations.length : (data?.pagination.total ?? 0)
    const totalPages = Math.ceil(totalCount / limit) || 1
    const registrations = activeSearch
        ? filteredRegistrations.slice(page * limit, (page + 1) * limit)
        : (data?.data ?? [])

    const isLoadingRegistrations = activeSearch ? isFullLoading : isRegistrationsLoading

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-8">
            {/* Back link */}
            <Link
                to="/app/events"
                className="inline-flex items-center gap-2 text-xs text-neutral-500 hover:text-white transition-colors duration-150 uppercase tracking-widest focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to events
            </Link>

            {/* Page header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-1">
                    <h2 className="text-3xl font-bold text-white">{event?.name ?? "Loading…"}</h2>
                    <div className="flex items-center gap-4 text-sm text-neutral-500">
                        <span>{event?.event_type?.toUpperCase()}</span>
                        <span>•</span>
                        <span>{event?.participation_type?.toUpperCase()} participation</span>
                    </div>
                </div>
                <Button
                    onClick={() => setShowVolunteersModal(true)}
                    className="bg-white text-black hover:bg-neutral-200 border-none px-6 py-2.5 font-bold flex items-center gap-2 shrink-0 h-fit"
                >
                    <Plus className="w-5 h-5" />
                    Add Volunteers
                </Button>
            </div>

            <AddVolunteersModal
                open={showVolunteersModal}
                onClose={() => {
                    setShowVolunteersModal(false)
                    setAddVolunteersError(null)
                    addVolunteersMutation.reset()
                }}
                eventName={event?.name ?? ""}
                onAdd={emails => addVolunteersMutation.mutate(emails)}
                isAdding={addVolunteersMutation.isPending}
                addSuccess={addVolunteersMutation.isSuccess}
                addError={addVolunteersError}
            />

            {/* Rounds section */}
            <div className="space-y-4">
                <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-2">
                    Rounds
                    <span className="h-[1px] flex-1 bg-neutral-800" />
                </h3>
                {isEventLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[1, 2, 3].map(i => (
                            <div
                                key={i}
                                className="h-32 bg-neutral-900/50 border border-neutral-800 animate-pulse"
                            />
                        ))}
                    </div>
                ) : event?.rounds && event.rounds.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {event.rounds
                            .sort((a, b) => a.round_no - b.round_no)
                            .map(round => (
                                <RoundCard key={round.id} round={round} eventId={eventId} />
                            ))}
                    </div>
                ) : (
                    <div className="p-6 border border-neutral-800 text-neutral-500 text-sm italic">
                        No rounds defined for this event.
                    </div>
                )}
            </div>

            {/* Volunteers section */}
            <div className="space-y-4">
                <button
                    type="button"
                    onClick={() => setShowCrew(!showCrew)}
                    className="w-full bg-neutral-950 border border-neutral-800 p-4 flex items-center justify-between group hover:border-neutral-600 transition-all duration-200 focus:outline-none"
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-950/20 border border-blue-900/50 text-blue-400 group-hover:text-blue-300 transition-colors">
                            <User className="w-5 h-5" />
                        </div>
                        <div className="text-left">
                            <div className="text-[10px] font-black text-neutral-600 uppercase tracking-[0.2em] leading-none mb-1">
                                Event Staff
                            </div>
                            <h3 className="text-sm font-bold text-white uppercase tracking-widest">
                                Volunteers
                            </h3>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        {event?.crew?.volunteers && (
                            <span className="text-[10px] font-mono text-neutral-600 uppercase tracking-widest">
                                {event.crew.volunteers.length} members
                            </span>
                        )}
                        <NavArrowDown
                            className={`w-5 h-5 text-neutral-500 group-hover:text-white transition-all duration-300 ${showCrew ? "rotate-180" : ""}`}
                        />
                    </div>
                </button>

                {showCrew && (
                    <div className="animate-slide-down bg-neutral-900/10 border-x border-b border-neutral-800/50 p-6 overflow-hidden">
                        {event?.crew?.volunteers && event.crew.volunteers.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {(event.crew.volunteers as unknown as CrewMember[]).map(person => (
                                    <div
                                        key={person.user_id}
                                        className="bg-neutral-950/50 border border-neutral-800/60 p-4 flex items-center justify-between group hover:border-neutral-600 transition-all duration-200"
                                    >
                                        <div className="space-y-1">
                                            <div className="text-sm font-bold text-white uppercase tracking-wider">
                                                {person.first_name} {person.last_name}
                                            </div>
                                            <div className="text-[10px] text-neutral-500 font-mono italic">
                                                {person.user_id}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="text-[10px] text-neutral-400 font-mono self-end">
                                                {person.ph_no}
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setPendingRemoveVolunteer(person)}
                                                title="Remove volunteer"
                                                className="p-1.5 text-neutral-600 hover:text-red-400 hover:bg-red-950/40 border border-transparent hover:border-red-900 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-red-500"
                                            >
                                                <Xmark className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="py-8 text-center text-xs text-neutral-600 italic font-mono uppercase tracking-[0.2em]">
                                No volunteers assigned to this event.
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Registrations section */}
            <div className="space-y-4">
                <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-2">
                    Registrations
                    <span className="h-[1px] flex-1 bg-neutral-800" />
                </h3>

                {/* Search Bar */}
                <div className="flex items-center gap-2 border-b border-neutral-800 bg-neutral-900/30 px-4 md:px-6 py-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                        <input
                            type="search"
                            placeholder="Search by name, ID, or phone..."
                            value={searchInput}
                            onChange={e => setSearchInput(e.target.value)}
                            onKeyDown={e => {
                                if (e.key === "Enter") {
                                    e.preventDefault()
                                    setActiveSearch(searchInput.trim())
                                    setPage(0)
                                    e.currentTarget.blur()
                                }
                            }}
                            className="w-full bg-neutral-950 border border-neutral-800 text-white pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-neutral-600"
                        />
                        {searchInput && (
                            <button
                                type="button"
                                onClick={() => {
                                    setSearchInput("")
                                    setActiveSearch("")
                                    setPage(0)
                                }}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white"
                            >
                                <Xmark className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={() => {
                            setActiveSearch(searchInput.trim())
                            setPage(0)
                        }}
                        className="hidden md:inline-flex px-4 py-2 text-xs font-bold uppercase tracking-widest border border-neutral-700 text-neutral-300 hover:bg-neutral-800 transition-colors"
                    >
                        Search
                    </button>
                </div>
                {activeSearch && (
                    <div className="px-4 md:px-6 pb-2">
                        {registrations.length > 0 ? (
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

                {isLoadingRegistrations ? (
                    <div className="text-neutral-500 text-sm">Loading registrations…</div>
                ) : error ? (
                    <div className="p-4 bg-red-950/50 border border-red-900 text-sm text-red-500">
                        Failed to load registrations. Please try again.
                    </div>
                ) : registrations.length === 0 ? (
                    <div className="py-20 border border-neutral-800 bg-neutral-950/30 flex flex-col items-center justify-center space-y-4">
                        <Group className="w-10 h-10 text-neutral-800" />
                        <div className="text-center space-y-1">
                            <p className="text-neutral-400 font-medium">
                                {activeSearch
                                    ? `No results found for "${activeSearch}"`
                                    : "No registrations yet"}
                            </p>
                            <p className="text-neutral-600 text-xs">
                                {activeSearch
                                    ? "Try a different search term."
                                    : "Nobody has registered for this event."}
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {/* Mobile View */}
                        <div className="md:hidden divide-y divide-neutral-800 border border-neutral-800 bg-neutral-950 shadow-xl">
                            {registrations.map((reg, idx) => (
                                <RegistrationMobileCard key={`${reg.type}-${idx}`} reg={reg} />
                            ))}
                        </div>

                        {/* Mobile Pagination */}
                        <div className="md:hidden">
                            <TablePagination
                                page={page}
                                totalPages={totalPages}
                                total={totalCount}
                                pageLimit={limit}
                                onPrev={() => setPage(p => Math.max(0, p - 1))}
                                onNext={() => setPage(p => p + 1)}
                                onSetPage={setPage}
                                onSetLimit={setLimit}
                            />
                        </div>

                        {/* Desktop View */}
                        <div className="hidden md:block border border-neutral-800 bg-neutral-950 overflow-hidden shadow-2xl">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-neutral-800 bg-neutral-900/60">
                                            {event?.participation_type?.toUpperCase() ===
                                                "TEAM" && (
                                                <th className="px-6 py-3 text-left text-[10px] font-semibold text-neutral-400 uppercase tracking-widest border-r border-neutral-800/60 w-[200px]">
                                                    Team / Entry
                                                </th>
                                            )}
                                            <th className="px-6 py-3 text-left text-[10px] font-semibold text-neutral-400 uppercase tracking-widest">
                                                Participant Name
                                            </th>
                                            <th className="px-6 py-3 text-left text-[10px] font-semibold text-neutral-400 uppercase tracking-widest hidden md:table-cell">
                                                College & Degree
                                            </th>
                                            <th className="px-6 py-3 text-left text-[10px] font-semibold text-neutral-400 uppercase tracking-widest">
                                                Phone Number
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {registrations.map((reg, idx) => (
                                            <RegistrationRow
                                                key={`${reg.type}-${idx}`}
                                                reg={reg}
                                                showTeamColumn={
                                                    event?.participation_type?.toUpperCase() ===
                                                    "TEAM"
                                                }
                                            />
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <TablePagination
                                page={page}
                                totalPages={totalPages}
                                total={totalCount}
                                pageLimit={limit}
                                onPrev={() => setPage(p => Math.max(0, p - 1))}
                                onNext={() => setPage(p => p + 1)}
                                onSetPage={setPage}
                                onSetLimit={setLimit}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Remove Volunteer Confirmation */}
            <ConfirmDialog
                open={!!pendingRemoveVolunteer}
                title="Remove Volunteer?"
                description={
                    pendingRemoveVolunteer
                        ? `This will remove ${pendingRemoveVolunteer.first_name} ${pendingRemoveVolunteer.last_name} from this event. This cannot be undone.${removeVolunteerError ? `\n\nError: ${removeVolunteerError}` : ""}`
                        : ""
                }
                confirmLabel="Remove"
                isPending={removeVolunteerMutation.isPending}
                onConfirm={() =>
                    pendingRemoveVolunteer &&
                    removeVolunteerMutation.mutate(pendingRemoveVolunteer.user_id)
                }
                onCancel={() => {
                    setPendingRemoveVolunteer(null)
                    setRemoveVolunteerError(null)
                }}
            />
        </div>
    )
}
