import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { team_management } from "../../../services/teams"
import { User, Xmark, CheckCircle } from "iconoir-react"
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
        onError: (error: Error) => {
            console.error(error)
            toast.error("Failed to accept invitation")
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
        onError: (error: Error) => {
            console.error(error)
            toast.error("Failed to decline invitation")
        },
    })

    if (isLoading) {
        if (isDesktop) {
            return (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl p-4 animate-pulse"
                >
                    <div className="h-6 bg-zinc-800 rounded w-1/2 mb-3"></div>
                    <div className="h-16 bg-zinc-800 rounded"></div>
                </motion.div>
            )
        }
        return (
            <AnimatePresence>
                <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="absolute top-12 right-0 w-80 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl p-4 animate-pulse z-50"
                >
                    <div className="h-6 bg-zinc-800 rounded w-1/2 mb-3"></div>
                    <div className="h-16 bg-zinc-800 rounded"></div>
                </motion.div>
            </AnimatePresence>
        )
    }

    if (error) {
        if (isDesktop) {
            return (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl p-4"
                >
                    <p className="text-red-400">Failed to load notifications</p>
                </motion.div>
            )
        }
        return (
            <AnimatePresence>
                <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="absolute top-12 right-0 w-80 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl p-4 z-50"
                >
                    <p className="text-red-400 text-sm">Failed to load notifications</p>
                </motion.div>
            </AnimatePresence>
        )
    }

    if (invitations.length === 0) {
        if (isDesktop) {
            return (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="w-full bg-zinc-900/30 border border-zinc-800/50 rounded-xl p-8 text-center"
                >
                    <User className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
                    <p className="text-zinc-500">No pending invitations</p>
                </motion.div>
            )
        }
        return (
            <AnimatePresence>
                <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="absolute top-12 right-0 w-80 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl p-6 text-center z-50"
                >
                    <User className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
                    <p className="text-zinc-500 text-sm">No pending invitations</p>
                </motion.div>
            </AnimatePresence>
        )
    }

    if (isDesktop) {
        return (
            <div className="w-full bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <User className="w-6 h-6 text-indigo-400" />
                        <h2 className="text-xl font-bold text-white">Team Invitations</h2>
                        <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 text-xs font-semibold rounded-full">
                            {invitations.length}
                        </span>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-zinc-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-zinc-800"
                    >
                        <Xmark width={20} height={20} />
                    </button>
                </div>
                <div className="max-h-96 overflow-y-auto space-y-4">
                    {invitations.map((invitation, index) => (
                        <motion.div
                            key={invitation.invitation_id}
                            initial={{ opacity: 0, y: 20, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{
                                type: "spring",
                                stiffness: 400,
                                damping: 25,
                                mass: 0.5,
                                delay: index * 0.05,
                            }}
                            className="w-full bg-zinc-800/50 border border-zinc-700 rounded-xl p-4 hover:border-zinc-600 transition-all"
                        >
                            <div className="flex items-center justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-zinc-400 mb-1">Team Invite</p>
                                    <p className="text-white font-semibold mb-1">
                                        {invitation.team_name || `Team ID: ${invitation.team_id}`}
                                    </p>
                                    <p className="text-xs text-zinc-500">
                                        From: {invitation.inviter_email}
                                    </p>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() =>
                                            acceptMutation.mutate(invitation.invitation_id)
                                        }
                                        disabled={acceptMutation.isPending}
                                        className="flex items-center gap-2 px-4 py-2 bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/30 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <CheckCircle width={16} height={16} />
                                        Accept
                                    </button>
                                    <button
                                        onClick={() =>
                                            declineMutation.mutate(invitation.invitation_id)
                                        }
                                        disabled={declineMutation.isPending}
                                        className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <Xmark width={16} height={16} strokeWidth={2.5} />
                                        Reject
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        )
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="fixed top-16 right-4 w-80 max-h-96 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden z-50"
                >
                    <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-900/50">
                        <div className="flex items-center gap-2">
                            <User className="w-5 h-5 text-indigo-400" />
                            <h2 className="text-sm font-semibold text-white">Team Invitations</h2>
                            <span className="px-1.5 py-0.5 bg-indigo-500/20 text-indigo-300 text-xs font-semibold rounded-full">
                                {invitations.length}
                            </span>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-zinc-400 hover:text-white transition-colors p-1"
                        >
                            <Xmark width={16} height={16} />
                        </button>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
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
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}

export default Notifications
