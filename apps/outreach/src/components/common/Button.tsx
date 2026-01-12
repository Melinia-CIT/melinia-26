type ButtonVariant = "primary" | "secondary" | "danger" | "outline";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  className?: string;
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
    "inline-flex items-center justify-center font-medium rounded-[8px] focus:outline-none cursor-pointer";

  const variantClasses = {
    primary: "bg-white text-zinc-900 hover:bg-gray-200 disabled:bg-gray-400 disabled:cursor-not-allowed",
    secondary:
      "bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500 disabled:bg-gray-400 disable:cursor-not-allowed",
    danger:
      "bg-red-900/10 hover:bg-red-900/20 border border-red-900/50 text-red-400 rounded-lg transition-colors font-medium text-sm flex items-center justify-center gap-2",
   outline:
      "border border-border bg-darkSurface text-black hover:bg-darkSurface focus:ring-primary disabled:bg-darkSurface disabled:cursor-not-allowed",
  };

  const sizeClasses = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  };

  const widthClass = fullWidth ? "w-full" : "";

  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${widthClass} ${className}`}
    >
      {loading && (
        <div className="w-4 h-4 border-1 border-t-transparent rounded-full animate-spin mr-2" />
      )}
      {children}
    </button>
  );
};

export default Button;