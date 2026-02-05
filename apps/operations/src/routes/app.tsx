import {
	createFileRoute,
	Link,
	Outlet,
	redirect,
	useNavigate,
} from "@tanstack/react-router";
import { authRoutes, mainNavItems } from "@/app/nav";
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

	const handleLogout = () => {
		auth.logout();
		navigate({ to: authRoutes.logout, search: { redirect: "/app" } });
	}

	return (
		<div className="min-h-screen flex flex-col bg-black">
			{/* Top bar */}
			<header className="h-16 bg-neutral-950 border-b border-neutral-800 flex items-center justify-between px-6">
				<div className="flex items-center gap-6">
					<h1 className="text-xl font-bold text-white tracking-tight">
						MELINIA'26 OPS
					</h1>

					{/* Navigation */}
					<nav className="flex items-center gap-1">
						{mainNavItems
							.filter((item) => item.enabled)
							.map((item) => (
								<Link
									key={item.to}
									to={item.to}
									className="px-3 py-1.5 text-sm text-neutral-400 hover:text-white hover:bg-neutral-900 transition-colors duration-150"
									activeProps={{
										className: "text-white bg-neutral-900",
									}}
								>
									{item.label}
								</Link>
							))}
					</nav>
				</div>

				<div className="flex items-center gap-4">
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
