import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Eye, EyeClosed } from "iconoir-react";
import { useState } from "react";
import { DEFAULT_REDIRECT } from "@/app/nav";
import { Button } from "@/ui/Button";
import { Field } from "@/ui/Field";
import { Input } from "@/ui/Input";

export const Route = createFileRoute("/auth/login")({
	component: LoginPage,
	validateSearch: (search: Record<string, unknown>) => ({
		redirect: (search.redirect as string) || DEFAULT_REDIRECT,
	}),
});

function LoginPage() {
	const navigate = useNavigate();
	const { redirect } = Route.useSearch();
	const { auth } = Route.useRouteContext();
	const [email, setEmail] = useState("");
	const [passwd, setPasswd] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [error, setError] = useState("");
	const [isLoading, setIsLoading] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");

		if (!email || !passwd) {
			setError("Email and password are required");
			return;
		}

		setIsLoading(true);

		try {
			await auth.login({ email, passwd, app: "ops" });
			await navigate({ to: redirect });
		} catch (err: any) {
			console.log(err);
			setError(err?.response ? err?.response?.data.message : "Invalid email or password");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)] px-4">
			<div className="w-full max-w-md">
				<div className="bg-neutral-950 border border-neutral-800 p-8 space-y-6">
					{/* Header */}
					<div className="space-y-2">
						<h1 className="text-2xl font-bold text-white tracking-tight">
							MELINIA'26
						</h1>
						<p className="text-sm text-neutral-500">
							Sign in to access the operations dashboard
						</p>
					</div>

					{/* Form */}
					<form onSubmit={handleSubmit} className="space-y-4">
						<Field label="Email" required error={error ? " " : undefined}>
							<Input
								type="email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								placeholder="your.email@college.edu"
								disabled={isLoading}
								autoComplete="email"
								required
							/>
						</Field>

						<Field label="Password" required>
							<div className="relative">
								<Input
									type={showPassword ? "text" : "password"}
									value={passwd}
									onChange={(e) => setPasswd(e.target.value)}
									placeholder="Enter your password"
									disabled={isLoading}
									autoComplete="current-password"
									required
									className="pr-10"
								/>
								<button
									type="button"
									onClick={() => setShowPassword(!showPassword)}
									className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 transition-colors duration-150"
									tabIndex={-1}
								>
									{showPassword ? (
										<EyeClosed className="w-5 h-5" />
									) : (
										<Eye className="w-5 h-5" />
									)}
								</button>
							</div>
						</Field>

						{error && (
							<div className="p-3 bg-red-950/50 border border-red-900 text-sm text-red-500">
								{error}
							</div>
						)}

						<Button
							type="submit"
							variant="primary"
							size="lg"
							className="w-full"
							disabled={isLoading}
						>
							{isLoading ? "Signing in..." : "Sign in"}
						</Button>
					</form>
				</div>
			</div>
		</div>
	);
}
