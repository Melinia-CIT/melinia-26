'use strict';

import { useState, useCallback, useMemo } from 'react';
import { ChevronRight, Users, Plus } from 'lucide-react'; // Added Plus icon
import { useQuery } from '@tanstack/react-query';
import { TeamDetailsPanel } from '../../components/userland/teams/TeamDetailsPanel';
import { TeamListItem } from '../../components/userland/teams/TeamList';
import { TeamModal } from '../../components/userland/teams/TeamModel';
import { Spinner } from '@melinia/outreach/src/components/common/Spinner';
import { CreateTeamForm } from '../../components/userland/teams/TeamForm';
import type { Team } from '@melinia/shared';
import { team_management } from '../../services/teams';

// Main Teams Page

const TeamsPage: React.FC = () => {
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [mobileModalOpen, setMobileModalOpen] = useState<boolean>(false);
  const [mobileSelectedId, setMobileSelectedId] = useState<string | null>(null);
  const [isTeamCreation, setIsTeamCreation] = useState<boolean>(false);

  const { data: response, isLoading } = useQuery<Team[]>({
    queryKey: ['teams'],
    queryFn: async () => {
      const res = await team_management.teamList();
      return res.data;
    },
  });

  const teams: Team[] = useMemo(() => {
    if (!Array.isArray(response)) {
      return [];
    }
    return response;
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
    <div className="h-full bg-zinc-950 text-white">
      {/* Desktop & Tablet Layout */}
      <div className="hidden md:grid md:grid-cols-3 lg:grid-cols-4 gap-6 h-[calc(100vh-120px)] p-6">
        {/* Left Side - Teams List */}
        <div className="md:col-span-1 flex flex-col border border-zinc-800 rounded-xl overflow-hidden bg-zinc-900/50">
          <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-inst font-bold text-white">Teams</h2>
              <p className="text-xs text-zinc-400 mt-1">{teams.length} team(s)</p>
            </div>
            
            <button
              onClick={() => { setIsTeamCreation(true); }}
              className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs rounded-md transition-colors border border-zinc-700"
            >
              <Plus size={14} /> New Team
            </button>
          </div>
        
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <Spinner w={20} h={20}/>
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
      <div className="md:hidden p-4 space-y-4">
        <div className="flex justify-between items-center mb-2">
            <div>
                <h2 className="text-2xl font-bold text-white">Teams</h2>
                <p className="text-sm text-zinc-400">{teams.length} team(s)</p>
            </div>
            <button 
                onClick={() => setIsTeamCreation(true)}
                className="p-2 bg-zinc-800 rounded-full text-zinc-200 border border-zinc-700"
            >
                <Plus size={20} />
            </button>
        </div>

        <div className="space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Spinner w={20} h={20}/>
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
                        {team.leader_id} member(s)
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-zinc-500 shrink-0" />
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

      {/* Create Team Modal - Updated here */}
      {isTeamCreation && (
        <CreateTeamForm onClose={() => setIsTeamCreation(false)} />
      )}
    </div>
  );
};

export default TeamsPage;