import { ChevronRight } from "lucide-react"
import type { Team } from "@melinia/shared"

interface TeamListItemProps {
    team: Team
    isSelected: boolean
    onClick: () => void
}

export const TeamListItem: React.FC<TeamListItemProps> = ({ team, isSelected, onClick }) => {
    return (
        <button
            onClick={onClick}
            className={`w-full text-left px-3 py-3 sm:px-4 sm:py-4 border border-zinc-800 rounded-lg transition-all duration-200 ${
                isSelected
                    ? "bg-blue-900/20 border-blue-600/50 shadow-lg shadow-blue-500/10"
                    : "bg-zinc-900 hover:bg-zinc-800 hover:border-zinc-700"
            }`}
        >
            <div className="flex items-center justify-between gap-2 sm:gap-3">
                <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-white text-sm sm:text-base truncate mb-1 sm:mb-2">
                        {team.team_name}
                    </h3>
                    <div className="flex items-center gap-2 sm:gap-4 text-xs text-zinc-400">
                        <span className="truncate">Leader: {team.leader_id}</span>
                    </div>
                </div>
                <ChevronRight
                    className={`h-4 w-4 sm:h-5 sm:w-5 shrink-0 transition-transform ${
                        isSelected ? "text-blue-400" : "text-zinc-500"
                    }`}
                />
            </div>
        </button>
    )
}
