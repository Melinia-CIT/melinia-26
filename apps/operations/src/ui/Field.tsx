/**
 * Field component
 * Simple field wrapper with label and error message (dark theme)
 */

import { cx } from "./cx";

export interface FieldProps {
	label?: string;
	error?: string;
	required?: boolean;
	className?: string;
	children: React.ReactNode;
	description?: string;
}

export function Field({
	label,
	error,
	required,
	className,
	children,
	description,
}: FieldProps) {
	return (
		<div className={cx("space-y-2", className)}>
			{label && (
				<label className="block text-sm font-medium text-neutral-300">
					{label}
					{required && <span className="text-red-500 ml-1">*</span>}
				</label>
			)}

			{children}

			{description && !error && (
				<p className="text-sm text-neutral-500">{description}</p>
			)}

			{error && <p className="text-sm text-red-500">{error}</p>}
		</div>
	);
}
