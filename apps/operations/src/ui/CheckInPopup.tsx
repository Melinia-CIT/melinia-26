import type { UserWithProfile } from "@melinia/shared";
import { useQuery } from "@tanstack/react-query";
import { Xmark } from "iconoir-react";
import { useEffect } from "react";
import { createPortal } from "react-dom";
import type { Registration } from "@/api/registrations";
import { Button } from "@/ui/Button";

export interface CheckInPopupProps {
	open: boolean;
	onClose: () => void;

	/** If present, renders registration details + check-in action */
	registration: Registration | null;

	/** For QR scans before registration data is available */
	userId: string | null;

	getUserById: (id: string) => Promise<UserWithProfile>;

	onCheckIn: (userId: string) => void;
	isCheckingIn: boolean;
	checkInSuccess: boolean;
	checkInError: string | null;
}

export function CheckInPopup({
	open,
	onClose,
	registration,
	userId,
	getUserById,
	onCheckIn,
	isCheckingIn,
	checkInSuccess,
	checkInError,
}: CheckInPopupProps) {
	const normalizedUserId = userId?.trim() ? userId.trim().toUpperCase() : null;
	const normalizedRegistrationId = registration?.id?.trim()
		? registration.id.trim().toUpperCase()
		: null;
	const effectiveUserId = normalizedUserId ?? normalizedRegistrationId;

	useEffect(() => {
		if (!open || !checkInSuccess) return;
		const timeoutId = window.setTimeout(() => {
			onClose();
		}, 2000);
		return () => window.clearTimeout(timeoutId);
	}, [open, checkInSuccess, onClose]);

	const {
		data: user,
		isLoading,
		isError,
		error,
	} = useQuery({
		queryKey: ["users", "byId", effectiveUserId],
		queryFn: () => getUserById(effectiveUserId as string),
		enabled: open && !!effectiveUserId,
	});

	if (!open) return null;

	return createPortal(
		<div
			className="fixed inset-0 bg-black/90 z-[9999] flex items-center justify-center p-2 sm:p-4 min-h-[100dvh]"
			style={{ height: "100dvh" }}
		>
			<div className="w-full max-w-4xl max-h-[calc(100dvh-1rem)] bg-neutral-950 border border-neutral-800 flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
				{/* Header */}
				<div className="flex items-center justify-between px-4 md:px-6 py-4 border-b border-neutral-800">
					<div className="space-y-1">
						<h3 className="text-lg md:text-xl font-semibold text-white">
							Check-in
						</h3>
						{effectiveUserId && (
							<p className="text-xs text-neutral-500">ID: {effectiveUserId}</p>
						)}
					</div>
					<button
						type="button"
						onClick={onClose}
						className="p-2 text-neutral-400 hover:text-white transition-colors duration-150"
						aria-label="Close"
					>
						<Xmark className="w-6 h-6" />
					</button>
				</div>

				{/* Body */}
				<div className="p-4 md:p-6 space-y-6 flex-1 overflow-y-auto">
					{/* Success */}
					{checkInSuccess && (
						<div className="p-4 bg-green-950/50 border border-green-900 text-green-500 text-sm">
							✓ Successfully checked in (closing...)
						</div>
					)}

					{/* Check-in errors */}
					{checkInError && (
						<div className="p-4 bg-red-950/50 border border-red-900 text-red-500 text-sm">
							{checkInError}
						</div>
					)}

					{/* Registration details */}
					{registration && (
						<div className="space-y-3">
							<div className="flex items-center justify-between">
								<h4 className="text-sm font-medium text-white">Registration</h4>
								<RegistrationStatusBadge status={registration.status} />
							</div>

							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<Info label="Name" value={registration.name} />
								<Info label="Email" value={registration.email} />
								<Info label="Phone" value={registration.phone} />
								<Info label="College" value={registration.college} />
								<Info
									label="Check-in"
									value={
										registration.checkedIn ? "Checked In" : "Not Checked In"
									}
								/>
								{registration.checkedInAt && (
									<Info
										label="Checked In At"
										value={new Date(registration.checkedInAt).toLocaleString()}
									/>
								)}
							</div>

							{/* Check-in action */}
							{!registration.checkedIn && (
								<div className="pt-4 border-t border-neutral-800">
									{registration.status === "verified" ? (
										<div className="space-y-3">
											<Button
												variant="primary"
												onClick={() => onCheckIn(registration.id)}
												disabled={isCheckingIn || checkInSuccess}
											>
												{isCheckingIn ? "Checking in..." : "Check In Attendee"}
											</Button>
										</div>
									) : (
										<div className="p-4 bg-yellow-950/50 border border-yellow-900 text-yellow-500 text-sm">
											This attendee must be verified before check-in
										</div>
									)}
								</div>
							)}
						</div>
					)}

					{/* User details */}
					<div className="space-y-3">
						<h4 className="text-sm font-medium text-white">User Details</h4>

						{!effectiveUserId ? (
							<div className="text-sm text-neutral-500">No user scanned.</div>
						) : isLoading ? (
							<div className="text-sm text-neutral-500">Loading user...</div>
						) : isError ? (
							<div className="p-4 bg-red-950/50 border border-red-900 text-red-500 text-sm">
								{(() => {
									const axErr = error as import("axios").AxiosError<{
										message?: string;
									}>;
									const msg =
										axErr?.response?.data?.message ||
										(error instanceof Error ? error.message : null) ||
										"Failed to fetch user details";
									return msg;
								})()}
							</div>
						) : (
							<UserDetails user={user as UserWithProfile} />
						)}

						{/* Check-in action for QR scans (no registration data yet) */}
						{!registration && effectiveUserId && (
							<div className="pt-4 border-t border-neutral-800">
								<Button
									variant="primary"
									onClick={() => onCheckIn(effectiveUserId)}
									disabled={
										checkInSuccess || isCheckingIn || isLoading || isError
									}
									className="w-full"
								>
									{isCheckingIn ? "Checking in..." : "Check In"}
								</Button>
							</div>
						)}
					</div>
				</div>

				{/* Footer */}
				<div className="px-4 md:px-6 py-4 border-t border-neutral-800 shrink-0">
					<Button variant="secondary" onClick={onClose} className="w-full">
						Close
					</Button>
				</div>
			</div>
		</div>,
		document.body,
	);
}

function Info({ label, value }: { label: string; value: string }) {
	return (
		<div className="space-y-1">
			<p className="text-xs text-neutral-500">{label}</p>
			<p className="text-sm text-white break-words">{value}</p>
		</div>
	);
}

function UserDetails({ user }: { user: UserWithProfile }) {
	const fullName =
		`${user.profile.first_name} ${user.profile.last_name ?? ""}`.trim();

	return (
		<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
			<Info label="Name" value={fullName || "—"} />
			<Info label="Email" value={user.email} />
			<Info label="Phone" value={user.ph_no ?? "—"} />
			<Info label="Status" value={user.status} />
			<Info label="Payment" value={user.payment_status} />
			<Info
				label="Profile Completed"
				value={user.profile_completed ? "Yes" : "No"}
			/>
			<Info label="College" value={user.profile.college} />
			<Info label="Degree" value={user.profile.degree} />
			<Info label="Year" value={String(user.profile.year)} />
		</div>
	);
}

function RegistrationStatusBadge({
	status,
}: {
	status: Registration["status"];
}) {
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
