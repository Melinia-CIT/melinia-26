import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { ScanQrCode } from "iconoir-react";
import { useState } from "react";
import type { AxiosError } from "axios";
import type { Registration } from "@/api/registrations";
import { Button } from "@/ui/Button";
import { Field } from "@/ui/Field";
import { Input } from "@/ui/Input";
import { CheckInPopup } from "@/ui/CheckInPopup";
import { QRScanner } from "@/ui/QRScanner";

type ApiErrorBody = { message?: string };

export const Route = createFileRoute("/app/check-in")({
	component: CheckInPage,
});

function CheckInPage() {
	const { api, queryClient } = Route.useRouteContext();
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedRegistration, setSelectedRegistration] =
		useState<Registration | null>(null);
	const [popupOpen, setPopupOpen] = useState(false);
	const [scannedUserId, setScannedUserId] = useState<string | null>(null);
	const [showScanner, setShowScanner] = useState(false);
	const [qrError, setQrError] = useState("");
	const [checkInError, setCheckInError] = useState<string | null>(null);
	const [isRequestingCamera, setIsRequestingCamera] = useState(false);

	// Search query
	const { data: searchResults, isLoading: isSearching } = useQuery({
		queryKey: ["registrations", "search", searchQuery],
		queryFn: () => api.registrations.search(searchQuery),
		enabled: searchQuery.length >= 3,
	});

	// Check-in mutation
	const checkInMutation = useMutation({
		mutationFn: (userId: string) => api.registrations.checkIn(userId),
		onSuccess: (data) => {
			// Update selected registration
			setSelectedRegistration(data.registration);
			// Invalidate queries
			queryClient.invalidateQueries({ queryKey: ["registrations"] });
			// Clear QR error
			setQrError("");
			setCheckInError(null);
		},
		onError: (error) => {
			console.error("Check-in error:", error);
			const axiosErr = error as AxiosError<ApiErrorBody>;
			const message = axiosErr.response?.data?.message;
			setCheckInError(message || "Failed to check in. Please try again.");
		},
	});

	const handleSearch = (query: string) => {
		setSearchQuery(query);
		setSelectedRegistration(null);
		setScannedUserId(null);
		setPopupOpen(false);
		setQrError("");
		setCheckInError(null);
	};

	const handleSelectRegistration = (registration: Registration) => {
		setSelectedRegistration(registration);
		setSearchQuery("");
		setScannedUserId(null);
		setPopupOpen(true);
		setQrError("");
		setCheckInError(null);
	};

	const handleQRScan = (scannedText: string) => {
		// Close scanner
		setShowScanner(false);
		setQrError("");
		setSearchQuery("");
		setSelectedRegistration(null);
		setCheckInError(null);

		// Extract user_id from scanned text
		// Expected format: "MLNUXXXXXX" or JSON with user_id field
		let userId: string;

		try {
			// Try to parse as JSON first
			const parsed = JSON.parse(scannedText);
			userId = parsed.user_id || parsed.id || scannedText;
		} catch {
			// Not JSON, use as-is
			userId = scannedText.trim();
		}

		// Validate format (should match MLNU followed by 6 alphanumeric characters)
		if (!/^MLNU[A-Za-z0-9]{6}$/.test(userId)) {
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
			// Check if mediaDevices is available
			if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
				throw new Error("Camera API not supported in this browser");
			}

			// Request camera permission with fallback
			let stream: MediaStream;
			try {
				// Try with back camera first (mobile)
				stream = await navigator.mediaDevices.getUserMedia({
					video: { facingMode: "environment" },
				});
			} catch {
				// Fallback to any available camera
				stream = await navigator.mediaDevices.getUserMedia({
					video: true,
				});
			}

			// Permission granted, stop the stream and open scanner
			stream.getTracks().forEach((track) => {
				track.stop();
			});
			setShowScanner(true);
		} catch (err) {
			console.error("Camera permission denied:", err);

			// Determine error message based on error type
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
			{/* Header */}
			<div className="space-y-1">
				<h2 className="text-2xl md:text-3xl font-bold text-white">Check-in</h2>
				<p className="text-neutral-500">
					Scan QR codes or search for attendees to check them in
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
				<h3 className="text-lg font-semibold text-white">Manual Search</h3>
				<Field
					label="Search Participant"
					description="Search by name, email, phone, or college (min 3 characters)"
				>
					<Input
						type="text"
						placeholder="Enter name, email, phone..."
						value={searchQuery}
						onChange={(e) => handleSearch(e.target.value)}
					/>
				</Field>

				{/* Search results */}
				{isSearching && (
					<div className="text-sm text-neutral-500">Searching...</div>
				)}

				{searchQuery.length >= 3 &&
					!isSearching &&
					searchResults &&
					searchResults.length === 0 && (
						<div className="text-sm text-neutral-500">No results found</div>
					)}

				{searchResults && searchResults.length > 0 && (
					<div className="space-y-2">
						<p className="text-sm text-neutral-400">
							Found {searchResults.length} result(s)
						</p>
						<div className="space-y-2">
							{searchResults.map((reg) => (
								<button
									key={reg.id}
									type="button"
									onClick={() => handleSelectRegistration(reg)}
									className="w-full text-left p-4 bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 transition-colors duration-150"
								>
									<div className="flex items-start justify-between">
										<div className="space-y-1">
											<p className="font-medium text-white">{reg.name}</p>
											<p className="text-sm text-neutral-400">{reg.email}</p>
											<p className="text-sm text-neutral-400">
												{reg.phone} · {reg.college}
											</p>
										</div>
										<div className="flex flex-col gap-1 items-end">
											<StatusBadge status={reg.status} />
											{reg.checkedIn && (
												<span className="text-xs text-green-500">
													✓ Checked In
												</span>
											)}
										</div>
									</div>
								</button>
							))}
						</div>
					</div>
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
			<CheckInPopup
				open={popupOpen}
				onClose={() => {
					setPopupOpen(false);
					setSelectedRegistration(null);
					setScannedUserId(null);
					setCheckInError(null);
					checkInMutation.reset();
				}}
				registration={selectedRegistration}
				userId={scannedUserId}
				getUserById={api.users.getById}
				onCheckIn={(id) => checkInMutation.mutate(id)}
				isCheckingIn={checkInMutation.isPending}
				checkInSuccess={checkInMutation.isSuccess}
				checkInError={checkInError}
			/>
		</div>
	);
}

function StatusBadge({ status }: { status: Registration["status"] }) {
	const styles = {
		pending: "bg-yellow-950/50 text-yellow-500 border-yellow-900",
		verified: "bg-green-950/50 text-green-500 border-green-900",
		rejected: "bg-red-950/50 text-red-500 border-red-900",
	};

	const labels = {
		pending: "Pending",
		verified: "Verified",
		rejected: "Rejected",
	};

	return (
		<span
			className={`inline-block px-2 py-1 text-xs font-medium border ${styles[status]}`}
		>
			{labels[status]}
		</span>
	);
}
