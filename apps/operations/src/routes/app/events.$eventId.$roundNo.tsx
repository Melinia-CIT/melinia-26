import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import type { AxiosError } from "axios"
import {
    ArrowLeft,
    Group,
    NavArrowLeft,
    NavArrowRight,
    ScanQrCode,
    Search,
    Trophy,
    User,
    Xmark,
} from "iconoir-react"
import { useMemo, useState } from "react"
import type {
    AssignPrizes,
    RoundCheckInEntry,
    RoundQualifiedParticipant,
    RoundResultStatus,
    RoundResultWithParticipant,
} from "@/api/events"
import { Button } from "@/ui/Button"
import { Field } from "@/ui/Field"
import { Input } from "@/ui/Input"
import { QRScanner } from "@/ui/QRScanner"
import { RoundCheckInPopup } from "@/ui/RoundCheckInPopup"

export const Route = createFileRoute("/app/events/$eventId/$roundNo")({
    component: RoundCheckInPage,
})

function RoundCheckInPage() {
    const { eventId, roundNo } = Route.useParams()
    const { api } = Route.useRouteContext()
    const queryClient = useQueryClient()
    const [searchInput, setSearchInput] = useState("")
    const [scannedUserId, setScannedUserId] = useState<string | null>(null)
    const [popupOpen, setPopupOpen] = useState(false)
    const [showScanner, setShowScanner] = useState(false)
    const [qrError, setQrError] = useState("")
    const [checkInError, setCheckInError] = useState<string | null>(null)
    const [isRequestingCamera, setIsRequestingCamera] = useState(false)

    // Participants section state
    const [activeTab, setActiveTab] = useState<"participants" | "checkedin" | "results">(
        "participants"
    )
    const [checkInsPage, setCheckInsPage] = useState(0)
    const [qualifiedPage, setQualifiedPage] = useState(0)
    const [resultsPage, setResultsPage] = useState(0)

    // Limit states per tab
    const [checkInsLimit, setCheckInsLimit] = useState(10)
    const [qualifiedLimit, setQualifiedLimit] = useState(10)
    const [resultsLimit, setResultsLimit] = useState(50)

    // Search states per tab
    const [checkInsSearchInput, setCheckInsSearchInput] = useState("")
    const [checkInsActiveSearch, setCheckInsActiveSearch] = useState("")
    const [qualifiedSearchInput, setQualifiedSearchInput] = useState("")
    const [qualifiedActiveSearch, setQualifiedActiveSearch] = useState("")
    const [resultsSearchInput, setResultsSearchInput] = useState("")
    const [resultsActiveSearch, setResultsActiveSearch] = useState("")

    const participantIdPattern = /^MLNU[A-Za-z0-9]{6}$/

    const roundNumber = parseInt(roundNo, 10)

    // Fetch detailed event data to show context
    const { data: event } = useQuery({
        queryKey: ["event-detail", eventId],
        queryFn: () => api.events.getById(eventId),
        staleTime: 1000 * 60,
    })
    const targetRound = event?.rounds.find(r => r.round_no === roundNumber)

    // Fetch the participant when a user_id is scanned
    const {
        data: participant,
        isLoading: isParticipantLoading,
        error: participantError,
    } = useQuery({
        queryKey: ["round-participant", eventId, roundNumber, scannedUserId],
        queryFn: () => api.events.getRoundParticipant(eventId, roundNumber, scannedUserId!),
        enabled: !!scannedUserId && popupOpen,
        retry: false,
    })

    // Fetch checked-in participants (normal mode)
    const {
        data: checkInsData,
        isLoading: isCheckInsLoading,
        error: checkInsError,
    } = useQuery({
        queryKey: ["round-checkins", eventId, roundNo, checkInsPage, checkInsLimit],
        queryFn: () =>
            api.events.getRoundCheckIns(eventId, roundNo, {
                from: checkInsPage * checkInsLimit,
                limit: checkInsLimit,
            }),
        enabled: !checkInsActiveSearch,
        staleTime: 1000 * 30,
    })

    // Fetch ALL checked-in participants (used for search filtering AND for the
    // counter-status batch when assigning Qualified/Eliminated results).
    // Always enabled so the full list is available even without an active search.
    const { data: checkInsFullData, isLoading: isCheckInsFullLoading } = useQuery({
        queryKey: ["round-checkins-full", eventId, roundNo],
        queryFn: () =>
            api.events.getRoundCheckIns(eventId, roundNo, {
                from: 0,
                limit: 9999,
            }),
        staleTime: 1000 * 30,
    })

    // Filter and paginate checked-in participants client-side when searching
    const filteredCheckIns = useMemo(() => {
        if (!checkInsActiveSearch || !checkInsFullData?.data) return []
        const searchLower = checkInsActiveSearch.toLowerCase()
        return checkInsFullData.data.filter(entry => {
            if (entry.type === "TEAM") {
                return (
                    entry.name.toLowerCase().includes(searchLower) ||
                    entry.members.some(
                        m =>
                            m.first_name.toLowerCase().includes(searchLower) ||
                            m.last_name.toLowerCase().includes(searchLower) ||
                            m.participant_id.toLowerCase().includes(searchLower) ||
                            m.ph_no.includes(searchLower)
                    )
                )
            }
            return (
                entry.first_name.toLowerCase().includes(searchLower) ||
                entry.last_name.toLowerCase().includes(searchLower) ||
                entry.participant_id.toLowerCase().includes(searchLower) ||
                entry.ph_no.includes(searchLower)
            )
        })
    }, [checkInsActiveSearch, checkInsFullData])

    const checkInsTotalCount = checkInsActiveSearch
        ? filteredCheckIns.length
        : (checkInsData?.pagination.total ?? 0)
    const checkInsTotalPages = Math.ceil(checkInsTotalCount / checkInsLimit) || 1
    const paginatedCheckIns = checkInsActiveSearch
        ? filteredCheckIns.slice(checkInsPage * checkInsLimit, (checkInsPage + 1) * checkInsLimit)
        : (checkInsData?.data ?? [])

    // Fetch qualified participants (normal mode)
    const {
        data: qualifiedData,
        isLoading: isQualifiedLoading,
        error: qualifiedError,
    } = useQuery({
        queryKey: ["round-qualified", eventId, roundNo, qualifiedPage, qualifiedLimit],
        queryFn: () =>
            api.events.getRoundParticipants(eventId, roundNo, {
                from: qualifiedPage * qualifiedLimit,
                limit: qualifiedLimit,
            }),
        enabled: !qualifiedActiveSearch,
        staleTime: 1000 * 30,
    })

    // Fetch ALL qualified participants for search (full dump mode)
    const { data: qualifiedFullData, isLoading: isQualifiedFullLoading } = useQuery({
        queryKey: ["round-qualified-full", eventId, roundNo],
        queryFn: () =>
            api.events.getRoundParticipants(eventId, roundNo, {
                from: 0,
                limit: 9999,
            }),
        enabled: !!qualifiedActiveSearch,
        staleTime: 1000 * 30,
    })

    // Filter and paginate qualified participants client-side when searching
    const filteredQualified = useMemo(() => {
        if (!qualifiedActiveSearch || !qualifiedFullData?.data) return []
        const searchLower = qualifiedActiveSearch.toLowerCase()
        return qualifiedFullData.data.filter(entry => {
            if (entry.type === "TEAM") {
                return (
                    entry.name.toLowerCase().includes(searchLower) ||
                    entry.members.some(
                        m =>
                            m.first_name.toLowerCase().includes(searchLower) ||
                            m.last_name.toLowerCase().includes(searchLower) ||
                            m.participant_id.toLowerCase().includes(searchLower) ||
                            m.ph_no.includes(searchLower)
                    )
                )
            }
            return (
                entry.first_name.toLowerCase().includes(searchLower) ||
                entry.last_name.toLowerCase().includes(searchLower) ||
                entry.participant_id.toLowerCase().includes(searchLower) ||
                entry.ph_no.includes(searchLower)
            )
        })
    }, [qualifiedActiveSearch, qualifiedFullData])

    const qualifiedTotalCount = qualifiedActiveSearch
        ? filteredQualified.length
        : (qualifiedData?.pagination.total ?? 0)
    const qualifiedTotalPages = Math.ceil(qualifiedTotalCount / qualifiedLimit) || 1
    const paginatedQualified = qualifiedActiveSearch
        ? filteredQualified.slice(
              qualifiedPage * qualifiedLimit,
              (qualifiedPage + 1) * qualifiedLimit
          )
        : (qualifiedData?.data ?? [])

    const checkInMutation = useMutation({
        mutationFn: ({ userIds, teamId }: { userIds: string[]; teamId: string | null }) =>
            api.events.checkInRound(eventId, roundNumber, userIds, teamId),
        onSuccess: () => {
            setQrError("")
            setCheckInError(null)
            // Invalidate queries to update table and badges
            queryClient.invalidateQueries({ queryKey: ["round-checkins"] })
            queryClient.invalidateQueries({ queryKey: ["round-participant"] })
        },
        onError: error => {
            console.error("Check-in error:", error)
            const axiosErr = error as AxiosError<{ message?: string }>
            const message = axiosErr.response?.data?.message
            setCheckInError(message || "Failed to check in. Please try again.")
        },
    })

    const handleSearch = (query: string) => {
        const normalizedQuery = query.trim().toUpperCase()

        if (participantIdPattern.test(normalizedQuery)) {
            setScannedUserId(normalizedQuery)
            setPopupOpen(true)
            setSearchInput("")
            setQrError("")
            setCheckInError(null)
            return
        } else {
            setQrError("Invalid ID format. Must be MLNU followed by 6 characters.")
        }
    }

    const handleQRScan = (scannedText: string) => {
        setShowScanner(false)
        setQrError("")
        setSearchInput("")
        setCheckInError(null)

        let userId: string

        try {
            const parsed = JSON.parse(scannedText)
            userId = String(parsed.user_id ?? parsed.id ?? scannedText)
        } catch {
            userId = scannedText
        }

        userId = userId.trim().toUpperCase()

        if (!participantIdPattern.test(userId)) {
            setQrError(
                `Invalid QR code format. Expected MLNU followed by 6 alphanumeric characters, got: ${userId}`
            )
            return
        }

        setScannedUserId(userId)
        setPopupOpen(true)
    }

    const handleOpenScanner = async () => {
        setIsRequestingCamera(true)
        setQrError("")

        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error("Camera API not supported in this browser")
            }

            let stream: MediaStream
            try {
                stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: "environment" },
                })
            } catch {
                stream = await navigator.mediaDevices.getUserMedia({
                    video: true,
                })
            }

            stream.getTracks().forEach(track => {
                track.stop()
            })
            setShowScanner(true)
        } catch (err) {
            console.error("Camera permission denied:", err)
            let errorMessage = "Failed to access camera. "

            if (err instanceof DOMException) {
                switch (err.name) {
                    case "NotAllowedError":
                        errorMessage += "Please allow camera access to scan QR codes."
                        break
                    case "NotFoundError":
                        errorMessage += "No camera found on this device."
                        break
                    case "NotReadableError":
                        errorMessage += "Camera is already in use by another application."
                        break
                    case "OverconstrainedError":
                        errorMessage += "No suitable camera found."
                        break
                    default:
                        errorMessage += "Please check your camera permissions."
                }
            } else if (err instanceof Error) {
                errorMessage = err.message
            } else {
                errorMessage += "Please check your camera permissions."
            }

            setQrError(errorMessage)
        } finally {
            setIsRequestingCamera(false)
        }
    }

    // Derived counts for badges
    const checkInCount = checkInsActiveSearch
        ? filteredCheckIns.length
        : (checkInsData?.pagination.total ?? 0)
    const participantsCount = qualifiedActiveSearch
        ? filteredQualified.length
        : (qualifiedData?.pagination.total ?? 0)

    return (
        <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
            {/* Back link */}
            <Link
                to="/app/events/$eventId"
                params={{ eventId }}
                className="inline-flex items-center gap-2 text-xs text-neutral-500 hover:text-white transition-colors duration-150 uppercase tracking-widest focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to Event Details
            </Link>

            {/* Header */}
            <div className="space-y-1">
                <h2 className="text-2xl md:text-3xl font-bold text-white">
                    Round {roundNo} Check-in
                </h2>
                <p className="text-neutral-500">
                    {targetRound ? targetRound.round_name : "Scan QR codes"}
                </p>
            </div>

            {/* QR Scanner Button */}
            <div className="bg-neutral-950 border border-neutral-800 p-6">
                <Button
                    variant="primary"
                    size="lg"
                    onClick={handleOpenScanner}
                    disabled={isRequestingCamera}
                    className="w-full flex items-center justify-center gap-2"
                >
                    <ScanQrCode className="w-5 h-5" />
                    {isRequestingCamera ? "Requesting Camera Access..." : "Scan QR Code"}
                </Button>
            </div>

            {/* QR Error */}
            {qrError && (
                <div className="p-4 bg-red-950/50 border border-red-900 text-red-500 text-sm">
                    {qrError}
                </div>
            )}

            {/* Manual Search */}
            <div className="bg-neutral-950 border border-neutral-800 p-6 space-y-4">
                <h3 className="text-lg font-semibold text-white">Manual Check In</h3>
                <Field
                    label="Participant ID"
                    description="Enter participant ID directly (MLNU......)"
                >
                    <div className="flex gap-2">
                        <Input
                            type="text"
                            placeholder="Enter participant ID"
                            value={searchInput}
                            onChange={e => setSearchInput(e.target.value)}
                            onKeyDown={e => {
                                if (e.key === "Enter") {
                                    e.preventDefault()
                                    handleSearch(searchInput)
                                }
                            }}
                            className="flex-1"
                        />
                        <Button variant="primary" onClick={() => handleSearch(searchInput)}>
                            Enter
                        </Button>
                    </div>
                </Field>
            </div>

            {/* ── Participants Section ───────────────────────────────────────────── */}
            <div className="bg-neutral-950 border border-neutral-800">
                {/* Tab Navigation */}
                <div className="border-b border-neutral-800">
                    {/* Mobile Dropdown */}
                    <div className="md:hidden p-4 bg-neutral-900/30">
                        <select
                            value={activeTab}
                            onChange={e => setActiveTab(e.target.value as any)}
                            className="w-full bg-neutral-950 border border-neutral-800 text-white px-4 py-3 text-xs uppercase tracking-widest font-bold focus:outline-none focus:ring-1 focus:ring-white appearance-none"
                            style={{
                                backgroundImage:
                                    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='white'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E\")",
                                backgroundRepeat: "no-repeat",
                                backgroundPosition: "right 1rem center",
                                backgroundSize: "1em",
                            }}
                        >
                            <option value="participants">Participants ({participantsCount})</option>
                            <option value="checkedin">Checked-In ({checkInCount})</option>
                            <option value="results">Results</option>
                        </select>
                    </div>

                    {/* Desktop Tabs */}
                    <div className="hidden md:flex overflow-x-auto scrollbar-hide">
                        <button
                            id="tab-participants"
                            type="button"
                            onClick={() => setActiveTab("participants")}
                            className={`px-6 py-3 text-sm font-medium uppercase tracking-wider transition-colors duration-150 border-b-2 flex-shrink-0 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white ${
                                activeTab === "participants"
                                    ? "text-white border-white"
                                    : "text-neutral-500 border-transparent hover:text-neutral-300 hover:border-neutral-700"
                            }`}
                        >
                            Participants
                            <span
                                className={`ml-2 text-xs px-1.5 py-0.5 border ${
                                    activeTab === "participants"
                                        ? "bg-white text-black border-white"
                                        : "bg-neutral-800 text-neutral-400 border-neutral-700"
                                }`}
                            >
                                {participantsCount}
                            </span>
                        </button>
                        <button
                            id="tab-checkedin"
                            type="button"
                            onClick={() => setActiveTab("checkedin")}
                            className={`px-6 py-3 text-sm font-medium uppercase tracking-wider transition-colors duration-150 border-b-2 flex-shrink-0 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white ${
                                activeTab === "checkedin"
                                    ? "text-white border-white"
                                    : "text-neutral-500 border-transparent hover:text-neutral-300 hover:border-neutral-700"
                            }`}
                        >
                            Checked-In
                            <span
                                className={`ml-2 text-xs px-1.5 py-0.5 border ${
                                    activeTab === "checkedin"
                                        ? "bg-white text-black border-white"
                                        : "bg-neutral-800 text-neutral-400 border-neutral-700"
                                }`}
                            >
                                {checkInCount}
                            </span>
                        </button>
                        <button
                            id="tab-results"
                            type="button"
                            onClick={() => setActiveTab("results")}
                            className={`px-6 py-3 text-sm font-medium uppercase tracking-wider transition-colors duration-150 border-b-2 flex-shrink-0 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white ${
                                activeTab === "results"
                                    ? "text-white border-white"
                                    : "text-neutral-500 border-transparent hover:text-neutral-300 hover:border-neutral-700"
                            }`}
                        >
                            Results
                        </button>
                    </div>
                </div>

                {/* Tab Content */}
                {activeTab === "participants" && (
                    <QualifiedTable
                        data={paginatedQualified}
                        isLoading={
                            qualifiedActiveSearch ? isQualifiedFullLoading : isQualifiedLoading
                        }
                        error={qualifiedError}
                        page={qualifiedPage}
                        totalPages={qualifiedTotalPages}
                        total={qualifiedTotalCount}
                        pageLimit={qualifiedLimit}
                        onPrev={() => setQualifiedPage(p => Math.max(0, p - 1))}
                        onNext={() => setQualifiedPage(p => p + 1)}
                        onSetPage={setQualifiedPage}
                        onSetLimit={setQualifiedLimit}
                        participationType={event?.participation_type}
                        searchInput={qualifiedSearchInput}
                        onSearchInputChange={setQualifiedSearchInput}
                        activeSearch={qualifiedActiveSearch}
                        onSearch={() => {
                            setQualifiedActiveSearch(qualifiedSearchInput.trim())
                            setQualifiedPage(0)
                        }}
                        onClearSearch={() => {
                            setQualifiedSearchInput("")
                            setQualifiedActiveSearch("")
                            setQualifiedPage(0)
                        }}
                    />
                )}
                {activeTab === "checkedin" && (
                    <CheckedInTable
                        eventId={eventId}
                        roundNo={roundNo}
                        data={paginatedCheckIns}
                        allData={checkInsFullData?.data ?? checkInsData?.data ?? []}
                        isLoading={checkInsActiveSearch ? isCheckInsFullLoading : isCheckInsLoading}
                        error={checkInsError}
                        page={checkInsPage}
                        totalPages={checkInsTotalPages}
                        total={checkInsTotalCount}
                        pageLimit={checkInsLimit}
                        onPrev={() => setCheckInsPage(p => Math.max(0, p - 1))}
                        onNext={() => setCheckInsPage(p => p + 1)}
                        onSetPage={setCheckInsPage}
                        onSetLimit={setCheckInsLimit}
                        participationType={event?.participation_type}
                        searchInput={checkInsSearchInput}
                        onSearchInputChange={setCheckInsSearchInput}
                        activeSearch={checkInsActiveSearch}
                        onSearch={() => {
                            setCheckInsActiveSearch(checkInsSearchInput.trim())
                            setCheckInsPage(0)
                        }}
                        onClearSearch={() => {
                            setCheckInsSearchInput("")
                            setCheckInsActiveSearch("")
                            setCheckInsPage(0)
                        }}
                        isLastRound={
                            !!event?.rounds?.length &&
                            roundNumber === Math.max(...(event.rounds.map((r) => r.round_no)))
                        }
                    />
                )}
                {activeTab === "results" && (
                    <ResultsTab
                        eventId={eventId}
                        roundNo={roundNo}
                        participationType={event?.participation_type}
                        searchInput={resultsSearchInput}
                        onSearchInputChange={setResultsSearchInput}
                        activeSearch={resultsActiveSearch}
                        onSearch={() => {
                            setResultsActiveSearch(resultsSearchInput.trim())
                            setResultsPage(0)
                        }}
                        onClearSearch={() => {
                            setResultsSearchInput("")
                            setResultsActiveSearch("")
                            setResultsPage(0)
                        }}
                        page={resultsPage}
                        onSetPage={setResultsPage}
                        limit={resultsLimit}
                        onSetLimit={setResultsLimit}
                        isLastRound={
                            !!event?.rounds?.length &&
                            roundNumber === Math.max(...(event.rounds.map((r) => r.round_no)))
                        }
                    />
                )}
            </div>

            {/* QR Scanner Modal */}
            {showScanner && (
                <QRScanner onScan={handleQRScan} onClose={() => setShowScanner(false)} />
            )}

            {/* Check-in Popup */}
            <RoundCheckInPopup
                open={popupOpen}
                onClose={() => {
                    setPopupOpen(false)
                    setScannedUserId(null)
                    setCheckInError(null)
                    checkInMutation.reset()
                }}
                participant={participant ?? null}
                isLoading={isParticipantLoading}
                error={participantError}
                onCheckIn={data => checkInMutation.mutate(data)}
                isCheckingIn={checkInMutation.isPending}
                checkInSuccess={checkInMutation.isSuccess}
                checkInError={checkInError}
            />
        </div>
    )
}

