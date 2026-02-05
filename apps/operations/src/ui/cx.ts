/**
 * Class name merge utility
 * Simple helper to merge className strings
 */

export function cx(...classes: (string | undefined | null | false)[]): string {
	return classes.filter(Boolean).join(" ");
}
