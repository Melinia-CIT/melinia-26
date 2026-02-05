/**
 * Button component
 * Base UI Button wrapper with dark theme monochrome styling
 */

import type { ButtonProps as BaseButtonProps } from "@base-ui/react/button";
import { Button as BaseButton } from "@base-ui/react/button";
import { cx } from "./cx";

export interface ButtonProps extends Omit<BaseButtonProps, "className"> {
	variant?: "primary" | "secondary" | "ghost";
	size?: "sm" | "md" | "lg";
	className?: string;
}

export function Button({
	variant = "primary",
	size = "md",
	className,
	children,
	...props
}: ButtonProps) {
	return (
		<BaseButton
			className={cx(
				// Base styles
				"inline-flex items-center justify-center font-medium transition-colors",
				"border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white",
				"disabled:opacity-50 disabled:pointer-events-none",
				"rounded-none", // Square corners

				// Variants (whitish cream - blends with dark bg)
				variant === "primary" &&
					"bg-stone-50 text-black border-stone-50 hover:bg-white hover:border-white",
				variant === "secondary" &&
					"bg-transparent text-neutral-300 border-neutral-700 hover:bg-neutral-900 hover:border-neutral-600",
				variant === "ghost" &&
					"bg-transparent text-neutral-300 border-transparent hover:bg-neutral-900",

				// Sizes
				size === "sm" && "h-8 px-3 text-sm",
				size === "md" && "h-10 px-4 text-base",
				size === "lg" && "h-12 px-6 text-lg",

				className,
			)}
			{...props}
		>
			{children}
		</BaseButton>
	);
}
