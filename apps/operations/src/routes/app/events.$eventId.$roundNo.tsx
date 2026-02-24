import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import type { AxiosError } from "axios"
import { ArrowLeft, ScanQrCode } from "iconoir-react"
import { useMemo, useState } from "react"
import { Button } from "@/ui/Button"
import { Field } from "@/ui/Field"
import { Input } from "@/ui/Input"
import { QRScanner } from "@/ui/QRScanner"
import { RoundCheckInPopup } from "@/ui/RoundCheckInPopup"
import { CheckedInTable } from "@/ui/CheckedInTable"
import { QualifiedTable } from "@/ui/QualifiedTable"
import { ResultsTab } from "@/ui/ResultsTab"

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
                            `${m.first_name} ${m.last_name}`.toLowerCase().includes(searchLower) ||
                            m.participant_id.toLowerCase().includes(searchLower) ||
                            m.ph_no.includes(searchLower)
                    )
                )
            }
            return (
                `${entry.first_name} ${entry.last_name}`.toLowerCase().includes(searchLower) ||
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
                            `${m.first_name} ${m.last_name}`.toLowerCase().includes(searchLower) ||
                            m.participant_id.toLowerCase().includes(searchLower) ||
                            m.ph_no.includes(searchLower)
                    )
                )
            }
            return (
                `${entry.first_name} ${entry.last_name}`.toLowerCase().includes(searchLower) ||
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

    const isLastRound =
        !!event?.rounds?.length && roundNumber === Math.max(...event.rounds.map(r => r.round_no))

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
                    {targetRound ? targetRound.round_name : "Scan QR codes"}
                </h2>
                <p className="text-neutral-500">Round {roundNo}</p>
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
                                    e.currentTarget.blur()
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

            {/* ── Participants Section ────────────────────────────────────────────── */}
            <div className="bg-neutral-950 border border-neutral-800">
                {/* Tab Navigation */}
                <div className="border-b border-neutral-800">
                    {/* Mobile Dropdown */}
                    <div className="md:hidden p-4 bg-neutral-900/30">
                        <select
                            value={activeTab}
                            onChange={e => setActiveTab(e.target.value as typeof activeTab)}
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
                        isLastRound={isLastRound}
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
                        isLastRound={isLastRound}
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
