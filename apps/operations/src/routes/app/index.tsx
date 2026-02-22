import { createFileRoute, Link } from "@tanstack/react-router";
import { ScanQrCode, Calendar, NavArrowRight } from "iconoir-react";

export const Route = createFileRoute("/app/")({
	component: DashboardPage,
});

function DashboardPage() {
	return (
		<div className="p-4 md:p-6 max-w-7xl mx-auto min-h-[70vh] flex flex-col items-center justify-center space-y-12">
			{/* Page header */}
			<div className="space-y-2 text-center">
				<h2 className="text-3xl md:text-5xl font-bold text-white tracking-tight">Dashboard</h2>
				<p className="text-neutral-500 text-base md:text-lg">
					Welcome to the operations portal for your college fest
				</p>
			</div>

			{/* Centered action tiles */}
			<div className="grid grid-cols-1 gap-6 w-full max-w-2xl">
				<Link
					to="/app/check-in"
					className="group block p-8 bg-neutral-950 border border-neutral-800 hover:border-neutral-700 hover:bg-neutral-900 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
				>
					<div className="flex items-center gap-6">
						<div className="p-4 bg-blue-950/50 border border-blue-800 text-blue-400 group-hover:text-blue-300 group-hover:border-blue-700 transition-colors">
							<ScanQrCode className="w-8 h-8" />
						</div>
						<div className="flex-1">
							<h3 className="text-xl font-bold text-white group-hover:text-stone-50 uppercase tracking-widest">Fest Check-in</h3>
							<p className="text-sm text-neutral-500 mt-1">Scan QR codes or search for attendees</p>
						</div>
						<NavArrowRight className="w-6 h-6 text-neutral-700 group-hover:text-neutral-400 transition-colors" />
					</div>
				</Link>

				<Link
					to="/app/events"
					className="group block p-8 bg-neutral-950 border border-neutral-800 hover:border-neutral-700 hover:bg-neutral-900 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
				>
					<div className="flex items-center gap-6">
						<div className="p-4 bg-blue-950/50 border border-blue-800 text-blue-400 group-hover:text-blue-300 group-hover:border-blue-700 transition-colors">
							<Calendar className="w-8 h-8" />
						</div>
						<div className="flex-1">
							<h3 className="text-xl font-bold text-white group-hover:text-stone-50 uppercase tracking-widest">Events</h3>
							<p className="text-sm text-neutral-500 mt-1">Manage event rounds and results</p>
						</div>
						<NavArrowRight className="w-6 h-6 text-neutral-700 group-hover:text-neutral-400 transition-colors" />
					</div>
				</Link>
			</div>
		</div>
	)
}


