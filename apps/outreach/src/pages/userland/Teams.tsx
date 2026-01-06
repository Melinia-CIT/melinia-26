'use strict';

import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronRight, Users, Trash2, X, AlertCircle, Loader } from 'lucide-react';
import { z } from 'zod';
import type {
  TeamDetails,
  Team,
  DeleteTeamRequest,
  RespondInvitationRequest,
  DeleteTeamMemberRequest,
} from '@melinia/shared';

interface TeamListResponse {
  id: string;
  team_name: string;
  leader_id: string;
  member_count: string;
}

interface ApiResponse<T> {
  status: boolean;
  statusCode: number;
  message: string;
  data: T;
}

// Mock API - Replace with actual API instance
const api = {
  get: async (url: string): Promise<ApiResponse<TeamListResponse[] | TeamDetails>> => {
    if (url === '/teams') {
      return {
        status: true,
        statusCode: 200,
        message: 'Teams fetched',
        data: [
          {
            id: 'MLNT7IJ97H',
            team_name: 'Testing for team creation',
            leader_id: 'MLNUSC875X',
            member_count: '1',
          },
          {
            id: 'MLNT7IJ97I',
            team_name: 'Code Warriors',
            leader_id: 'MLNUSC875Y',
            member_count: '3',
          },
        ] as TeamListResponse[],
      };
    }
    if (url.includes('/teams/')) {
      const teamId = url.split('/').pop();
      return {
        status: true,
        statusCode: 200,
        message: 'Team details fetched',
        data: {
          id: teamId || 'team_1',
          name: 'Code Warriors',
          leader_id: 'user_101',
          leader_first_name: 'Vishal',
          leader_last_name: 'Kumar',
          leader_email: 'vishal.kumar@example.com',
          members: [
            {
              user_id: 'user_102',
              first_name: 'Ananya',
              last_name: 'Rao',
              email: 'ananya.rao@example.com',
            },
            {
              user_id: 'user_103',
              first_name: 'Ana',
              last_name: 'Dora',
              email: 'ananya.rao@example.com',
            },
             {
              user_id: 'user_104',
              first_name: 'A',
              last_name: 'nush',
              email: 'ananya.rao@example.com',
            },
 
          ],
          pending_invites: [
            {
              invitation_id: 45,
              user_id: 'user_104',
              first_name: 'Sneha',
              last_name: 'Iyer',
              email: 'sneha.iyer@example.com',
            },
          ],
          events_registered: [
            {
              event_id: 'event_501',
              event_name: 'Hackathon 2025',
            },
          ],
          team_size: 5,
        } as TeamDetails,
      };
    }
    throw new Error('Not found');
  },
  delete: async (url: string): Promise<ApiResponse<{ success: boolean }>> => {
    return {
      status: true,
      statusCode: 200,
      message: 'Deleted successfully',
      data: { success: true },
    };
  },
};

interface TeamDetailsPanelProps {
  teamId: string;
  onDelete?: () => void;
  onClose?: () => void;
}

interface DeleteConfirmState {
  type: 'team' | 'invitation';
  id: string | number;
}

