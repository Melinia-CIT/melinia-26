import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
	ArrowLeft,
	Clock,
	Group,
	NavArrowDown,
	NavArrowLeft,
	NavArrowRight,
	Plus,
	Search,
	User,
	Xmark,
} from "iconoir-react";
import { useMemo, useState } from "react";
import type {
	EventDetail,
	EventRegistration,
	EventRegistrationsResponse,
} from "@/api/events";
import { AddVolunteersModal } from "@/ui/AddVolunteersModal";
import { Button } from "@/ui/Button";

type CrewMember = {
	user_id: string;
	first_name: string;
	last_name: string;
	ph_no: string;
};

export const Route = createFileRoute("/app/events/$eventId/")({
	component: EventRegistrationsPage,
});

// ── helpers ───────────────────────────────────────────────────────────────────

function fmtTime(date: string | Date) {
	return new Date(date)
		.toLocaleTimeString([], {
			hour: "2-digit",
			minute: "2-digit",
			hour12: true,
		})
		.toUpperCase();
}

function TypeBadge({ type }: { type: "TEAM" | "SOLO" }) {
	if (type === "TEAM") {
		return (
			<span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-bold border uppercase tracking-tighter bg-blue-950/50 text-blue-400 border-blue-800 w-fit">
				<Group className="w-2.5 h-2.5" />
				Team
			</span>
		);
	}
	return (
		<span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-bold border uppercase tracking-tighter bg-blue-950/50 text-blue-400 border-blue-800 w-fit">
			<User className="w-2.5 h-2.5" />
			Solo
		</span>
	);
}
// ── page ──────────────────────────────────────────────────────────────────────

