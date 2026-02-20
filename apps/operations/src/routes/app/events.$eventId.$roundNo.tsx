import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ScanQrCode, ArrowLeft } from "iconoir-react";
import { useState } from "react";
import type { AxiosError } from "axios";
import { Button } from "@/ui/Button";
import { Field } from "@/ui/Field";
import { Input } from "@/ui/Input";
import { RoundCheckInPopup } from "@/ui/RoundCheckInPopup";
import { QRScanner } from "@/ui/QRScanner";

export const Route = createFileRoute('/app/events/$eventId/$roundNo')({
    component: RoundCheckInPage,
})

function RoundCheckInPage() {
    const { eventId, roundNo } = Route.useParams();
    const { api } = Route.useRouteContext();
    const [searchInput, setSearchInput] = useState("");
    const [scannedUserId, setScannedUserId] = useState<string | null>(null);
    const [popupOpen, setPopupOpen] = useState(false);
    const [showScanner, setShowScanner] = useState(false);
    const [qrError, setQrError] = useState("");
    const [checkInError, setCheckInError] = useState<string | null>(null);
    const [isRequestingCamera, setIsRequestingCamera] = useState(false);

    const participantIdPattern = /^MLNU[A-Za-z0-9]{6}$/;

    const roundNumber = parseInt(roundNo, 10);

    // Fetch detailed event data to show context (optional but good for UX)
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

    // Check-in mutation
    const checkInMutation = useMutation({
        mutationFn: ({ userIds, teamId }: { userIds: string[], teamId: string | null }) => api.events.checkInRound(eventId, roundNumber, userIds, teamId),
        onSuccess: () => {
            setQrError("");
            setCheckInError(null);
            // Optionally could invalidate query if we had a table of checked in users.
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
        // Close scanner
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

            {/* As requested, a place for displaying checked-in teams or individuals could go here, but since there's no endpoint for it, we omit it for now, or just show the recently checked in. */}

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