// Team Details Component - Reusable
// Team Details Component - Reusable
const TeamDetailsPanel: React.FC<TeamDetailsPanelProps> = ({ teamId, onDelete, onClose }) => {
  const [deleteConfirm, setDeleteConfirm] = useState<DeleteConfirmState | null>(null);
  const queryClient = useQueryClient();

  const { data: response, isLoading, error } = useQuery<ApiResponse<TeamDetails>>({
    queryKey: ['team', teamId],
    queryFn: async () => {
      const res = await api.get(`/teams/${teamId}`);
      return res as ApiResponse<TeamDetails>;
    },
  });

  const teamData = response?.data;

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

  if (error || !response?.status) {
    return (
      <div className="p-6 text-center">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <p className="text-red-400">Failed to load team details</p>
      </div>
    );
  }

  if (!teamData) return null;

  return (
    <div className="md:h-full overflow-y-auto custom-scrollbar bg-zinc-950">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-zinc-900/80 backdrop-blur border-b border-zinc-800 p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h2 className="text-2xl font-bold font-inst text-white mb-1">{teamData.name}</h2>
            <p className="text-zinc-400 text-sm">Team ID: {teamData.id}</p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
              aria-label="Close team details"
            >
              <X className="h-5 w-5 text-zinc-400" />
            </button>
          )}
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* Team Stats */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-zinc-900 border border-zinc-800 rounded p-3">
            <p className="text-zinc-400 text-xs uppercase tracking-wide mb-1">Size</p>
            <p className="text-xl font-bold text-white">{teamData.team_size}</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded p-3">
            <p className="text-zinc-400 text-xs uppercase tracking-wide mb-1">Members</p>
            <p className="text-xl font-bold text-white">{teamData.members.length + 1}</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded p-3">
            <p className="text-zinc-400 text-xs uppercase tracking-wide mb-1">Events</p>
            <p className="text-xl font-bold text-white">{teamData.events_registered.length}</p>
          </div>
        </div>

        {/* Team Leader */}
        <div className="bg-zinc-900 border border-zinc-800 rounded p-3">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-2">Leader</p>
          <p className="font-semibold text-white text-sm">
            {teamData.leader_first_name} {teamData.leader_last_name}
          </p>
          <p className="text-xs text-zinc-400">{teamData.leader_email}</p>
        </div>

        {/* Members & Pending Invites in 2 columns */}
        <div className="grid grid-cols-2 gap-3">
          {/* Members */}
          <section>
            <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wide mb-2">
              Members ({teamData.members.length})
            </h3>
            <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
              {teamData.members.length > 0 ? (
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
              Pending ({teamData.pending_invites.length})
            </h3>
            <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
              {teamData.pending_invites.length > 0 ? (
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
            Events ({teamData.events_registered.length})
          </h3>
          <div className="space-y-2 max-h-32 overflow-y-auto custom-scrollbar">
            {teamData.events_registered.length > 0 ? (
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


interface TeamModalProps {
  teamId: string;
  onClose: () => void;
}

// Mobile Modal
const TeamModal: React.FC<TeamModalProps> = ({ teamId, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-end">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative h-full w-full bg-zinc-950 rounded-t-2xl shadow-2xl overflow-hidden">
        <TeamDetailsPanel teamId={teamId} onClose={onClose} />
      </div>
    </div>
  );
};

interface TeamListItemProps {
  team: TeamListResponse;
  isSelected: boolean;
  onClick: () => void;
}

// Team List Item
const TeamListItem: React.FC<TeamListItemProps> = ({ team, isSelected, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-4 border border-zinc-800 rounded-lg transition-all duration-200 ${
        isSelected
          ? 'bg-blue-900/20 border-blue-600/50 shadow-lg shadow-blue-500/10'
          : 'bg-zinc-900 hover:bg-zinc-800 hover:border-zinc-700'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-white truncate mb-2">{team.team_name}</h3>
          <div className="flex items-center gap-4 text-xs text-zinc-400">
            <span>Leader: {team.leader_id}</span>
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {team.member_count} member(s)
            </span>
          </div>
        </div>
        <ChevronRight
          className={`h-5 w-5 flex-shrink-0 transition-transform ${
            isSelected ? 'text-blue-400' : 'text-zinc-500'
          }`}
        />
      </div>
    </button>
  );
};

// Main Teams Page
const TeamsPage: React.FC = () => {
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [mobileModalOpen, setMobileModalOpen] = useState<boolean>(false);
  const [mobileSelectedId, setMobileSelectedId] = useState<string | null>(null);

  const { data: response, isLoading } = useQuery<ApiResponse<TeamListResponse[]>>({
    queryKey: ['teams'],
    queryFn: async () => {
      const res = await api.get('/teams');
      return res as ApiResponse<TeamListResponse[]>;
    },
  });

  const teams: TeamListResponse[] = useMemo(() => {
    if (!response?.status || !Array.isArray(response.data)) {
      return [];
    }
    return response.data;
  }, [response]);

  const handleMobileTeamSelect = useCallback((teamId: string) => {
    setMobileSelectedId(teamId);
    setMobileModalOpen(true);
  }, []);

  const handleMobileModalClose = useCallback(() => {
    setMobileModalOpen(false);
    setMobileSelectedId(null);
  }, []);

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Desktop & Tablet Layout */}
      <div className="hidden md:grid md:grid-cols-3 lg:grid-cols-4 gap-6 h-[calc(100vh-120px)] p-6">
        {/* Left Side - Teams List */}
        <div className="md:col-span-1 flex flex-col border border-zinc-800 rounded-xl overflow-hidden bg-zinc-900/50">
          <div className="p-6 border-b border-zinc-800">
            <h2 className="text-2xl font-inst font-bold text-white">Teams</h2>
            <p className="text-xs text-zinc-400 mt-1">{teams.length} team(s)</p>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader className="h-6 w-6 animate-spin text-blue-500" />
              </div>
            ) : teams.length > 0 ? (
              teams.map((team) => (
                <TeamListItem
                  key={team.id}
                  team={team}
                  isSelected={selectedTeamId === team.id}
                  onClick={() => setSelectedTeamId(team.id)}
                />
              ))
            ) : (
              <div className="flex items-center justify-center h-full text-center">
                <div>
                  <Users className="h-8 w-8 text-zinc-600 mx-auto mb-2" />
                  <p className="text-sm text-zinc-500">No teams yet</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Side - Team Details */}
        <div className="md:col-span-2 lg:col-span-3 border border-zinc-800 rounded-xl overflow-hidden bg-zinc-900/50">
          {selectedTeamId ? (
            <TeamDetailsPanel teamId={selectedTeamId} />
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <Users className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
                <p className="text-zinc-400">Select a team to view details</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden p-4">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white mb-1">Your Teams</h2>
          <p className="text-sm text-zinc-400">{teams.length} team(s)</p>
        </div>

        <div className="space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader className="h-6 w-6 animate-spin text-blue-500" />
            </div>
          ) : teams.length > 0 ? (
            teams.map((team) => (
              <button
                key={team.id}
                onClick={() => handleMobileTeamSelect(team.id)}
                className="w-full text-left px-4 py-4 bg-zinc-900 border border-zinc-800 rounded-lg hover:border-zinc-700 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-white mb-2">{team.team_name}</h3>
                    <div className="flex items-center gap-4 text-xs text-zinc-400">
                      <span>Leader: {team.leader_id}</span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {team.member_count} member(s)
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-zinc-500 flex-shrink-0" />
                </div>
              </button>
            ))
          ) : (
            <div className="text-center py-8">
              <Users className="h-10 w-10 text-zinc-600 mx-auto mb-2" />
              <p className="text-sm text-zinc-500">No teams yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Modal */}
      {mobileModalOpen && mobileSelectedId && (
        <TeamModal teamId={mobileSelectedId} onClose={handleMobileModalClose} />
      )}
    </div>
  );
};

export default TeamsPage;