function EventRegistrationsPage() {
	const { eventId } = Route.useParams();
	const { api } = Route.useRouteContext();
	const queryClient = useQueryClient();
	const [page, setPage] = useState(0);
	const [limit, setLimit] = useState(10);
	const [searchInput, setSearchInput] = useState("");
	const [activeSearch, setActiveSearch] = useState("");
	const [showVolunteersModal, setShowVolunteersModal] = useState(false);
	const [showCrew, setShowCrew] = useState(false);
	const [addVolunteersError, setAddVolunteersError] = useState<string | null>(
		null,
	);

	// Fetch detailed event data (includes rounds)
	const { data: event, isLoading: isEventLoading } = useQuery<EventDetail>({
		queryKey: ["event-detail", eventId],
		queryFn: () => api.events.getById(eventId),
		staleTime: 1000 * 60,
	});

	// Normal mode query
	const {
		data,
		isLoading: isRegistrationsLoading,
		error,
	} = useQuery<EventRegistrationsResponse>({
		queryKey: ["event-registrations", eventId, page, limit],
		queryFn: () =>
			api.events.getRegistrations(eventId, { from: page * limit, limit }),
		enabled: !activeSearch,
		staleTime: 1000 * 30,
	});

	// Full dump query for search
	const { data: fullData, isLoading: isFullLoading } =
		useQuery<EventRegistrationsResponse>({
			queryKey: ["event-registrations-full", eventId],
			queryFn: () =>
				api.events.getRegistrations(eventId, { from: 0, limit: 9999 }),
			enabled: !!activeSearch,
			staleTime: 1000 * 30,
		});

	const addVolunteersMutation = useMutation({
		mutationFn: (emails: string[]) => {
			return api.events.assignVolunteers(eventId, emails);
		},
		onSuccess: () => {
			setAddVolunteersError(null);
			queryClient.invalidateQueries({ queryKey: ["event-detail", eventId] });
		},
		onError: (error) => {
			const axiosErr = error as any;
			const message =
				axiosErr.response?.data?.message || "Failed to add volunteers.";
			setAddVolunteersError(message);
		},
	});

	// Filter registrations client-side when searching
	const filteredRegistrations = useMemo(() => {
		if (!activeSearch || !fullData?.data) return [];
		const searchLower = activeSearch.toLowerCase();
		return fullData.data.filter((reg) => {
			if (reg.type === "TEAM") {
				return (
					reg.name.toLowerCase().includes(searchLower) ||
					reg.members.some(
						(m) =>
							m.first_name.toLowerCase().includes(searchLower) ||
							m.last_name.toLowerCase().includes(searchLower) ||
							m.participant_id.toLowerCase().includes(searchLower) ||
							m.ph_no.includes(searchLower),
					)
				);
			}
			return (
				reg.first_name.toLowerCase().includes(searchLower) ||
				reg.last_name.toLowerCase().includes(searchLower) ||
				reg.participant_id.toLowerCase().includes(searchLower) ||
				reg.ph_no.includes(searchLower)
			);
		});
	}, [activeSearch, fullData]);

	const totalCount = activeSearch
		? filteredRegistrations.length
		: (data?.pagination.total ?? 0);
	const totalPages = Math.ceil(totalCount / limit) || 1;
	const registrations = activeSearch
		? filteredRegistrations.slice(page * limit, (page + 1) * limit)
		: (data?.data ?? []);

	const isLoadingRegistrations = activeSearch
		? isFullLoading
		: isRegistrationsLoading;

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
					<h2 className="text-3xl font-bold text-white">
						{event?.name ?? "Loading…"}
					</h2>
					<div className="flex items-center gap-4 text-sm text-neutral-500">
						<span>{event?.event_type?.toUpperCase()}</span>
						<span>•</span>
						<span>
							{event?.participation_type?.toUpperCase()} participation
						</span>
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
					setShowVolunteersModal(false);
					setAddVolunteersError(null);
					addVolunteersMutation.reset();
				}}
				eventName={event?.name ?? ""}
				onAdd={(emails) => addVolunteersMutation.mutate(emails)}
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
						{[1, 2, 3].map((i) => (
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
							.map((round) => (
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
						<div
							className={`p-2 bg-blue-950/20 border border-blue-900/50 text-blue-400 group-hover:text-blue-300 transition-colors`}
						>
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
								{(event.crew.volunteers as unknown as CrewMember[]).map(
									(person) => (
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
											<div className="text-[10px] text-neutral-400 font-mono self-end">
												{person.ph_no}
											</div>
										</div>
									),
								)}
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
					<div className="relative flex-1 max-w-md">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
						<input
							type="text"
							placeholder="Search by name, ID, or phone..."
							value={searchInput}
							onChange={(e) => setSearchInput(e.target.value)}
							onKeyDown={(e) => {
								if (e.key === "Enter") {
									e.preventDefault();
									setActiveSearch(searchInput.trim());
									setPage(0);
								}
							}}
							className="w-full bg-neutral-950 border border-neutral-800 text-white pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-neutral-600"
						/>
						{searchInput && (
							<button
								type="button"
								onClick={() => {
									setSearchInput("");
									setActiveSearch("");
									setPage(0);
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
							setActiveSearch(searchInput.trim());
							setPage(0);
						}}
						className="px-4 py-2 text-xs font-bold uppercase tracking-widest border border-neutral-700 text-neutral-300 hover:bg-neutral-800 transition-colors"
					>
						Search
					</button>
					{activeSearch && (
						<span className="text-xs text-neutral-500">
							Showing {totalCount} result{totalCount !== 1 ? "s" : ""} for "
							{activeSearch}"
						</span>
					)}
				</div>

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

						{/* Desktop View */}
						<div className="hidden md:block border border-neutral-800 bg-neutral-950 overflow-hidden shadow-2xl">
							{/* Table */}
							<div className="overflow-x-auto">
								<table className="w-full">
									<thead>
										<tr className="border-b border-neutral-800 bg-neutral-900/60">
											{event?.participation_type?.toUpperCase() === "TEAM" && (
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
									<tbody className="">
										{registrations.map((reg, idx) => (
											<RegistrationRow
												key={`${reg.type}-${idx}`}
												reg={reg}
												showTeamColumn={
													event?.participation_type?.toUpperCase() === "TEAM"
												}
											/>
										))}
									</tbody>
								</table>
							</div>

							{/* Pagination */}
							<TablePagination
								page={page}
								totalPages={totalPages}
								total={totalCount}
								pageLimit={limit}
								onPrev={() => setPage((p) => Math.max(0, p - 1))}
								onNext={() => setPage((p) => p + 1)}
								onSetPage={setPage}
								onSetLimit={setLimit}
							/>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}

// ── Table Pagination ────────────────────────────────────────────────────────────

interface TablePaginationProps {
	page: number;
	totalPages: number;
	total: number;
	pageLimit: number;
	onPrev: () => void;
	onNext: () => void;
	onSetPage?: (page: number) => void;
	onSetLimit?: (limit: number) => void;
	limitOptions?: number[];
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
	const from = total === 0 ? 0 : page * pageLimit + 1;
	const to = Math.min((page + 1) * pageLimit, total);
	const [gotoInput, setGotoInput] = useState("");

	const renderPageNumbers = () => {
		if (!onSetPage || totalPages <= 1) return null;

		const pages: (number | string)[] = [];

		if (totalPages <= 7) {
			for (let i = 0; i < totalPages; i++) pages.push(i);
		} else {
			if (page < 3) {
				pages.push(0, 1, 2, 3, "...", totalPages - 1);
			} else if (page > totalPages - 4) {
				pages.push(
					0,
					"...",
					totalPages - 4,
					totalPages - 3,
					totalPages - 2,
					totalPages - 1,
				);
			} else {
				pages.push(0, "...", page - 1, page, page + 1, "...", totalPages - 1);
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
						);
					}
					const isCurrent = p === page;
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
					);
				})}
			</div>
		);
	};

	const handleGotoPage = () => {
		if (!onSetPage) return;
		const pageNum = parseInt(gotoInput, 10);
		if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
			onSetPage(pageNum - 1);
			setGotoInput("");
		}
	};

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
							onChange={(e) => {
								onSetLimit(parseInt(e.target.value, 10));
								onSetPage?.(0);
							}}
							className="bg-neutral-950 border border-neutral-800 text-neutral-400 text-[10px] uppercase tracking-widest px-2 py-1 focus:outline-none focus:border-neutral-600"
						>
							{limitOptions.map((opt) => (
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
								onChange={(e) => setGotoInput(e.target.value)}
								onKeyDown={(e) => {
									if (e.key === "Enter") {
										e.preventDefault();
										handleGotoPage();
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
	);
}

// ── mobile card ──────────────────────────────────────────────────────────────────────

function RegistrationMobileCard({ reg }: { reg: EventRegistration }) {
	if (reg.type === "SOLO") {
		return (
			<div className="p-4 space-y-4">
				<div className="flex items-start justify-between">
					<div className="space-y-1.5 flex-1 min-w-0">
						<TypeBadge type="SOLO" />
						<div className="text-sm font-bold text-white uppercase tracking-wider truncate">
							{reg.first_name} {reg.last_name}
						</div>
						<div className="text-[10px] text-neutral-500 font-mono">
							{reg.participant_id}
						</div>
					</div>
					<div className="shrink-0 pl-4">
						<div className="text-[11px] text-neutral-400 font-mono tracking-tight">
							{reg.ph_no}
						</div>
					</div>
				</div>
				<div className="pt-3 border-t border-neutral-800/40">
					<div className="text-[11px] text-neutral-300 font-medium leading-relaxed">
						{reg.college}
					</div>
					<div className="text-[10px] text-neutral-600 mt-0.5">
						{reg.degree}
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="p-4 space-y-4">
			<div className="flex items-start justify-between">
				<div className="space-y-1.5">
					<TypeBadge type="TEAM" />
					<div className="text-sm font-black text-white uppercase tracking-widest">
						{reg.name}
					</div>
					<div className="text-[9px] text-neutral-600 uppercase tracking-widest font-black">
						{reg.members.length} members
					</div>
				</div>
			</div>
			<div className="space-y-4 pl-3 border-l-2 border-neutral-800 ml-1">
				{reg.members.map((m) => (
					<div key={m.participant_id} className="space-y-1.5">
						<div className="flex items-center justify-between gap-3">
							<span className="text-xs font-bold text-neutral-300">
								{m.first_name} {m.last_name}
							</span>
							<span className="text-[10px] text-neutral-600 font-mono shrink-0">
								{m.ph_no}
							</span>
						</div>
						<div className="text-[10px] leading-relaxed">
							<span className="text-neutral-500 font-medium">{m.college}</span>
							<span className="mx-1.5 text-neutral-800">·</span>
							<span className="text-neutral-700">{m.degree}</span>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}

// ── round card ──────────────────────────────────────────────────────────────

function RoundCard({
	round,
	eventId,
}: {
	round: EventDetail["rounds"][number];
	eventId: string;
}) {
	return (
		<Link
			to="/app/events/$eventId/$roundNo"
			params={{ eventId, roundNo: round.round_no.toString() }}
			className="bg-neutral-950 border border-neutral-800 p-5 space-y-4 relative overflow-hidden group block hover:border-neutral-600 hover:bg-neutral-900 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
		>
			<div
				className="absolute top-0 right-0 p-3 text-[48px] font-black leading-none pointer-events-none select-none italic transition-all duration-300 opacity-20 group-hover:opacity-40"
				style={{
					WebkitTextStroke: "1px var(--color-blue-800)",
					WebkitTextFillColor: "var(--color-blue-800)",
				}}
			>
				#{round.round_no}
			</div>

			<div className="space-y-1 relative z-10">
				<div className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest">
					Round {round.round_no}
				</div>
				<h4 className="text-lg font-bold text-white leading-tight">
					{round.round_name}
				</h4>
			</div>

			<div className="relative z-10 pt-1">
				<div className="flex items-center gap-2 text-[11px] text-neutral-500">
					<Clock className="w-3.5 h-3.5 text-neutral-700 shrink-0" />
					<span>
						{fmtTime(round.start_time)} – {fmtTime(round.end_time)}
					</span>
				</div>
			</div>
		</Link>
	);
}

// ── registration rows ────────────────────────────────────────────────────────

function RegistrationRow({
	reg,
	showTeamColumn,
}: {
	reg: EventRegistration;
	showTeamColumn: boolean;
}) {
	if (reg.type === "SOLO") {
		return (
			<tr className="hover:bg-neutral-900/40 transition-colors duration-150 border-b border-neutral-800/60 last:border-0">
				{showTeamColumn && (
					<td className="px-6 py-4 border-r border-neutral-800/60 bg-neutral-950/20 align-middle">
						<div className="flex flex-col items-center justify-center">
							<TypeBadge type="SOLO" />
						</div>
					</td>
				)}
				<td className="px-6 py-4">
					<div className="flex flex-col gap-2">
						{!showTeamColumn && <TypeBadge type="SOLO" />}
						<div className="text-sm font-semibold text-white">
							{reg.first_name} {reg.last_name}
						</div>
						<div className="text-[10px] text-neutral-500 font-mono mt-0.5">
							{reg.participant_id}
						</div>
					</div>
				</td>
				<td className="px-6 py-4 hidden md:table-cell">
					<div className="text-xs text-neutral-400">
						<div className="truncate max-w-[240px] font-medium text-neutral-300">
							{reg.college}
						</div>
						<div className="text-[10px] text-neutral-600 mt-0.5">
							{reg.degree}
						</div>
					</div>
				</td>
				<td className="px-6 py-4">
					<div className="text-xs text-neutral-400 font-mono">{reg.ph_no}</div>
				</td>
			</tr>
		);
	}

	return (
		<>
			{reg.members.map((member, idx) => (
				<tr
					key={member.participant_id}
					className={`hover:bg-neutral-900/20 transition-colors duration-150 border-b border-neutral-800/60 last:border-0 ${
						idx === 0 ? "" : "border-t-0"
					}`}
				>
					{idx === 0 && showTeamColumn && (
						<td
							rowSpan={reg.members.length}
							className="px-6 py-6 border-r border-neutral-800/60 bg-neutral-950/30 align-middle"
						>
							<div className="flex flex-col items-center justify-center space-y-2 sticky top-4 text-center">
								<TypeBadge type="TEAM" />
								<div className="text-sm font-black text-white uppercase tracking-widest leading-none">
									{reg.name}
								</div>
								<div className="text-[9px] text-neutral-600 uppercase tracking-widest font-bold">
									{reg.members.length} members
								</div>
							</div>
						</td>
					)}
					<td className="px-6 py-3.5">
						<div className="text-sm text-neutral-300 font-medium">
							{member.first_name} {member.last_name}
						</div>
						<div className="text-[10px] text-neutral-600 font-mono mt-0.5">
							{member.participant_id}
						</div>
					</td>
					<td className="px-6 py-3.5 hidden md:table-cell">
						<div className="text-xs text-neutral-500">
							<div className="truncate max-w-[240px] text-neutral-400">
								{member.college}
							</div>
							<div className="text-[10px] text-neutral-700 mt-0.5">
								{member.degree}
							</div>
						</div>
					</td>
					<td className="px-6 py-3.5">
						<div className="text-xs text-neutral-500 font-mono">
							{member.ph_no}
						</div>
					</td>
				</tr>
			))}
		</>
	);
}
