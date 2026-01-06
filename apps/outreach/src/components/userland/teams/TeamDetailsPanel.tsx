'use strict';

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Trash2, X, AlertCircle, Loader } from 'lucide-react';
import api from '../../../services/api';
import type { TeamDetails } from '@melinia/shared';
import { team_management } from '../../../services/teams';

interface TeamDetailsPanelProps {
  teamId: string;
  onDelete?: () => void;
  onClose?: () => void;
}

interface DeleteConfirmState {
  type: 'team' | 'invitation';
  id: string | number;
}

interface TeamApiResponse {
  status: boolean;
  message: string;
  data: TeamDetails;
}

// Team Details Component - Reusable
export const TeamDetailsPanel: React.FC<TeamDetailsPanelProps> = ({ teamId, onDelete, onClose }) => {
  const [deleteConfirm, setDeleteConfirm] = useState<DeleteConfirmState | null>(null);
  const queryClient = useQueryClient();

  const { data: response, isLoading, error } = useQuery<TeamDetails>({
    queryKey: ['team', teamId],
    queryFn: async () => {
      const res = await team_management.getTeamDetails(teamId);
      return res.data;
    },
  });

  const teamData = response;

  const deleteMutation = useMutation({
    mutationFn: async (url: string) => api.delete(url),
    onSuccess: () => {
      if (deleteConfirm?.type === 'team') {
        onDelete?.();
        queryClient.invalidateQueries({ queryKey: ['teams'] });
      } else {
        queryClient.invalidateQueries({ queryKey: ['team', teamId] });
      }
      setDeleteConfirm(null);
    },
  });

  const handleDeleteConfirm = useCallback(() => {
    if (!deleteConfirm) return;

    if (deleteConfirm.type === 'team') {
      deleteMutation.mutate(`/teams/${teamId}`);
    } else {
      deleteMutation.mutate(`/invitations/${deleteConfirm.id}`);
    }
  }, [deleteConfirm, deleteMutation, teamId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader className="h-8 w-8 animate-spin text-blue-500" />
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
    <div className="h-full overflow-y-auto custom-scrollbar bg-zinc-950">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-zinc-900/80 backdrop-blur border-b border-zinc-800 p-4 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h2 className="text-xl sm:text-2xl font-bold font-inst text-white mb-1">{teamData.name}</h2>
            <p className="text-zinc-400 text-xs sm:text-sm">ID: {teamData.id}</p>
          </div>

          {/* Team Stats */}
          <div className="hidden sm:grid grid-cols-3 gap-2">
            <div className="bg-zinc-900 border border-zinc-800 rounded p-2">
              <p className="text-zinc-400 text-xs uppercase tracking-wide mb-1">Size</p>
              <p className="text-lg font-bold text-white">{teamData.team_size}</p>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded p-2">
              <p className="text-zinc-400 text-xs uppercase tracking-wide mb-1">Members</p>
              <p className="text-lg font-bold text-white">{(teamData.members?.length ?? 0) + 1}</p>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded p-2">
              <p className="text-zinc-400 text-xs uppercase tracking-wide mb-1">Events</p>
              <p className="text-lg font-bold text-white">{teamData.events_registered?.length ?? 0}</p>
            </div>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-zinc-800 rounded-lg transition-colors flex-shrink-0"
              aria-label="Close team details"
            >
              <X className="h-5 w-5 text-zinc-400" />
            </button>
          )}
        </div>

        {/* Mobile Stats */}
        <div className="grid sm:hidden grid-cols-3 gap-2 mt-3">
          <div className="bg-zinc-900 rounded p-2">
            <p className="text-zinc-400 text-xs uppercase tracking-wide mb-1">Size</p>
            <p className="font-bold text-white">{teamData.team_size}</p>
          </div>
          <div className="bg-zinc-900 rounded p-2">
            <p className="text-zinc-400 text-xs uppercase tracking-wide mb-1">Members</p>
            <p className="font-bold text-white">{(teamData.members?.length ?? 0) + 1}</p>
          </div>
          <div className="bg-zinc-900 rounded p-2">
            <p className="text-zinc-400 text-xs uppercase tracking-wide mb-1">Events</p>
            <p className="font-bold text-white">{teamData.events_registered?.length ?? 0}</p>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-5 space-y-4 sm:space-y-5">
        {/* Team Leader */}
        <div className="bg-zinc-900 border border-zinc-800 rounded p-3">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-2">Leader</p>
          <p className="font-semibold text-white text-sm">
            {teamData.leader_first_name} {teamData.leader_last_name}
          </p>
          <p className="text-xs text-zinc-400">{teamData.leader_email}</p>
        </div>

        {/* Members & Pending Invites in 2 columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Members */}
          <section>
            <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wide mb-2">
              Members ({teamData.members?.length ?? 0})
            </h3>
            <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
              {teamData.members && teamData.members.length > 0 ? (
                teamData.members.map((member) => (
                  <div
                    key={member.user_id}
                    className="bg-zinc-900 border border-zinc-800 rounded p-2 hover:border-zinc-700 transition-colors"
                  >
                    <p className="font-semibold text-white text-xs mb-1">
                      {member.first_name} {member.last_name}
                    </p>
                    <p className="text-xs text-zinc-400">{member.email}</p>
                  </div>
                ))
              ) : (
                <p className="text-zinc-500 text-xs">No members</p>
              )}
            </div>
          </section>

          {/* Pending Invitations */}
          <section>
            <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wide mb-2">
              Pending ({teamData.pending_invites?.length ?? 0})
            </h3>
            <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
              {teamData.pending_invites && teamData.pending_invites.length > 0 ? (
                teamData.pending_invites.map((invite) => (
                  <div
                    key={invite.invitation_id}
                    className="bg-zinc-900 border border-zinc-800 rounded p-2 hover:border-zinc-700 transition-colors flex items-start justify-between gap-2"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white text-xs mb-1 truncate">
                        {invite.first_name} {invite.last_name}
                      </p>
                      <p className="text-xs text-zinc-400 truncate">{invite.email}</p>
                    </div>
                    <button
                      onClick={() =>
                        setDeleteConfirm({ type: 'invitation', id: invite.invitation_id })
                      }
                      className="p-1 hover:bg-red-900/20 text-red-400 rounded transition-colors flex-shrink-0"
                      title="Remove"
                      aria-label={`Remove invitation for ${invite.first_name}`}
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-zinc-500 text-xs">No invitations</p>
              )}
            </div>
          </section>
        </div>

        {/* Events Registered */}
        <section>
          <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wide mb-2">
            Events ({teamData.events_registered?.length ?? 0})
          </h3>
          <div className="space-y-2 max-h-32 overflow-y-auto custom-scrollbar">
            {teamData.events_registered && teamData.events_registered.length > 0 ? (
              teamData.events_registered.map((event) => (
                <div
                  key={event.event_id}
                  className="bg-zinc-900 border border-zinc-800 rounded p-2 hover:border-zinc-700 transition-colors"
                >
                  <p className="font-semibold text-white text-xs">{event.event_name}</p>
                </div>
              ))
            ) : (
              <p className="text-zinc-500 text-xs">No events</p>
            )}
          </div>
        </section>

        {/* Delete Team Section */}
        <button
          onClick={() => setDeleteConfirm({ type: 'team', id: teamId })}
          className="w-full px-3 py-2 bg-red-900/20 border border-red-900 text-red-400 rounded hover:bg-red-900/30 transition-colors font-medium text-xs"
        >
          Delete Team
        </button>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setDeleteConfirm(null)}
          />
          <div className="relative bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl max-w-sm w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <h3 className="text-lg font-semibold text-white">Confirm Deletion</h3>
            </div>
            <p className="text-zinc-300 mb-6">
              {deleteConfirm.type === 'team'
                ? 'Are you sure you want to delete this team? This action cannot be undone.'
                : 'Are you sure you want to remove this pending invitation?'}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors text-white font-medium disabled:opacity-50"
                disabled={deleteMutation.isPending}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deleteMutation.isPending}
                className="flex-1 px-4 py-2 bg-red-900/30 hover:bg-red-900/50 border border-red-900 text-red-400 rounded-lg transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deleteMutation.isPending && <Loader className="h-4 w-4 animate-spin" />}
                {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
