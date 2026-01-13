import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { team_management } from "../../../services/teams"
import { User, Xmark, CheckCircle } from "iconoir-react"
import toast from "react-hot-toast"

interface Invitation {
    invitation_id: number
    team_id: string
    team_name?: string
    inviter_email: string
}

interface NotificationsProps {
    isOpen: boolean
}

const Notifications = ({ isOpen }: NotificationsProps) => {
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
        return (
            <div className="w-full max-w-4xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-xl shadow-zinc-900/50 p-6 animate-pulse">
                <div className="h-8 bg-zinc-800 rounded w-1/3 mb-4"></div>
                <div className="h-24 bg-zinc-800 rounded"></div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="w-full max-w-4xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-xl shadow-zinc-900/50 p-6">
                <p className="text-red-400">Failed to load notifications</p>
            </div>
        )
    }

    if (invitations.length === 0) {
        return (
            <div className="w-full max-w-4xl bg-zinc-900/30 border border-zinc-800/50 rounded-2xl p-8 text-center">
                <User className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
                <p className="text-zinc-500">No pending invitations</p>
            </div>
        )
    }

    if (!isOpen) return null

    return (
        <div className="w-full max-w-4xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-xl shadow-zinc-900/50 p-6 animate-in slide-in-from-top-2 duration-300">
            <div className="flex items-center gap-3 mb-6">
                <User className="w-6 h-6 text-indigo-400" />
                <h2 className="text-xl font-bold text-white">Team Invitations</h2>
                <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 text-xs font-semibold rounded-full">
                    {invitations.length}
                </span>
            </div>

            <div className="space-y-3">
                {invitations.map(invitation => (
                    <div
                        key={invitation.invitation_id}
                        className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-4 hover:border-zinc-600 transition-all"
                    >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex-1">
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
                                    onClick={() => acceptMutation.mutate(invitation.invitation_id)}
                                    disabled={acceptMutation.isPending}
                                    className="flex items-center gap-2 px-4 py-2 bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/30 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <CheckCircle width={16} height={16} />
                                    Accept
                                </button>
                                <button
                                    onClick={() => declineMutation.mutate(invitation.invitation_id)}
                                    disabled={declineMutation.isPending}
                                    className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Xmark width={16} height={16} strokeWidth={2.5} />
                                    Reject
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default Notifications
