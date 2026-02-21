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
import type { RoundCheckInEntry, RoundQualifiedParticipant } from "@/api/events";

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
    const [activeTab, setActiveTab] = useState<"checkedin" | "qualified">("checkedin");
    const [checkInsPage, setCheckInsPage] = useState(0);
    const [qualifiedPage, setQualifiedPage] = useState(0);
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
    const qualifiedCount = qualifiedData ? (qualifiedData.pagination.total || qualifiedData.data.length) : 0;

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
                            variant="secondary"
                            onClick={() => handleSearch(searchInput)}
                        >
                            Enter
                        </Button>
                    </div>
                </Field>
            </div>

            {/* ── Participants Section ───────────────────────────────────────────── */}
            <div className="bg-neutral-950 border border-neutral-800">
                {/* Section Header */}
                <div className="px-6 py-4 border-b border-neutral-800">
                    <h3 className="text-lg font-semibold text-white">Participants</h3>
                    <p className="text-xs text-neutral-500 mt-0.5">
                        View participants who have checked-in or are qualified for this round.
                    </p>
                </div>

                {/* Tab Bar */}
                <div className="flex border-b border-neutral-800">
                    <button
                        id="tab-checkedin"
                        type="button"
                        onClick={() => setActiveTab("checkedin")}
                        className={`px-6 py-3 text-sm font-medium uppercase tracking-wider transition-colors duration-150 border-b-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white ${activeTab === "checkedin"
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
                        id="tab-qualified"
                        type="button"
                        onClick={() => setActiveTab("qualified")}
                        className={`px-6 py-3 text-sm font-medium uppercase tracking-wider transition-colors duration-150 border-b-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white ${activeTab === "qualified"
                            ? "text-white border-white"
                            : "text-neutral-500 border-transparent hover:text-neutral-300 hover:border-neutral-700"
                            }`}
                    >
                        Qualified
                        <span className={`ml-2 text-xs px-1.5 py-0.5 border ${activeTab === "qualified"
                            ? "bg-white text-black border-white"
                            : "bg-neutral-800 text-neutral-400 border-neutral-700"
                            }`}>
                            {qualifiedCount}
                        </span>
                    </button>
                </div>

                {/* Tab Content */}
                {activeTab === "checkedin" ? (
                    <CheckedInTable
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
                ) : (
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

// ── Checked-In Table ─────────────────────────────────────────────────────────

interface CheckedInTableProps {
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
        <>
            {/* Mobile card view */}
            <div className="md:hidden divide-y divide-neutral-800">
                {data.map((entry, idx) => (
                    <CheckedInCard key={idx} entry={entry} />
                ))}
            </div>

            {/* Desktop table view */}
            <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-neutral-800">
                            <th className="px-6 py-4 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">
                                Type
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">
                                Name / Participant
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">
                                Members
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">
                                College
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">
                                Checked-In At
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-800">
                        {data.map((entry, idx) =>
                            entry.type === "TEAM" ? (
                                <TeamCheckInRow key={idx} entry={entry} />
                            ) : (
                                <SoloCheckInRow key={idx} entry={entry} />
                            )
                        )}
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
        </>
    );
}

function CheckedInCard({ entry }: { entry: RoundCheckInEntry }) {
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
                    <span className="ml-auto">{new Date(entry.checkedin_at).toLocaleString()}</span>
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
                <span className="ml-auto">{new Date(entry.checkedin_at).toLocaleString()}</span>
            </div>
        </div>
    );
}

function TeamCheckInRow({ entry }: { entry: Extract<RoundCheckInEntry, { type: "TEAM" }> }) {
    return (
        <tr className="hover:bg-neutral-900 transition-colors duration-150 align-top">
            <td className="px-6 py-4 text-sm">
                <TypeBadge type="TEAM" />
            </td>
            <td className="px-6 py-4">
                <div className="flex items-center gap-1.5">
                    <Group className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                    <span className="text-sm font-medium text-white">{entry.name}</span>
                </div>
            </td>
            <td className="px-6 py-4">
                <div className="space-y-1">
                    {entry.members.map(m => (
                        <div key={m.participant_id} className="text-xs text-neutral-400">
                            <span className="text-neutral-200">{m.first_name} {m.last_name}</span>
                            <span className="text-neutral-600 font-mono ml-1.5">{m.participant_id}</span>
                        </div>
                    ))}
                </div>
            </td>
            <td className="px-6 py-4 text-sm text-neutral-400">
                {entry.members[0]?.college ?? "—"}
            </td>
            <td className="px-6 py-4 text-sm text-neutral-400 whitespace-nowrap">
                {new Date(entry.checkedin_at).toLocaleString()}
            </td>
        </tr>
    );
}

function SoloCheckInRow({ entry }: { entry: Extract<RoundCheckInEntry, { type: "SOLO" }> }) {
    return (
        <tr className="hover:bg-neutral-900 transition-colors duration-150">
            <td className="px-6 py-4 text-sm">
                <TypeBadge type="SOLO" />
            </td>
            <td className="px-6 py-4">
                <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                    <div>
                        <p className="text-sm font-medium text-white">{entry.first_name} {entry.last_name}</p>
                        <p className="text-xs text-neutral-500 font-mono">{entry.participant_id}</p>
                    </div>
                </div>
            </td>
            <td className="px-6 py-4 text-xs text-neutral-400">
                {entry.email}
            </td>
            <td className="px-6 py-4 text-sm text-neutral-400">
                {entry.college}
            </td>
            <td className="px-6 py-4 text-sm text-neutral-400 whitespace-nowrap">
                {new Date(entry.checkedin_at).toLocaleString()}
            </td>
        </tr>
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
            <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-neutral-800">
                            <th className="px-6 py-4 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">
                                Type
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">
                                Name / Participant
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">
                                Members
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">
                                College
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">
                                Registered At
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-800">
                        {data.map((entry, idx) =>
                            entry.type === "TEAM" ? (
                                <TeamQualifiedRow key={idx} entry={entry} />
                            ) : (
                                <SoloQualifiedRow key={idx} entry={entry} />
                            )
                        )}
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

function TeamQualifiedRow({ entry }: { entry: Extract<RoundQualifiedParticipant, { type: "TEAM" }> }) {
    return (
        <tr className="hover:bg-neutral-900 transition-colors duration-150 align-top">
            <td className="px-6 py-4 text-sm">
                <TypeBadge type="TEAM" />
            </td>
            <td className="px-6 py-4">
                <div className="flex items-center gap-1.5">
                    <Group className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                    <span className="text-sm font-medium text-white">{entry.name}</span>
                </div>
            </td>
            <td className="px-6 py-4">
                <div className="space-y-1">
                    {entry.members.map(m => (
                        <div key={m.participant_id} className="text-xs text-neutral-400">
                            <span className="text-neutral-200">{m.first_name} {m.last_name}</span>
                            <span className="text-neutral-600 font-mono ml-1.5">{m.participant_id}</span>
                        </div>
                    ))}
                </div>
            </td>
            <td className="px-6 py-4 text-sm text-neutral-400">
                {entry.members[0]?.college ?? "—"}
            </td>
            <td className="px-6 py-4 text-sm text-neutral-400 whitespace-nowrap">
                {new Date(entry.registered_at).toLocaleString()}
            </td>
        </tr>
    );
}

function SoloQualifiedRow({ entry }: { entry: Extract<RoundQualifiedParticipant, { type: "SOLO" }> }) {
    return (
        <tr className="hover:bg-neutral-900 transition-colors duration-150">
            <td className="px-6 py-4 text-sm">
                <TypeBadge type="SOLO" />
            </td>
            <td className="px-6 py-4">
                <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                    <div>
                        <p className="text-sm font-medium text-white">{entry.first_name} {entry.last_name}</p>
                        <p className="text-xs text-neutral-500 font-mono">{entry.participant_id}</p>
                    </div>
                </div>
            </td>
            <td className="px-6 py-4 text-xs text-neutral-400">
                {entry.email}
            </td>
            <td className="px-6 py-4 text-sm text-neutral-400">
                {entry.college}
            </td>
            <td className="px-6 py-4 text-sm text-neutral-400 whitespace-nowrap">
                {new Date(entry.registered_at).toLocaleString()}
            </td>
        </tr>
    );
}

// ── Shared sub-components ─────────────────────────────────────────────────────

function TypeBadge({ type }: { type: "TEAM" | "SOLO" }) {
    if (type === "TEAM") {
        return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider border border-blue-800 bg-blue-950/50 text-blue-400">
                <Group className="w-2.5 h-2.5" />
                Team
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider border border-neutral-700 bg-neutral-900 text-neutral-400">
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
