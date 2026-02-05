/**
 * Navigation constants
 * Single source of truth for app navigation
 */

export interface NavItem {
	label: string;
	to: string;
	description?: string;
	enabled: boolean;
}

/**
 * Main navigation items (shown in top nav bar)
 */
export const mainNavItems: NavItem[] = [
	{
		label: "Dashboard",
		to: "/app",
		description: "Overview and quick actions",
		enabled: true,
	},
	{
		label: "Registrations",
		to: "/app/registrations",
		description: "View and manage all fest registrations",
		enabled: true,
	},
	{
		label: "Check-in",
		to: "/app/check-in",
		description: "Search for attendees and mark them as checked in",
		enabled: true,
	},
	{
		label: "Events",
		to: "/app/events",
		description: "Manage schedule and venues",
		enabled: false, // Not yet implemented
	},
	{
		label: "Volunteers",
		to: "/app/volunteers",
		description: "Manage shifts and attendance",
		enabled: false, // Not yet implemented
	},
];

/**
 * Quick action items (shown on dashboard)
 */
export const quickActionItems: NavItem[] = [
	{
		label: "Open Check-in",
		to: "/app/check-in",
		description: "Scan QR codes",
		enabled: true,
	},
	{
		label: "View Events",
		to: "/app/events",
		description: "Manage schedule",
		enabled: false,
	},
	{
		label: "Registrations",
		to: "/app/registrations",
		description: "View all entries",
		enabled: true,
	},
	{
		label: "Volunteers",
		to: "/app/volunteers",
		description: "Manage shifts",
		enabled: false,
	},
];

/**
 * Auth routes
 */
export const authRoutes = {
	login: "/auth/login",
	logout: "/auth/login",
} as const;

/**
 * Default redirect after login
 */
export const DEFAULT_REDIRECT = "/app";
