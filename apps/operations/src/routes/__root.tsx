import { TanStackDevtools } from "@tanstack/react-devtools";
import {
	createRootRouteWithContext,
	Outlet,
	redirect,
} from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { authRoutes, DEFAULT_REDIRECT } from "@/app/nav";
import type { RouterContext } from "@/app/routerContext";
import { env } from "@/config/env";

export const Route = createRootRouteWithContext<RouterContext>()({
	component: RootComponent,
	beforeLoad: async ({ context, location }) => {
		// Redirect from root to appropriate page
		if (location.pathname === "/") {
			if (context.auth.isAuthenticated()) {
				throw redirect({ to: DEFAULT_REDIRECT });
			} else {
				throw redirect({
					to: authRoutes.login,
					search: { redirect: DEFAULT_REDIRECT },
				});
			}
		}
	},
});

function RootComponent() {
	return (
		<>
			<Outlet />
			{env.isDev && (
				<TanStackDevtools
					config={{
						position: "bottom-right",
					}}
					plugins={[
						{
							name: "Tanstack Router",
							render: <TanStackRouterDevtoolsPanel />,
						},
					]}
				/>
			)}
		</>
	);
}
