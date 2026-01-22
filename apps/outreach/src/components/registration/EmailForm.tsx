import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, ArrowRight } from "iconoir-react";
import { generateOTPSchema, type GenerateOTP } from "@melinia/shared";
import { UseMutationResult } from "@tanstack/react-query";

interface EmailFormProps {
	mutation: UseMutationResult<any, Error, GenerateOTP, unknown>;
	onSuccess: (data: GenerateOTP) => void;
}

const EmailForm = ({ mutation, onSuccess }: EmailFormProps) => {
	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<GenerateOTP>({
		resolver: zodResolver(generateOTPSchema),
		mode: "onChange",
	});

	const onSubmit = (data: GenerateOTP) => {
		mutation.mutate(data, {
			onSuccess: () => onSuccess(data),
		});
	};

	return (
		<form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
			<div className="w-full">
				<div className="relative">
					<Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" strokeWidth={1.5} width={20} height={20} />
					<input
						type="email"
						placeholder="Email Address"
						className={`w-full rounded-lg bg-zinc-900 border pl-10 pr-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 transition-colors duration-200
              ${errors.email ? 'border-red-500 focus:ring-red-500/50' : 'border-zinc-800 focus:ring-zinc-600'} `}
						{...register("email")}
					/>
				</div>
				{errors.email && (
					<p className="text-red-400 text-xs mt-2 pl-1 flex items-center gap-1">
						{errors.email.message}
					</p>
				)}
			</div>
			<button
				type="submit"
				disabled={mutation.isPending}
				className="group w-full rounded-lg bg-white py-3 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-200 flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed mt-2"
			>
				{mutation.isPending ? (
					"Sending..."
				) : (
					<span className="flex items-center gap-2 transition-transform duration-200 group-hover:translate-x-1">
						Verify Email
						<ArrowRight width={16} height={16} strokeWidth={2.5} />
					</span>
				)}
			</button>
		</form>
	);
};

export default EmailForm;
