import { ChevronRight } from 'lucide-react';
import type {Team} from '@melinia/shared';


interface TeamListItemProps {
  team: Team;
  isSelected: boolean;
  onClick: () => void;
}

// Team List Item
export const TeamListItem: React.FC<TeamListItemProps> = ({ team, isSelected, onClick }) => {
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
            {/* <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {team.member_count} member(s)
            </span> */}
          </div>
        </div>
        <ChevronRight
          className={`h-5 w-5 shrink-0 transition-transform ${
            isSelected ? 'text-blue-400' : 'text-zinc-500'
          }`}
        />
      </div>
    </button>
  );
};

