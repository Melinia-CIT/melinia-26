import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/ui/Button";

export const Route = createFileRoute("/app/")({
	component: DashboardPage,
});

function DashboardPage() {
	return (
		<div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
			{/* Page header */}
			<div className="space-y-1">
				<h2 className="text-2xl md:text-3xl font-bold text-white">Dashboard</h2>
				<p className="text-neutral-500">
					Welcome to the operations portal for your college fest
				</p>
			</div>

			{/* Actions section */}
			<div className="bg-neutral-950 border border-neutral-800 p-4 space-y-4">
				<p className="text-sm font-medium text-neutral-500 uppercase tracking-wider">
					Actions
				</p>
				<div className="flex flex-wrap gap-4">
					<Link to="/app/check-in">
						<Button variant="primary" size="md">
							Global Check-in
						</Button>
					</Link>
					<Link to="/app/events">
						<Button variant="primary" size="md">
							Events
						</Button>
					</Link>
				</div>
			</div>

			{/* Stats cards */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
				<StatCard
					label="Registrations Today"
					value="234"
					description="12% increase from yesterday"
				/>
				<StatCard
					label="Check-ins"
					value="189"
					description="80% of registered attendees"
				/>
				<StatCard
					label="Pending Verifications"
					value="15"
					description="3 require immediate attention"
				/>
			</div>
		</div>
	)
}

interface StatCardProps {
	label: string;
	value: string;
	description: string;
}

function StatCard({ label, value, description }: StatCardProps) {
	return (
		<div className="bg-neutral-950 border border-neutral-800 p-6 space-y-2">
			<p className="text-sm font-medium text-neutral-500">{label}</p>
			<p className="text-3xl font-bold text-white">{value}</p>
			<p className="text-sm text-neutral-500">{description}</p>
		</div>
	)
}


