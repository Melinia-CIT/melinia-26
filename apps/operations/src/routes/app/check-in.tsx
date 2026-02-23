import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import type { AxiosError } from "axios";
import {
	ArrowLeft,
	NavArrowLeft,
	NavArrowRight,
	ScanQrCode,
} from "iconoir-react";
import { useState } from "react";
import type { Registration } from "@/api/registrations";
import { Button } from "@/ui/Button";
import { CheckInPopup } from "@/ui/CheckInPopup";
import { Field } from "@/ui/Field";
import { Input } from "@/ui/Input";
import { QRScanner } from "@/ui/QRScanner";

type ApiErrorBody = { message?: string };

export const Route = createFileRoute("/app/check-in")({
	component: CheckInPage,
});

function CheckInPage() {
	const { api, queryClient } = Route.useRouteContext();
	const [searchInput, setSearchInput] = useState("");
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedRegistration, setSelectedRegistration] =
		useState<Registration | null>(null);
	const [popupOpen, setPopupOpen] = useState(false);
	const [scannedUserId, setScannedUserId] = useState<string | null>(null);
	const [showScanner, setShowScanner] = useState(false);
	const [qrError, setQrError] = useState("");
	const [checkInError, setCheckInError] = useState<string | null>(null);
	const [isRequestingCamera, setIsRequestingCamera] = useState(false);

	const participantIdPattern = /^MLNU[A-Za-z0-9]{6}$/;

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
			// API layer throws plain Error for 200-with-message responses
			// Axios throws AxiosError for non-2xx responses
			const axiosErr = error as AxiosError<ApiErrorBody>;
			const message =
				axiosErr.response?.data?.message ||
				error.message ||
				"Failed to check in. Please try again.";
			setCheckInError(message);
		},
	});

	const handleSearch = (query: string) => {
		const normalizedQuery = query.trim();
		const maybeParticipantId = normalizedQuery.toUpperCase();

		// If a participant ID is typed manually, open the same flow as a QR scan.
		if (participantIdPattern.test(maybeParticipantId)) {
			setSelectedRegistration(null);
			setScannedUserId(maybeParticipantId);
			setPopupOpen(true);
			setSearchInput("");
			setSearchQuery("");
			setQrError("");
			setCheckInError(null);
			return;
		}

		setSearchQuery(normalizedQuery);
		setSelectedRegistration(null);
		setScannedUserId(null);
		setPopupOpen(false);
		setQrError("");
		setCheckInError(null);
	};

	const handleSubmitSearch = () => {
		handleSearch(searchInput);
	};

	const handleSelectRegistration = (registration: Registration) => {
		setSelectedRegistration(registration);
		setSearchInput("");
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
		setSearchInput("");
		setSearchQuery("");
		setSelectedRegistration(null);
		setCheckInError(null);

		// Extract user_id from scanned text
		// Expected format: "MLNUXXXXXX" or JSON with user_id field
		let userId: string;

		try {
			// Try to parse as JSON first
			const parsed = JSON.parse(scannedText);
			userId = String(parsed.user_id ?? parsed.id ?? scannedText);
		} catch {
			// Not JSON, use as-is
			userId = scannedText;
		}

		userId = userId.trim().toUpperCase();

		// Validate format (should match MLNU followed by 6 alphanumeric characters)
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
		<div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
			{/* Back link */}
			<Link
				to="/app"
				className="inline-flex items-center gap-2 text-xs text-neutral-500 hover:text-white transition-colors duration-150 uppercase tracking-widest focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
			>
				<ArrowLeft className="w-3.5 h-3.5" />
				Back to Dashboard
			</Link>
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
					description="Search by participant ID (MLNU......)"
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
									handleSubmitSearch();
								}
							}}
							className="flex-1"
						/>
						<Button variant="primary" onClick={handleSubmitSearch}>
							Search
						</Button>
					</div>
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

			{/* Overall Check-ins Table */}
			<OverallCheckInsTable api={api} />
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

// ── Overall Check-ins Table ───────────────────────────────────────────────────

type ApiShape = {
	registrations: {
		getOverallCheckIns: (params: {
			from?: number;
			limit?: number;
		}) => Promise<import("@/api/registrations").OverallCheckInsResponse>;
	};
};

const LIMIT_OPTIONS = [10, 20, 50, 100];

