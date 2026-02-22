import {
	createFileRoute,
	Outlet,
	redirect,
	useNavigate,
} from "@tanstack/react-router";
import { authRoutes } from "@/app/nav";
import { Button } from "@/ui/Button";

export const Route = createFileRoute("/app")({
	beforeLoad: async ({ context, location }) => {
		try {
			await context.auth.ensureSession();
		} catch {
			throw redirect({
				to: authRoutes.login,
				search: {
					redirect: location.pathname,
				},
			})
		}
	},
	component: AppLayout,
});

function AppLayout() {
	const navigate = useNavigate();
	const { auth } = Route.useRouteContext();

	const handleLogout = async () => {
		await auth.logout();
		navigate({ to: authRoutes.logout, search: { redirect: "/app" } });
	}

	return (
		<div className="min-h-screen flex flex-col bg-[var(--color-bg)]">
			{/* Top bar */}
			<header className="h-16 bg-neutral-950 border-b border-neutral-800 flex items-center justify-between px-4 md:px-6 relative z-50">
				<div className="flex items-center gap-4 md:gap-6">
					<h1 className="text-lg md:text-xl font-bold text-white tracking-tight">
						MELINIA'26 OPS
					</h1>
				</div>

				<div className="flex items-center gap-2 md:gap-4">
					<Button variant="ghost" size="sm" onClick={handleLogout}>
						Logout
					</Button>
				</div>
			</header>

			{/* Main content */}
			<main className="flex-1">
				<Outlet />
			</main>
		</div>
	)
}
