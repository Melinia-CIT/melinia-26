import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import type { Registration } from "@/api/registrations";
import { Button } from "@/ui/Button";
import { Input } from "@/ui/Input";

export const Route = createFileRoute("/app/registrations")({
	component: RegistrationsPage,
});

function RegistrationsPage() {
	const { api } = Route.useRouteContext();
	const [search, setSearch] = useState("");
	const [statusFilter, setStatusFilter] = useState<
		Registration["status"] | "all"
	>("all");
	const [checkedInFilter, setCheckedInFilter] = useState<
		"all" | "checked-in" | "pending"
	>("all");
	const [page, setPage] = useState(1);

	const { data, isLoading, error } = useQuery({
		queryKey: ["registrations", page, search, statusFilter, checkedInFilter],
		queryFn: () =>
			api.registrations.list({
				page,
				limit: 20,
				search: search || undefined,
				status: statusFilter !== "all" ? statusFilter : undefined,
				checkedIn:
					checkedInFilter === "all"
						? undefined
						: checkedInFilter === "checked-in",
			}),
	})

	return (
		<div className="p-6 max-w-7xl mx-auto space-y-6">
			{/* Header */}
			<div className="space-y-1">
				<h2 className="text-3xl font-bold text-white">Registrations</h2>
				<p className="text-neutral-500">
					View and manage all fest registrations
				</p>
			</div>

			{/* Filters */}
			<div className="bg-neutral-950 border border-neutral-800 p-6 space-y-4">
				<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
					{/* Search */}
					<div className="md:col-span-2">
						<label
							htmlFor="search"
							className="block text-sm font-medium text-neutral-300 mb-2"
						>
							Search
						</label>
						<Input
							id="search"
							type="text"
							placeholder="Name, email, phone, college..."
							value={search}
							onChange={(e) => setSearch(e.target.value)}
						/>
					</div>

					{/* Status filter */}
					<div>
						<label
							htmlFor="status"
							className="block text-sm font-medium text-neutral-300 mb-2"
						>
							Status
						</label>
						<select
							id="status"
							value={statusFilter}
							onChange={(e) =>
								setStatusFilter(
									e.target.value as Registration["status"] | "all",
								)
							}
							className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 text-white focus:outline-none focus:ring-2 focus:ring-white transition-colors duration-150"
						>
							<option value="all">All</option>
							<option value="pending">Pending</option>
							<option value="verified">Verified</option>
							<option value="rejected">Rejected</option>
						</select>
					</div>

					{/* Check-in filter */}
					<div>
						<label
							htmlFor="checkin"
							className="block text-sm font-medium text-neutral-300 mb-2"
						>
							Check-in
						</label>
						<select
							id="checkin"
							value={checkedInFilter}
							onChange={(e) =>
								setCheckedInFilter(
									e.target.value as "all" | "checked-in" | "pending",
								)
							}
							className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 text-white focus:outline-none focus:ring-2 focus:ring-white transition-colors duration-150"
						>
							<option value="all">All</option>
							<option value="checked-in">Checked In</option>
							<option value="pending">Not Checked In</option>
						</select>
					</div>
				</div>
			</div>

			{/* Results */}
			<div className="bg-neutral-950 border border-neutral-800">
				{isLoading ? (
					<div className="p-12 text-center text-neutral-500">
						Loading registrations...
					</div>
				) : error ? (
					<div className="p-12 text-center">
						<p className="text-red-500 mb-4">Failed to load registrations</p>
						<p className="text-sm text-neutral-500">{String(error)}</p>
					</div>
				) : !data || data.data.length === 0 ? (
					<div className="p-12 text-center text-neutral-500">
						No registrations found
					</div>
				) : (
					<>
						{/* Table */}
						<div className="overflow-x-auto">
							<table className="w-full">
								<thead>
									<tr className="border-b border-neutral-800">
										<th className="px-6 py-4 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">
											Name
										</th>
										<th className="px-6 py-4 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">
											Email
										</th>
										<th className="px-6 py-4 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">
											Phone
										</th>
										<th className="px-6 py-4 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">
											College
										</th>
										<th className="px-6 py-4 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">
											Status
										</th>
										<th className="px-6 py-4 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">
											Check-in
										</th>
										<th className="px-6 py-4 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">
											Registered
										</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-neutral-800">
									{data.data.map((registration) => (
										<tr
											key={registration.id}
											className="hover:bg-neutral-900 transition-colors duration-150"
										>
											<td className="px-6 py-4 text-sm text-white">
												{registration.name}
											</td>
											<td className="px-6 py-4 text-sm text-neutral-400">
												{registration.email}
											</td>
											<td className="px-6 py-4 text-sm text-neutral-400">
												{registration.phone}
											</td>
											<td className="px-6 py-4 text-sm text-neutral-400">
												{registration.college}
											</td>
											<td className="px-6 py-4 text-sm">
												<StatusBadge status={registration.status} />
											</td>
											<td className="px-6 py-4 text-sm">
												<CheckInBadge checkedIn={registration.checkedIn} />
											</td>
											<td className="px-6 py-4 text-sm text-neutral-400">
												{new Date(
													registration.registeredAt,
												).toLocaleDateString()}
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>

						{/* Pagination */}
						<div className="px-6 py-4 border-t border-neutral-800 flex items-center justify-between">
							<p className="text-sm text-neutral-500">
								Showing {(page - 1) * 20 + 1} to{" "}
								{Math.min(page * 20, data.total)} of {data.total} registrations
							</p>
							<div className="flex gap-2">
								<Button
									variant="secondary"
									disabled={page === 1}
									onClick={() => setPage(page - 1)}
								>
									Previous
								</Button>
								<Button
									variant="secondary"
									disabled={page >= data.totalPages}
									onClick={() => setPage(page + 1)}
								>
									Next
								</Button>
							</div>
						</div>
					</>
				)}
			</div>
		</div>
	)
}

function StatusBadge({ status }: { status: Registration["status"] }) {
	const styles = {
		pending: "bg-yellow-950/50 text-yellow-500 border-yellow-900",
		verified: "bg-green-950/50 text-green-500 border-green-900",
		rejected: "bg-red-950/50 text-red-500 border-red-900",
	}

	const labels = {
		pending: "Pending",
		verified: "Verified",
		rejected: "Rejected",
	}

	return (
		<span
			className={`inline-block px-2 py-1 text-xs font-medium border ${styles[status]}`}
		>
			{labels[status]}
		</span>
	)
}

function CheckInBadge({ checkedIn }: { checkedIn: boolean }) {
	return checkedIn ? (
		<span className="inline-block px-2 py-1 text-xs font-medium border bg-green-950/50 text-green-500 border-green-900">
			Checked In
		</span>
	) : (
		<span className="inline-block px-2 py-1 text-xs font-medium border bg-neutral-900 text-neutral-500 border-neutral-800">
			Pending
		</span>
	)
}
