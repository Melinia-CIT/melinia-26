type ButtonVariant = "primary" | "secondary" | "danger" | "outline"
type ButtonSize = "sm" | "md" | "lg"

interface ButtonProps {
    children: React.ReactNode
    onClick?: () => void
    type?: "button" | "submit" | "reset"
    variant?: ButtonVariant
    size?: ButtonSize
    disabled?: boolean
    loading?: boolean
    fullWidth?: boolean
    className?: string
}

const Button: React.FC<ButtonProps> = ({
    children,
    onClick,
    type = "button",
    variant = "primary",
    size = "md",
    disabled = false,
    loading = false,
    fullWidth = false,
    className = "",
}) => {
    const baseClasses =
        "inline-flex items-center justify-center font-medium rounded-[8px] focus:outline-none cursor-pointer"

    const variantClasses = {
        primary:
            "bg-zinc-100 text-zinc-900 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed",
        secondary:
            "bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500 disabled:bg-gray-400 disable:cursor-not-allowed",
        danger: "bg-red-900/10 hover:bg-red-900/20 border border-red-900/50 text-red-400 rounded-lg transition-colors font-medium text-sm flex items-center justify-center gap-2",
        outline:
            "border border-border bg-black text-white hover:bg-darkSurface focus:ring-primary disabled:bg-darkSurface disabled:cursor-not-allowed",
    }

    const sizeClasses = {
        sm: "px-2.5 py-1.5 text-xs sm:text-sm",
        md: "px-3.5 py-2 text-sm",
        lg: "px-4 py-2.5 sm:px-5 sm:py-3 text-sm sm:text-base",
    }

    const widthClass = fullWidth ? "w-full" : ""

    const isDisabled = disabled || loading

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={isDisabled}
            className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${widthClass} ${className} ${isDisabled ? "cursor-not-allowed!" : ""} `}
        >
            {loading && (
                <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 border border-t-transparent rounded-full animate-spin mr-1.5 sm:mr-2" />
            )}
            {children}
        </button>
    )
}

export default Button
