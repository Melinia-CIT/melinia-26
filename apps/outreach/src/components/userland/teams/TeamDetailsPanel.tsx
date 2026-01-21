import { useState, useCallback, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
    SendMail,
    Trash,
    MessageAlert,
    Community,
    User,
    UserPlus,
    Xmark,
    Trophy,
    ArrowRight,
    UserCrown,
} from "iconoir-react"
import toast from "react-hot-toast"
import { useNavigate } from "react-router"
import { type TeamDetails, type AddNewMemberRequest, addNewMemberSchema } from "@melinia/shared"
import { Spinner } from "../../ui/spinner"
import { team_management } from "../../../services/teams"
import { fetchUser } from "../../../services/users"
import Button from "../../ui/button"

interface TeamDetailsPanelProps {
    teamId: string
    onDelete?: () => void
    onClose?: () => void
}

interface DeleteConfirmState {
    type: "team" | "invitation"
    id: string | number
}

export const TeamDetailsPanel: React.FC<TeamDetailsPanelProps> = ({
    teamId,
    onDelete,
    onClose,
}) => {
    const queryClient = useQueryClient()
    const navigate = useNavigate()

    const [deleteConfirm, setDeleteConfirm] = useState<DeleteConfirmState | null>(null)
    const [isAddMemberOpen, setIsAddMemberOpen] = useState(false)
    const [deleteMember, setDeleteMember] = useState<boolean>(false)
    const [selectedMemberId, setSelectedMemberId] = useState<string>("")

    // Add Member Form
    const {
        register: registerMember,
        handleSubmit: handleSubmitMember,
        formState: { errors: memberErrors },
        reset: resetMemberForm,
    } = useForm<AddNewMemberRequest>({
        resolver: zodResolver(addNewMemberSchema),
        defaultValues: { email: "" },
        mode: "onSubmit",
    })

    const {
        data: response,
        isLoading,
        error,
    } = useQuery<TeamDetails>({
        queryKey: ["team", teamId],
        queryFn: async () => {
            const res = await team_management.getTeamDetails(teamId)
            return res.data
        },
    })

    const teamData = response

    const { data: currentUser } = useQuery({
        queryKey: ["userMe"],
        queryFn: fetchUser,
    })

    const [isLeader, setIsLeader] = useState(false)

    useEffect(() => {
        if (currentUser && teamData) {
            setIsLeader(currentUser.id === teamData.leader_id)
        } else {
            setIsLeader(false)
        }
    }, [currentUser, teamData])

    const hasRegisteredEvents = teamData?.events_registered && teamData.events_registered.length > 0

    const deleteTeamMutation = useMutation({
        mutationFn: team_management.deleteTeam,
        onSuccess: () => {
            toast.success("Team deleted successfully")
            queryClient.invalidateQueries({ queryKey: ["teams"] })
            onDelete?.()
            setDeleteConfirm(null)
        },
        onError: (err: any) => {
            toast.error(err?.response?.data?.message || "Failed to delete team")
            setDeleteConfirm(null)
        },
    })

    const deleteInvitationMutation = useMutation({
        mutationFn: (inviteId: string) => team_management.deleteInvitation(teamId, inviteId),
        onSuccess: () => {
            toast.success("Invitation removed")
            queryClient.invalidateQueries({ queryKey: ["team", teamId] })
            setDeleteConfirm(null)
        },
        onError: (err: any) => {
            toast.error(err?.response?.data?.message || "Failed to remove invitation")
            setDeleteConfirm(null)
        },
    })

    const addMemberMutation = useMutation({
        mutationFn: (data: { email: string }) => team_management.addMember(data, teamId),
        onSuccess: () => {
            toast.success("Invitation sent successfully")
            queryClient.invalidateQueries({ queryKey: ["team", teamId] })
            setIsAddMemberOpen(false)
            resetMemberForm()
        },
        onError: (err: any) => {
            toast.error(err?.response?.data?.message || "Failed to send invitation")
        },
    })

    const deleteMemberMutation = useMutation({
        mutationFn: (member_id: string) => team_management.removeTeammate(teamId, member_id),
        onSuccess: () => {
            toast.success("Team member deleted!")
            queryClient.invalidateQueries({ queryKey: ["team", teamId] })
            setDeleteMember(false)
        },
        onError: (err: any) => {
            toast.error(err?.response?.data?.message || "Failed to delete member")
        },
    })

    const handleDeleteConfirm = useCallback(() => {
        if (!deleteConfirm) return
        if (deleteConfirm.type === "team") {
            deleteTeamMutation.mutate(teamId)
        } else if (deleteConfirm.type === "invitation") {
            deleteInvitationMutation.mutate(deleteConfirm.id as string)
        }
    }, [deleteConfirm, deleteTeamMutation, deleteInvitationMutation, teamId])

    const handleDeleteMember = (member_id: string) => {
        if (hasRegisteredEvents) {
            toast.error("Cannot remove member while event is registered.")
            return
        }
        deleteMemberMutation.mutate(member_id)
    }

    const handleAddMember = (data: AddNewMemberRequest) => {
        if (hasRegisteredEvents) return
        addMemberMutation.mutate(data)
    }

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-full bg-zinc-950 text-zinc-300">
                <Spinner w={32} h={32} />
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-zinc-950">
                <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-full mb-4">
                    <MessageAlert className="h-6 w-6 text-zinc-400" strokeWidth={1.5} />
                </div>
                <p className="text-white font-medium">Failed to load team details</p>
            </div>
        )
    }

    if (!teamData) return null

    return (
        <div className="flex flex-col h-full bg-zinc-950 text-white font-sans antialiased">
            <style>{`
                .custom-scroll::-webkit-scrollbar { width: 6px; }
                .custom-scroll::-webkit-scrollbar-track { background: #09090b; }
                .custom-scroll::-webkit-scrollbar-thumb { background-color: #3f3f46; border-radius: 4px; }
                .custom-scroll::-webkit-scrollbar-thumb:hover { background-color: #52525b; }
            `}</style>

            {/* Header */}
            <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-950 shrink-0 z-20 p-4">
                <div className="flex-1 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-semibold text-white tracking-tight">
                            {teamData.name}
                        </h2>
                        <p className="text-xs text-zinc-400 mt-0.5 font-medium uppercase tracking-wider">
                            Team Overview
                        </p>
                    </div>
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="text-zinc-500 hover:text-zinc-300 transition-colors shrink-0"
                        >
                            <Xmark width={25} height={25} />
                        </button>
                    )}
                </div>

                <div className="hidden md:flex flex-row gap-4">
                    <Button
                        onClick={() => setIsAddMemberOpen(true)}
                        disabled={hasRegisteredEvents || !isLeader}
                        variant="primary"
                        size="md"
                        className="flex gap-2 bg-white text-zinc-900 hover:bg-zinc-200 border-0"
                    >
                        <UserPlus strokeWidth={2} className="h-4 w-4" />
                        <span className="text-xs sm:text-sm">Add Member</span>
                    </Button>

                    <Button
                        onClick={() =>
                            !hasRegisteredEvents && setDeleteConfirm({ type: "team", id: teamId })
                        }
                        disabled={hasRegisteredEvents || !isLeader}
                        variant="danger"
                        size="md"
                        className="flex gap-2 bg-red-600 text-white hover:bg-red-700"
                    >
                        <Trash strokeWidth={2} className="h-4 w-4" />
                        <span className="text-xs sm:text-sm">Delete Team</span>
                    </Button>

                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto custom-scroll p-4 sm:p-6 space-y-6 min-h-0 relative z-10">
                {/* Warning Banner */}
                {hasRegisteredEvents && (
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-center gap-3">
                        <Community
                            className="h-5 w-5 text-amber-500 shrink-0 mt-0.5"
                            strokeWidth={2}
                        />
                        <div className="text-sm">
                            <p className="font-semibold text-amber-100">Team Locked</p>
                            <p className="text-amber-200/60 mt-1 leading-relaxed">
                                Cannot modify members or invites while registered for an active
                                event.
                            </p>
                        </div>
                    </div>
                )}

                {/* Leader Card - Changed to zinc-900 to pop against zinc-950 background */}
                <div className="flex items-center gap-4 p-4 rounded-xl bg-zinc-900 border border-zinc-800">
                    <div className="h-12 w-12 rounded-full bg-zinc-950 border border-orange-800 text-orange-300 flex items-center justify-center shrink-0">
                        <UserCrown className="h-6 w-6" strokeWidth={1.5} />
                    </div>
                    <div className="min-w-0">
                        <p className="text-[11px] font-bold text-orange-500 uppercase tracking-widest mb-1">
                            Team Leader
                        </p>
                        <p className="text-base font-medium text-white truncate">
                            {teamData.leader_first_name} {teamData.leader_last_name}
                        </p>
                    </div>
                </div>

                {/* Members Section */}
                <section>
                    <h3 className="flex items-center gap-2 text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">
                        <Community className="h-3.5 w-3.5" />
                        Members ({teamData.members?.length || 0})
                    </h3>
                    <div className="space-y-3">
                        {teamData.members && teamData.members.length > 0 ? (
                            teamData.members.map(member => (
                                <div
                                    key={member.user_id}
                                    className="flex items-center justify-between p-4 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-colors"
                                >
                                    <div className="flex items-center gap-3 min-w-0 pr-4">
                                        <div className="h-9 w-9 rounded-full bg-zinc-950 border border-zinc-800 flex items-center justify-center text-sm font-bold text-zinc-300">
                                            <User />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium text-white truncate">
                                                {member.first_name} {member.last_name}
                                            </p>
                                            <p className="text-xs text-zinc-400 truncate mt-0.5">
                                                {member.email}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setDeleteMember(true)
                                            setSelectedMemberId(member.user_id)
                                        }}
                                        disabled={hasRegisteredEvents || !isLeader}
                                        className={`p-2 rounded-md transition-colors ${
                                            hasRegisteredEvents || !isLeader
                                                ? "text-zinc-700 cursor-not-allowed"
                                                : "text-zinc-500 hover:text-white hover:bg-zinc-800"
                                        }`}
                                        title="Remove member"
                                    >
                                        <Trash className="h-4 w-4" strokeWidth={2} />
                                    </button>
                                </div>
                            ))
                        ) : (
                            <div className="p-6 rounded-xl border border-dashed border-zinc-800 text-center">
                                <p className="text-sm text-zinc-500">
                                    No other members in this team.
                                </p>
                            </div>
                        )}
                    </div>
                </section>

                {/* Invites Section */}
                {teamData.pending_invites && teamData.pending_invites.length > 0 && (
                    <section>
                        <h3 className="flex items-center gap-2 text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">
                            <MessageAlert className="h-3.5 w-3.5" />
                            Pending Invites
                        </h3>
                        <div className="space-y-3">
                            {teamData.pending_invites.map(invite => (
                                <div
                                    key={invite.invitation_id}
                                    className="flex items-center justify-between p-4 rounded-xl bg-zinc-900 border border-zinc-800"
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="h-9 w-9 rounded-full bg-zinc-950 flex items-center justify-center border border-zinc-800">
                                            <UserPlus
                                                className="h-4 w-4 text-zinc-500"
                                                strokeWidth={1.5}
                                            />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm text-zinc-200 truncate">
                                                {invite.email}
                                            </p>
                                            <p className="text-[10px] text-zinc-600 uppercase font-bold tracking-wider mt-0.5">
                                                Pending
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() =>
                                            setDeleteConfirm({
                                                type: "invitation",
                                                id: invite.invitation_id,
                                            })
                                        }
                                        disabled={!isLeader}
                                        className={`p-2 rounded-md transition-colors ${
                                            !isLeader
                                                ? "text-zinc-700 cursor-not-allowed"
                                                : "text-zinc-500 hover:text-white hover:bg-zinc-800"
                                        }`}
                                    >
                                        <Xmark className="h-4 w-4" strokeWidth={2} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Events Section */}
                <section className="pb-4">
                    <h3 className="flex items-center gap-2 text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">
                        <Trophy className="h-3.5 w-3.5" />
                        Registered Events
                    </h3>
                    <div className="space-y-2">
                        {teamData.events_registered && teamData.events_registered.length > 0 ? (
                            teamData.events_registered.map(event => (
                                <button
                                    key={event.event_id}
                                    onClick={() => navigate(`/app/events/${event.event_id}`)}
                                    className="w-full group flex items-center justify-between p-4 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-colors text-left"
                                >
                                    <span className="text-sm font-medium text-zinc-200 group-hover:text-white transition-colors">
                                        {event.event_name}
                                    </span>
                                    <div className="h-8 w-8 rounded-full bg-zinc-950 flex items-center justify-center group-hover:bg-zinc-900 transition-colors border border-zinc-800">
                                        <ArrowRight className="h-4 w-4 text-zinc-400 group-hover:text-white transition-colors" />
                                    </div>
                                </button>
                            ))
                        ) : (
                            <div className="p-6 rounded-xl border border-dashed border-zinc-800 text-center">
                                <p className="text-sm text-zinc-500">No events registered yet.</p>
                            </div>
                        )}
                    </div>
                </section>
            </div>

            {/* Footer */}
            <div className="md:hidden p-4 sm:p-6 bg-zinc-950 border-t border-zinc-800 shrink-0 z-20">
                <div className="flex flex-row gap-4 justify-end">
                    <Button
                        onClick={() => setIsAddMemberOpen(true)}
                        disabled={hasRegisteredEvents || !isLeader}
                        variant="primary"
                        size="md"
                        className="flex gap-2 bg-white text-zinc-900 hover:bg-zinc-200 border-0"
                    >
                        <UserPlus strokeWidth={2} className="h-4 w-4" />
                        <span className="text-xs sm:text-sm">Add Member</span>
                    </Button>

                    <Button
                        onClick={() =>
                            !hasRegisteredEvents && setDeleteConfirm({ type: "team", id: teamId })
                        }
                        disabled={hasRegisteredEvents || !isLeader}
                        variant="danger"
                        size="md"
                        className="flex gap-2 bg-red-600 text-white hover:bg-red-700"
                    >
                        <Trash strokeWidth={2} className="h-4 w-4" />
                        <span className="text-xs sm:text-sm">Delete Team</span>
                    </Button>
                </div>
            </div>

            {/* Modals Container */}
            {/* Delete Member Modal */}
            {deleteMember && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 sm:p-6 backdrop-blur-sm">
                    <div className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-5 sm:p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
                        <div className="mb-5 sm:mb-6">
                            <h3 className="text-lg sm:text-xl font-semibold text-white mb-2 tracking-tight">
                                Remove Member
                            </h3>
                            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                                Are you sure you want to remove this team member? They will lose
                                access to team data immediately.
                            </p>
                        </div>
                        <div className="flex gap-3 justify-end flex-col sm:flex-row">
                            <Button
                                onClick={() => setDeleteMember(false)}
                                variant="secondary"
                                size="md"
                                fullWidth
                                className="bg-transparent border border-zinc-700 text-zinc-400 hover:bg-zinc-800/50 hover:text-white hover:border-zinc-600 text-sm sm:text-sm order-2 sm:order-1 transition-all duration-200"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                onClick={() => handleDeleteMember(selectedMemberId)}
                                variant="danger"
                                size="md"
                                fullWidth
                                disabled={deleteMemberMutation.isPending}
                                className="bg-red-600 text-white hover:bg-red-700 px-4 py-2 rounded-md font-medium text-sm transition-colors disabled:opacity-50"
                            >
                                {deleteMemberMutation.isPending ? "Removing..." : "Remove"}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* General Delete Confirm Modal */}
            {deleteConfirm && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 sm:p-6 backdrop-blur-sm">
                    <div className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-5 sm:p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
                        <div className="mb-5 sm:mb-6">
                            <h3 className="text-lg sm:text-xl font-semibold text-white mb-2 tracking-tight">
                                {deleteConfirm.type === "team"
                                    ? "Delete Team?"
                                    : "Revoke Invitation?"}
                            </h3>
                            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed mt-2">
                                {deleteConfirm.type === "team"
                                    ? "This action cannot be undone. All team data, events, and history will be permanently deleted."
                                    : "This invitation link will no longer work."}
                            </p>
                        </div>
                        <div className="flex gap-3 justify-between flex-col sm:flex-row">
                            <Button
                                onClick={() => setDeleteConfirm(null)}
                                variant="secondary"
                                size="md"
                                fullWidth
                                className="bg-transparent border border-zinc-700 text-zinc-400 hover:bg-zinc-800/50 hover:text-white hover:border-zinc-600 text-sm sm:text-sm order-2 sm:order-1 transition-all duration-200"
                            >
                                Keep Safe
                            </Button>
                            <Button
                                onClick={handleDeleteConfirm}
                                disabled={
                                    deleteTeamMutation.isPending ||
                                    deleteInvitationMutation.isPending
                                }
                                variant="danger"
                                size="md"
                                fullWidth
                                className="bg-red-600 text-white hover:bg-red-700 order-1 sm:order-2"
                                loading={
                                    deleteTeamMutation.isPending ||
                                    deleteInvitationMutation.isPending
                                }
                            >
                                {deleteConfirm.type === "team"
                                    ? "Yes, Delete Team"
                                    : "Revoke Invite"}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Member Modal */}
            {isAddMemberOpen && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 sm:p-6 backdrop-blur-sm">
                    <div className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl sm:rounded-2xl p-5 sm:p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center mb-5 sm:mb-6">
                            <div>
                                <h2 className="text-lg sm:text-xl font-semibold text-white tracking-tight">
                                    Send Invitation
                                </h2>
                                <p className="text-xs text-zinc-500 mt-0.5">
                                    Invite team member via email
                                </p>
                            </div>
                            <button
                                onClick={() => setIsAddMemberOpen(false)}
                                className="text-zinc-500 hover:text-white transition-colors p-1.5 -mr-1.5 rounded-lg hover:bg-zinc-800 sm:p-2"
                            >
                                <Xmark width={22} height={22} strokeWidth={1.5} />
                            </button>
                        </div>

                        <form
                            onSubmit={handleSubmitMember(handleAddMember)}
                            className="space-y-4 sm:space-y-5"
                        >
                            {/* Input Field */}
                            <div>
                                <label className="block text-[11px] font-semibold uppercase tracking-wider mb-2 text-zinc-400">
                                    Email
                                </label>
                                <div className="relative w-full">
                                    <input
                                        type="email"
                                        placeholder="username@domain.tld"
                                        {...registerMember("email")}
                                        className={`w-full bg-zinc-950/50 border rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 transition-all duration-200
                                            ${
                                                memberErrors.email
                                                    ? "border-red-500/50 text-red-100 placeholder-red-300/40 focus:ring-red-500/20 focus:border-red-500"
                                                    : "border-zinc-700 text-white placeholder-zinc-600 focus:border-zinc-500 focus:ring-zinc-500/10"
                                            }
                                        `}
                                    />
                                    <SendMail
                                        className="absolute top-1/2 left-3.5 -translate-y-1/2 text-zinc-500 h-5 w-5"
                                        strokeWidth={1.5}
                                    />
                                </div>
                                {memberErrors.email && (
                                    <p className="text-red-400 text-[11px] mt-2 flex items-center gap-1.5 font-medium">
                                        <MessageAlert className="h-3.5 w-3.5" strokeWidth={2} />{" "}
                                        {memberErrors.email.message}
                                    </p>
                                )}
                            </div>

                            <Button
                                type="submit"
                                disabled={addMemberMutation.isPending}
                                variant="primary"
                                size="md"
                                fullWidth
                                loading={addMemberMutation.isPending}
                                className="mt-5 sm:mt-6 gap-2 bg-white text-zinc-900 hover:bg-zinc-200 border-0"
                            >
                                Invite
                            </Button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
