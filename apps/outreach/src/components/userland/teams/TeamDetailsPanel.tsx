'use strict';

import { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Trash, MessageAlert, Community, Calendar, User, UserPlus, Xmark } from 'iconoir-react';
import toast from 'react-hot-toast';
import { type TeamDetails, type AddNewMemberRequest, addNewMemberSchema } from '@melinia/shared';
import { Spinner } from '../../common/Spinner';
import { team_management } from '../../../services/teams';
import Button from '../../common/Button';
import DialogBox from '../../common/DialogBox';

interface TeamDetailsPanelProps {
  teamId: string;
  onDelete?: () => void;
  onClose?: () => void;
}

interface DeleteConfirmState {
  type: 'team' | 'invitation';
  id: string | number;
}

export const TeamDetailsPanel: React.FC<TeamDetailsPanelProps> = ({ teamId, onDelete, onClose }) => {
  const queryClient = useQueryClient();

  const [deleteConfirm, setDeleteConfirm] = useState<DeleteConfirmState | null>(null);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [deleteMember, setDeleteMember] = useState<boolean>(false);
  const [selectedMemberId, setSelectedMemberId] = useState<string>("");
  
  // Add Member Form
  const {
    register: registerMember,
    handleSubmit: handleSubmitMember,
    formState: { errors: memberErrors },
    reset: resetMemberForm,
  } = useForm<AddNewMemberRequest>({
    resolver: zodResolver(addNewMemberSchema),
    defaultValues: { email: '' },
    mode: "onSubmit"
  });

  const { data: response, isLoading, error } = useQuery<TeamDetails>({
    queryKey: ['team', teamId],
    queryFn: async () => {
      const res = await team_management.getTeamDetails(teamId);
      return res.data;
    },
  });

  const teamData = response;

  // Logic: Check if team has registered events
  const hasRegisteredEvents = teamData?.events_registered && teamData.events_registered.length > 0;

  const deleteTeamMutation = useMutation({
    mutationFn: team_management.deleteTeam,
    onSuccess: () => {
      toast.success('Team deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      onDelete?.();
      setDeleteConfirm(null);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to delete team');
    }
  });

  const deleteInvitationMutation = useMutation({
    mutationFn: (inviteId: string) => team_management.deleteInvitation(teamId, inviteId),
    onSuccess: () => {
      toast.success('Invitation removed');
      queryClient.invalidateQueries({ queryKey: ['team', teamId] });
      setDeleteConfirm(null);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to remove invitation');
    }
  });

  const addMemberMutation = useMutation({
    mutationFn: (data: { email: string }) => team_management.addMember(data, teamId),
    onSuccess: () => {
      toast.success('Invitation sent successfully');
      queryClient.invalidateQueries({ queryKey: ['team', teamId] });
      setIsAddMemberOpen(false);
      resetMemberForm();
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to send invitation');
    }
  });

  const deleteMemberMutation = useMutation({
    mutationFn:(member_id:string) => team_management.removeTeammate(teamId, member_id),
    onSuccess:()=>{
      toast.success("Team member deleted!");
      setDeleteMember(false);
    },
    onError:(err:any)=>{
      toast.error(err?.response?.data?.message || 'Failed to delete member');
    }
  })

  const handleDeleteConfirm = useCallback(() => {
    if (!deleteConfirm) return;
    if (deleteConfirm.type === 'team') {
      deleteTeamMutation.mutate(teamId);
    } else if (deleteConfirm.type === 'invitation') {
      deleteInvitationMutation.mutate(deleteConfirm.id as string);
    }
  }, [deleteConfirm, deleteTeamMutation, deleteInvitationMutation, teamId]);

  const handleDeleteMember = (member_id:string) => {
    if (hasRegisteredEvents) {
      toast.error("Cannot remove member while event is registered.");
      return;
    }
    deleteMemberMutation.mutate(member_id);
  }

  const handleAddMember = (data: AddNewMemberRequest) => {
    if (hasRegisteredEvents) return; // Should be handled by disabled button, but safety check
    addMemberMutation.mutate(data);
  };


  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6">
        <Spinner w={40} h={40} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <MessageAlert className="h-16 w-16 text-red-500 mx-auto mb-4" />
        <p className="text-red-400 font-medium">Failed to load team details</p>
      </div>
    );
  }

  if (!teamData) return null;

  return (
    <div className="flex flex-col h-full bg-zinc-950">
      <div className="flex-none bg-zinc-900 border-b border-zinc-800 shrink-0">
        <div className="flex items-center justify-between p-4">
          <h2 className="text-xl font-inst font-bold text-white truncate pr-4">{teamData.name}</h2>
          {onClose && (
            <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-md transition-colors shrink-0">
              <Xmark className="h-6 w-6" />
            </button>
          )}
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6 min-h-0">
        
        {/* Warning Banner if Events are Registered */}
        {hasRegisteredEvents && (
          <div className="bg-yellow-900/10 border border-yellow-700/30 rounded-lg p-3 flex items-start gap-3">
            <Calendar className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-yellow-200">Team Actions Locked</p>
              <p className="text-yellow-200/70 text-xs mt-0.5">
                Members cannot be added or removed because the team is registered for an event.
              </p>
            </div>
          </div>
        )}

        {/* Leader Info */}
        <div className="flex items-center gap-4 bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
          <div className="h-12 w-12 rounded-full bg-blue-900/30 text-blue-400 flex items-center justify-center shrink-0">
            <User className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] text-zinc-500 uppercase font-semibold tracking-wider mb-1">Team Leader</p>
            <p className="text-base font-bold text-white truncate">
              {teamData.leader_first_name} {teamData.leader_last_name}
            </p>
            <p className="text-sm text-zinc-400 truncate">{teamData.leader_email}</p>
          </div>
        </div>

        {/* Members List */}
        <section>
          <h3 className="text-sm font-bold text-zinc-300 uppercase tracking-wide mb-3 flex items-center gap-2">
            <Community className="h-4 w-4" /> Members
          </h3>

          <div className="space-y-2">
            {teamData.members && teamData.members.length > 0 ? (
              teamData.members.map((member) => (
                <div
                  key={member.user_id}
                  className="bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 flex justify-between items-center"
                >
                  <div className="min-w-0 pr-4">
                    <p className="text-base font-medium text-white truncate">
                      {member.first_name} {member.last_name}
                    </p>
                    <p className="text-xs text-zinc-400 truncate">{member.email}</p>
                  </div>
                  <Button
                    variant='danger'
                    type='button'
                    size='sm'
                    disabled={hasRegisteredEvents}
                    onClick={()=>{
                        setDeleteMember(true);
                        setSelectedMemberId(member.user_id)
                    }}
                  >
                    Remove
                  </Button>
                </div>
              ))
            ) : (
              <p className="text-sm text-zinc-600 italic py-2 text-center">No additional members yet.</p>
            )}
          </div>
        </section>

        {/* Pending Invitations */}
        {teamData.pending_invites && teamData.pending_invites.length > 0 && (
          <section>
            <h3 className="text-sm font-bold text-zinc-300 uppercase tracking-wide mb-3 flex items-center gap-2">
              <MessageAlert className="h-4 w-4" /> Pending Invitations
            </h3>
            <div className="space-y-2">
              {teamData.pending_invites.map((invite) => (
                <div
                  key={invite.invitation_id}
                  className="bg-zinc-900 border border-zinc-800/80 rounded-lg px-4 py-3 flex items-start justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="text-base font-medium text-white truncate">
                      {invite.first_name} {invite.last_name}
                    </p>
                    <p className="text-xs text-zinc-400 truncate">{invite.email}</p>
                  </div>
                  <button
                    onClick={() => setDeleteConfirm({ type: 'invitation', id: invite.invitation_id })}
                    className="p-2 hover:bg-red-900/20 text-red-400 rounded-md transition-colors shrink-0"
                  >
                    <Trash className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Events Registered */}
        <section>
          <h3 className="text-sm font-bold text-zinc-300 uppercase tracking-wide mb-3 flex items-center gap-2">
            <Calendar className="h-4 w-4" /> Registered Event
          </h3>
          <div className="space-y-2">
            {teamData.events_registered && teamData.events_registered.length > 0 ? (
              teamData.events_registered.map((event) => (
                <div
                  key={event.event_id}
                  className="bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3"
                >
                  <p className="text-base font-medium text-white">{event.event_name}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-zinc-600 italic py-2 text-center">No event registered.</p>
            )}
          </div>
        </section>
        <div className="h-4" />
      </div>

      <div className="flex-none p-4 border-t border-zinc-800 bg-zinc-900 shrink-0 z-10 relative">
        <div className="flex flex-col sm:flex-row gap-3">

          {/* Add Member Button */}
          <button
            onClick={() => setIsAddMemberOpen(true)}
            disabled={hasRegisteredEvents}
            className={`flex-1 px-4 py-2.5 rounded-lg transition-colors font-medium text-sm flex items-center justify-center gap-2
              ${hasRegisteredEvents 
                ? "bg-zinc-900 border border-zinc-800 text-zinc-600 cursor-not-allowed" 
                : "bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 text-white"
              }`}
          >
            <UserPlus className="h-4 w-4" /> Add Member
          </button>

          {/* Delete Team Button */}
          <button
            onClick={() => !hasRegisteredEvents && setDeleteConfirm({ type: 'team', id: teamId })}
            disabled={hasRegisteredEvents}
            className={`flex-1 px-4 py-2.5 rounded-lg transition-colors font-medium text-sm flex items-center justify-center gap-2
              ${hasRegisteredEvents 
                ? "bg-zinc-900 border border-zinc-800 text-zinc-600 cursor-not-allowed" 
                : "bg-red-900/10 hover:bg-red-900/20 border border-red-900/50 text-red-400"
              }`}
          >
            <Trash className="h-4 w-4" /> Delete Team
          </button>

        </div>
      </div>


      {/* Delete Confirmation Modal */}
      {
        deleteMember && (
          <DialogBox
            heading='Remove Teammate'
            description='Are you sure to delete this member?'
            actionButtonLabel='Remove'
            actionButtonVariant='danger'
            handleActionButton={()=>handleDeleteMember(selectedMemberId)}
            handleCancelButton={()=>{setDeleteMember(false);}}
          />
        )
      }
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setDeleteConfirm(null)}
          />
          <div className="relative bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl max-w-sm w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <MessageAlert className="h-6 w-6 text-red-500" />
              <h3 className="text-lg font-semibold text-white">Confirm Deletion</h3>
            </div>
            <p className="text-sm text-zinc-300 mb-6 leading-relaxed">
              {deleteConfirm.type === 'team'
                ? 'Are you sure? This will permanently delete the team and cannot be undone.'
                : 'Remove this pending invitation?'}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors text-white text-sm font-medium"
                disabled={deleteTeamMutation.isPending || deleteInvitationMutation.isPending}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deleteTeamMutation.isPending || deleteInvitationMutation.isPending}
                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm font-medium flex items-center justify-center gap-2"
              >
                {(deleteTeamMutation.isPending || deleteInvitationMutation.isPending) ? (
                  <Spinner h={4} w={4} />
                ) : (
                  <Trash className="h-4 w-4" />
                )}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {isAddMemberOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsAddMemberOpen(false)}
          />
          <div className="relative bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl max-w-sm w-full p-6 animate-in zoom-in-95 fade-in duration-200">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-semibold text-white">Add Team Member</h3>
              <button
                onClick={() => setIsAddMemberOpen(false)}
                className="text-zinc-500 hover:text-zinc-300"
                disabled={addMemberMutation.isPending}
              >
                <Xmark width={20} height={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitMember(handleAddMember)} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-500 mb-1.5 uppercase tracking-wide">
                  Member Email
                </label>
                <input
                  type="email"
                  placeholder="peterparker@tuta.com"
                  {...registerMember('email')}
                  className={`w-full bg-zinc-950 border rounded-md px-4 py-3 text-sm focus:outline-none focus:ring-1 transition-colors ${memberErrors.email
                      ? "border-red-500 text-red-100 placeholder-red-300/50 focus:ring-red-500"
                      : "border-zinc-700 text-white placeholder-zinc-600 focus:border-white focus:ring-white"
                    }`}
                />
                {memberErrors.email && (
                  <p className="text-red-400 text-xs mt-1.5">{memberErrors.email.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={addMemberMutation.isPending}
                className="w-full rounded-lg bg-zinc-100 py-3 text-sm text-zinc-900 font-bold hover:bg-white transition disabled:opacity-70 disabled:cursor-not-allowed mt-4 flex items-center justify-center gap-2"
              >
                {addMemberMutation.isPending ? (
                  <>
                    <Spinner w={4} h={4} /> Sending Invite...
                  </>
                ) : (
                  'Send Invitation'
                )}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