// ── Checked-In Table ─────────────────────────────────────────────────────────

type ParticipantStatus = RoundResultStatus

function entryId(entry: RoundCheckInEntry): string {
    return entry.type === "TEAM" ? `team:${entry.name}` : `solo:${entry.participant_id}`
}

/** Returns a participant ID suitable for the delete API for this entry.
 *  For teams any member works — the server deletes the entire team from the round. */
function entryParticipantId(entry: RoundCheckInEntry): string {
    return entry.type === "TEAM" ? entry.members[0]!.participant_id : entry.participant_id
}

// ── Confirmation Dialog ───────────────────────────────────────────────────────

interface ConfirmDialogProps {
    open: boolean
    title: string
    description: string
    confirmLabel?: string
    isPending?: boolean
    onConfirm: () => void
    onCancel: () => void
}

function ConfirmDialog({
    open,
    title,
    description,
    confirmLabel = "Confirm",
    isPending = false,
    onConfirm,
    onCancel,
}: ConfirmDialogProps) {
    if (!open) return null
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="bg-neutral-950 border border-neutral-800 w-full max-w-sm mx-4 shadow-2xl">
                <div className="px-6 pt-6 pb-4 border-b border-neutral-800">
                    <p className="text-sm font-bold text-white uppercase tracking-widest">
                        {title}
                    </p>
                </div>
                <div className="px-6 py-5">
                    <p className="text-sm text-neutral-400 leading-relaxed">{description}</p>
                </div>
                <div className="px-6 pb-6 flex items-center justify-end gap-3">
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={isPending}
                        className="px-4 py-2 text-xs font-bold uppercase tracking-widest border border-neutral-700 text-neutral-400 hover:bg-neutral-900 hover:text-white disabled:opacity-40 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={isPending}
                        className="px-4 py-2 text-xs font-bold uppercase tracking-widest border border-red-800 bg-red-950/60 text-red-400 hover:bg-red-900/60 hover:border-red-600 hover:text-red-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-red-500"
                    >
                        {isPending ? "Removing…" : confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    )
}

type ResultFeedback =
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

// ── Prize slot types ─────────────────────────────────────────────────────────

type PrizeSlot = 1 | 2 | 3;

interface WinnerSlot {
    entryId: string;
    label: string; // display name
    userId?: string;
    teamId?: string;
}

type WinnerAssignments = Map<PrizeSlot, WinnerSlot>;

type PrizeFeedback =
    | { kind: "success"; count: number }
    | { kind: "partial"; count: number; total: number; errors: { error: string; id: string }[] }
    | { kind: "failure"; errors: { error: string; id: string }[] };

// ── Winners Summary Banner ─────────────────────────────────────────────────────

const PLACE_LABELS: Record<PrizeSlot, string> = { 1: "1st Place", 2: "2nd Place", 3: "3rd Place" };
const PLACE_ICONS: Record<PrizeSlot, { label: string; cls: string }> = {
    1: { label: "🥇", cls: "text-yellow-400 border-yellow-700 bg-yellow-950/40" },
    2: { label: "🥈", cls: "text-neutral-300 border-neutral-600 bg-neutral-800/50" },
    3: { label: "🥉", cls: "text-amber-600 border-amber-800 bg-amber-950/40" },
};

interface CheckedInTableProps {
    eventId: string
    roundNo: string
    /** The current page's entries (for display) */
    data: RoundCheckInEntry[]
    /** All checked-in entries across every page – needed for the counter-status batch */
    allData: RoundCheckInEntry[];
    isLoading: boolean;
    error: Error | null;
    page: number;
    totalPages: number;
    total: number;
    pageLimit: number;
    onPrev: () => void;
    onNext: () => void;
    onSetPage: (page: number) => void;
    onSetLimit: (limit: number) => void;
    participationType?: string;
    searchInput: string;
    onSearchInputChange: (value: string) => void;
    activeSearch: string;
    onSearch: () => void;
    onClearSearch: () => void;
    /** True when this is the final round of the event */
    isLastRound?: boolean;
}

