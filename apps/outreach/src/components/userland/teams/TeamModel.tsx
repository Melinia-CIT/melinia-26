import { TeamDetailsPanel } from "./TeamDetailsPanel"

interface TeamModalProps {
    teamId: string
    onClose: () => void
    onDelete?: () => void
}

export const TeamModal: React.FC<TeamModalProps> = ({ teamId, onClose, onDelete }) => {
    return (
        <div className="fixed inset-0 z-9999 flex items-center justify-center p-4 md:hidden">
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-md transition-opacity"
                onClick={onClose}
            />
            <div className="relative w-full max-w-md bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl shadow-black/50 h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <TeamDetailsPanel teamId={teamId} onClose={onClose} onDelete={onDelete} />
            </div>
        </div>
    )
}
