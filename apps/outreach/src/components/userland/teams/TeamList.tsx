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
            className={`w-full text-left p-4 rounded-xl border transition-all hover:cursor-pointer duration-200 group relative ${isSelected
                ? "bg-zinc-900 border-zinc-500/50 shadow-sm"
                : "bg-zinc-950 border-zinc-800 hover:bg-zinc-900 hover:border-zinc-700"
                }`}
        >
            <div className="flex items-center justify-between gap-3 sm:gap-4">
                <div className="flex-1 min-w-0">
                    <h3 className={`font-medium text-sm sm:text-base truncate mb-1 ${isSelected ? "text-white" : "text-zinc-100 group-hover:text-white"
                        }`}>
                        {team.team_name}
                    </h3>
                    <div className="flex items-center gap-2 sm:gap-4 text-xs text-zinc-500">
                        <span className="truncate font-medium">Team ID: {team.id}</span>
                    </div>
                </div>

                {/* Icon Container - Matches Zinc Theme */}
                <div className={`shrink-0 p-1.5 rounded-md transition-all duration-300 ${isSelected
                    ? "bg-zinc-600 text-white shadow-md"
                    : "bg-zinc-900 text-zinc-600 group-hover:bg-zinc-800 group-hover:text-zinc-400"
                    }`}>
                    <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" strokeWidth={2.5} />
                </div>
            </div>
        </button>
    )
}
