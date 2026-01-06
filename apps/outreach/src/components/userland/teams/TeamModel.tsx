import { TeamDetailsPanel } from "./TeamDetailsPanel"; 

interface TeamModalProps {
  teamId: string;
  onClose: () => void;
}

export const TeamModal: React.FC<TeamModalProps> = ({ teamId, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:hidden">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Changed to flex-col to handle height correctly */}
      <div className="relative w-full max-w-lg max-h-[85vh] bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        <TeamDetailsPanel teamId={teamId} onClose={onClose} />
      </div>
    </div>
  );
};
