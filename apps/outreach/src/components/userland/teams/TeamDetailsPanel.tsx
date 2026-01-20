import { useState, useCallback } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
    Trash,
    MessageAlert,
    Community,
    Calendar,
    User,
    UserPlus,
    Xmark,
    Trophy,
    ArrowRight,
} from "iconoir-react"
import toast from "react-hot-toast"
import { useNavigate } from "react-router"
import { type TeamDetails, type AddNewMemberRequest, addNewMemberSchema } from "@melinia/shared"
import { Spinner } from "../../ui/spinner"
import { team_management } from "../../../services/teams"
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
            <div className="flex flex-col items-center justify-center h-full bg-zinc-950 text-zinc-200">
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
                <p className="text-zinc-300 font-medium">Failed to load team details</p>
            </div>
        )
    }

    if (!teamData) return null

    return (
        <div className="flex flex-col h-full bg-zinc-950 font-sans text-zinc-100 relative">
            <style>{`
                .mono-scroll::-webkit-scrollbar { width: 4px; }
                .mono-scroll::-webkit-scrollbar-track { background: #09090b; }
                .mono-scroll::-webkit-scrollbar-thumb { background-color: #27272a; border-radius: 4px; }
                .mono-scroll::-webkit-scrollbar-thumb:hover { background-color: #3f3f46; }
            `}</style>

            {/* Header */}
            <div className="flex-none border-b border-white/5 bg-zinc-900/30 backdrop-blur-md shrink-0 z-10">
                <div className="flex items-center justify-between px-4 py-3">
                    <h2 className="text-2xl text-white font-inst">{teamData.name}</h2>
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="p-1.5 rounded-full hover:bg-zinc-800 text-zinc-500 hover:text-white transition-all shrink-0"
                        >
                            <Xmark className="h-4 w-4" strokeWidth={2} />
                        </button>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto mono-scroll p-4 space-y-6 min-h-0">
                {/* Warning Banner */}
                {hasRegisteredEvents && (
                    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 flex items-start gap-3">
                        <Calendar
                            className="h-4 w-4 text-zinc-400 shrink-0 mt-0.5"
                            strokeWidth={2}
                        />
                        <div className="text-xs">
                            <p className="font-semibold text-zinc-300">Team Locked</p>
                            <p className="text-zinc-500 mt-0.5">
                                Cannot modify members while registered for an event.
                            </p>
                        </div>
                    </div>
                )}

                {/* Leader Card */}
                <div className="flex items-center gap-3 p-3 rounded-xl bg-zinc-900 border border-zinc-800/50">
                    <div className="h-10 w-10 rounded-full bg-zinc-800 text-zinc-300 flex items-center justify-center shrink-0 border border-zinc-700">
                        <User className="h-5 w-5" strokeWidth={1.5} />
                    </div>
                    <div className="min-w-0">
                        <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider mb-0.5">
                            Leader
                        </p>
                        <p className="text-sm font-medium text-white truncate">
                            {teamData.leader_first_name} {teamData.leader_last_name}
                        </p>
                    </div>
                </div>

                {/* Members */}
                <section>
                    <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <Community className="h-3.5 w-3.5" /> Members
                    </h3>
                    <div className="space-y-2">
                        {teamData.members && teamData.members.length > 0 ? (
                            teamData.members.map(member => (
                                <div
                                    key={member.user_id}
                                    className="flex items-center justify-between p-3 rounded-lg bg-zinc-900/50 border border-transparent hover:border-zinc-700 hover:bg-zinc-900 transition-all"
                                >
                                    <div className="flex items-center gap-3 min-w-0 pr-2">
                                        <div className="h-8 w-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs font-bold text-zinc-400">
                                            {member.first_name?.[0]}
                                            {member.last_name?.[0]}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm text-zinc-200 truncate">
                                                {member.first_name} {member.last_name}
                                            </p>
                                            <p className="text-xs text-zinc-600 truncate">
                                                {member.email}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setDeleteMember(true)
                                            setSelectedMemberId(member.user_id)
                                        }}
                                        disabled={hasRegisteredEvents}
                                        className={`p-1.5 rounded-md transition-colors ${
                                            hasRegisteredEvents
                                                ? "text-zinc-700"
                                                : "text-zinc-500 hover:text-white hover:bg-zinc-800"
                                        }`}
                                    >
                                        <Trash className="h-3.5 w-3.5" strokeWidth={2} />
                                    </button>
                                </div>
                            ))
                        ) : (
                            <p className="text-xs text-zinc-600 text-center py-4">
                                No members yet.
                            </p>
                        )}
                    </div>
                </section>

                {/* Invites */}
                {teamData.pending_invites && teamData.pending_invites.length > 0 && (
                    <section>
                        <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <MessageAlert className="h-3.5 w-3.5" /> Invites
                        </h3>
                        <div className="space-y-2">
                            {teamData.pending_invites.map(invite => (
                                <div
                                    key={invite.invitation_id}
                                    className="flex items-center justify-between p-3 rounded-lg bg-zinc-900/30 border border-zinc-800/30"
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="h-8 w-8 rounded-full bg-zinc-800/50 flex items-center justify-center border border-zinc-800">
                                            <UserPlus
                                                className="h-3.5 w-3.5 text-zinc-500"
                                                strokeWidth={1.5}
                                            />
                                        </div>
                                        <p className="text-sm text-zinc-400 truncate">
                                            {invite.email}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() =>
                                            setDeleteConfirm({
                                                type: "invitation",
                                                id: invite.invitation_id,
                                            })
                                        }
                                        className="p-1.5 text-zinc-600 hover:text-white hover:bg-zinc-800 rounded-md transition-colors"
                                    >
                                        <Xmark className="h-3.5 w-3.5" strokeWidth={2} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Events */}
                <section className="pb-2">
                    <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <Trophy className="h-3.5 w-3.5" /> Events
                    </h3>
                    <div className="space-y-2">
                        {teamData.events_registered && teamData.events_registered.length > 0 ? (
                            teamData.events_registered.map(event => (
                                <button
                                    key={event.event_id}
                                    onClick={() => navigate(`/app/events/${event.event_id}`)}
                                    className="w-full group flex items-center justify-between p-3 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-600 transition-colors text-left"
                                >
                                    <span className="text-sm text-zinc-300 group-hover:text-white transition-colors">
                                        {event.event_name}
                                    </span>
                                    <ArrowRight className="h-3.5 w-3.5 text-zinc-600 group-hover:text-zinc-300 transition-colors" />
                                </button>
                            ))
                        ) : (
                            <p className="text-xs text-zinc-600 text-center py-4">
                                No events registered.
                            </p>
                        )}
                    </div>
                </section>
            </div>

            {/* Footer */}
            <div className="flex-none p-4 bg-zinc-950 border-t border-zinc-800/50 shrink-0 z-20">
                <div className="grid grid-cols-2 gap-3">
                    <Button
                        onClick={() => setIsAddMemberOpen(true)}
                        disabled={hasRegisteredEvents}
                        variant="primary"
                        size="sm"
                        fullWidth
                        className="gap-2"
                    >
                        <UserPlus className="h-3.5 w-3.5" />
                        Add Member
                    </Button>

                    <Button
                        onClick={() =>
                            !hasRegisteredEvents && setDeleteConfirm({ type: "team", id: teamId })
                        }
                        disabled={hasRegisteredEvents}
                        variant="danger"
                        size="sm"
                        fullWidth
                        className="gap-2"
                    >
                        <Trash className="h-3.5 w-3.5" /> Delete Team
                    </Button>
                </div>
            </div>

            {/* Compact Delete Member Modal */}
            {deleteMember && (
                <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => setDeleteMember(false)}
                    />
                    <div className="relative bg-zinc-900 border border-zinc-800 shadow-2xl max-w-xs w-full rounded-xl p-4 animate-in fade-in zoom-in-95 duration-150">
                        <h3 className="text-sm font-medium text-white mb-2">Remove Member</h3>
                        <p className="text-xs text-zinc-400 mb-4">
                            Are you sure you want to remove this member? This cannot be undone.
                        </p>
                        <div className="flex gap-2 justify-end">
                            <Button
                                onClick={() => setDeleteMember(false)}
                                variant="secondary"
                                size="sm"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={() => handleDeleteMember(selectedMemberId)}
                                variant="primary"
                                size="sm"
                            >
                                {deleteMemberMutation.isPending ? "Removing..." : "Remove"}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Compact Delete Confirm Modal */}
            {deleteConfirm && (
                <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => setDeleteConfirm(null)}
                    />
                    <div className="relative bg-zinc-900 border border-zinc-800 shadow-2xl max-w-sm w-full rounded-2xl p-6 animate-in fade-in zoom-in-95 duration-150">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-2 bg-zinc-800 rounded-lg">
                                <Trash className="h-5 w-5 text-zinc-300" strokeWidth={2} />
                            </div>
                            <h3 className="text-base font-medium text-white">Confirm Action</h3>
                        </div>
                        <p className="text-sm text-zinc-400 mb-6 leading-relaxed">
                            {deleteConfirm.type === "team"
                                ? "This will permanently delete the team. This action cannot be undone."
                                : "Revoke this pending invitation?"}
                        </p>
                        <div className="flex gap-3">
                            <Button
                                onClick={() => setDeleteConfirm(null)}
                                variant="secondary"
                                size="md"
                                className="flex-1"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleDeleteConfirm}
                                disabled={
                                    deleteTeamMutation.isPending ||
                                    deleteInvitationMutation.isPending
                                }
                                variant="primary"
                                size="md"
                                className="flex-1"
                                loading={
                                    deleteTeamMutation.isPending ||
                                    deleteInvitationMutation.isPending
                                }
                            >
                                {deleteConfirm.type === "team" ? "Delete" : "Confirm"}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Member Modal */}
            {isAddMemberOpen && (
                <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => setIsAddMemberOpen(false)}
                    />
                    <div className="relative bg-zinc-900 border border-zinc-800 shadow-2xl sm:max-w-md max-w-sm w-full rounded-2xl p-5 sm:p-6 animate-in fade-in zoom-in-95 duration-150">
                        <div className="flex justify-between items-center mb-5">
                            <h3 className="text-base font-medium text-white">Add Member</h3>
                            <button
                                onClick={() => setIsAddMemberOpen(false)}
                                className="text-zinc-500 hover:text-white p-1.5 rounded-md hover:bg-zinc-800 transition-colors"
                            >
                                <Xmark width={18} height={18} strokeWidth={2} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmitMember(handleAddMember)} className="space-y-4">
                            <div>
                                <input
                                    type="email"
                                    placeholder="username@domain.tld"
                                    {...registerMember("email")}
                                    className={`w-full bg-zinc-950 border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-1 transition-colors placeholder:text-zinc-600
                                        ${
                                            memberErrors.email
                                                ? "border-white text-white"
                                                : "border-zinc-700 text-white focus:border-white focus:ring-white/20"
                                        }
                                    `}
                                />
                                {memberErrors.email && (
                                    <p className="text-zinc-400 text-xs text-red-500 mt-1.5">
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
                                className="gap-2"
                            >
                                Send Invite <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
                            </Button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
