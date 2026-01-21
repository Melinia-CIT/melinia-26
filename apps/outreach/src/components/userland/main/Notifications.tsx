import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { team_management } from "../../../services/teams"
import { Group, Xmark, CheckCircle } from "iconoir-react"
import { motion, AnimatePresence } from "framer-motion"
import toast from "react-hot-toast"

interface Invitation {
    invitation_id: number
    team_id: string
    team_name?: string
    inviter_email: string
}

interface NotificationsProps {
    isOpen: boolean
    onClose?: () => void
    isDesktop?: boolean
}

const Notifications = ({ isOpen, onClose, isDesktop = false }: NotificationsProps) => {
    const queryClient = useQueryClient()

    const {
        data: invitationsData,
        isLoading,
        error,
    } = useQuery({
        queryKey: ["userInvitations"],
        queryFn: async () => {
            const response = await team_management.getInvitationsForUser()
            return response.data.invitations
        },
        refetchInterval: 30000,
    })

    const invitations: Invitation[] = invitationsData || []

    const acceptMutation = useMutation({
        mutationFn: async (invitationId: number) => {
            const response = await team_management.acceptInvitation(invitationId)
            return response
        },
        onSuccess: () => {
            toast.success("Invitation accepted successfully!")
            queryClient.invalidateQueries({ queryKey: ["userInvitations"] })
            queryClient.invalidateQueries({ queryKey: ["teams"] })
        },
        onError: (error: any) => {
            console.error(error)
            toast.error(error.response.data.message)
        },
    })

    const declineMutation = useMutation({
        mutationFn: async (invitationId: number) => {
            const response = await team_management.declineInviation(invitationId)
            return response
        },
        onSuccess: () => {
            toast.success("Invitation declined")
            queryClient.invalidateQueries({ queryKey: ["userInvitations"] })
        },
        onError: (error: any) => {
            console.error(error)
            toast.error(error.response.data.message)
        },
    })

    // --- Desktop Rendering ---
    // Desktop uses the outer motion.div for animation, so we just render content directly
    if (isDesktop) {
        return (
            <div className="w-full bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-900/50">
                    <div className="flex items-center gap-2">
                        <Group className="w-5 h-5 text-neutral-400" />
                        <h2 className="text-sm font-semibold text-white">Team Invitations</h2>
                        <span className="px-1.5 py-0.5 bg-neutral-500/20 text-neutral-300 text-xs font-semibold rounded-full">
                            {invitations.length}
                        </span>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-zinc-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-zinc-800"
                    >
                        <Xmark width={16} height={16} />
                    </button>
                </div>

                {/* Content Body */}
                <div className="max-h-80 overflow-y-auto">
                    {isLoading ? (
                        <div className="p-4 animate-pulse">
                            <div className="h-6 bg-zinc-800 rounded w-1/2 mb-3"></div>
                            <div className="h-16 bg-zinc-800 rounded"></div>
                        </div>
                    ) : error ? (
                        <div className="p-4 text-center">
                            <p className="text-red-400 text-sm">Failed to load notifications</p>
                        </div>
                    ) : invitations.length === 0 ? (
                        <div className="p-6 text-center">
                            <Group className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
                            <p className="text-zinc-500 text-sm">No pending invitations</p>
                        </div>
                    ) : (
                        <div className="space-y-2 p-2">
                            {invitations.map(invitation => (
                                <div
                                    key={invitation.invitation_id}
                                    className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-3 hover:border-zinc-600 transition-all"
                                >
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs text-zinc-400 mb-0.5">
                                                Team Invite
                                            </p>
                                            <p className="text-sm text-white font-semibold mb-0.5 truncate">
                                                {invitation.team_name ||
                                                    `Team ID: ${invitation.team_id}`}
                                            </p>
                                            <p className="text-xs text-zinc-500 truncate">
                                                From: {invitation.inviter_email}
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() =>
                                                    acceptMutation.mutate(invitation.invitation_id)
                                                }
                                                disabled={acceptMutation.isPending}
                                                className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/30 rounded text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <CheckCircle width={14} height={14} />
                                                Accept
                                            </button>
                                            <button
                                                onClick={() =>
                                                    declineMutation.mutate(invitation.invitation_id)
                                                }
                                                disabled={declineMutation.isPending}
                                                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <Xmark width={14} height={14} strokeWidth={2.5} />
                                                Reject
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        )
    }

    // --- Mobile Rendering ---
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.9 }}
                    transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 25,
                        mass: 0.5,
                    }}
                    className="fixed top-16 right-4 w-80 max-h-96 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden z-50"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-900/50">
                        <div className="flex items-center gap-2">
                            <Group className="w-5 h-5 text-neutral-400" />
                            <h2 className="text-sm font-semibold text-white">Team Invitations</h2>
                            <span className="px-1.5 py-0.5 bg-neutral-500/20 text-neutral-300 text-xs font-semibold rounded-full">
                                {invitations.length}
                            </span>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-zinc-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-zinc-800"
                        >
                            <Xmark width={16} height={16} />
                        </button>
                    </div>

                    {/* Content Body */}
                    <div className="max-h-80 overflow-y-auto">
                        {isLoading ? (
                            // Loading State
                            <div className="p-4 animate-pulse">
                                <div className="h-6 bg-zinc-800 rounded w-1/2 mb-3"></div>
                                <div className="h-16 bg-zinc-800 rounded"></div>
                            </div>
                        ) : error ? (
                            // Error State
                            <div className="p-4 text-center">
                                <p className="text-red-400 text-sm">Failed to load notifications</p>
                            </div>
                        ) : invitations.length === 0 ? (
                            // Empty State
                            <div className="p-6 text-center">
                                <Group className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
                                <p className="text-zinc-500 text-sm">No pending invitations</p>
                            </div>
                        ) : (
                            // List State
                            <div className="space-y-2 p-2">
                                {invitations.map(invitation => (
                                    <div
                                        key={invitation.invitation_id}
                                        className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-3 hover:border-zinc-600 transition-all"
                                    >
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs text-zinc-400 mb-0.5">
                                                    Team Invite
                                                </p>
                                                <p className="text-sm text-white font-semibold mb-0.5 truncate">
                                                    {invitation.team_name ||
                                                        `Team ID: ${invitation.team_id}`}
                                                </p>
                                                <p className="text-xs text-zinc-500 truncate">
                                                    From: {invitation.inviter_email}
                                                </p>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() =>
                                                        acceptMutation.mutate(
                                                            invitation.invitation_id
                                                        )
                                                    }
                                                    disabled={acceptMutation.isPending}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/30 rounded text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    <CheckCircle width={14} height={14} />
                                                    Accept
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        declineMutation.mutate(
                                                            invitation.invitation_id
                                                        )
                                                    }
                                                    disabled={declineMutation.isPending}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    <Xmark
                                                        width={14}
                                                        height={14}
                                                        strokeWidth={2.5}
                                                    />
                                                    Reject
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}

export default Notifications
