import {
	createFileRoute,
	Link,
	Outlet,
	redirect,
	useNavigate,
} from "@tanstack/react-router";
import { Menu, Xmark } from "iconoir-react";
import { useState } from "react";
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
	const [isMenuOpen, setIsMenuOpen] = useState(false);

	const handleLogout = () => {
		auth.logout();
		navigate({ to: authRoutes.logout, search: { redirect: "/app" } });
	}

	const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

	return (
		<div className="min-h-screen flex flex-col bg-black">
			{/* Top bar */}
			<header className="h-16 bg-neutral-950 border-b border-neutral-800 flex items-center justify-between px-4 md:px-6 relative z-50">
				<div className="flex items-center gap-4 md:gap-6">
					<h1 className="text-lg md:text-xl font-bold text-white tracking-tight">
						MELINIA'26 OPS
					</h1>

					{/* Desktop Navigation */}
					<nav className="hidden md:flex items-center gap-1">
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

				<div className="flex items-center gap-2 md:gap-4">
					<div className="hidden md:block">
						<Button variant="ghost" size="sm" onClick={handleLogout}>
							Logout
						</Button>
					</div>

					{/* Mobile Menu Toggle */}
					<button
						type="button"
						className="md:hidden p-2 text-neutral-400 hover:text-white transition-colors"
						onClick={toggleMenu}
						aria-label="Toggle menu"
					>
						{isMenuOpen ? <Xmark className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
					</button>
				</div>
			</header>

			{/* Mobile Navigation Menu */}
			{isMenuOpen && (
				<div className="fixed inset-0 top-16 bg-black z-40 md:hidden flex flex-col animate-slide-down">
					<nav className="flex-1 px-4 py-8 space-y-4">
						{mainNavItems
							.filter((item) => item.enabled)
							.map((item) => (
								<Link
									key={item.to}
									to={item.to}
									onClick={() => setIsMenuOpen(false)}
									className="block px-4 py-3 text-lg font-medium text-neutral-400 hover:text-white border border-transparent hover:border-neutral-800 transition-all"
									activeProps={{
										className: "text-white bg-neutral-900 border-neutral-800",
									}}
								>
									{item.label}
								</Link>
							))}
					</nav>
					<div className="p-8 border-t border-neutral-800">
						<Button
							variant="secondary"
							className="w-full justify-center"
							onClick={() => {
								setIsMenuOpen(false);
								handleLogout();
							}}
						>
							Logout
						</Button>
					</div>
				</div>
			)}

			{/* Main content */}
			<main className="flex-1">
				<Outlet />
			</main>
		</div>
	)
}
