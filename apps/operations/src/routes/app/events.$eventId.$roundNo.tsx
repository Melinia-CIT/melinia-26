import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ScanQrCode, ArrowLeft, Group, User, NavArrowLeft, NavArrowRight } from "iconoir-react";
import { useState } from "react";
import type { AxiosError } from "axios";
import { Button } from "@/ui/Button";
import { Field } from "@/ui/Field";
import { Input } from "@/ui/Input";
import { RoundCheckInPopup } from "@/ui/RoundCheckInPopup";
import { QRScanner } from "@/ui/QRScanner";
import type { RoundCheckInEntry, RoundQualifiedParticipant, RoundResultStatus, RoundResultWithParticipant } from "@/api/events";

export const Route = createFileRoute('/app/events/$eventId/$roundNo')({
    component: RoundCheckInPage,
})

function RoundCheckInPage() {
    const { eventId, roundNo } = Route.useParams();
    const { api } = Route.useRouteContext();
    const queryClient = useQueryClient();
    const [searchInput, setSearchInput] = useState("");
    const [scannedUserId, setScannedUserId] = useState<string | null>(null);
    const [popupOpen, setPopupOpen] = useState(false);
    const [showScanner, setShowScanner] = useState(false);
    const [qrError, setQrError] = useState("");
    const [checkInError, setCheckInError] = useState<string | null>(null);
    const [isRequestingCamera, setIsRequestingCamera] = useState(false);

    // Participants section state
    const [activeTab, setActiveTab] = useState<"participants" | "checkedin" | "results">("participants");
    const [checkInsPage, setCheckInsPage] = useState(0);
    const [qualifiedPage, setQualifiedPage] = useState(0);
    const [resultsPage, setResultsPage] = useState(1); // API uses 1-based pages
    const PAGE_LIMIT = 10;

    const participantIdPattern = /^MLNU[A-Za-z0-9]{6}$/;

    const roundNumber = parseInt(roundNo, 10);

    // Fetch detailed event data to show context
    const { data: event } = useQuery({
        queryKey: ['event-detail', eventId],
        queryFn: () => api.events.getById(eventId),
        staleTime: 1000 * 60,
    });
    const targetRound = event?.rounds.find(r => r.round_no === roundNumber);

    // Fetch the participant when a user_id is scanned
    const { data: participant, isLoading: isParticipantLoading, error: participantError } = useQuery({
        queryKey: ['round-participant', eventId, roundNumber, scannedUserId],
        queryFn: () => api.events.getRoundParticipant(eventId, roundNumber, scannedUserId!),
        enabled: !!scannedUserId && popupOpen,
        retry: false,
    });

    // Fetch checked-in participants
    const {
        data: checkInsData,
        isLoading: isCheckInsLoading,
        error: checkInsError,
    } = useQuery({
        queryKey: ['round-checkins', eventId, roundNo, checkInsPage],
        queryFn: () => api.events.getRoundCheckIns(eventId, roundNo, { from: checkInsPage * PAGE_LIMIT, limit: PAGE_LIMIT }),
        enabled: true,
        staleTime: 1000 * 30,
    });

    // Fetch qualified participants
    const {
        data: qualifiedData,
        isLoading: isQualifiedLoading,
        error: qualifiedError,
    } = useQuery({
        queryKey: ['round-qualified', eventId, roundNo, qualifiedPage],
        queryFn: () => api.events.getRoundParticipants(eventId, roundNo, { from: qualifiedPage * PAGE_LIMIT, limit: PAGE_LIMIT }),
        enabled: true,
        staleTime: 1000 * 30,
    });

    // Fetch round results (for Results tab)
    const {
        data: roundResultsData,
        isLoading: isResultsLoading,
        error: resultsError,
    } = useQuery({
        queryKey: ['round-results', eventId, roundNo, resultsPage],
        queryFn: () => api.events.getRoundResults(eventId, roundNo, { page: resultsPage, limit: PAGE_LIMIT }),
        enabled: activeTab === "results",
        staleTime: 1000 * 30,
    });

    // Check-in mutation
    const checkInMutation = useMutation({
        mutationFn: ({ userIds, teamId }: { userIds: string[], teamId: string | null }) => api.events.checkInRound(eventId, roundNumber, userIds, teamId),
        onSuccess: () => {
            setQrError("");
            setCheckInError(null);
            // Invalidate queries to update table and badges
            queryClient.invalidateQueries({ queryKey: ['round-checkins'] });
            queryClient.invalidateQueries({ queryKey: ['round-participant'] });
        },
        onError: (error) => {
            console.error("Check-in error:", error);
            const axiosErr = error as AxiosError<{ message?: string }>;
            const message = axiosErr.response?.data?.message;
            setCheckInError(message || "Failed to check in. Please try again.");
        },
    });

    const handleSearch = (query: string) => {
        const normalizedQuery = query.trim().toUpperCase();

        if (participantIdPattern.test(normalizedQuery)) {
            setScannedUserId(normalizedQuery);
            setPopupOpen(true);
            setSearchInput("");
            setQrError("");
            setCheckInError(null);
            return;
        } else {
            setQrError("Invalid ID format. Must be MLNU followed by 6 characters.");
        }
    };

    const handleQRScan = (scannedText: string) => {
        setShowScanner(false);
        setQrError("");
        setSearchInput("");
        setCheckInError(null);

        let userId: string;

        try {
            const parsed = JSON.parse(scannedText);
            userId = String(parsed.user_id ?? parsed.id ?? scannedText);
        } catch {
            userId = scannedText;
        }

        userId = userId.trim().toUpperCase();

        if (!participantIdPattern.test(userId)) {
            setQrError(
                `Invalid QR code format. Expected MLNU followed by 6 alphanumeric characters, got: ${userId}`,
            );
            return;
        }

        setScannedUserId(userId);
        setPopupOpen(true);
    };

    const handleOpenScanner = async () => {
        setIsRequestingCamera(true);
        setQrError("");

        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error("Camera API not supported in this browser");
            }

            let stream: MediaStream;
            try {
                stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: "environment" },
                });
            } catch {
                stream = await navigator.mediaDevices.getUserMedia({
                    video: true,
                });
            }

            stream.getTracks().forEach((track) => {
                track.stop();
            });
            setShowScanner(true);
        } catch (err) {
            console.error("Camera permission denied:", err);
            let errorMessage = "Failed to access camera. ";

            if (err instanceof DOMException) {
                switch (err.name) {
                    case "NotAllowedError":
                        errorMessage += "Please allow camera access to scan QR codes.";
                        break;
                    case "NotFoundError":
                        errorMessage += "No camera found on this device.";
                        break;
                    case "NotReadableError":
                        errorMessage += "Camera is already in use by another application.";
                        break;
                    case "OverconstrainedError":
                        errorMessage += "No suitable camera found.";
                        break;
                    default:
                        errorMessage += "Please check your camera permissions.";
                }
            } else if (err instanceof Error) {
                errorMessage = err.message;
            } else {
                errorMessage += "Please check your camera permissions.";
            }

            setQrError(errorMessage);
        } finally {
            setIsRequestingCamera(false);
        }
    };

    const checkInsTotalPages = checkInsData
        ? Math.ceil(checkInsData.pagination.total / PAGE_LIMIT) || 1
        : 1;
    const qualifiedTotalPages = qualifiedData
        ? Math.ceil(qualifiedData.pagination.total / PAGE_LIMIT) || 1
        : 1;

    // Derived counts for badges
    const checkInCount = checkInsData ? (checkInsData.pagination.total || checkInsData.data.length) : 0;
    const participantsCount = qualifiedData ? (qualifiedData.pagination.total || qualifiedData.data.length) : 0;

    return (
        <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
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
                            onChange={(e) => setSearchInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    e.preventDefault();
                                    handleSearch(searchInput);
                                }
                            }}
                            className="flex-1"
                        />
                        <Button
                            variant="primary"
                            onClick={() => handleSearch(searchInput)}
                        >
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
                            onChange={(e) => setActiveTab(e.target.value as any)}
                            className="w-full bg-neutral-950 border border-neutral-800 text-white px-4 py-3 text-xs uppercase tracking-widest font-bold focus:outline-none focus:ring-1 focus:ring-white appearance-none"
                            style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'white\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'%3E%3C/path%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1em' }}
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
                            className={`px-6 py-3 text-sm font-medium uppercase tracking-wider transition-colors duration-150 border-b-2 flex-shrink-0 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white ${activeTab === "participants"
                                ? "text-white border-white"
                                : "text-neutral-500 border-transparent hover:text-neutral-300 hover:border-neutral-700"
                                }`}
                        >
                            Participants
                            <span className={`ml-2 text-xs px-1.5 py-0.5 border ${activeTab === "participants"
                                ? "bg-white text-black border-white"
                                : "bg-neutral-800 text-neutral-400 border-neutral-700"
                                }`}>
                                {participantsCount}
                            </span>
                        </button>
                        <button
                            id="tab-checkedin"
                            type="button"
                            onClick={() => setActiveTab("checkedin")}
                            className={`px-6 py-3 text-sm font-medium uppercase tracking-wider transition-colors duration-150 border-b-2 flex-shrink-0 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white ${activeTab === "checkedin"
                                ? "text-white border-white"
                                : "text-neutral-500 border-transparent hover:text-neutral-300 hover:border-neutral-700"
                                }`}
                        >
                            Checked-In
                            <span className={`ml-2 text-xs px-1.5 py-0.5 border ${activeTab === "checkedin"
                                ? "bg-white text-black border-white"
                                : "bg-neutral-800 text-neutral-400 border-neutral-700"
                                }`}>
                                {checkInCount}
                            </span>
                        </button>
                        <button
                            id="tab-results"
                            type="button"
                            onClick={() => setActiveTab("results")}
                            className={`px-6 py-3 text-sm font-medium uppercase tracking-wider transition-colors duration-150 border-b-2 flex-shrink-0 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white ${activeTab === "results"
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
                        data={qualifiedData?.data ?? []}
                        isLoading={isQualifiedLoading}
                        error={qualifiedError}
                        page={qualifiedPage}
                        totalPages={qualifiedTotalPages}
                        total={qualifiedData?.pagination.total ?? 0}
                        pageLimit={PAGE_LIMIT}
                        onPrev={() => setQualifiedPage(p => Math.max(0, p - 1))}
                        onNext={() => setQualifiedPage(p => p + 1)}
                    />
                )}
                {activeTab === "checkedin" && (
                    <CheckedInTable
                        eventId={eventId}
                        roundNo={roundNo}
                        data={checkInsData?.data ?? []}
                        isLoading={isCheckInsLoading}
                        error={checkInsError}
                        page={checkInsPage}
                        totalPages={checkInsTotalPages}
                        total={checkInsData?.pagination.total ?? 0}
                        pageLimit={PAGE_LIMIT}
                        onPrev={() => setCheckInsPage(p => Math.max(0, p - 1))}
                        onNext={() => setCheckInsPage(p => p + 1)}
                    />
                )}
                {activeTab === "results" && (
                    <ResultsTable
                        data={roundResultsData?.data ?? []}
                        isLoading={isResultsLoading}
                        error={resultsError as Error | null}
                        page={resultsPage}
                        totalPages={roundResultsData?.totalPages ?? 1}
                        total={roundResultsData?.total ?? 0}
                        pageLimit={PAGE_LIMIT}
                        onPrev={() => setResultsPage(p => Math.max(1, p - 1))}
                        onNext={() => setResultsPage(p => p + 1)}
                    />
                )}
            </div>

            {/* QR Scanner Modal */}
            {showScanner && (
                <QRScanner
                    onScan={handleQRScan}
                    onClose={() => setShowScanner(false)}
                />
            )}

            {/* Check-in Popup */}
            <RoundCheckInPopup
                open={popupOpen}
                onClose={() => {
                    setPopupOpen(false);
                    setScannedUserId(null);
                    setCheckInError(null);
                    checkInMutation.reset();
                }}
                participant={participant ?? null}
                isLoading={isParticipantLoading}
                error={participantError}
                onCheckIn={(data) => checkInMutation.mutate(data)}
                isCheckingIn={checkInMutation.isPending}
                checkInSuccess={checkInMutation.isSuccess}
                checkInError={checkInError}
            />
        </div>
    );
}

// ── Results Table ─────────────────────────────────────────────────────────────

interface ResultsTableProps {
    data: RoundResultWithParticipant[];
    isLoading: boolean;
    error: Error | null;
    page: number;
    totalPages: number;
    total: number;
    pageLimit: number;
    onPrev: () => void;
    onNext: () => void;
}

const STATUS_STYLES: Record<string, { badge: string; dot: string; label: string }> = {
    QUALIFIED: { badge: "border-emerald-700 bg-emerald-950/40 text-emerald-400", dot: "bg-emerald-400", label: "Qualified" },
    ELIMINATED: { badge: "border-amber-700  bg-amber-950/40  text-amber-400", dot: "bg-amber-400", label: "Eliminated" },
    DISQUALIFIED: { badge: "border-red-800    bg-red-950/40    text-red-400", dot: "bg-red-400", label: "Disqualified" },
};

function ResultStatusBadge({ status }: { status: string }) {
    const s = STATUS_STYLES[status] ?? { badge: "border-neutral-700 bg-neutral-900 text-neutral-400", dot: "bg-neutral-500", label: status };
    return (
        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest border whitespace-nowrap ${s.badge}`}>
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${s.dot}`} />
            {s.label}
        </span>
    );
}

function ResultsTable({ data, isLoading, error, page, totalPages, total, pageLimit, onPrev, onNext }: ResultsTableProps) {
    if (isLoading) {
        return (
            <div className="p-12 text-center text-neutral-500 font-mono text-sm">
                Loading results…
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-12 text-center space-y-2">
                <p className="text-red-500 text-sm font-medium">Failed to load round results</p>
                <p className="text-xs text-neutral-600 font-mono">{String(error)}</p>
            </div>
        );
    }

    if (data.length === 0) {
        return (
            <div className="p-12 text-center text-neutral-500 text-sm">
                No results recorded for this round yet.
            </div>
        );
    }

    // Group adjacent results by team_id to use rowSpan
    const groups: Array<{
        type: "team" | "solo";
        team_id?: string;
        team_name?: string | null;
        points: number;
        status: string;
        eval_at: Date;
        eval_by: string;
        members: RoundResultWithParticipant[];
    }> = [];

    data.forEach((item) => {
        if (item.team_id) {
            const lastGroup = groups[groups.length - 1];
            if (lastGroup && lastGroup.type === "team" && lastGroup.team_id === item.team_id) {
                lastGroup.members.push(item);
            } else {
                groups.push({
                    type: "team",
                    team_id: item.team_id,
                    team_name: item.team_name,
                    points: item.points,
                    status: item.status,
                    eval_at: item.eval_at,
                    eval_by: item.eval_by,
                    members: [item]
                });
            }
        } else {
            groups.push({
                type: "solo",
                points: item.points,
                status: item.status,
                eval_at: item.eval_at,
                eval_by: item.eval_by,
                members: [item]
            });
        }
    });

    const pageOffset = (page - 1) * pageLimit;

    return (
        <>
            {/* Mobile card view */}
            <div className="md:hidden divide-y divide-neutral-800">
                {groups.map((group, gIdx) => {
                    const isTeam = group.type === "team";
                    return (
                        <div key={isTeam ? `team-${group.team_id}` : `solo-${group.members[0].user_id}`} className="p-4 space-y-4">
                            <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0">
                                    {isTeam ? (
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2">
                                                <TypeBadge type="TEAM" />
                                                <span className="font-bold text-sm text-white uppercase tracking-wider">{group.team_name}</span>
                                            </div>
                                            <div className="space-y-2 pl-2 border-l-2 border-neutral-800/80 ml-1">
                                                {group.members.map(m => (
                                                    <div key={m.user_id} className="text-xs text-neutral-400">
                                                        <div className="font-medium text-neutral-300">{m.name}</div>
                                                        <div className="text-[10px] text-neutral-600 font-mono mt-0.5">{m.user_id}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <TypeBadge type="SOLO" />
                                                <span className="text-[10px] text-neutral-600 font-mono uppercase">Solo Entry</span>
                                            </div>
                                            <div className="font-semibold text-sm text-white">{group.members[0].name}</div>
                                            <div className="text-[10px] text-neutral-500 font-mono">{group.members[0].email}</div>
                                        </div>
                                    )}
                                </div>
                                <div className="flex flex-col items-end gap-3 pl-4 shrink-0">
                                    <ResultStatusBadge status={group.status} />
                                    <div className="flex flex-col items-end leading-none">
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-xl font-black text-white tabular-nums">{group.points}</span>
                                            <span className="text-[9px] text-neutral-600 font-bold uppercase tracking-widest">pts</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center justify-between text-[10px] text-neutral-700 font-mono pt-1 border-t border-neutral-800/40">
                                <span>eval: {group.eval_by}</span>
                                <span>{new Date(group.eval_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                            </div>
                        </div>
                    );
                })}
                {/* Mobile pagination */}
                <div className="flex items-center justify-between px-4 py-3 bg-neutral-950/60 border-t border-neutral-800 text-xs text-neutral-500">
                    <span className="font-mono">
                        {total === 0 ? "No results" : `Showing ${groups.length} groups`}
                    </span>
                    <div className="flex gap-2">
                        <button onClick={onPrev} disabled={page <= 1} className="p-1.5 border border-neutral-800 hover:border-neutral-600 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                            <NavArrowLeft className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={onNext} disabled={page >= totalPages} className="p-1.5 border border-neutral-800 hover:border-neutral-600 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                            <NavArrowRight className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Desktop table view */}
            <div className="hidden md:block border border-neutral-800 bg-neutral-950 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-neutral-800 bg-neutral-900/60 font-mono">
                                <th className="px-6 py-3 text-left text-[10px] font-semibold text-neutral-400 uppercase tracking-widest border-r border-neutral-800/60 w-[320px]">Team / Entry</th>
                                <th className="px-6 py-3 text-left text-[10px] font-semibold text-neutral-400 uppercase tracking-widest">Members</th>
                                <th className="px-6 py-3 text-left text-[10px] font-semibold text-neutral-400 uppercase tracking-widest border-l border-neutral-800/60 w-[240px]">Evaluated By</th>
                            </tr>
                        </thead>
                        <tbody>
                            {groups.map((group, _gIdx) => {
                                const isTeam = group.type === "team";
                                return group.members.map((member, mIdx) => (
                                    <tr key={member.id} className={`border-b border-neutral-800/60 last:border-0 hover:bg-neutral-900/10 transition-colors duration-150 ${mIdx > 0 ? 'bg-neutral-950/20' : ''}`}>

                                        {/* Column 1: Team Info - spanned */}
                                        {mIdx === 0 && (
                                            <td rowSpan={group.members.length} className="px-6 py-6 border-r border-neutral-800/40 bg-neutral-900/20 align-top">
                                                <div className="flex flex-col gap-4">
                                                    <div>
                                                        {isTeam ? (
                                                            <>
                                                                <div className="text-sm font-black text-white uppercase tracking-widest leading-none mb-1">{group.team_name}</div>
                                                                <div className="text-[10px] text-neutral-600 font-mono tracking-tight">{group.team_id}</div>
                                                            </>
                                                        ) : (
                                                            <div className="flex items-center gap-2">
                                                                <TypeBadge type="SOLO" />
                                                                <span className="text-[10px] text-neutral-700 uppercase tracking-widest font-mono">Solo Entry</span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="flex items-center gap-6 pt-2 border-t border-neutral-800/60">
                                                        <div className="flex flex-col gap-1">
                                                            <span className="text-[9px] text-neutral-600 uppercase font-bold tracking-tighter">Points</span>
                                                            <div className="flex items-baseline gap-1">
                                                                <span className="text-xl font-black text-white tabular-nums leading-none">{group.points}</span>
                                                                <span className="text-[9px] text-neutral-700 font-bold uppercase tracking-widest">pts</span>
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-col gap-1.5 flex-1">
                                                            <span className="text-[9px] text-neutral-600 uppercase font-bold tracking-tighter">Status</span>
                                                            <ResultStatusBadge status={group.status} />
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                        )}

                                        {/* Column 2: Individual Members */}
                                        <td className="px-6 py-4 align-middle">
                                            <div className="flex items-center gap-3">
                                                <div className="w-1.5 h-1.5 rounded-full bg-neutral-800 shrink-0" />
                                                <div className="min-w-0">
                                                    <div className="text-sm font-semibold text-white truncate leading-tight">{member.name}</div>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <div className="text-[10px] text-neutral-500 font-mono truncate">{member.email}</div>
                                                        <span className="text-neutral-800 text-[10px]">|</span>
                                                        <div className="text-[9px] text-neutral-600 font-mono">{member.user_id}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Column 3: Evaluator Info - spanned */}
                                        {mIdx === 0 && (
                                            <td rowSpan={group.members.length} className="px-6 py-4 border-l border-neutral-800/40 bg-neutral-900/10 align-middle">
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-5 h-5 rounded-full bg-neutral-800 flex items-center justify-center text-[9px] text-neutral-500 font-bold uppercase">AD</div>
                                                        <span className="text-[11px] text-neutral-400 font-mono font-medium">{group.eval_by}</span>
                                                    </div>
                                                    <div className="text-[10px] text-neutral-700 mt-1 pl-7">
                                                        {new Date(group.eval_at).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}
                                                    </div>
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                ));
                            })}
                        </tbody>
                    </table>
                </div>


                <TablePagination
                    page={page}
                    totalPages={totalPages}
                    total={total}
                    pageLimit={pageLimit}
                    onPrev={onPrev}
                    onNext={onNext}
                />
            </div>
        </>
    );
}

// ── Checked-In Table ─────────────────────────────────────────────────────────

type ParticipantStatus = RoundResultStatus;

function entryId(entry: RoundCheckInEntry): string {
    return entry.type === "TEAM" ? `team:${entry.name}` : `solo:${entry.participant_id}`;
}

type ResultFeedback =
    | { kind: "success"; count: number }
    | { kind: "partial"; count: number; total: number; userErrors: { user_id: string; error: string }[]; teamErrors: { team_id: string; error: string }[] }
    | { kind: "failure"; userErrors: { user_id: string; error: string }[]; teamErrors: { team_id: string; error: string }[] };

interface CheckedInTableProps {
    eventId: string;
    roundNo: string;
    data: RoundCheckInEntry[];
    isLoading: boolean;
    error: Error | null;
    page: number;
    totalPages: number;
    total: number;
    pageLimit: number;
    onPrev: () => void;
    onNext: () => void;
}

function CheckedInTable({
    eventId,
    roundNo,
    data,
    isLoading,
    error,
    page,
    totalPages,
    total,
    pageLimit,
    onPrev,
    onNext,
}: CheckedInTableProps) {
    const { api } = Route.useRouteContext();
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [feedback, setFeedback] = useState<ResultFeedback | null>(null);

    const allIds = data.map(entryId);
    const allSelected = allIds.length > 0 && allIds.every(id => selected.has(id));
    const someSelected = allIds.some(id => selected.has(id)) && !allSelected;

    // Build a lookup: entryId → entry (so we can extract the right id field for API)
    const entryMap = new Map(data.map(e => [entryId(e), e]));

    const resultMutation = useMutation({
        mutationFn: (vars: { ids: string[]; status: ParticipantStatus }) => {
            const results = vars.ids.map(id => {
                const entry = entryMap.get(id)!;
                if (entry.type === "TEAM") {
                    // team_id is optional until backend includes it in check-in responses
                    return { team_id: entry.team_id ?? entry.name, status: vars.status };
                }
                return { user_id: entry.participant_id, status: vars.status };
            });
            return api.events.postRoundResults(eventId, roundNo, { results });
        },
        onSuccess: (res, vars) => {
            const submittedCount = vars.ids.length;
            const recorded = res.data.recorded_count;
            const userErrors = res.user_errors ?? [];
            const teamErrors = res.team_errors ?? [];
            const hasErrors = userErrors.length > 0 || teamErrors.length > 0;

            setSelected(new Set());

            if (recorded === 0) {
                setFeedback({ kind: "failure", userErrors, teamErrors });
            } else if (hasErrors) {
                setFeedback({ kind: "partial", count: recorded, total: submittedCount, userErrors, teamErrors });
            } else {
                setFeedback({ kind: "success", count: recorded });
                setTimeout(() => setFeedback(null), 4000);
            }
        },
        onError: () => {
            setFeedback({ kind: "failure", userErrors: [], teamErrors: [] });
        },
    });

    function applyStatus(status: ParticipantStatus) {
        setFeedback(null);
        resultMutation.mutate({ ids: Array.from(selected), status });
    }

    function toggleAll() {
        if (allSelected) setSelected(new Set());
        else setSelected(new Set(allIds));
    }

    function toggleEntry(id: string) {
        setSelected(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }

    const selectedCount = selected.size;
    const isPending = resultMutation.isPending;

    if (isLoading) {
        return (
            <div className="p-12 text-center text-neutral-500">
                Loading checked-in participants...
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-12 text-center">
                <p className="text-red-500 mb-2">Failed to load checked-in participants</p>
                <p className="text-xs text-neutral-500">{String(error)}</p>
            </div>
        );
    }

    if (data.length === 0) {
        return (
            <div className="p-12 text-center text-neutral-500">
                No participants have checked in yet.
            </div>
        );
    }

    return (
        <div className="relative">
            {/* ── Result Feedback Banner ── */}
            {feedback && (
                <div className={`px-4 md:px-6 py-3 border-b text-xs font-medium flex flex-col gap-2 ${feedback.kind === "success"
                    ? "bg-emerald-950/50 border-emerald-800 text-emerald-300"
                    : feedback.kind === "partial"
                        ? "bg-amber-950/50 border-amber-800 text-amber-300"
                        : "bg-red-950/50 border-red-900 text-red-400"
                    }`}>
                    <div className="flex items-start justify-between gap-3">
                        <span>
                            {feedback.kind === "success" && `✓ ${feedback.count} ${feedback.count === 1 ? "entry" : "entries"} updated successfully.`}
                            {feedback.kind === "partial" && `⚠ ${feedback.count}/${feedback.total} entries updated. ${feedback.userErrors.length + feedback.teamErrors.length} failed:`}
                            {feedback.kind === "failure" && "✗ Failed to update any entries. Please try again."}
                        </span>
                        <button onClick={() => setFeedback(null)} className="text-current opacity-60 hover:opacity-100 shrink-0 text-base leading-none">✕</button>
                    </div>
                    {(feedback.kind === "partial" || feedback.kind === "failure") && (
                        <div className="space-y-0.5 pl-2 border-l-2 border-current/30">
                            {feedback.userErrors.map(e => (
                                <div key={e.user_id} className="font-mono opacity-80">{e.user_id}: {e.error}</div>
                            ))}
                            {feedback.teamErrors.map(e => (
                                <div key={e.team_id} className="font-mono opacity-80">{e.team_id}: {e.error}</div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ── Status Action Bar ── */}
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

                    {/* Status buttons — wrap on very small screens */}
                    <div className="flex items-center gap-1.5 flex-wrap shrink-0">
                        {isPending && (
                            <span className="text-[11px] text-neutral-500 uppercase tracking-widest animate-pulse mr-1">Saving…</span>
                        )}
                        <button
                            type="button"
                            disabled={isPending}
                            onClick={() => applyStatus("QUALIFIED")}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest border border-emerald-700 bg-emerald-950/60 text-emerald-400 hover:bg-emerald-900/60 hover:border-emerald-500 hover:text-emerald-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-400"
                        >
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                            Qualified
                        </button>
                        <button
                            type="button"
                            disabled={isPending}
                            onClick={() => applyStatus("ELIMINATED")}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest border border-amber-700 bg-amber-950/60 text-amber-400 hover:bg-amber-900/60 hover:border-amber-500 hover:text-amber-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-400"
                        >
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
                            Eliminated
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

            {/* Mobile card view */}
            <div className="md:hidden divide-y divide-neutral-800">
                {data.map((entry, idx) => {
                    const id = entryId(entry);
                    return (
                        <CheckedInCard
                            key={idx}
                            entry={entry}
                            checked={selected.has(id)}
                            onToggle={() => toggleEntry(id)}
                        />
                    );
                })}
            </div>

            {/* Desktop table view */}
            <div className="hidden md:block border border-neutral-800 bg-neutral-950 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-neutral-800 bg-neutral-900/60 font-mono">
                                <th className="w-12 px-6 py-3 border-r border-neutral-800/60 bg-neutral-900/40">
                                    <input
                                        type="checkbox"
                                        checked={allSelected}
                                        ref={el => { if (el) el.indeterminate = someSelected; }}
                                        onChange={toggleAll}
                                        className="w-4 h-4 bg-black border-neutral-700 rounded-none checked:bg-white checked:border-white transition-all cursor-pointer accent-white"
                                    />
                                </th>
                                <th className="px-6 py-3 text-left text-[10px] font-semibold text-neutral-400 uppercase tracking-widest border-r border-neutral-800/60 w-[200px]">
                                    Team / Entry
                                </th>
                                <th className="px-6 py-3 text-left text-[10px] font-semibold text-neutral-400 uppercase tracking-widest">
                                    Participant Name
                                </th>
                                <th className="px-6 py-3 text-left text-[10px] font-semibold text-neutral-400 uppercase tracking-widest">
                                    College & Degree
                                </th>
                                <th className="px-6 py-3 text-left text-[10px] font-semibold text-neutral-400 uppercase tracking-widest">
                                    Phone Number
                                </th>

                            </tr>
                        </thead>
                        <tbody>
                            {data.map((entry, idx) => {
                                const id = entryId(entry);
                                return (
                                    <CheckedInRowGroup
                                        key={idx}
                                        entry={entry}
                                        checked={selected.has(id)}
                                        onToggle={() => toggleEntry(id)}
                                    />
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                <TablePagination
                    page={page}
                    totalPages={totalPages}
                    total={total}
                    pageLimit={pageLimit}
                    onPrev={onPrev}
                    onNext={onNext}
                />
            </div>
        </div>
    );
}

// ── Row + Card components (now controlled) ────────────────────────────────────

interface CheckedInRowGroupProps {
    entry: RoundCheckInEntry;
    checked: boolean;
    onToggle: () => void;
}

function CheckedInRowGroup({ entry, checked, onToggle }: CheckedInRowGroupProps) {
    const rowHighlight = checked ? "bg-neutral-900/50" : "";

    if (entry.type === "SOLO") {
        return (
            <tr className={`hover:bg-neutral-900/40 transition-colors duration-150 border-b border-neutral-800/60 last:border-0 ${rowHighlight}`}>
                <td className="w-12 px-6 py-4 border-r border-neutral-800/60 bg-neutral-950/20 align-middle">
                    <input
                        type="checkbox"
                        checked={checked}
                        onChange={onToggle}
                        className="w-4 h-4 bg-black border-neutral-800 rounded-none checked:bg-white checked:border-white transition-all cursor-pointer accent-white"
                    />
                </td>
                <td className="px-6 py-4 border-r border-neutral-800/60 bg-neutral-950/30 align-middle">
                    <div className="flex flex-col items-center justify-center space-y-2 text-center">
                        <TypeBadge type="SOLO" />
                        <div className="text-sm font-bold text-white uppercase tracking-wider leading-tight">
                            {entry.first_name}
                        </div>
                        <p className="text-[10px] text-neutral-600 mt-0.5 uppercase tracking-wider">
                            {new Date(entry.checkedin_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                    </div>
                </td>
                <td className="px-6 py-4">
                    <div className="text-sm font-semibold text-white">{entry.first_name} {entry.last_name}</div>
                    <div className="text-[10px] text-neutral-500 font-mono mt-0.5">{entry.participant_id}</div>
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
        );
    }

    return (
        <>
            {entry.members.map((member, mIdx) => (
                <tr
                    key={member.participant_id}
                    className={`hover:bg-neutral-900/20 transition-colors duration-150 border-b border-neutral-800/60 last:border-0 ${checked ? "bg-neutral-900/30" : ""}`}
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
                                    <p className="text-[10px] text-neutral-600 mt-0.5 uppercase tracking-wider">
                                        {new Date(entry.checkedin_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
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

                </tr>
            ))}
        </>
    );
}

interface CheckedInCardProps {
    entry: RoundCheckInEntry;
    checked: boolean;
    onToggle: () => void;
}

function CheckedInCard({ entry, checked, onToggle }: CheckedInCardProps) {
    const cardBase = `p-4 space-y-3 relative transition-colors duration-150 ${checked ? "bg-neutral-900/60" : ""}`;
    const checkboxCls = "w-5 h-5 bg-black border-neutral-700 rounded-none checked:bg-white checked:border-white transition-all cursor-pointer accent-white shrink-0";

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
                    <span className="font-semibold text-white truncate flex-1">{entry.first_name} {entry.last_name}</span>
                </>
            )}

        </div>
    );

    if (entry.type === "TEAM") {
        return (
            <div className={cardBase}>
                {header}
                <div className="space-y-1 pl-8">
                    {entry.members.map(m => (
                        <div key={m.participant_id} className="text-xs text-neutral-400 font-mono">
                            {m.first_name} {m.last_name} • {m.email}
                        </div>
                    ))}
                </div>
                <div className="flex gap-4 text-xs text-neutral-500 items-center pl-8">
                    <span>{entry.members[0]?.college ?? "—"}</span>
                    <span className="ml-auto">{new Date(entry.checkedin_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
            </div>
        );
    }
    return (
        <div className={cardBase}>
            {header}
            <div className="text-xs text-neutral-400 font-mono pl-8">{entry.participant_id} • {entry.email}</div>
            <div className="flex gap-4 text-xs text-neutral-500 items-center pl-8">
                <span>{entry.college}</span>
                <span className="ml-auto">{new Date(entry.checkedin_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
        </div>
    );
}



// ── Qualified Table ───────────────────────────────────────────────────────────

interface QualifiedTableProps {
    data: RoundQualifiedParticipant[];
    isLoading: boolean;
    error: Error | null;
    page: number;
    totalPages: number;
    total: number;
    pageLimit: number;
    onPrev: () => void;
    onNext: () => void;
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
}: QualifiedTableProps) {
    if (isLoading) {
        return (
            <div className="p-12 text-center text-neutral-500">
                Loading qualified participants...
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-12 text-center">
                <p className="text-red-500 mb-2">Failed to load qualified participants</p>
                <p className="text-xs text-neutral-500">{String(error)}</p>
            </div>
        );
    }

    if (data.length === 0) {
        return (
            <div className="p-12 text-center text-neutral-500">
                No qualified participants for this round yet.
            </div>
        );
    }

    return (
        <>
            {/* Mobile card view */}
            <div className="md:hidden divide-y divide-neutral-800">
                {data.map((entry, idx) => (
                    <QualifiedCard key={idx} entry={entry} />
                ))}
            </div>

            {/* Desktop table view */}
            <div className="hidden md:block border border-neutral-800 bg-neutral-950 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-neutral-800 bg-neutral-900/60">
                                <th className="px-6 py-3 text-left text-[10px] font-semibold text-neutral-400 uppercase tracking-widest border-r border-neutral-800/60 w-[200px]">
                                    Team / Entry
                                </th>
                                <th className="px-6 py-3 text-left text-[10px] font-semibold text-neutral-400 uppercase tracking-widest">
                                    Participant Name
                                </th>
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

                <TablePagination
                    page={page}
                    totalPages={totalPages}
                    total={total}
                    pageLimit={pageLimit}
                    onPrev={onPrev}
                    onNext={onNext}
                />
            </div>
        </>
    );
}

function QualifiedRowGroup({ entry }: { entry: RoundQualifiedParticipant }) {
    if (entry.type === "SOLO") {
        return (
            <tr className="hover:bg-neutral-900/40 transition-colors duration-150 border-b border-neutral-800/60 last:border-0">
                <td className="px-6 py-4 border-r border-neutral-800/60 bg-neutral-950/30 align-middle">
                    <div className="flex flex-col items-center justify-center space-y-2 text-center">
                        <TypeBadge type="SOLO" />
                        <div className="text-sm font-bold text-white uppercase tracking-wider leading-tight">
                            {entry.first_name}
                        </div>
                    </div>
                </td>
                <td className="px-6 py-4">
                    <div className="text-sm font-semibold text-white">
                        {entry.first_name} {entry.last_name}
                    </div>
                    <div className="text-[10px] text-neutral-500 font-mono mt-0.5">{entry.participant_id}</div>
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
        );
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
                            <div className="text-[10px] text-neutral-700 mt-0.5">{member.degree}</div>
                        </div>
                    </td>
                    <td className="px-6 py-4">
                        <div className="text-xs text-neutral-500 font-mono">{member.ph_no}</div>
                    </td>
                </tr>
            ))}
        </>
    );
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
                            {m.first_name} {m.last_name} • {m.email}
                        </div>
                    ))}
                </div>
                <div className="flex gap-4 text-xs text-neutral-500">
                    <span>{entry.members[0]?.college ?? "—"}</span>
                    <span className="ml-auto">{new Date(entry.registered_at).toLocaleString()}</span>
                </div>
            </div>
        );
    }
    return (
        <div className="p-4 space-y-2">
            <div className="flex items-center gap-2">
                <TypeBadge type="SOLO" />
                <span className="font-semibold text-white">{entry.first_name} {entry.last_name}</span>
            </div>
            <div className="text-xs text-neutral-400 font-mono">{entry.participant_id} • {entry.email}</div>
            <div className="flex gap-4 text-xs text-neutral-500">
                <span>{entry.college}</span>
                <span className="ml-auto">{new Date(entry.registered_at).toLocaleString()}</span>
            </div>
        </div>
    );
}



// ── Shared sub-components ─────────────────────────────────────────────────────

function TypeBadge({ type }: { type: "TEAM" | "SOLO" }) {
    if (type === "TEAM") {
        return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider border border-blue-800 bg-blue-950/50 text-blue-400 w-fit">
                <Group className="w-2.5 h-2.5" />
                Team
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider border border-blue-800 bg-blue-950/50 text-blue-400 w-fit">
            <User className="w-2.5 h-2.5" />
            Solo
        </span>
    );
}

interface TablePaginationProps {
    page: number;
    totalPages: number;
    total: number;
    pageLimit: number;
    onPrev: () => void;
    onNext: () => void;
}

function TablePagination({ page, totalPages, total, pageLimit, onPrev, onNext }: TablePaginationProps) {
    const from = page * pageLimit + 1;
    const to = Math.min((page + 1) * pageLimit, total);

    return (
        <div className="px-6 py-4 border-t border-neutral-800 flex items-center justify-between">
            <p className="text-sm text-neutral-500">
                {total === 0 ? "No results" : `Showing ${from}–${to} of ${total}`}
            </p>
            <div className="flex gap-2">
                <button
                    type="button"
                    onClick={onPrev}
                    disabled={page === 0}
                    className="p-2 border border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors duration-150"
                    aria-label="Previous page"
                >
                    <NavArrowLeft className="w-4 h-4" />
                </button>
                <span className="px-3 py-2 text-sm text-neutral-400 border border-neutral-800 min-w-[3rem] text-center">
                    {page + 1} / {totalPages}
                </span>
                <button
                    type="button"
                    onClick={onNext}
                    disabled={page >= totalPages - 1}
                    className="p-2 border border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors duration-150"
                    aria-label="Next page"
                >
                    <NavArrowRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
