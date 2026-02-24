import { useMutation, useQuery } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { ArrowLeft, ScanQrCode } from "iconoir-react"
import { useState } from "react"
import type { Registration } from "@/api/registrations"
import { Button } from "@/ui/Button"
import { CheckInPopup } from "@/ui/CheckInPopup"
import { Field } from "@/ui/Field"
import { Input } from "@/ui/Input"
import { OverallCheckInsTable, StatusBadge } from "@/ui/OverallCheckInsTable"
import { QRScanner } from "@/ui/QRScanner"

export const Route = createFileRoute("/app/check-in")({
	component: CheckInPage,
})

function CheckInPage() {
	const { api, queryClient } = Route.useRouteContext()
	const [searchInput, setSearchInput] = useState("")
	const [searchQuery, setSearchQuery] = useState("")
	const [selectedRegistration, setSelectedRegistration] = useState<Registration | null>(null)
	const [popupOpen, setPopupOpen] = useState(false)
	const [scannedUserId, setScannedUserId] = useState<string | null>(null)
	const [showScanner, setShowScanner] = useState(false)
	const [qrError, setQrError] = useState("")
	const [checkInError, setCheckInError] = useState<string | null>(null)
	const [isRequestingCamera, setIsRequestingCamera] = useState(false)

	const participantIdPattern = /^MLNU[A-Za-z0-9]{6}$/

	const { data: searchResults, isLoading: isSearching } = useQuery({
		queryKey: ["registrations", "search", searchQuery],
		queryFn: () => api.registrations.search(searchQuery),
		enabled: searchQuery.length >= 3,
	})

	const checkInMutation = useMutation({
		mutationFn: (userId: string) => api.registrations.checkIn(userId),
		onSuccess: data => {
			setSelectedRegistration(data.registration)
			queryClient.invalidateQueries({ queryKey: ["registrations"] })
			setQrError("")
			setCheckInError(null)
		},
		onError: (error: any) => {
			const message = error.response?.data.message || error.response.message || "Failed to check in. Please try again."
			setCheckInError(message)
		},
	})

	const handleSearch = (query: string) => {
		const normalizedQuery = query.trim()
		const maybeParticipantId = normalizedQuery.toUpperCase()
		if (participantIdPattern.test(maybeParticipantId)) {
			setSelectedRegistration(null)
			setScannedUserId(maybeParticipantId)
			setPopupOpen(true)
			setSearchInput("")
			setSearchQuery("")
			setQrError("")
			setCheckInError(null)
			return
		}
		setSearchQuery(normalizedQuery)
		setSelectedRegistration(null)
		setScannedUserId(null)
		setPopupOpen(false)
		setQrError("")
		setCheckInError(null)
	}

	const handleSelectRegistration = (registration: Registration) => {
		setSelectedRegistration(registration)
		setSearchInput("")
		setSearchQuery("")
		setScannedUserId(null)
		setPopupOpen(true)
		setQrError("")
		setCheckInError(null)
	}

	const handleQRScan = (scannedText: string) => {
		setShowScanner(false)
		setQrError("")
		setSearchInput("")
		setSearchQuery("")
		setSelectedRegistration(null)
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
			setQrError(`Invalid QR code format. Expected MLNU followed by 6 alphanumeric characters, got: ${userId}`)
			return
		}
		setScannedUserId(userId)
		setPopupOpen(true)
	}

	const handleOpenScanner = async () => {
		setIsRequestingCamera(true)
		setQrError("")
		try {
			if (!navigator.mediaDevices?.getUserMedia) throw new Error("Camera API not supported in this browser")
			let stream: MediaStream
			try {
				stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
			} catch {
				stream = await navigator.mediaDevices.getUserMedia({ video: true })
			}
			stream.getTracks().forEach(t => t.stop())
			setShowScanner(true)
		} catch (err) {
			let msg = "Failed to access camera. "
			if (err instanceof DOMException) {
				const map: Record<string, string> = {
					NotAllowedError: "Please allow camera access to scan QR codes.",
					NotFoundError: "No camera found on this device.",
					NotReadableError: "Camera is already in use by another application.",
					OverconstrainedError: "No suitable camera found.",
				}
				msg += map[err.name] ?? "Please check your camera permissions."
			} else if (err instanceof Error) {
				msg = err.message
			} else {
				msg += "Please check your camera permissions."
			}
			setQrError(msg)
		} finally {
			setIsRequestingCamera(false)
		}
	}

	return (
		<div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
			<Link to="/app" className="inline-flex items-center gap-2 text-xs text-neutral-500 hover:text-white transition-colors duration-150 uppercase tracking-widest focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
				<ArrowLeft className="w-3.5 h-3.5" />
				Back to Dashboard
			</Link>

			<div className="space-y-1">
				<h2 className="text-2xl md:text-3xl font-bold text-white">Check-in</h2>
				<p className="text-neutral-500">Scan QR codes or search for attendees to check them in</p>
			</div>

			{/* QR Scanner Button */}
			<div className="bg-neutral-950 border border-neutral-800 p-6">
				<Button variant="primary" size="lg" onClick={handleOpenScanner} disabled={isRequestingCamera}
					className="w-full flex items-center justify-center gap-2">
					<ScanQrCode className="w-5 h-5" />
					{isRequestingCamera ? "Requesting Camera Access..." : "Scan QR Code"}
				</Button>
			</div>

			{qrError && <div className="p-4 bg-red-950/50 border border-red-900 text-red-500 text-sm">{qrError}</div>}

			{/* Manual Search */}
			<div className="bg-neutral-950 border border-neutral-800 p-6 space-y-4">
				<h3 className="text-lg font-semibold text-white">Manual Search</h3>
				<Field label="Search Participant" description="Search by participant ID (MLNU......)">
					<div className="flex gap-2">
						<Input type="text" placeholder="Enter participant ID" value={searchInput}
							onChange={e => setSearchInput(e.target.value)}
							onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); handleSearch(searchInput) } }}
							className="flex-1" />
						<Button variant="primary" onClick={() => handleSearch(searchInput)}>Search</Button>
					</div>
				</Field>

				{isSearching && <div className="text-sm text-neutral-500">Searching...</div>}
				{searchQuery.length >= 3 && !isSearching && searchResults && searchResults.length === 0 && (
					<div className="text-sm text-neutral-500">No results found</div>
				)}
				{searchResults && searchResults.length > 0 && (
					<div className="space-y-2">
						<p className="text-sm text-neutral-400">Found {searchResults.length} result(s)</p>
						<div className="space-y-2">
							{searchResults.map(reg => (
								<button key={reg.id} type="button" onClick={() => handleSelectRegistration(reg)}
									className="w-full text-left p-4 bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 transition-colors duration-150">
									<div className="flex items-start justify-between">
										<div className="space-y-1">
											<p className="font-medium text-white">{reg.name}</p>
											<p className="text-sm text-neutral-400">{reg.email}</p>
											<p className="text-sm text-neutral-400">{reg.phone} · {reg.college}</p>
										</div>
										<div className="flex flex-col gap-1 items-end">
											<StatusBadge status={reg.status} />
											{reg.checkedIn && <span className="text-xs text-green-500">✓ Checked In</span>}
										</div>
									</div>
								</button>
							))}
						</div>
					</div>
				)}
			</div>

			{showScanner && <QRScanner onScan={handleQRScan} onClose={() => setShowScanner(false)} />}

			<CheckInPopup
				open={popupOpen}
				onClose={() => {
					setPopupOpen(false)
					setSelectedRegistration(null)
					setScannedUserId(null)
					setCheckInError(null)
					checkInMutation.reset()
				}}
				registration={selectedRegistration}
				userId={scannedUserId}
				getUserById={api.users.getById}
				onCheckIn={id => checkInMutation.mutate(id)}
				isCheckingIn={checkInMutation.isPending}
				checkInSuccess={checkInMutation.isSuccess}
				checkInError={checkInError}
			/>

			<OverallCheckInsTable api={api} />
		</div>
	)
}
