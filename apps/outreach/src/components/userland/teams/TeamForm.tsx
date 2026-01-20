import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Xmark, Plus, XmarkCircle } from "iconoir-react"
import toast from "react-hot-toast"
import { CreateTeam, createTeamSchema } from "@melinia/shared"
import { team_management } from "../../../services/teams"
import Button from "../../ui/button"

interface CreateTeamFormProps {
    onClose: () => void
}

export const CreateTeamForm: React.FC<CreateTeamFormProps> = ({ onClose }) => {
    const queryClient = useQueryClient()

    // Local state for the email input field
    const [emailInput, setEmailInput] = useState("")

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        formState: { errors },
        reset,
    } = useForm<CreateTeam>({
        resolver: zodResolver(createTeamSchema),
        mode: "onSubmit",
        defaultValues: {
            name: "",
            member_emails: [],
        },
    })

    // Watch the member_emails array to display tags
    const memberEmails = watch("member_emails") || []

    const createTeamMutation = useMutation({
        mutationFn: team_management.createTeam,
        onSuccess: () => {
            toast.success("Team created successfully")
            queryClient.invalidateQueries({ queryKey: ["teams"] })
            reset()
            setEmailInput("") // Clear local input state
            onClose()
        },
        onError: (error: any) => {
            toast.error(error.response?.data.message || "Failed to create team")
        },
    })

    const onSubmit = (data: CreateTeam) => {
        // Create a sanitized version of the data
        const sanitizedData = {
            ...data,
            name: data.name.trim(), // Trim leading and trailing spaces from the name
        }

        createTeamMutation.mutate(sanitizedData)
    }

    // Handler to add an email
    const handleAddEmail = () => {
        const trimmedEmail = emailInput.trim()

        // Basic validation
        if (!trimmedEmail) return

        // Simple regex for email validation before adding to list
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(trimmedEmail)) {
            toast.error("Please enter a valid email address")
            return
        }

        // Check for duplicates
        if (memberEmails.includes(trimmedEmail)) {
            toast.error("Email already added")
            return
        }

        // Update form state
        setValue("member_emails", [...memberEmails, trimmedEmail])
        setEmailInput("") // Clear input
    }

    // Handler to remove an email
    const handleRemoveEmail = (emailToRemove: string) => {
        setValue(
            "member_emails",
            memberEmails.filter(email => email !== emailToRemove)
        )
    }

    // Allow pressing "Enter" to add email
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            e.preventDefault()
            handleAddEmail()
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl animate-in fade-in zoom-in duration-200">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold text-white">Create New Team</h2>
                    <button
                        onClick={onClose}
                        className="text-zinc-500 hover:text-zinc-300 transition-colors"
                        type="button"
                    >
                        <Xmark width={25} height={25} />
                    </button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                    {/* Team Name Field */}
                    <div>
                        <label
                            className={`block text-xs font-medium mb-1.5 ${
                                errors.name ? "text-red-400" : "text-zinc-200"
                            }`}
                        >
                            Team Name *
                        </label>
                        <input
                            type="text"
                            placeholder="Enter team name"
                            {...register("name")}
                            className={`w-full bg-zinc-950 border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 transition-colors ${
                                errors.name
                                    ? "border-red-500 text-red-100 placeholder-red-300/50 focus:ring-red-500"
                                    : "border-zinc-700 text-white placeholder-zinc-600 focus:border-white focus:ring-white"
                            }`}
                        />
                        {errors.name && (
                            <p className="text-red-400 text-[10px] mt-1">{errors.name.message}</p>
                        )}
                    </div>

                    {/* Member Emails Field */}
                    <div>
                        <label className="block text-xs font-medium mb-1.5 text-zinc-200">
                            Teammates Email ID (Optional)
                        </label>

                        {/* Email Input Area */}
                        <div className="flex gap-2 mb-2">
                            <input
                                type="text"
                                value={emailInput}
                                onChange={e => setEmailInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Enter Email ID"
                                className="flex-1 bg-zinc-950 border border-zinc-700 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-white focus:ring-1 focus:ring-white placeholder-zinc-600"
                            />
                            <button
                                type="button"
                                onClick={handleAddEmail}
                                className="bg-white text-zinc-900 px-3 py-2 rounded-md transition-colors"
                            >
                                <Plus className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Email Tags List */}
                        {memberEmails.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                                {memberEmails.map((email, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center gap-2 bg-zinc-800 text-zinc-200 text-xs px-2 py-1.5 rounded-full border border-zinc-700 group"
                                    >
                                        <span>{email}</span>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveEmail(email)}
                                            className="text-zinc-500 hover:text-red-400 transition-colors"
                                        >
                                            <XmarkCircle className="h-5 w-5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Hidden input to ensure form validation works with RHF if needed, 
                though we use setValue manually. Registering helps if Zod checks exist on submit */}
                        <input type="hidden" {...register("member_emails")} />
                    </div>

                    <Button
                        type="submit"
                        disabled={createTeamMutation.isPending}
                        variant="primary"
                        size="md"
                        fullWidth
                        loading={createTeamMutation.isPending}
                        className="mt-6 gap-2"
                    >
                        Create Team
                    </Button>
                </form>
            </div>
        </div>
    )
}
