import { useState, useCallback, useMemo } from "react"
import { ChevronRight, Users, Plus } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { TeamDetailsPanel } from "../../components/userland/teams/TeamDetailsPanel"
import { TeamListItem } from "../../components/userland/teams/TeamList"
import { TeamModal } from "../../components/userland/teams/TeamModel"
import { Spinner } from "../../components/ui/spinner"
import { CreateTeamForm } from "../../components/userland/teams/TeamForm"
import type { Team } from "@melinia/shared"
import { team_management } from "../../services/teams"

type ActiveModal = "mobileDetails" | "createTeam" | null
type FilterType = "all" | "led" | "member"

const TeamsPage: React.FC = () => {
    const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null)
    const [activeModal, setActiveModal] = useState<ActiveModal>(null)
    
    const [filter, setFilter] = useState<FilterType>("all")

    const { data: response, isLoading } = useQuery<Team[]>({
        queryKey: ["teams", filter],
        queryFn: async () => {
            // Pass the filter state directly to the function
            const res = await team_management.teamList(filter)
            return res.data
        },
    })

    const teams: Team[] = useMemo(() => {
        if (!Array.isArray(response)) {
            return []
        }
        return response
    }, [response])

    const handleMobileTeamSelect = useCallback((teamId: string) => {
        setSelectedTeamId(teamId)
        setActiveModal("mobileDetails")
    }, [])

    const handleMobileModalClose = useCallback(() => {
        setActiveModal(null)
        setSelectedTeamId(null)
    }, [])

    const FilterTabs = () => (
        <div className="flex items-center p-1 bg-zinc-800/50 rounded-lg w-fit">
            {[
                { id: "all" as FilterType, label: "All" },
                { id: "led" as FilterType, label: "My Teams" },
                { id: "member" as FilterType, label: "Other" }
            ].map((option) => (
                <button
                    key={option.id}
                    onClick={() => setFilter(option.id)}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                        filter === option.id
                            ? "bg-zinc-200 text-zinc-900 shadow-sm"
                            : "text-zinc-400 hover:text-zinc-200"
                    }`}
                >
                    {option.label}
                </button>
            ))}
        </div>
    )

    return (
        <div className="flex-1 flex flex-col text-white sm:h-full font-geist p-1">
            {/* Desktop & Tablet Layout */}
            <div className="hidden md:grid md:grid-cols-4 lg:grid-cols-6 gap-6 h-full">
                {/* Left Side - Teams List */}
                <div className="col-span-2 flex flex-col border border-zinc-800 rounded-xl overflow-hidden bg-zinc-900/50 flex-1">
                    <div className="p-6 border-b border-zinc-800">
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <h2 className="text-2xl font-inst font-bold text-white">Teams</h2>
                                <p className="text-xs text-zinc-400 mt-1">{teams.length} team(s)</p>
                            </div>

                            <button
                                onClick={() => {
                                    setActiveModal("createTeam")
                                }}
                                className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-2 sm:py-3 bg-zinc-200 text-zinc-800 text-xs sm:text-sm font-semibold rounded-md transition-colors"
                            >
                                <Plus size={12} className="w-3.5 h-3.5 sm:w-4 sm:h-4" />{" "}
                            </button>
                        </div>

                        <FilterTabs />
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
                        {isLoading ? (
                            <div className="flex items-center justify-center h-full">
                                <Spinner w={20} h={20} />
                            </div>
                        ) : teams.length > 0 ? (
                            teams.map(team => (
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
                <div className="md:col-span-2 lg:col-span-4 border border-zinc-800 rounded-xl overflow-hidden bg-zinc-900/50 flex-1">
                    {selectedTeamId ? (
                        <TeamDetailsPanel
                            teamId={selectedTeamId}
                            onDelete={() => setSelectedTeamId(null)}
                        />
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
            <div className="md:hidden flex flex-col gap-6 px-2 h-full">
                <div className="flex flex-col gap-4">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-2xl md:text-3xl font-bold font-inst text-white">Teams</h2>
                            <p className="text-sm text-zinc-400">{teams.length} team(s)</p>
                        </div>
                        <button
                            onClick={() => {
                                setActiveModal("createTeam")
                            }}
                            className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-2 sm:py-3 bg-zinc-200 text-zinc-800 text-xs sm:text-sm font-semibold rounded-md transition-colors"
                        >
                            <Plus size={12} className="w-3.5 h-3.5 sm:w-4 sm:h-4" />{" "}
                            <span className="hidden sm:inline">New Team</span>
                        </button>
                    </div>

                    <FilterTabs />
                </div>

                <div className="flex-1 flex flex-col space-y-3 h-full">
                    {isLoading ? (
                        <>
                            {[1, 2, 3].map(i => (
                                <div
                                    key={i}
                                    className="w-full px-4 py-4 bg-zinc-900/50 border border-zinc-800 rounded-xl animate-pulse"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex flex-col w-full">
                                            <div className="h-5 w-3/4 bg-zinc-800 rounded mb-2" />
                                            <div className="flex items-center gap-4">
                                                <div className="h-3 w-20 bg-zinc-800 rounded" />
                                                <div className="h-3 w-24 bg-zinc-800 rounded" />
                                            </div>
                                        </div>
                                        <div className="h-5 w-5 bg-zinc-800 rounded shrink-0" />
                                    </div>
                                </div>
                            ))}
                        </>
                    ) : teams.length > 0 ? (
                        teams.map(team => (
                            <div
                                key={team.id}
                                onClick={() => handleMobileTeamSelect(team.id)}
                                className="w-full text-left px-4 py-4 bg-zinc-900 border border-zinc-800 rounded-xl hover:border-zinc-700 hover:cursor-pointer transition-colors"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex flex-col">
                                        <h3 className="font-semibold text-white mb-2">
                                            {team.team_name}
                                        </h3>
                                        <div className="flex items-center gap-4 text-xs text-zinc-400">
                                            <span>Team ID: {team.id}</span>
                                            <span className="flex items-center gap-1">
                                                <Users className="h-3 w-3" />
                                                {team.member_count} member(s)
                                            </span>
                                        </div>
                                    </div>
                                    <ChevronRight className="h-5 w-5 text-zinc-500 shrink-0 self-center" />
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="flex items-center justify-center flex-1 text-center">
                            <div>
                                <Users className="h-10 w-10 text-zinc-600 mx-auto mb-2" />
                                <p className="text-sm text-zinc-500">No teams yet</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Mobile Modal */}
            {activeModal === "mobileDetails" && selectedTeamId && (
                <TeamModal
                    teamId={selectedTeamId}
                    onClose={handleMobileModalClose}
                    onDelete={handleMobileModalClose}
                />
            )}

            {/* Create Team Modal */}
            {activeModal === "createTeam" && (
                <CreateTeamForm onClose={() => setActiveModal(null)} />
            )}
        </div>
    )
}

export default TeamsPage
