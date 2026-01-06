'use strict';

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Trash2, X, AlertCircle, Users, Calendar, User } from 'lucide-react';
import api from '../../../services/api';
import type { TeamDetails } from '@melinia/shared';
import { Spinner } from '../../common/Spinner';
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
      <div className="flex flex-col items-center justify-center h-full p-6">
        <Spinner/>
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
      {/* HEADER SECTION - Static (Does not scroll) */}
      <div className="flex-none bg-zinc-900 border-b border-zinc-800">
        {/* Title Row */}
        <div className="flex items-center justify-between p-3">
          <h2 className="text-lg font-inst font-bold text-white truncate pr-2">{teamData.name}</h2>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-zinc-800 rounded-md transition-colors shrink-0"
              aria-label="Close"
            >
              <X className="h-5 w-5 text-zinc-400" />
            </button>
          )}
        </div>

        {/* Compact Stats Row - Mobile Friendly */}
        {/* <div className="grid grid-cols-3 border-t border-zinc-800/50">
          <div className="flex flex-col items-center py-2 border-r border-zinc-800/50">
             <span className="text-[10px] uppercase text-zinc-500 font-semibold tracking-wider">Size</span>
             <span className="text-sm font-bold text-white">{teamData.team_size}</span>
          </div>
          <div className="flex flex-col items-center py-2 border-r border-zinc-800/50">
             <span className="text-[10px] uppercase text-zinc-500 font-semibold tracking-wider">Members</span>
             <span className="text-sm font-bold text-white">{(teamData.members?.length ?? 0) + 1}</span>
          </div>
          <div className="flex flex-col items-center py-2">
             <span className="text-[10px] uppercase text-zinc-500 font-semibold tracking-wider">Events</span>
             <span className="text-sm font-bold text-white">{teamData.events_registered?.length ?? 0}</span>
          </div>
        </div> */}
      </div>

      {/* SCROLLABLE CONTENT SECTION */}
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
          <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wide mb-2 flex items-center gap-1.5">
            <Users className="h-3 w-3" /> Members
          </h3>
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
                    onClick={() =>
                      setDeleteConfirm({ type: 'invitation', id: invite.invitation_id })
                    }
                    className="p-1.5 hover:bg-red-900/20 text-red-400 rounded transition-colors shrink-0"
                    aria-label={`Remove invitation for ${invite.first_name}`}
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
        
        {/* Extra space at bottom for scroll comfort */}
        <div className="h-4" />
      </div>

      {/* FOOTER - Delete Button - Static at bottom */}
      <div className="flex-none p-3 border-t border-zinc-800 bg-zinc-900">
        <button
          onClick={() => setDeleteConfirm({ type: 'team', id: teamId })}
          className="w-full px-3 py-2.5 bg-red-900/10 hover:bg-red-900/20 border border-red-900/50 text-red-400 rounded-lg transition-colors font-medium text-xs flex items-center justify-center gap-2"
        >
          <Trash2 className="h-3.5 w-3.5" /> Delete Team
        </button>
      </div>

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
                disabled={deleteMutation.isPending}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deleteMutation.isPending}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm font-medium flex items-center justify-center gap-2"
              >
                {deleteMutation.isPending && <Spinner  />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