function OverallCheckInsTable({ api }: { api: ApiShape }) {
	const [limit, setLimit] = useState(20);
	const [page, setPage] = useState(1);
	const [pageInput, setPageInput] = useState("");
	const [search, setSearch] = useState("");
	const [searchInput, setSearchInput] = useState("");

	// When searching we fetch everything and filter client-side.
	// When not searching we use server pagination.
	const isSearching = search.trim().length > 0;
	const from = isSearching ? 0 : (page - 1) * limit;
	const fetchLimit = isSearching ? 999999 : limit;

	const { data, isLoading, error } = useQuery({
		queryKey: ["overall-checkins", from, fetchLimit, search],
		queryFn: () =>
			api.registrations.getOverallCheckIns({
				from,
				limit: fetchLimit,
			}),
	});

	// Client-side filtering when search is active
	const allRows = data?.data ?? [];
	const filteredRows = isSearching
		? allRows.filter((r) => {
				const q = search.toLowerCase();
				return (
					r.first_name.toLowerCase().includes(q) ||
					r.last_name.toLowerCase().includes(q) ||
					r.email.toLowerCase().includes(q) ||
					r.ph_no.toLowerCase().includes(q) ||
					r.college.toLowerCase().includes(q) ||
					r.degree.toLowerCase().includes(q) ||
					r.participant_id.toLowerCase().includes(q) ||
					r.checkedin_by.toLowerCase().includes(q)
				);
			})
		: allRows;

	// Pagination math
	const totalItems = isSearching
		? filteredRows.length
		: (data?.pagination.total ?? 0);
	const totalPages = Math.max(1, Math.ceil(totalItems / limit));
	const displayRows = isSearching
		? filteredRows.slice((page - 1) * limit, page * limit)
		: filteredRows;

	// Reset page when search/limit changes
	const applySearch = () => {
		setSearch(searchInput.trim());
		setPage(1);
	};
	const clearSearch = () => {
		setSearchInput("");
		setSearch("");
		setPage(1);
	};

	const goToPage = (p: number) => {
		const clamped = Math.max(1, Math.min(p, totalPages));
		setPage(clamped);
	};

	const handlePageInputSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		const n = parseInt(pageInput, 10);
		if (!Number.isNaN(n)) goToPage(n);
		setPageInput("");
	};

	const formatDate = (d: string) => {
		try {
			return new Date(d).toLocaleString();
		} catch {
			return d;
		}
	};

	return (
		<div className="bg-neutral-950 border border-neutral-800 space-y-0">
			{/* Header */}
			<div className="px-6 py-5 border-b border-neutral-800 space-y-4">
				<div className="flex items-center justify-between gap-4">
					<div>
						<h3 className="text-lg font-semibold text-white">All Check-ins</h3>
						<p className="text-sm text-neutral-500 mt-0.5">
							{isLoading ? "Loading…" : `${totalItems} total check-ins`}
						</p>
					</div>
					{/* Limit selector */}
					<div className="flex items-center gap-2 shrink-0">
						<span className="text-xs text-neutral-500">Rows</span>
						<select
							value={limit}
							onChange={(e) => {
								setLimit(Number(e.target.value));
								setPage(1);
							}}
							className="px-2 py-1.5 bg-neutral-900 border border-neutral-800 text-white text-sm focus:outline-none focus:ring-2 focus:ring-white"
						>
							{LIMIT_OPTIONS.map((o) => (
								<option key={o} value={o}>
									{o}
								</option>
							))}
						</select>
					</div>
				</div>

				{/* Search bar */}
				<div className="flex gap-2">
					<Input
						type="text"
						placeholder="Search by name, email, college, ID…"
						value={searchInput}
						onChange={(e) => setSearchInput(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === "Enter") {
								e.preventDefault();
								applySearch();
							}
							if (e.key === "Escape") clearSearch();
						}}
						className="flex-1"
					/>
					<Button variant="primary" onClick={applySearch}>
						Search
					</Button>
					{search && (
						<Button variant="secondary" onClick={clearSearch}>
							Clear
						</Button>
					)}
				</div>
			</div>

			{/* Body */}
			{isLoading ? (
				<div className="p-12 text-center text-neutral-500">
					Loading check-ins…
				</div>
			) : error ? (
				<div className="p-12 text-center">
					<p className="text-red-500 mb-2">Failed to load check-ins</p>
					<p className="text-sm text-neutral-500">{String(error)}</p>
				</div>
			) : displayRows.length === 0 ? (
				<div className="p-12 text-center text-neutral-500">
					{search ? "No check-ins match your search." : "No check-ins yet."}
				</div>
			) : (
				<>
					{/* Mobile card view */}
					<div className="md:hidden divide-y divide-neutral-800">
						{displayRows.map((row) => (
							<div
								key={row.participant_id}
								className="p-4 space-y-2 hover:bg-neutral-900 transition-colors duration-150"
							>
								<div className="flex justify-between items-start">
									<div>
										<p className="font-medium text-white">
											{row.first_name} {row.last_name}
										</p>
										<p className="text-xs text-neutral-400">
											{row.participant_id}
										</p>
									</div>
								</div>
								<div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
									<div>
										<p className="text-neutral-500 uppercase tracking-wider">
											Email
										</p>
										<p className="text-neutral-300 truncate">{row.email}</p>
									</div>
									<div>
										<p className="text-neutral-500 uppercase tracking-wider">
											Phone
										</p>
										<p className="text-neutral-300">{row.ph_no}</p>
									</div>
									<div>
										<p className="text-neutral-500 uppercase tracking-wider">
											College
										</p>
										<p className="text-neutral-300 truncate">{row.college}</p>
									</div>
									<div>
										<p className="text-neutral-500 uppercase tracking-wider">
											Degree
										</p>
										<p className="text-neutral-300">{row.degree}</p>
									</div>
									<div>
										<p className="text-neutral-500 uppercase tracking-wider">
											Checked in at
										</p>
										<p className="text-neutral-300">
											{formatDate(row.checkedin_at)}
										</p>
									</div>
									<div>
										<p className="text-neutral-500 uppercase tracking-wider">
											Checked in by
										</p>
										<p className="text-neutral-300">{row.checkedin_by}</p>
									</div>
								</div>
							</div>
						))}
					</div>

					{/* Desktop table view */}
					<div className="hidden md:block overflow-x-auto">
						<table className="w-full">
							<thead>
								<tr className="border-b border-neutral-800">
									{[
										"Participant ID",
										"Name",
										"Email",
										"Phone",
										"College",
										"Degree",
										"Checked in at",
										"Checked in by",
									].map((h) => (
										<th
											key={h}
											className="px-6 py-4 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider whitespace-nowrap"
										>
											{h}
										</th>
									))}
								</tr>
							</thead>
							<tbody className="divide-y divide-neutral-800">
								{displayRows.map((row) => (
									<tr
										key={row.participant_id}
										className="hover:bg-neutral-900 transition-colors duration-150"
									>
										<td className="px-6 py-4 text-xs font-mono text-neutral-400 whitespace-nowrap">
											{row.participant_id}
										</td>
										<td className="px-6 py-4 text-sm text-white whitespace-nowrap">
											{row.first_name} {row.last_name}
										</td>
										<td className="px-6 py-4 text-sm text-neutral-400">
											{row.email}
										</td>
										<td className="px-6 py-4 text-sm text-neutral-400 whitespace-nowrap">
											{row.ph_no}
										</td>
										<td className="px-6 py-4 text-sm text-neutral-400 max-w-[200px] truncate">
											{row.college}
										</td>
										<td className="px-6 py-4 text-sm text-neutral-400 whitespace-nowrap">
											{row.degree}
										</td>
										<td className="px-6 py-4 text-sm text-neutral-400 whitespace-nowrap">
											{formatDate(row.checkedin_at)}
										</td>
										<td className="px-6 py-4 text-sm text-neutral-400">
											{row.checkedin_by}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</>
			)}

			{/* Pagination footer */}
			{!isLoading && !error && totalItems > 0 && (
				<div className="px-6 py-4 border-t border-neutral-800 flex flex-wrap items-center justify-between gap-4">
					<p className="text-sm text-neutral-500">
						{isSearching
							? `${Math.min((page - 1) * limit + 1, totalItems)}–${Math.min(page * limit, totalItems)} of ${totalItems} results`
							: `${(page - 1) * limit + 1}–${Math.min(page * limit, totalItems)} of ${totalItems} check-ins`}
					</p>

					<div className="flex items-center gap-2">
						{/* Prev */}
						<button
							type="button"
							disabled={page === 1}
							onClick={() => goToPage(page - 1)}
							className="p-1.5 border border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors duration-150"
							aria-label="Previous page"
						>
							<NavArrowLeft className="w-4 h-4" />
						</button>

						{/* Page indicator */}
						<span className="text-sm text-neutral-400 px-1">
							Page {page} of {totalPages}
						</span>

						{/* Next */}
						<button
							type="button"
							disabled={page >= totalPages}
							onClick={() => goToPage(page + 1)}
							className="p-1.5 border border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors duration-150"
							aria-label="Next page"
						>
							<NavArrowRight className="w-4 h-4" />
						</button>

						{/* Jump to page */}
						<form
							onSubmit={handlePageInputSubmit}
							className="flex items-center gap-1.5 ml-2"
						>
							<span className="text-xs text-neutral-500">Go to</span>
							<input
								type="number"
								min={1}
								max={totalPages}
								value={pageInput}
								onChange={(e) => setPageInput(e.target.value)}
								placeholder="pg"
								className="w-14 px-2 py-1 text-sm bg-neutral-900 border border-neutral-800 text-white text-center focus:outline-none focus:ring-2 focus:ring-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
							/>
							<Button variant="secondary" type="submit">
								Go
							</Button>
						</form>
					</div>
				</div>
			)}
		</div>
	);
}
