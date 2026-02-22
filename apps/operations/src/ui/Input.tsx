/**
 * Input component
 * Base UI Input wrapper with dark theme monochrome styling
 */

import type { InputProps as BaseInputProps } from "@base-ui/react/input";
import { Input as BaseInput } from "@base-ui/react/input";
import { cx } from "./cx";

export interface InputProps extends Omit<BaseInputProps, "className"> {
	className?: string;
}

export function Input({ className, ...props }: InputProps) {
	return (
		<BaseInput
			className={cx(
				// Base styles (dark monochrome)
				"w-full h-10 px-3 text-base",
				"bg-neutral-950 text-neutral-300 border border-neutral-800",
				"focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent",
				"disabled:opacity-50 disabled:bg-neutral-900 disabled:cursor-not-allowed",
				"placeholder:text-neutral-600",
				"rounded-none", // Square corners
				className,
			)}
			{...props}
		/>
	);
}
