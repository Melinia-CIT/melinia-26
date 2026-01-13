import { Bell } from "iconoir-react"
import { useQuery } from "@tanstack/react-query"
import { team_management } from "../../../services/teams"

interface NotificationIconProps {
    onClick: () => void
    isOpen: boolean
}

export const NotificationIcon = ({ onClick, isOpen }: NotificationIconProps) => {
    const { data: invitationsData } = useQuery({
        queryKey: ["userInvitations"],
        queryFn: async () => {
            const response = await team_management.getInvitationsForUser()
            return response.data.invitations
        },
        refetchInterval: 30000,
    })

    const invitations = invitationsData || []
    const hasNotifications = invitations.length > 0

    return (
        <button
            onClick={onClick}
            className={`relative p-2 rounded-full transition-all duration-200 hover:bg-zinc-800/50 ${
                isOpen ? "bg-zinc-800/50" : ""
            }`}
            aria-label="Notifications"
        >
            <Bell
                className={`w-6 h-6 transition-all duration-200 ${
                    hasNotifications ? "text-indigo-400 animate-pulse" : "text-zinc-500"
                } ${isOpen ? "scale-110" : ""}`}
            />

            {/* Notification badge */}
            {hasNotifications && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center animate-bounce">
                    <span className="text-xs font-bold text-white">
                        {invitations.length > 9 ? "9+" : invitations.length}
                    </span>
                </div>
            )}
        </button>
    )
}