function CheckedInTable({
    eventId,
    roundNo,
    data,
    allData,
    isLoading,
    error,
    page,
    totalPages,
    total,
    pageLimit,
    onPrev,
    onNext,
    onSetPage,
    onSetLimit,
    participationType,
    searchInput,
    onSearchInputChange,
    activeSearch,
    onSearch,
    onClearSearch,
    isLastRound = false,
}: CheckedInTableProps) {
    const { api } = Route.useRouteContext();
    const queryClient = useQueryClient();
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [feedback, setFeedback] = useState<ResultFeedback | null>(null);
    const [isPendingBatch, setIsPendingBatch] = useState(false);
    // Auto mode: marks others with the counter-status automatically.
    // Manual mode: only updates the selected entries.
    // Persisted to localStorage so the preference survives tab switches.
    const [isAutoMode, setIsAutoMode] = useState<boolean>(() => {
        try {
            const stored = localStorage.getItem("checkin-assignment-mode");
            return stored === null ? true : stored === "auto";
        } catch {
            return true;
        }
    });

    function toggleAutoMode(value: boolean) {
        setIsAutoMode(value);
        try { localStorage.setItem("checkin-assignment-mode", value ? "auto" : "manual"); } catch { /* ignore */ }
    }

    // ── Winner-assignment state (last round only) ────────────────────────
    const [winners, setWinners] = useState<WinnerAssignments>(new Map());
    const [pendingPlaceTarget, setPendingPlaceTarget] = useState<PrizeSlot | null>(null);
    const [prizeFeedback, setPrizeFeedback] = useState<PrizeFeedback | null>(null);
    const [isSubmittingPrizes, setIsSubmittingPrizes] = useState(false);

    // Delete confirmation state
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
            const axiosErr = err as import("axios").AxiosError<{ message?: string }>
            const msg = axiosErr.response?.data?.message ?? "Failed to remove check-in"
            setFeedback({ kind: "delete-failure", message: msg })
            setPendingDelete(null)
        },
    })

    const allIds = data.map(entryId)
    const allSelected = allIds.length > 0 && allIds.every(id => selected.has(id))
    const someSelected = allIds.some(id => selected.has(id)) && !allSelected

    // Build a lookup from the FULL data set (not just the current page) so that
    // the counter-status batch can address entries that aren't visible right now.
    const entryMap = useMemo(() => new Map(allData.map(e => [entryId(e), e])), [allData])

    /** Convert a list of entryIds into the API `results` payload shape */
    function buildResults(
        ids: string[],
        status: ParticipantStatus
    ): { user_id?: string; team_id?: string; status: ParticipantStatus }[] {
        return ids
            .map(id => {
                const entry = entryMap.get(id)
                if (!entry) return null
                if (entry.type === "TEAM") {
                    return { team_id: entry.team_id ?? entry.name, status }
                }
                return { user_id: entry.participant_id, status }
            })
            .filter(Boolean) as {
            user_id?: string
            team_id?: string
            status: ParticipantStatus
        }[]
    }

    /** Post a single batch to the API and return structured result info */
    async function postBatch(
        ids: string[],
        status: ParticipantStatus
    ): Promise<{
        recorded: number
        userErrors: { user_id: string; error: string }[]
        teamErrors: { team_id: string; error: string }[]
    }> {
        if (ids.length === 0) return { recorded: 0, userErrors: [], teamErrors: [] }
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
            const axiosErr = err as AxiosError<{
                user_errors?: { user_id: string; error: string }[]
                team_errors?: { team_id: string; error: string }[]
            }>
            const body = axiosErr.response?.data
            return {
                recorded: 0,
                userErrors: body?.user_errors ?? [],
                teamErrors: body?.team_errors ?? [],
            }
        }
    }

    /**
     * Apply a status to selected entries.
     *
     * AUTO mode:
     *   – QUALIFIED: selected → QUALIFIED, everyone else → ELIMINATED
     *   – ELIMINATED: selected → ELIMINATED, everyone else → QUALIFIED
     * MANUAL mode:
     *   – Only the selected entries are updated.
     * DISQUALIFIED always behaves as manual-only regardless of mode.
     */
    async function applyStatus(status: ParticipantStatus) {
        setFeedback(null)
        setIsPendingBatch(true)

        const selectedIds = Array.from(selected)
        const selectedSet = new Set(selectedIds)

        try {
            if (status === "DISQUALIFIED" || !isAutoMode) {
                // Manual path — only update the selected entries.
                const { recorded, userErrors, teamErrors } = await postBatch(
                    selectedIds,
                    status,
                );
                const total = selectedIds.length;
                const hasErrors = userErrors.length > 0 || teamErrors.length > 0;
                if (recorded === 0) {
                    setFeedback({ kind: "failure", userErrors, teamErrors })
                } else if (hasErrors) {
                    setFeedback({ kind: "partial", count: recorded, total, userErrors, teamErrors });
                } else {
                    setFeedback({ kind: "success", count: recorded })
                    setTimeout(() => setFeedback(null), 4000)
                }
            } else {
                // Auto path — selected get the chosen status; everyone else gets the opposite.
                const counterStatus: ParticipantStatus =
                    status === "QUALIFIED" ? "ELIMINATED" : "QUALIFIED"

                const otherIds = allData.map(entryId).filter(id => !selectedSet.has(id))

                const [primaryResult, counterResult] = await Promise.all([
                    postBatch(selectedIds, status),
                    postBatch(otherIds, counterStatus),
                ])

                const totalRecorded = primaryResult.recorded + counterResult.recorded;
                const totalSubmitted = selectedIds.length + otherIds.length;
                const allUserErrors = [...primaryResult.userErrors, ...counterResult.userErrors];
                const allTeamErrors = [...primaryResult.teamErrors, ...counterResult.teamErrors];
                const hasErrors = allUserErrors.length > 0 || allTeamErrors.length > 0;

                if (totalRecorded === 0) {
                    setFeedback({ kind: "failure", userErrors: allUserErrors, teamErrors: allTeamErrors });
                } else if (hasErrors) {
                    setFeedback({ kind: "partial", count: totalRecorded, total: totalSubmitted, userErrors: allUserErrors, teamErrors: allTeamErrors });
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

    // ── Winner-assignment helpers ────────────────────────────────────────────

    /** Build a display label for a checked-in entry */
    function entryLabel(entry: RoundCheckInEntry): string {
        if (entry.type === "TEAM") return entry.name;
        return `${entry.first_name} ${entry.last_name}`;
    }

    /**
     * When a place-slot button is clicked:
     *  – If nothing is selected: toggle the slot as the "active" target so the
     *    operator can then click a row checkbox to assign it.
     *  – If exactly one entry is selected: immediately assign it to that slot.
     */
    function handlePlaceClick(place: PrizeSlot) {
        if (selected.size === 1) {
            const [eid] = Array.from(selected);
            const entry = entryMap.get(eid);
            if (!entry) return;

            // Remove this entry from any other slot it was in
            const next = new Map(winners);
            for (const [p, slot] of next.entries()) {
                if (slot.entryId === eid) next.delete(p);
            }

            next.set(place, {
                entryId: eid,
                label: entryLabel(entry),
                userId: entry.type === "SOLO" ? entry.participant_id : undefined,
                teamId: entry.type === "TEAM" ? (entry.team_id ?? undefined) : undefined,
            });
            setWinners(next);
            setSelected(new Set()); // deselect after assigning
            setPendingPlaceTarget(null);
        } else {
            // Toggle this slot as the pending target for next click
            setPendingPlaceTarget((prev) => (prev === place ? null : place));
        }
    }

    /** Remove a winner from a slot */
    function clearWinnerSlot(place: PrizeSlot) {
        const next = new Map(winners);
        next.delete(place);
        setWinners(next);
        if (pendingPlaceTarget === place) setPendingPlaceTarget(null);
    }

    // When a row is toggled while a pendingPlaceTarget is active, auto-assign.
    function handleToggleEntryWithPlaceContext(eid: string) {
        if (pendingPlaceTarget !== null) {
            const entry = entryMap.get(eid);
            if (!entry) return;

            const next = new Map(winners);
            // Remove the entry from any existing slot
            for (const [p, slot] of next.entries()) {
                if (slot.entryId === eid) next.delete(p);
            }
            next.set(pendingPlaceTarget, {
                entryId: eid,
                label: entryLabel(entry),
                userId: entry.type === "SOLO" ? entry.participant_id : undefined,
                teamId: entry.type === "TEAM" ? (entry.team_id ?? undefined) : undefined,
            });
            setWinners(next);
            setPendingPlaceTarget(null);
            return;
        }
        toggleEntry(eid);
    }

    /** Submit winners to POST /ops/events/:eventId/prizes */
    async function submitWinners() {
        if (winners.size === 0) return;
        setPrizeFeedback(null);
        setIsSubmittingPrizes(true);

        const results: AssignPrizes["results"] = [];
        for (const [position, slot] of winners.entries()) {
            if (slot.userId) {
                results.push({ user_id: slot.userId, position });
            } else if (slot.teamId) {
                results.push({ team_id: slot.teamId, position });
            }
        }

        // Collect the entryIds of winners to exclude them from ELIMINATED batch.
        const winnerEntryIds = new Set(
            Array.from(winners.values()).map((s) => s.entryId),
        );

        try {
            // 1. Assign prizes
            const res = await api.events.assignEventPrizes(eventId, { results });
            const recorded = res.data.recorded_count;
            const total = results.length;
            const errors = res.errors ?? res.data.errors ?? [];

            if (recorded === 0) {
                // Prize assignment fully failed — don't touch round statuses.
                setPrizeFeedback({
                    kind: "failure",
                    errors: errors.map((e) => ({
                        error: e.error,
                        id: e.user_id ?? (e as any).team_id ?? "",
                    })),
                });
                return;
            }

            // 2. In parallel: mark winners as QUALIFIED and everyone else as ELIMINATED
            //    in the round results table so the Results tab reflects reality.
            const winnerIds = Array.from(winnerEntryIds);
            const nonWinnerIds = allData
                .map(entryId)
                .filter((id) => !winnerEntryIds.has(id));

            await Promise.all([
                postBatch(winnerIds, "QUALIFIED"),
                postBatch(nonWinnerIds, "ELIMINATED"),
            ]);

            queryClient.invalidateQueries({ queryKey: ["round-results"] });

            if (errors.length > 0) {
                setPrizeFeedback({
                    kind: "partial",
                    count: recorded,
                    total,
                    errors: errors.map((e) => ({
                        error: e.error,
                        id: e.user_id ?? (e as any).team_id ?? "",
                    })),
                });
            } else {
                setPrizeFeedback({ kind: "success", count: recorded });
                setTimeout(() => setPrizeFeedback(null), 6000);
                setWinners(new Map());
            }
        } catch (err) {
            const axiosErr = err as AxiosError<{ message?: string; errors?: any[] }>;
            const body = axiosErr.response?.data;
            setPrizeFeedback({
                kind: "failure",
                errors: (body?.errors ?? []).map((e: any) => ({
                    error: e.error ?? body?.message ?? "Unknown error",
                    id: e.user_id ?? e.team_id ?? "",
                })),
            });
        } finally {
            setIsSubmittingPrizes(false);
        }
    }

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

    const selectedCount = selected.size
    const isPending = isPendingBatch

    return (
        <div className="relative">
            {/* ── Search Bar ── */}
            <div className="flex items-center gap-2 px-4 md:px-6 py-3 border-b border-neutral-800 bg-neutral-900/30">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                    <input
                        type="text"
                        placeholder="Search by name, ID, or phone..."
                        value={searchInput}
                        onChange={e => onSearchInputChange(e.target.value)}
                        onKeyDown={e => {
                            if (e.key === "Enter") {
                                e.preventDefault()
                                onSearch()
                            }
                        }}
                        className="w-full bg-neutral-950 border border-neutral-800 text-white pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-neutral-600"
                    />
                    {searchInput && (
                        <button
                            type="button"
                            onClick={onClearSearch}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white"
                        >
                            <Xmark className="w-4 h-4" />
                        </button>
                    )}
                </div>
                <button
                    type="button"
                    onClick={onSearch}
                    className="px-4 py-2 text-xs font-bold uppercase tracking-widest border border-neutral-700 text-neutral-300 hover:bg-neutral-800 transition-colors"
                >
                    Search
                </button>
                {activeSearch && (
                    <span className="text-xs text-neutral-500">
                        Showing {total} result{total !== 1 ? "s" : ""} for "{activeSearch}"
                    </span>
                )}
            </div>

            {/* ── Result Feedback Banner ── */}
            {feedback && (
                <div
                    className={`px-4 md:px-6 py-3 border-b text-xs font-medium flex flex-col gap-2 ${
                        feedback.kind === "success" || feedback.kind === "delete-success"
                            ? "bg-emerald-950/50 border-emerald-800 text-emerald-300"
                            : feedback.kind === "partial"
                              ? "bg-amber-950/50 border-amber-800 text-amber-300"
                              : "bg-red-950/50 border-red-900 text-red-400"
                    }`}
                >
                    <div className="flex items-start justify-between gap-3">
                        <span>
                            {feedback.kind === "success" &&
                                `✓ ${feedback.count} ${feedback.count === 1 ? "entry" : "entries"} updated successfully.`}
                            {feedback.kind === "delete-success" && `✓ ${feedback.message}`}
                            {feedback.kind === "delete-failure" && `✗ ${feedback.message}`}
                            {feedback.kind === "partial" &&
                                `⚠ ${feedback.count}/${feedback.total} entries updated. ${feedback.userErrors.length + feedback.teamErrors.length} failed:`}
                            {feedback.kind === "failure" &&
                                "✗ Failed to update any entries. Please try again."}
                        </span>
                        <button
                            type="button"
                            onClick={() => setFeedback(null)}
                            className="text-current opacity-60 hover:opacity-100 shrink-0 text-base leading-none"
                        >
                            ✕
                        </button>
                    </div>
                    {(feedback.kind === "partial" || feedback.kind === "failure") && (
                        <div className="space-y-0.5 pl-2 border-l-2 border-current/30">
                            {feedback.userErrors.map(e => (
                                <div key={e.user_id} className="font-mono opacity-80">
                                    {e.user_id}: {e.error}
                                </div>
                            ))}
                            {feedback.teamErrors.map(e => (
                                <div key={e.team_id} className="font-mono opacity-80">
                                    {e.team_id}: {e.error}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ── Winner Assignment Panel (last round only) ── */}
            {isLastRound && (
                <WinnerAssignmentPanel
                    winners={winners}
                    selectedCount={selectedCount}
                    selected={selected}
                    entryMap={entryMap}
                    pendingPlaceTarget={pendingPlaceTarget}
                    prizeFeedback={prizeFeedback}
                    isSubmittingPrizes={isSubmittingPrizes}
                    isPending={isPending}
                    onPlaceClick={handlePlaceClick}
                    onClearSlot={clearWinnerSlot}
                    onSubmitWinners={submitWinners}
                    onDisqualify={() => applyStatus("DISQUALIFIED")}
                    onClearSelection={() => setSelected(new Set())}
                    onDismissPrizeFeedback={() => setPrizeFeedback(null)}
                />
            )}

            {/* ── Status Action Bar (non-last rounds) ── */}
            {!isLastRound && (
                <>
                    {/* Mode toggle row — always visible */}
                    <div className="flex items-center gap-3 px-4 md:px-6 py-2 border-b border-neutral-800/60 bg-neutral-950">
                        <span className="text-[10px] text-neutral-600 uppercase tracking-widest font-bold">
                            Assignment Mode
                        </span>
                        <div className="flex items-center border border-neutral-800 overflow-hidden">
                            <button
                                type="button"
                                onClick={() => toggleAutoMode(true)}
                                className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest transition-colors duration-150 focus-visible:outline-none ${isAutoMode
                                    ? "bg-white text-black"
                                    : "bg-transparent text-neutral-600 hover:text-neutral-300"
                                    }`}
                            >
                                Auto
                            </button>
                            <div className="w-px h-4 bg-neutral-800" />
                            <button
                                type="button"
                                onClick={() => toggleAutoMode(false)}
                                className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest transition-colors duration-150 focus-visible:outline-none ${!isAutoMode
                                    ? "bg-white text-black"
                                    : "bg-transparent text-neutral-600 hover:text-neutral-300"
                                    }`}
                            >
                                Manual
                            </button>
                        </div>
                        <span className="text-[10px] text-neutral-700 italic">
                            {isAutoMode
                                ? "Qualifying auto-eliminates others, and vice versa"
                                : "Only selected entries are updated"}
                        </span>
                    </div>

                    {/* Selection action bar */}
                    <div
                        className={`sticky top-0 z-20 transition-all duration-300 ease-out overflow-hidden ${selectedCount > 0
                            ? "max-h-32 opacity-100"
                            : "max-h-0 opacity-0 pointer-events-none"
                            }`}
                    >
                        <div className="bg-neutral-900 border-b border-neutral-700 px-4 md:px-6 py-3 flex items-center gap-3 flex-wrap shadow-lg shadow-black/40">
                            {/* Count + label */}
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-white text-black text-[11px] font-black shrink-0">
                                    {selectedCount}
                                </span>
                                <span className="text-xs text-neutral-300 font-medium">
                                    {selectedCount === 1 ? "entry" : "entries"} selected
                                </span>
                            </div>

                            {/* Status buttons */}
                            <div className="flex items-center gap-1.5 flex-wrap shrink-0">
                                {isPending && (
                                    <span className="text-[11px] text-neutral-500 uppercase tracking-widest animate-pulse mr-1">
                                        Saving…
                                    </span>
                                )}
                                <button
                                    type="button"
                                    disabled={isPending}
                                    onClick={() => applyStatus("QUALIFIED")}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest border border-emerald-700 bg-emerald-950/60 text-emerald-400 hover:bg-emerald-900/60 hover:border-emerald-500 hover:text-emerald-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-400"
                                >
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                                    Qualified
                                    {isAutoMode && <span className="opacity-50 text-[9px] normal-case tracking-normal font-normal ml-0.5">+auto</span>}
                                </button>
                                <button
                                    type="button"
                                    disabled={isPending}
                                    onClick={() => applyStatus("ELIMINATED")}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest border border-amber-700 bg-amber-950/60 text-amber-400 hover:bg-amber-900/60 hover:border-amber-500 hover:text-amber-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-400"
                                >
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
                                    Eliminated
                                    {isAutoMode && <span className="opacity-50 text-[9px] normal-case tracking-normal font-normal ml-0.5">+auto</span>}
                                </button>
                                <button
                                    type="button"
                                    disabled={isPending}
                                    onClick={() => applyStatus("DISQUALIFIED")}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest border border-red-800 bg-red-950/60 text-red-400 hover:bg-red-900/60 hover:border-red-600 hover:text-red-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-red-400"
                                >
                                    <span className="w-1.5 h-1.5 rounded-full bg-red-400 inline-block" />
                                    Disqualified
                                </button>
                                <button
                                    type="button"
                                    disabled={isPending}
                                    onClick={() => setSelected(new Set())}
                                    className="px-2 py-1.5 text-[11px] text-neutral-600 hover:text-neutral-400 disabled:opacity-40 transition-colors duration-150 focus-visible:outline-none"
                                    aria-label="Clear selection"
                                >
                                    ✕
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Loading state */}
            {isLoading && (
                <div className="p-12 text-center text-neutral-500">
                    Loading checked-in participants...
                </div>
            )}

            {/* Error state */}
            {error && !isLoading && (
                <div className="p-12 text-center">
                    <p className="text-red-500 mb-2">Failed to load checked-in participants</p>
                    <p className="text-xs text-neutral-500">{String(error)}</p>
                </div>
            )}

            {/* Empty state */}
            {!isLoading && !error && data.length === 0 && (
                <div className="p-12 text-center text-neutral-500">
                    {activeSearch
                        ? `No results found for "${activeSearch}"`
                        : "No participants have checked in yet."}
                </div>
            )}

            {/* Mobile card view */}
            {!isLoading && !error && data.length > 0 && (
                <div className="md:hidden divide-y divide-neutral-800">
                    {data.map((entry, idx) => {
                        const id = entryId(entry);
                        const assignedPlace = (() => {
                            for (const [p, slot] of winners.entries()) {
                                if (slot.entryId === id) return p as PrizeSlot;
                            }
                            return null;
                        })();
                        return (
                            <CheckedInCard
                                key={idx}
                                entry={entry}
                                checked={selected.has(id)}
                                onToggle={() =>
                                    isLastRound
                                        ? handleToggleEntryWithPlaceContext(id)
                                        : toggleEntry(id)
                                }
                                assignedPlace={assignedPlace}
                                isLastRound={isLastRound}
                                onDelete={() => setPendingDelete(entry)}
                            />
                        )
                    })}
                </div>
            )}

            {/* Desktop table view */}
            {!isLoading && !error && data.length > 0 && (
                <div className="hidden md:block border border-neutral-800 bg-neutral-950 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-neutral-800 bg-neutral-900/60 font-mono">
                                    <th className="w-12 px-6 py-3 border-r border-neutral-800/60 bg-neutral-900/40">
                                        <input
                                            type="checkbox"
                                            checked={allSelected}
                                            ref={el => {
                                                if (el) el.indeterminate = someSelected
                                            }}
                                            onChange={toggleAll}
                                            className="w-4 h-4 bg-black border-neutral-700 rounded-none checked:bg-white checked:border-white transition-all cursor-pointer accent-white"
                                        />
                                    </th>
                                    {participationType?.toUpperCase() === "SOLO" ? (
                                        <th
                                            colSpan={2}
                                            className="px-6 py-3 text-left text-[10px] font-semibold text-neutral-400 uppercase tracking-widest border-r border-neutral-800/60"
                                        >
                                            Participant Details
                                        </th>
                                    ) : (
                                        <>
                                            <th className="px-6 py-3 text-left text-[10px] font-semibold text-neutral-400 uppercase tracking-widest border-r border-neutral-800/60 w-[200px]">
                                                Team / Entry
                                            </th>
                                            <th className="px-6 py-3 text-left text-[10px] font-semibold text-neutral-400 uppercase tracking-widest">
                                                Participant Name
                                            </th>
                                        </>
                                    )}
                                    <th className="px-6 py-3 text-left text-[10px] font-semibold text-neutral-400 uppercase tracking-widest">
                                        College & Degree
                                    </th>
                                    <th className="px-6 py-3 text-left text-[10px] font-semibold text-neutral-400 uppercase tracking-widest">
                                        Phone Number
                                    </th>
                                    <th className="w-16 px-4 py-3" />
                                </tr>
                            </thead>
                            <tbody>
                                {data.map((entry, idx) => {
                                    const id = entryId(entry);
                                    const assignedPlace = (() => {
                                        for (const [p, slot] of winners.entries()) {
                                            if (slot.entryId === id) return p as PrizeSlot;
                                        }
                                        return null;
                                    })();
                                    return (
                                        <CheckedInRowGroup
                                            key={idx}
                                            entry={entry}
                                            checked={selected.has(id)}
                                            onToggle={() =>
                                                isLastRound
                                                    ? handleToggleEntryWithPlaceContext(id)
                                                    : toggleEntry(id)
                                            }
                                            assignedPlace={assignedPlace}
                                            isLastRound={isLastRound}
                                            onDelete={() => setPendingDelete(entry)}
                                        />
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <TablePagination
                page={page}
                totalPages={totalPages}
                total={total}
                pageLimit={pageLimit}
                onPrev={onPrev}
                onNext={onNext}
                onSetPage={onSetPage}
                onSetLimit={onSetLimit}
            />

            <ConfirmDialog
                open={!!pendingDelete}
                title="Remove check-in?"
                description={
                    pendingDelete?.type === "TEAM"
                        ? `This will uncheck the entire team "${pendingDelete.name}" (${pendingDelete.members.length} member${pendingDelete.members.length !== 1 ? "s" : ""}) from round ${roundNo}. This cannot be undone.`
                        : `This will uncheck "${pendingDelete?.type === "SOLO" ? `${pendingDelete.first_name} ${pendingDelete.last_name}` : ""}" from round ${roundNo}. This cannot be undone.`
                }
                confirmLabel="Remove"
                isPending={deleteMutation.isPending}
                onConfirm={() => pendingDelete && deleteMutation.mutate(pendingDelete)}
                onCancel={() => setPendingDelete(null)}
            />
        </div>
    )
}

// ── Winner Assignment Panel ───────────────────────────────────────────────────

interface WinnerAssignmentPanelProps {
    winners: WinnerAssignments;
    selectedCount: number;
    selected: Set<string>;
    entryMap: Map<string, RoundCheckInEntry>;
    pendingPlaceTarget: PrizeSlot | null;
    prizeFeedback: PrizeFeedback | null;
    isSubmittingPrizes: boolean;
    isPending: boolean;
    onPlaceClick: (place: PrizeSlot) => void;
    onClearSlot: (place: PrizeSlot) => void;
    onSubmitWinners: () => void;
    onDisqualify: () => void;
    onClearSelection: () => void;
    onDismissPrizeFeedback: () => void;
}

function WinnerAssignmentPanel({
    winners,
    selectedCount,
    pendingPlaceTarget,
    prizeFeedback,
    isSubmittingPrizes,
    isPending,
    onPlaceClick,
    onClearSlot,
    onSubmitWinners,
    onDisqualify,
    onClearSelection,
    onDismissPrizeFeedback,
}: WinnerAssignmentPanelProps) {
    const places: PrizeSlot[] = [1, 2, 3];
    const hasAnyWinner = winners.size > 0;

    return (
        <div className="border-b border-neutral-800 bg-neutral-950">
            {/* ── Header ── */}
            <div className="flex items-center gap-3 px-4 md:px-6 py-3 border-b border-neutral-800/60 bg-neutral-900/40">
                <Trophy className="w-4 h-4 text-yellow-500 shrink-0" />
                <span className="text-xs font-bold text-white uppercase tracking-widest">
                    Final Round — Winner Selection
                </span>
                <span className="text-[10px] text-neutral-500 ml-auto">
                    Assign podium positions, then submit
                </span>
            </div>

            {/* ── Prize feedback banner ── */}
            {prizeFeedback && (
                <div
                    className={`px-4 md:px-6 py-3 border-b text-xs font-medium flex flex-col gap-2 ${prizeFeedback.kind === "success"
                        ? "bg-emerald-950/50 border-emerald-800 text-emerald-300"
                        : prizeFeedback.kind === "partial"
                            ? "bg-amber-950/50 border-amber-800 text-amber-300"
                            : "bg-red-950/50 border-red-900 text-red-400"
                        }`}
                >
                    <div className="flex items-start justify-between gap-3">
                        <span>
                            {prizeFeedback.kind === "success" &&
                                `✓ ${prizeFeedback.count} prize${prizeFeedback.count === 1 ? "" : "s"} assigned successfully!`}
                            {prizeFeedback.kind === "partial" &&
                                `⚠ ${prizeFeedback.count}/${prizeFeedback.total} prizes assigned. ${prizeFeedback.errors.length} failed:`}
                            {prizeFeedback.kind === "failure" &&
                                "✗ Failed to assign prizes. Please try again."}
                        </span>
                        <button
                            type="button"
                            onClick={onDismissPrizeFeedback}
                            className="text-current opacity-60 hover:opacity-100 shrink-0 text-base leading-none"
                        >
                            ✕
                        </button>
                    </div>
                    {(prizeFeedback.kind === "partial" || prizeFeedback.kind === "failure") &&
                        prizeFeedback.errors.length > 0 && (
                            <div className="space-y-0.5 pl-2 border-l-2 border-current/30">
                                {prizeFeedback.errors.map((e, i) => (
                                    <div key={i} className="font-mono opacity-80">
                                        {e.id ? `${e.id}: ` : ""}{e.error}
                                    </div>
                                ))}
                            </div>
                        )}
                </div>
            )}

            {/* ── Podium Slots ── */}
            <div className="px-4 md:px-6 py-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                {places.map((place) => {
                    const slot = winners.get(place);
                    const { label: medal, cls: slotCls } = PLACE_ICONS[place];
                    const isActive = pendingPlaceTarget === place;

                    return (
                        <div
                            key={place}
                            className={`relative border transition-all duration-150 ${isActive
                                ? "border-white bg-neutral-900 ring-1 ring-white"
                                : slot
                                    ? `${slotCls} border-2`
                                    : "border-neutral-800 bg-neutral-900/20"
                                }`}
                        >
                            {/* Place label */}
                            <div className="flex items-center gap-2 px-3 pt-3 pb-2">
                                <span className="text-base leading-none">{medal}</span>
                                <span
                                    className={`text-[10px] font-black uppercase tracking-widest ${isActive ? "text-white" : slot ? "text-current" : "text-neutral-600"
                                        }`}
                                >
                                    {PLACE_LABELS[place]}
                                </span>
                                {isActive && (
                                    <span className="ml-auto text-[9px] text-white font-bold uppercase tracking-widest animate-pulse">
                                        Select a row ↓
                                    </span>
                                )}
                            </div>

                            {/* Assigned name or empty-state button */}
                            <div className="px-3 pb-3">
                                {slot ? (
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="text-sm font-bold text-white truncate">
                                            {slot.label}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => onClearSlot(place)}
                                            className="shrink-0 text-neutral-500 hover:text-red-400 transition-colors duration-150"
                                            aria-label={`Remove ${PLACE_LABELS[place]} winner`}
                                        >
                                            <Xmark className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => onPlaceClick(place)}
                                        disabled={isSubmittingPrizes}
                                        className={`w-full text-left text-[10px] uppercase tracking-widest py-1 border transition-colors duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white disabled:opacity-40 ${isActive
                                            ? "border-white text-white px-2"
                                            : "border-neutral-800 text-neutral-600 hover:border-neutral-600 hover:text-neutral-400 px-2"
                                            }`}
                                    >
                                        {isActive
                                            ? "Waiting for selection…"
                                            : selectedCount === 1
                                                ? "Assign selected"
                                                : "Click to assign"}
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* ── Guidance + Action Bar ── */}
            <div className="flex flex-col md:flex-row items-start md:items-center gap-3 px-4 md:px-6 py-3 border-t border-neutral-800/60 bg-neutral-900/30">
                {/* Guidance text */}
                <p className="text-[10px] text-neutral-500 flex-1">
                    {pendingPlaceTarget
                        ? `Click a row checkbox to assign it to ${PLACE_LABELS[pendingPlaceTarget]}. Or select a row first, then click a place slot.`
                        : selectedCount === 1
                            ? `${selectedCount} entry selected. Click a place slot above to assign it.`
                            : selectedCount > 1
                                ? `${selectedCount} entries selected. Select only 1 at a time to assign a place.`
                                : "Select a participant row, then click a podium slot above to assign their position."}
                </p>

                <div className="flex items-center gap-2 shrink-0">
                    {/* Disqualify (manual, rare) */}
                    {selectedCount > 0 && (
                        <>
                            <button
                                type="button"
                                disabled={isPending}
                                onClick={onDisqualify}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest border border-red-800 bg-red-950/60 text-red-400 hover:bg-red-900/60 hover:border-red-600 hover:text-red-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-150"
                            >
                                <span className="w-1.5 h-1.5 rounded-full bg-red-400 inline-block" />
                                Disqualify
                            </button>
                            <button
                                type="button"
                                onClick={onClearSelection}
                                className="px-2 py-1.5 text-[11px] text-neutral-600 hover:text-neutral-400 transition-colors duration-150"
                            >
                                ✕
                            </button>
                        </>
                    )}

                    {/* Submit Winners */}
                    <button
                        type="button"
                        disabled={!hasAnyWinner || isSubmittingPrizes || isPending}
                        onClick={onSubmitWinners}
                        className={`inline-flex items-center gap-2 px-4 py-1.5 text-[11px] font-black uppercase tracking-widest border transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white ${hasAnyWinner
                            ? "border-white bg-white text-black hover:bg-neutral-200"
                            : "border-neutral-700 bg-neutral-900 text-neutral-300 hover:bg-neutral-800"
                            }`}
                    >
                        <Trophy className="w-3.5 h-3.5" />
                        {isSubmittingPrizes
                            ? "Submitting…"
                            : hasAnyWinner
                                ? `Submit ${winners.size} Winner${winners.size > 1 ? "s" : ""}`
                                : "Submit Winners"}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Status badge ──────────────────────────────────────────────────────────────

interface CheckedInRowGroupProps {
    entry: RoundCheckInEntry;
    checked: boolean;
    onToggle: () => void;
    assignedPlace?: PrizeSlot | null;
    isLastRound?: boolean;
    onDelete?: () => void;
}

function CheckedInRowGroup({
    entry,
    checked,
    onToggle,
    assignedPlace,
    isLastRound,
    onDelete,
}: CheckedInRowGroupProps) {
    const rowHighlight = checked ? "bg-neutral-900/50" : "";
    const winnerBorderCls = assignedPlace
        ? assignedPlace === 1
            ? "ring-1 ring-inset ring-yellow-700/60"
            : assignedPlace === 2
                ? "ring-1 ring-inset ring-neutral-500/40"
                : "ring-1 ring-inset ring-amber-800/50"
        : "";

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
    ) : null;

    if (entry.type === "SOLO") {
        return (
            <tr
                className={`hover:bg-neutral-900/40 transition-colors duration-150 border-b border-neutral-800/60 last:border-0 ${rowHighlight} ${winnerBorderCls}`}
            >
                <td className="w-12 px-6 py-4 border-r border-neutral-800/60 bg-neutral-950/20 align-middle text-center">
                    <input
                        type="checkbox"
                        checked={checked}
                        onChange={onToggle}
                        className="w-4 h-4 bg-black border-neutral-800 rounded-none checked:bg-white checked:border-white transition-all cursor-pointer accent-white mt-1"
                    />
                </td>
                <td
                    colSpan={2}
                    className="px-6 py-4 border-r border-neutral-800/60 bg-neutral-950/30 align-middle"
                >
                    <div className="flex items-center gap-4">
                        <div className="flex flex-col items-center justify-center space-y-1.5 min-w-[70px]">
                            <TypeBadge type="SOLO" />
                            {isLastRound && assignedPlace ? (
                                <span className={`text-[10px] font-black uppercase tracking-widest ${PLACE_ICONS[assignedPlace].cls} border px-1.5 py-0.5`}>
                                    {PLACE_ICONS[assignedPlace].label} {PLACE_LABELS[assignedPlace]}
                                </span>
                            ) : (
                                <p className="text-[9px] text-neutral-600 font-mono uppercase tracking-tighter">
                                    {new Date(entry.checkedin_at).toLocaleTimeString([], {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                    })}
                                </p>
                            )}
                        </div>
                        <div className="h-8 w-px bg-neutral-800/40" />
                        <div className="space-y-1">
                            <div className="text-sm font-bold text-white uppercase tracking-wider leading-tight">
                                {entry.first_name} {entry.last_name}
                            </div>
                            <div className="text-[10px] text-neutral-500 font-mono">
                                {entry.participant_id}
                            </div>
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
                            <td
                                rowSpan={entry.members.length}
                                className="w-12 px-6 py-4 border-r border-neutral-800/60 bg-neutral-950/20 align-middle"
                            >
                                <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={onToggle}
                                    className="w-4 h-4 bg-black border-neutral-800 rounded-none checked:bg-white checked:border-white transition-all cursor-pointer accent-white"
                                />
                            </td>
                            <td
                                rowSpan={entry.members.length}
                                className="px-6 py-4 border-r border-neutral-800/60 bg-neutral-950/30 align-middle"
                            >
                                <div className="flex flex-col items-center justify-center space-y-2 sticky top-4 text-center">
                                    <TypeBadge type="TEAM" />
                                    <div className="text-sm font-black text-white uppercase tracking-widest leading-none">
                                        {entry.name}
                                    </div>
                                    <div className="text-[9px] text-neutral-600 uppercase tracking-widest font-bold">
                                        {entry.members.length} members
                                    </div>
                                    {isLastRound && assignedPlace ? (
                                        <span className={`text-[10px] font-black uppercase tracking-widest ${PLACE_ICONS[assignedPlace].cls} border px-1.5 py-0.5 mt-1`}>
                                            {PLACE_ICONS[assignedPlace].label} {PLACE_LABELS[assignedPlace]}
                                        </span>
                                    ) : (
                                        <p className="text-[10px] text-neutral-600 mt-0.5 uppercase tracking-wider">
                                            {new Date(entry.checkedin_at).toLocaleTimeString([], {
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            })}
                                        </p>
                                    )}
                                </div>
                            </td>
                        </>
                    )}
                    <td className="px-6 py-4">
                        <div className="text-sm text-neutral-300">
                            {member.first_name} {member.last_name}
                        </div>
                        <div className="text-[10px] text-neutral-600 font-mono mt-0.5">
                            {member.participant_id}
                        </div>
                    </td>
                    <td className="px-6 py-4">
                        <div className="text-xs text-neutral-500">
                            <div className="truncate max-w-[240px]">{member.college}</div>
                            <div className="text-[10px] text-neutral-700 mt-0.5">
                                {member.degree}
                            </div>
                        </div>
                    </td>
                    <td className="px-6 py-4">
                        <div className="text-xs text-neutral-500 font-mono">{member.ph_no}</div>
                    </td>
                    {/* Delete button only on the first row (spans the team) */}
                    {mIdx === 0 && onDelete ? (
                        <td
                            rowSpan={entry.members.length}
                            className="w-16 px-4 align-middle text-center"
                        >
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

interface CheckedInCardProps {
    entry: RoundCheckInEntry;
    checked: boolean;
    onToggle: () => void;
    assignedPlace?: PrizeSlot | null;
    isLastRound?: boolean;
    onDelete?: () => void;
}

function CheckedInCard({ entry, checked, onToggle, assignedPlace, isLastRound, onDelete }: CheckedInCardProps) {
    const cardBase = `p-4 space-y-3 relative transition-colors duration-150 ${checked ? "bg-neutral-900/60" : ""}${assignedPlace && isLastRound
        ? assignedPlace === 1
            ? " ring-1 ring-inset ring-yellow-700/50"
            : assignedPlace === 2
                ? " ring-1 ring-inset ring-neutral-500/30"
                : " ring-1 ring-inset ring-amber-800/40"
        : ""
        }`;
    const checkboxCls =
        "w-5 h-5 bg-black border-neutral-700 rounded-none checked:bg-white checked:border-white transition-all cursor-pointer accent-white shrink-0"

    const header = (
        <div className="flex items-center gap-3">
            <input type="checkbox" checked={checked} onChange={onToggle} className={checkboxCls} />
            {entry.type === "TEAM" ? (
                <>
                    <TypeBadge type="TEAM" />
                    <span className="font-semibold text-white truncate flex-1">{entry.name}</span>
                </>
            ) : (
                <>
                    <TypeBadge type="SOLO" />
                    <span className="font-semibold text-white truncate flex-1">
                        {entry.first_name} {entry.last_name}
                    </span>
                </>
            )}
            {/* Badge for assigned place (last round) */}
            {isLastRound && assignedPlace && (
                <span className={`shrink-0 text-[10px] font-black border px-1.5 py-0.5 ${PLACE_ICONS[assignedPlace].cls}`}>
                    {PLACE_ICONS[assignedPlace].label}
                </span>
            )}
            {/* Delete button */}
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
                    <span className="ml-auto">
                        {new Date(entry.checkedin_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                        })}
                    </span>
                </div>
            </div>
        )
    }
    return (
        <div className={cardBase}>
            {header}
            <div className="text-xs text-neutral-400 font-mono pl-8">
                {entry.participant_id} • {entry.ph_no}
            </div>
            <div className="flex gap-4 text-xs text-neutral-500 items-center pl-8">
                <span>{entry.college}</span>
                <span className="ml-auto">
                    {new Date(entry.checkedin_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                    })}
                </span>
            </div>
        </div>
    )
}

// ── Qualified Table ───────────────────────────────────────────────────────────

interface QualifiedTableProps {
    data: RoundQualifiedParticipant[]
    isLoading: boolean
    error: Error | null
    page: number
    totalPages: number
    total: number
    pageLimit: number
    onPrev: () => void
    onNext: () => void
    onSetPage: (page: number) => void
    onSetLimit: (limit: number) => void
    participationType?: string
    searchInput: string
    onSearchInputChange: (value: string) => void
    activeSearch: string
    onSearch: () => void
    onClearSearch: () => void
}

function QualifiedTable({
    data,
    isLoading,
    error,
    page,
    totalPages,
    total,
    pageLimit,
    onPrev,
    onNext,
    onSetPage,
    onSetLimit,
    participationType,
    searchInput,
    onSearchInputChange,
    activeSearch,
    onSearch,
    onClearSearch,
}: QualifiedTableProps) {
    return (
        <>
            {/* ── Search Bar ── */}
            <div className="flex items-center gap-2 px-4 md:px-6 py-3 border-b border-neutral-800 bg-neutral-900/30">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                    <input
                        type="text"
                        placeholder="Search by name, ID, or phone..."
                        value={searchInput}
                        onChange={e => onSearchInputChange(e.target.value)}
                        onKeyDown={e => {
                            if (e.key === "Enter") {
                                e.preventDefault()
                                onSearch()
                            }
                        }}
                        className="w-full bg-neutral-950 border border-neutral-800 text-white pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-neutral-600"
                    />
                    {searchInput && (
                        <button
                            type="button"
                            onClick={onClearSearch}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white"
                        >
                            <Xmark className="w-4 h-4" />
                        </button>
                    )}
                </div>
                <button
                    type="button"
                    onClick={onSearch}
                    className="px-4 py-2 text-xs font-bold uppercase tracking-widest border border-neutral-700 text-neutral-300 hover:bg-neutral-800 transition-colors"
                >
                    Search
                </button>
                {activeSearch && (
                    <span className="text-xs text-neutral-500">
                        Showing {total} result{total !== 1 ? "s" : ""} for "{activeSearch}"
                    </span>
                )}
            </div>

            {/* Loading state */}
            {isLoading && (
                <div className="p-12 text-center text-neutral-500">
                    Loading qualified participants...
                </div>
            )}

            {/* Error state */}
            {error && !isLoading && (
                <div className="p-12 text-center">
                    <p className="text-red-500 mb-2">Failed to load qualified participants</p>
                    <p className="text-xs text-neutral-500">{String(error)}</p>
                </div>
            )}

            {/* Empty state */}
            {!isLoading && !error && data.length === 0 && (
                <div className="p-12 text-center text-neutral-500">
                    {activeSearch
                        ? `No results found for "${activeSearch}"`
                        : "No qualified participants for this round yet."}
                </div>
            )}

            {/* Mobile card view */}
            {!isLoading && !error && data.length > 0 && (
                <div className="md:hidden divide-y divide-neutral-800">
                    {data.map((entry, idx) => (
                        <QualifiedCard key={idx} entry={entry} />
                    ))}
                </div>
            )}

            {/* Desktop table view */}
            {!isLoading && !error && data.length > 0 && (
                <div className="hidden md:block border border-neutral-800 bg-neutral-950 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-neutral-800 bg-neutral-900/60">
                                    {participationType?.toUpperCase() === "SOLO" ? (
                                        <th
                                            colSpan={2}
                                            className="px-6 py-3 text-left text-[10px] font-semibold text-neutral-400 uppercase tracking-widest border-r border-neutral-800/60"
                                        >
                                            Participant Details
                                        </th>
                                    ) : (
                                        <>
                                            <th className="px-6 py-3 text-left text-[10px] font-semibold text-neutral-400 uppercase tracking-widest border-r border-neutral-800/60 w-[200px]">
                                                Team / Entry
                                            </th>
                                            <th className="px-6 py-3 text-left text-[10px] font-semibold text-neutral-400 uppercase tracking-widest">
                                                Participant Name
                                            </th>
                                        </>
                                    )}
                                    <th className="px-6 py-3 text-left text-[10px] font-semibold text-neutral-400 uppercase tracking-widest">
                                        College & Degree
                                    </th>
                                    <th className="px-6 py-3 text-left text-[10px] font-semibold text-neutral-400 uppercase tracking-widest">
                                        Phone Number
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.map((entry, idx) => (
                                    <QualifiedRowGroup key={idx} entry={entry} />
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <TablePagination
                page={page}
                totalPages={totalPages}
                total={total}
                pageLimit={pageLimit}
                onPrev={onPrev}
                onNext={onNext}
                onSetPage={onSetPage}
                onSetLimit={onSetLimit}
            />
        </>
    )
}

function QualifiedRowGroup({ entry }: { entry: RoundQualifiedParticipant }) {
    if (entry.type === "SOLO") {
        return (
            <tr className="hover:bg-neutral-900/40 transition-colors duration-150 border-b border-neutral-800/60 last:border-0">
                <td
                    colSpan={2}
                    className="px-6 py-4 border-r border-neutral-800/60 bg-neutral-950/30 align-middle"
                >
                    <div className="flex items-center gap-4">
                        <div className="flex flex-col items-center justify-center space-y-1.5 min-w-[70px]">
                            <TypeBadge type="SOLO" />
                            <div className="text-[10px] text-neutral-600 font-bold uppercase tracking-widest">
                                Solo
                            </div>
                        </div>
                        <div className="h-8 w-px bg-neutral-800/40" />
                        <div className="space-y-1">
                            <div className="text-sm font-bold text-white uppercase tracking-wider leading-tight">
                                {entry.first_name} {entry.last_name}
                            </div>
                            <div className="text-[10px] text-neutral-500 font-mono">
                                {entry.participant_id}
                            </div>
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
            </tr>
        )
    }

    return (
        <>
            {entry.members.map((member, mIdx) => (
                <tr
                    key={member.participant_id}
                    className="hover:bg-neutral-900/20 transition-colors duration-150 border-b border-neutral-800/60 last:border-0"
                >
                    {mIdx === 0 && (
                        <td
                            rowSpan={entry.members.length}
                            className="px-6 py-4 border-r border-neutral-800/60 bg-neutral-950/30 align-middle"
                        >
                            <div className="flex flex-col items-center justify-center space-y-2 sticky top-4 text-center">
                                <TypeBadge type="TEAM" />
                                <div className="text-sm font-black text-white uppercase tracking-widest leading-none">
                                    {entry.name}
                                </div>
                                <div className="text-[9px] text-neutral-600 uppercase tracking-widest font-bold">
                                    {entry.members.length} members
                                </div>
                            </div>
                        </td>
                    )}
                    <td className="px-6 py-4">
                        <div className="text-sm text-neutral-300">
                            {member.first_name} {member.last_name}
                        </div>
                        <div className="text-[10px] text-neutral-600 font-mono mt-0.5">
                            {member.participant_id}
                        </div>
                    </td>
                    <td className="px-6 py-4">
                        <div className="text-xs text-neutral-500">
                            <div className="truncate max-w-[240px]">{member.college}</div>
                            <div className="text-[10px] text-neutral-700 mt-0.5">
                                {member.degree}
                            </div>
                        </div>
                    </td>
                    <td className="px-6 py-4">
                        <div className="text-xs text-neutral-500 font-mono">{member.ph_no}</div>
                    </td>
                </tr>
            ))}
        </>
    )
}

function QualifiedCard({ entry }: { entry: RoundQualifiedParticipant }) {
    if (entry.type === "TEAM") {
        return (
            <div className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                    <TypeBadge type="TEAM" />
                    <span className="font-semibold text-white">{entry.name}</span>
                </div>
                <div className="space-y-1">
                    {entry.members.map(m => (
                        <div key={m.participant_id} className="text-xs text-neutral-400 font-mono">
                            {m.first_name} {m.last_name} • {m.ph_no}
                        </div>
                    ))}
                </div>
                <div className="flex gap-4 text-xs text-neutral-500">
                    <span>{entry.members[0]?.college ?? "—"}</span>
                </div>
            </div>
        )
    }
    return (
        <div className="p-4 space-y-2">
            <div className="flex items-center gap-2">
                <TypeBadge type="SOLO" />
                <span className="font-semibold text-white">
                    {entry.first_name} {entry.last_name}
                </span>
            </div>
            <div className="text-xs text-neutral-400 font-mono">
                {entry.participant_id} • {entry.ph_no}
            </div>
            <div className="flex gap-4 text-xs text-neutral-500">
                <span>{entry.college}</span>
            </div>
        </div>
    )
}

// ── Results Tab ───────────────────────────────────────────────────────────────

function ResultsTab({
    eventId,
    roundNo,
    participationType,
    searchInput,
    onSearchInputChange,
    activeSearch,
    onSearch,
    onClearSearch,
    page,
    onSetPage,
    limit,
    onSetLimit,
    isLastRound = false,
}: {
    eventId: string;
    roundNo: string;
    participationType?: string;
    searchInput: string;
    onSearchInputChange: (value: string) => void;
    activeSearch: string;
    onSearch: () => void;
    onClearSearch: () => void;
    page: number;
    onSetPage: (page: number) => void;
    limit: number;
    onSetLimit: (limit: number) => void;
    isLastRound?: boolean;
}) {
    const { api } = Route.useRouteContext()
    const [statusFilter, setStatusFilter] = useState<
        "all" | "QUALIFIED" | "ELIMINATED" | "DISQUALIFIED"
    >("all")
    const [sort, setSort] = useState<"points_desc" | "points_asc" | "name_asc">("points_desc")

    // Winners query – only runs on the final round
    const {
        data: winnersData,
        isLoading: isWinnersLoading,
        error: winnersError,
        refetch: refetchWinners,
    } = useQuery({
        queryKey: ["event-winners", eventId],
        queryFn: () => api.events.getEventWinners(eventId),
        enabled: isLastRound,
        staleTime: 1000 * 60,
    });
    // Normal mode query
    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ["round-results", eventId, roundNo, statusFilter, sort, page, limit],
        queryFn: () =>
            api.events.getRoundResults(eventId, roundNo, {
                status: statusFilter === "all" ? undefined : statusFilter,
                sort,
                from: page * limit,
                limit: limit,
            }),
        enabled: !activeSearch,
        staleTime: 1000 * 30,
    })

    // Full dump query for search
    const { data: fullData, isLoading: isFullLoading } = useQuery({
        queryKey: ["round-results-full", eventId, roundNo, statusFilter, sort],
        queryFn: () =>
            api.events.getRoundResults(eventId, roundNo, {
                status: statusFilter === "all" ? undefined : statusFilter,
                sort,
                from: 0,
                limit: 9999,
            }),
        enabled: !!activeSearch,
        staleTime: 1000 * 30,
    })

    // Filter results client-side when searching
    const filteredResults = useMemo(() => {
        if (!activeSearch || !fullData?.data) return []
        const searchLower = activeSearch.toLowerCase()
        return fullData.data.filter(r => {
            return (
                r.name.toLowerCase().includes(searchLower) ||
                r.user_id.toLowerCase().includes(searchLower) ||
                r.ph_no.includes(searchLower) ||
                r.team_name?.toLowerCase().includes(searchLower) ||
                r.team_id?.toLowerCase().includes(searchLower)
            )
        })
    }, [activeSearch, fullData])

    const results = activeSearch ? filteredResults : (data?.data ?? [])
    const totalCount = activeSearch ? filteredResults.length : (data?.pagination.total ?? 0)
    const totalPages = Math.ceil(totalCount / limit) || 1

    // Client-side pagination for search results
    const paginatedResults = activeSearch
        ? filteredResults.slice(page * limit, (page + 1) * limit)
        : results

    const statusCounts = results.reduce<Record<string, number>>((acc, r) => {
        acc[r.status] = (acc[r.status] ?? 0) + 1
        return acc
    }, {})

    // Group results by team_id
    const groupedResults: {
        id: string
        members: RoundResultWithParticipant[]
    }[] = []
    paginatedResults.forEach(r => {
        if (r.team_id) {
            const groupKey = `team:${r.team_id}`
            const group = groupedResults.find(g => g.id === groupKey)
            if (group) {
                group.members.push(r)
            } else {
                groupedResults.push({ id: groupKey, members: [r] })
            }
        } else {
            groupedResults.push({ id: `user:${r.user_id}`, members: [r] })
        }
    })

    const isLoadingResults = activeSearch ? isFullLoading : isLoading

    const winners = winnersData?.data ?? [];
    // Sort by prize_position ascending, then deduplicate — keep only the first (lowest id)
    // entry per position in case a position was submitted more than once.
    const sortedWinners = [...winners]
        .sort((a, b) => a.prize_position - b.prize_position)
        .filter((w, _i, arr) => arr.findIndex(x => x.prize_position === w.prize_position) === _i);

    const PODIUM_META: Record<number, { medal: string; label: string; ringCls: string; bgCls: string; textCls: string; borderCls: string }> = {
        1: { medal: "🥇", label: "1st Place", ringCls: "ring-yellow-600/40", bgCls: "bg-yellow-950/30", textCls: "text-yellow-300", borderCls: "border-yellow-700/60" },
        2: { medal: "🥈", label: "2nd Place", ringCls: "ring-neutral-500/30", bgCls: "bg-neutral-800/30", textCls: "text-neutral-300", borderCls: "border-neutral-600/60" },
        3: { medal: "🥉", label: "3rd Place", ringCls: "ring-amber-700/30", bgCls: "bg-amber-950/20", textCls: "text-amber-500", borderCls: "border-amber-800/50" },
    };

    return (
        <div>
            {/* ── Winners Podium (last round only) ── */}
            {isLastRound && (
                <div className="border-b border-neutral-800">
                    {/* Header */}
                    <div className="flex items-center justify-between gap-3 px-4 md:px-6 py-3 bg-neutral-900/60 border-b border-neutral-800/60">
                        <div className="flex items-center gap-2">
                            <Trophy className="w-4 h-4 text-yellow-500" />
                            <span className="text-xs font-black text-white uppercase tracking-widest">
                                Event Winners
                            </span>
                        </div>
                        <button
                            type="button"
                            onClick={() => refetchWinners()}
                            className="text-[10px] text-neutral-600 hover:text-neutral-300 uppercase tracking-widest transition-colors border border-neutral-800 px-2 py-1 hover:border-neutral-600"
                        >
                            Refresh
                        </button>
                    </div>

                    {/* Loading */}
                    {isWinnersLoading && (
                        <div className="px-4 md:px-6 py-8 text-center text-[11px] text-neutral-600 uppercase tracking-widest animate-pulse">
                            Loading winners…
                        </div>
                    )}

                    {/* Error */}
                    {winnersError && !isWinnersLoading && (
                        <div className="px-4 md:px-6 py-6 text-center">
                            <p className="text-xs text-red-500">Failed to load winners</p>
                            <p className="text-[10px] text-neutral-600 mt-1">{String(winnersError)}</p>
                        </div>
                    )}

                    {/* Empty — no prizes assigned yet */}
                    {!isWinnersLoading && !winnersError && sortedWinners.length === 0 && (
                        <div className="px-4 md:px-6 py-8 text-center">
                            <p className="text-[11px] text-neutral-600 uppercase tracking-widest">
                                No winners assigned yet
                            </p>
                            <p className="text-[10px] text-neutral-700 mt-1">
                                Use the Checked-In tab to assign podium positions.
                            </p>
                        </div>
                    )}

                    {/* Podium grid */}
                    {!isWinnersLoading && !winnersError && sortedWinners.length > 0 && (
                        <div className="px-4 md:px-6 py-5 grid grid-cols-1 md:grid-cols-3 gap-4">
                            {sortedWinners.map((w) => {
                                const meta = PODIUM_META[w.prize_position] ?? PODIUM_META[1];
                                return (
                                    <div
                                        key={w.id}
                                        className={`relative border-2 ${meta.borderCls} ${meta.bgCls} ring-1 ${meta.ringCls} p-5 flex flex-col gap-3`}
                                    >
                                        {/* Position + medal */}
                                        <div className="flex items-center gap-2">
                                            <span className="text-2xl leading-none">{meta.medal}</span>
                                            <span className={`text-[10px] font-black uppercase tracking-widest ${meta.textCls}`}>
                                                {meta.label}
                                            </span>
                                        </div>

                                        {/* Winner identity */}
                                        <div className="space-y-0.5">
                                            <div className="text-sm font-black text-white uppercase tracking-wide leading-tight">
                                                {w.team_id ? (w.team_name || "Unknown Team") : (w.participant_name || "Unknown Participant")}
                                            </div>
                                            {w.team_id && (
                                                <div className="text-[10px] text-neutral-500 font-mono">
                                                    {w.team_id}
                                                </div>
                                            )}
                                        </div>

                                        {/* Stats row */}
                                        <div className={`flex items-center gap-4 pt-3 border-t ${meta.borderCls}`}>
                                            <div>
                                                <div className="text-lg font-black text-white tabular-nums leading-none">
                                                    {w.points}
                                                </div>
                                                <div className="text-[9px] text-neutral-600 uppercase tracking-widest font-bold mt-0.5">
                                                    Points
                                                </div>
                                            </div>
                                            <div className="h-6 w-px bg-neutral-800/60" />
                                            <div>
                                                <div className={`text-lg font-black tabular-nums leading-none ${meta.textCls}`}>
                                                    ₹{w.reward_value.toLocaleString()}
                                                </div>
                                                <div className="text-[9px] text-neutral-600 uppercase tracking-widest font-bold mt-0.5">
                                                    Prize
                                                </div>
                                            </div>
                                        </div>

                                        {/* Awarded by */}
                                        <div className="flex items-center gap-1.5 text-[9px] text-neutral-700 uppercase tracking-widest font-bold">
                                            <User className="w-3 h-3 shrink-0" />
                                            {w.awarded_by}
                                        </div>
                                    </div>
                                );
                            })}

                            {/* Placeholder slots for positions not yet assigned */}
                            {([1, 2, 3] as const).filter(pos => !sortedWinners.find(w => w.prize_position === pos)).map(pos => {
                                const meta = PODIUM_META[pos];
                                return (
                                    <div key={`empty-${pos}`} className={`border border-neutral-800 p-5 flex flex-col gap-3 opacity-40`}>
                                        <div className="flex items-center gap-2">
                                            <span className="text-2xl leading-none grayscale">{meta.medal}</span>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-neutral-600">
                                                {meta.label}
                                            </span>
                                        </div>
                                        <div className="text-[10px] text-neutral-700 uppercase tracking-widest">
                                            Not yet assigned
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* ── Search Bar ── */}
            <div className="flex items-center gap-2 px-4 md:px-6 py-3 border-b border-neutral-800 bg-neutral-900/30">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                    <input
                        type="text"
                        placeholder="Search by name, ID, phone, or team..."
                        value={searchInput}
                        onChange={e => onSearchInputChange(e.target.value)}
                        onKeyDown={e => {
                            if (e.key === "Enter") {
                                e.preventDefault()
                                onSearch()
                            }
                        }}
                        className="w-full bg-neutral-950 border border-neutral-800 text-white pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-neutral-600"
                    />
                    {searchInput && (
                        <button
                            type="button"
                            onClick={onClearSearch}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white"
                        >
                            <Xmark className="w-4 h-4" />
                        </button>
                    )}
                </div>
                <button
                    type="button"
                    onClick={onSearch}
                    className="px-4 py-2 text-xs font-bold uppercase tracking-widest border border-neutral-700 text-neutral-300 hover:bg-neutral-800 transition-colors"
                >
                    Search
                </button>
                {activeSearch && (
                    <span className="text-xs text-neutral-500">
                        Showing {totalCount} result{totalCount !== 1 ? "s" : ""} for "{activeSearch}
                        "
                    </span>
                )}
            </div>

            {/* ── Filter + Sort Bar ── */}
            <div className="flex flex-wrap items-center gap-2 px-4 md:px-6 py-3 border-b border-neutral-800 bg-neutral-900/30">
                {/* Status filter chips */}
                <div className="flex items-center gap-1.5 flex-wrap">
                    {(["all", "QUALIFIED", "ELIMINATED", "DISQUALIFIED"] as const).map(s => {
                        const active = statusFilter === s
                        const colorMap: Record<string, string> = {
                            all: "border-neutral-700 text-neutral-300 bg-neutral-900",
                            QUALIFIED: "border-emerald-700 text-emerald-300 bg-emerald-950/40",
                            ELIMINATED: "border-amber-700 text-amber-300 bg-amber-950/40",
                            DISQUALIFIED: "border-red-800 text-red-300 bg-red-950/40",
                        }
                        const inactiveColor =
                            "border-neutral-800 text-neutral-600 hover:text-neutral-400 hover:border-neutral-700"
                        return (
                            <button
                                key={s}
                                type="button"
                                onClick={() => {
                                    setStatusFilter(s)
                                    onSetPage(0)
                                }}
                                className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest border transition-colors duration-150 focus-visible:outline-none ${active ? colorMap[s] : inactiveColor}`}
                            >
                                {s === "all" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
                                {s !== "all" && statusCounts[s] != null && (
                                    <span className="ml-1 opacity-70">({statusCounts[s]})</span>
                                )}
                                {s === "all" && totalCount > 0 && (
                                    <span className="ml-1 opacity-70">({totalCount})</span>
                                )}
                            </button>
                        )
                    })}
                </div>

                {/* Sort selector */}
                <div className="ml-auto flex items-center gap-2">
                    <span className="text-[10px] text-neutral-600 uppercase tracking-widest">
                        Sort
                    </span>
                    <select
                        value={sort}
                        onChange={e => {
                            setSort(e.target.value as typeof sort)
                            onSetPage(0)
                        }}
                        className="bg-neutral-950 border border-neutral-800 text-neutral-400 text-[10px] uppercase tracking-widest px-2 py-1.5 focus:outline-none focus:border-neutral-600"
                    >
                        <option value="points_desc">Points ↓</option>
                        <option value="points_asc">Points ↑</option>
                        <option value="name_asc">Name A→Z</option>
                    </select>
                </div>

                <button
                    type="button"
                    onClick={() => refetch()}
                    className="text-[10px] text-neutral-600 hover:text-neutral-300 uppercase tracking-widest transition-colors duration-150 border border-neutral-800 px-2 py-1.5 hover:border-neutral-600"
                >
                    Refresh
                </button>
            </div>

            {/* ── Content ── */}
            {isLoadingResults && (
                <div className="p-12 text-center text-neutral-500">Loading results…</div>
            )}

            {error && !isLoadingResults && (
                <div className="p-12 text-center">
                    <p className="text-red-500 mb-2">Failed to load results</p>
                    <p className="text-xs text-neutral-500">{String(error)}</p>
                </div>
            )}

            {!isLoadingResults && !error && paginatedResults.length === 0 && (
                <div className="p-12 text-center text-neutral-500">
                    {activeSearch
                        ? `No results found for "${activeSearch}"`
                        : statusFilter === "all"
                          ? "No results recorded for this round yet."
                          : `No ${statusFilter.toLowerCase()} participants.`}
                </div>
            )}

            {!isLoadingResults && !error && paginatedResults.length > 0 && (
                <>
                    {/* Mobile cards */}
                    <div className="md:hidden divide-y divide-neutral-800 border border-neutral-800 bg-neutral-950 shadow-xl overflow-hidden">
                        {groupedResults.map(g => (
                            <ResultCardGroup key={g.id} members={g.members} />
                        ))}
                    </div>

                    {/* Desktop View */}
                    <div className="hidden md:block border border-neutral-800 bg-neutral-950 overflow-hidden shadow-2xl mt-4">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-neutral-800 bg-neutral-900/60">
                                        {participationType?.toUpperCase() === "SOLO" ? (
                                            <th
                                                colSpan={2}
                                                className="px-6 py-3 text-left text-[10px] font-semibold text-neutral-400 uppercase tracking-widest border-r border-neutral-800/60"
                                            >
                                                Participant Details
                                            </th>
                                        ) : (
                                            <>
                                                <th className="px-6 py-3 text-left text-[10px] font-semibold text-neutral-400 uppercase tracking-widest w-[200px] border-r border-neutral-800/60">
                                                    Entity
                                                </th>
                                                <th className="px-6 py-3 text-left text-[10px] font-semibold text-neutral-400 uppercase tracking-widest">
                                                    Participants
                                                </th>
                                            </>
                                        )}
                                        <th className="px-6 py-3 text-left text-[10px] font-semibold text-neutral-400 uppercase tracking-widest w-[240px] border-l border-neutral-800/60">
                                            Evaluation
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {groupedResults.map(group => (
                                        <ResultRowGroup
                                            key={group.id}
                                            members={group.members}
                                            participationType={participationType}
                                        />
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Pagination */}
                    <TablePagination
                        page={page}
                        totalPages={totalPages}
                        total={totalCount}
                        pageLimit={limit}
                        onPrev={() => onSetPage(Math.max(0, page - 1))}
                        onNext={() => onSetPage(page + 1)}
                        onSetPage={onSetPage}
                        onSetLimit={onSetLimit}
                    />
                </>
            )}
        </div>
    )
}

function ResultRowGroup({
    members,
    participationType,
}: {
    members: RoundResultWithParticipant[]
    participationType?: string
}) {
    const statusColor: Record<string, string> = {
        QUALIFIED: "text-emerald-400 border-emerald-800 bg-emerald-950/40",
        ELIMINATED: "text-amber-400 border-amber-800 bg-amber-950/40",
        DISQUALIFIED: "text-red-400 border-red-900 bg-red-950/40",
    }
    const dotColor: Record<string, string> = {
        QUALIFIED: "bg-emerald-400",
        ELIMINATED: "bg-amber-400",
        DISQUALIFIED: "bg-red-400",
    }

    const first = members[0]
    const s = first.status

    return (
        <>
            {members.map((r, idx) => (
                <tr
                    key={r.id}
                    className={`hover:bg-neutral-900/20 transition-colors duration-150 border-b border-neutral-800/60 last:border-0 ${idx === 0 ? "" : "border-t-0"}`}
                >
                    {/* Main Details Section */}
                    {participationType?.toUpperCase() === "SOLO" ? (
                        idx === 0 && (
                            <td
                                colSpan={2}
                                className="px-6 py-6 align-top bg-neutral-950/10 border-r border-neutral-800/60"
                            >
                                <div className="flex items-center gap-6">
                                    <div className="flex flex-col items-center justify-center space-y-1.5 min-w-[70px]">
                                        <TypeBadge type="SOLO" />
                                        <div className="text-[10px] text-neutral-500 font-medium uppercase tracking-tight">
                                            Individual
                                        </div>
                                    </div>
                                    <div className="h-10 w-px bg-neutral-800/40" />
                                    <div className="flex flex-col">
                                        <div className="text-sm font-bold text-white uppercase tracking-wider leading-tight">
                                            {r.name}
                                        </div>
                                        <div className="flex items-center gap-3 mt-1.5">
                                            <span className="text-[10px] text-neutral-500 font-mono uppercase">
                                                {r.user_id}
                                            </span>
                                            <span className="w-1 h-1 rounded-full bg-neutral-800" />
                                            <span className="text-[10px] text-emerald-500/80 font-mono font-medium">
                                                {r.ph_no}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </td>
                        )
                    ) : (
                        <>
                            {/* Entity Column - Left Rowspan (only render once) */}
                            {idx === 0 && (
                                <td
                                    className="px-6 py-6 align-top bg-neutral-950/10 border-r border-neutral-800/60"
                                    rowSpan={members.length}
                                >
                                    <div className="flex flex-col gap-4 sticky top-4">
                                        {first.team_id ? (
                                            <div className="space-y-1.5">
                                                <TypeBadge type="TEAM" />
                                                <div className="text-sm font-black text-white uppercase tracking-widest leading-none">
                                                    {first.team_name ?? first.team_id}
                                                </div>
                                                <div className="text-[10px] text-neutral-600 font-mono tracking-tight">
                                                    {first.team_id}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="space-y-1.5">
                                                <TypeBadge type="SOLO" />
                                                <div className="text-[10px] text-neutral-500 font-medium uppercase tracking-tight">
                                                    Individual Entry
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </td>
                            )}
                            {/* Participant Details Column - render for every member */}
                            <td className="px-6 py-5 align-top">
                                <div className="flex flex-col">
                                    <div className="text-sm font-semibold text-neutral-200">
                                        {r.name}
                                    </div>
                                    <div className="flex items-center gap-3 mt-1.5">
                                        <span className="text-[10px] text-neutral-500 font-mono uppercase">
                                            {r.user_id}
                                        </span>
                                        <span className="w-1 h-1 rounded-full bg-neutral-800" />
                                        <span className="text-[10px] text-emerald-500/80 font-mono font-medium">
                                            {r.ph_no}
                                        </span>
                                    </div>
                                </div>
                            </td>
                        </>
                    )}

                    {/* Evaluation Column - Right Rowspan */}
                    {idx === 0 && (
                        <td
                            className="px-6 py-6 align-top bg-neutral-950/30 border-l border-neutral-800/60"
                            rowSpan={members.length}
                        >
                            <div className="flex flex-col gap-4 sticky top-4">
                                {/* Evaluation Metrics */}
                                <div className="flex items-center gap-3 py-3 border-b border-neutral-800/50">
                                    <div className="shrink-0">
                                        <div className="text-xl font-black text-white tabular-nums leading-none">
                                            {first.points}
                                        </div>
                                        <div className="text-[9px] text-neutral-600 uppercase tracking-widest font-bold mt-1">
                                            Points
                                        </div>
                                    </div>
                                    <div className="h-8 w-px bg-neutral-800/50" />
                                    <span
                                        className={`inline-flex items-center gap-1.5 px-2 py-1 text-[10px] font-bold uppercase tracking-widest border ${statusColor[s] ?? "border-neutral-700 text-neutral-400"}`}
                                    >
                                        <span
                                            className={`w-1.5 h-1.5 rounded-full ${dotColor[s] ?? "bg-neutral-400"}`}
                                        />
                                        {s}
                                    </span>
                                </div>

                                {/* Evaluator Metadata */}
                                <div className="space-y-1">
                                    <div className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest flex items-center gap-2">
                                        <User className="w-3.5 h-3.5 text-neutral-700" />
                                        {first.eval_by}
                                    </div>
                                    <div className="text-[10px] text-neutral-600 font-mono pl-5">
                                        {new Date(first.eval_at)
                                            .toLocaleTimeString([], {
                                                hour: "2-digit",
                                                minute: "2-digit",
                                                hour12: true,
                                            })
                                            .toUpperCase()}
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

function ResultCardGroup({ members }: { members: RoundResultWithParticipant[] }) {
    const statusColor: Record<string, string> = {
        QUALIFIED: "text-emerald-400",
        ELIMINATED: "text-amber-400",
        DISQUALIFIED: "text-red-400",
    }
    const first = members[0]

    return (
        <div className="p-5 space-y-6">
            {/* Evaluation Header */}
            <div className="flex items-start justify-between gap-4">
                <div className="space-y-2 flex-1">
                    {first.team_id ? (
                        <>
                            <TypeBadge type="TEAM" />
                            <div className="text-base font-black text-white uppercase tracking-widest leading-tight">
                                {first.team_name ?? first.team_id}
                            </div>
                            <div className="text-[10px] text-neutral-600 font-mono tracking-tighter">
                                {first.team_id}
                            </div>
                        </>
                    ) : (
                        <div className="space-y-2">
                            <TypeBadge type="SOLO" />
                            <div className="text-sm font-black text-white uppercase tracking-widest">
                                Individual Result
                            </div>
                        </div>
                    )}
                </div>
                <div className="text-right shrink-0">
                    <div className="text-[9px] font-bold uppercase tracking-widest text-neutral-600 mb-1">
                        Raw Score
                    </div>
                    <div className="text-2xl font-black text-white tabular-nums leading-none tracking-tighter">
                        {first.points}
                    </div>
                    <div
                        className={`text-[10px] font-black uppercase tracking-widest mt-2 px-1.5 py-0.5 border ${statusColor[first.status] ? "border-current opacity-90" : "border-neutral-800 text-neutral-500"} ${statusColor[first.status] ?? ""}`}
                    >
                        {first.status}
                    </div>
                </div>
            </div>

            {/* Members Section - Styled like Event Registration Mobile View */}
            <div className="space-y-5 pl-4 border-l-2 border-neutral-900">
                <div className="text-[9px] font-bold uppercase tracking-[0.2em] text-neutral-700">
                    {members.length === 1 ? "PARTICIPANT" : `MEMBERS (${members.length})`}
                </div>
                <div className="space-y-4">
                    {members.map(m => (
                        <div key={m.id} className="group">
                            <div className="flex items-center justify-between gap-3">
                                <div className="text-xs font-bold text-neutral-200">{m.name}</div>
                                <div className="text-[10px] text-emerald-500/60 font-mono font-medium">
                                    {m.ph_no}
                                </div>
                            </div>
                            <div className="text-[10px] text-neutral-600 font-mono mt-0.5 uppercase tracking-tighter">
                                {m.user_id}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Evaluation Metadata Footer */}
            <div className="flex flex-col gap-1 pt-4 border-t border-neutral-800/50">
                <div className="flex items-center gap-2 text-[10px] text-neutral-500 font-bold uppercase tracking-widest">
                    <User className="w-3.5 h-3.5 text-neutral-800" />
                    Evaluated by {first.eval_by}
                </div>
                <div className="text-[10px] text-neutral-700 font-mono pl-5 italic">
                    {new Date(first.eval_at)
                        .toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: true,
                        })
                        .toUpperCase()}
                </div>
            </div>
        </div>
    )
}

// ── Shared sub-components ─────────────────────────────────────────────────────

function TypeBadge({ type }: { type: "TEAM" | "SOLO" }) {
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

interface TablePaginationProps {
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

function TablePagination({
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
                            className={`min-w-[28px] h-[28px] flex items-center justify-center text-[10px] font-bold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white border ${
                                isCurrent
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
                            onChange={e => onSetLimit(parseInt(e.target.value, 10))}
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
