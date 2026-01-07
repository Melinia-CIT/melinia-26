'use strict';

import { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Trash2, X, AlertCircle, Users, Calendar, User, Plus, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { type TeamDetails, type AddNewMemberRequest, addNewMemberSchema } from '@melinia/shared';
import { Spinner } from '../../common/Spinner';
import { team_management } from '../../../services/teams';


// --- Types ---
interface TeamDetailsPanelProps {
  teamId: string;
  onDelete?: () => void;
  onClose?: () => void;
}

interface DeleteConfirmState {
  type: 'team' | 'invitation';
  id: string | number;
}


// --- Internal Component: Add Member Modal ---
const AddMemberModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: AddNewMemberRequest) => void;
  isLoading: boolean;
}> = ({ isOpen, onClose, onSubmit, isLoading }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<AddNewMemberRequest>({
    resolver: zodResolver(addNewMemberSchema),
    defaultValues: { email: '' },
    mode:"onSubmit"
  });

  const handleFormSubmit = (data: AddNewMemberRequest) => {
    onSubmit(data);
    reset();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl max-w-sm w-full p-6 animate-in zoom-in-95 fade-in duration-200">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-white">Add Team Member</h3>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-300"
            disabled={isLoading}
          >
            <X width={20} height={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1.5">
              Member Email
            </label>
            <input
              type="email"
              placeholder="peterparker@tuta.com"
              {...register('email')}
                className={`w-full bg-zinc-950 border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 transition-colors ${
                errors.email
                  ? "border-red-500 text-red-100 placeholder-red-300/50 focus:ring-red-500"
                  : "border-zinc-700 text-white placeholder-zinc-600 focus:border-white focus:ring-white"
              }`}
            />
            {errors.email && (
              <p className="text-red-400 text-[10px] mt-1">{errors.email.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-lg bg-zinc-100 py-2.5 text-sm text-zinc-900 font-semibold hover:bg-white transition disabled:opacity-70 disabled:cursor-not-allowed mt-4 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Sending Invite...
              </>
            ) : (
              'Send Invitation'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

// --- Main Component ---
export const TeamDetailsPanel: React.FC<TeamDetailsPanelProps> = ({ teamId, onDelete, onClose }) => {
  const queryClient = useQueryClient();
  
  // States
  const [deleteConfirm, setDeleteConfirm] = useState<DeleteConfirmState | null>(null);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);

  // --- Queries ---
  const { data: response, isLoading, error } = useQuery<TeamDetails>({
    queryKey: ['team', teamId],
    queryFn: async () => {
      const res = await team_management.getTeamDetails(teamId);
      return res.data;
    },
  });

  const teamData = response;

  // --- Mutations ---
  
  // 1. Delete Team
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

  // 2. Delete Invitation
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

  // 3. Add Member
  const addMemberMutation = useMutation({
    mutationFn: (data: { email: string }) => team_management.addMember(data, teamId), 
    onSuccess: () => {
      toast.success('Invitation sent successfully');
      queryClient.invalidateQueries({ queryKey: ['team', teamId] });
      setIsAddMemberOpen(false);
    },
    onError: (err: any) => {
      console.log(err.response.data);
      
      toast.error(err?.response?.data?.message || 'Failed to send invitation');
    }
  });

  // --- Handlers ---

  const handleDeleteConfirm = useCallback(() => {
    if (!deleteConfirm) return;

    if (deleteConfirm.type === 'team') {
      deleteTeamMutation.mutate(teamId);
    } else if (deleteConfirm.type === 'invitation') {
      deleteInvitationMutation.mutate(deleteConfirm.id as string);
    }
  }, [deleteConfirm, deleteTeamMutation, deleteInvitationMutation, teamId]);

  const handleAddMember = (data: AddNewMemberRequest) => {
    addMemberMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6">
        <Spinner w={30} h={30}/>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <p className="text-red-400">Failed to load team details</p>
      </div>
    );
  }

  if (!teamData) return null;

  return (
    <div className="flex flex-col h-full bg-zinc-950">
      {/* HEADER SECTION */}
      <div className="flex-none bg-zinc-900 border-b border-zinc-800">
        <div className="flex items-center justify-between p-3">
          <h2 className="text-lg font-inst font-bold text-white truncate pr-2">{teamData.name}</h2>
          {onClose && (
            <button onClick={onClose} className="p-1.5 hover:bg-zinc-800 rounded-md transition-colors shrink-0">
              <X className="h-5 w-5 text-zinc-400" />
            </button>
          )}
        </div>
      </div>

      {/* SCROLLABLE CONTENT */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-4">
        
        {/* Leader Info */}
        <div className="flex items-center gap-3 bg-zinc-900/50 border border-zinc-800 rounded-lg p-2.5">
          <div className="h-8 w-8 rounded-full bg-blue-900/30 text-blue-400 flex items-center justify-center shrink-0">
            <User className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] text-zinc-500 uppercase font-semibold">Team Leader</p>
            <p className="text-sm font-semibold text-white truncate">
              {teamData.leader_first_name} {teamData.leader_last_name}
            </p>
            <p className="text-xs text-zinc-400 truncate">{teamData.leader_email}</p>
          </div>
        </div>

        {/* Members List */}
        <section>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wide flex items-center gap-1.5">
              <Users className="h-3 w-3" /> Members
            </h3>
            <button
              onClick={() => setIsAddMemberOpen(true)}
              className="flex items-center gap-1 text-[10px] font-medium text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 px-2 py-1 rounded border border-zinc-700 transition-colors"
            >
              <Plus size={12} /> Add
            </button>
          </div>
          
          <div className="space-y-1.5">
            {teamData.members && teamData.members.length > 0 ? (
              teamData.members.map((member) => (
                <div
                  key={member.user_id}
                  className="bg-zinc-900 border border-zinc-800 rounded px-2.5 py-2 flex justify-between items-center"
                >
                  <div className="min-w-0 pr-2">
                    <p className="text-sm font-medium text-white truncate">
                      {member.first_name} {member.last_name}
                    </p>
                    <p className="text-[11px] text-zinc-400 truncate">{member.email}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-zinc-600 italic">No additional members.</p>
            )}
          </div>
        </section>

        {/* Pending Invitations */}
        {teamData.pending_invites && teamData.pending_invites.length > 0 && (
          <section>
            <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <AlertCircle className="h-3 w-3" /> Pending
            </h3>
            <div className="space-y-1.5">
              {teamData.pending_invites.map((invite) => (
                <div
                  key={invite.invitation_id}
                  className="bg-zinc-900 border border-zinc-800/80 rounded px-2.5 py-2 flex items-start justify-between gap-2"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {invite.first_name} {invite.last_name}
                    </p>
                    <p className="text-[11px] text-zinc-400 truncate">{invite.email}</p>
                  </div>
                  <button
                    onClick={() => setDeleteConfirm({ type: 'invitation', id: invite.invitation_id })}
                    className="p-1.5 hover:bg-red-900/20 text-red-400 rounded transition-colors shrink-0"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Events Registered */}
        <section>
          <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wide mb-2 flex items-center gap-1.5">
            <Calendar className="h-3 w-3" /> Events
          </h3>
          <div className="space-y-1.5">
            {teamData.events_registered && teamData.events_registered.length > 0 ? (
              teamData.events_registered.map((event) => (
                <div
                  key={event.event_id}
                  className="bg-zinc-900 border border-zinc-800 rounded px-2.5 py-2"
                >
                  <p className="text-sm font-medium text-white">{event.event_name}</p>
                </div>
              ))
            ) : (
              <p className="text-xs text-zinc-600 italic">No events registered.</p>
            )}
          </div>
        </section>
        
        <div className="h-4" />
      </div>

      {/* FOOTER - Delete Team Button */}
      <div className="flex-none p-3 border-t border-zinc-800 bg-zinc-900">
        <button
          onClick={() => setDeleteConfirm({ type: 'team', id: teamId })}
          className="w-full px-3 py-2.5 bg-red-900/10 hover:bg-red-900/20 border border-red-900/50 text-red-400 rounded-lg transition-colors font-medium text-xs flex items-center justify-center gap-2"
        >
          <Trash2 className="h-3.5 w-3.5" /> Delete Team
        </button>
      </div>

      {/* Modals */}
      
      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setDeleteConfirm(null)}
          />
          <div className="relative bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl max-w-xs w-full p-5">
            <div className="flex items-center gap-3 mb-3">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <h3 className="text-base font-semibold text-white">Confirm Deletion</h3>
            </div>
            <p className="text-sm text-zinc-300 mb-5 leading-relaxed">
              {deleteConfirm.type === 'team'
                ? 'Are you sure? This will permanently delete the team and cannot be undone.'
                : 'Remove this pending invitation?'}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors text-white text-sm font-medium"
                disabled={deleteTeamMutation.isPending || deleteInvitationMutation.isPending}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deleteTeamMutation.isPending || deleteInvitationMutation.isPending}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm font-medium flex items-center justify-center gap-2"
              >
                {(deleteTeamMutation.isPending || deleteInvitationMutation.isPending) ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                    <Trash2 className="h-4 w-4" />
                )}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      <AddMemberModal
        isOpen={isAddMemberOpen}
        onClose={() => setIsAddMemberOpen(false)}
        onSubmit={handleAddMember}
        isLoading={addMemberMutation.isPending}
      />

    </div>
  );
};
