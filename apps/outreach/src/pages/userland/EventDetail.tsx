import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  Trophy, 
  Target, 
  ArrowLeft,
  AlertCircle,
  ShieldCheck,
  ListChecks,
  Phone,
  User2,
  ChevronDown 
} from "lucide-react";
import api from "../../services/api";

// ... Interfaces remain the same ...
interface Round { roundNo: number; roundDescription: string; }
interface Prize { position: number; rewardValue: number; }
interface Organizer { userId: string; assignedBy: string; firstName: string; lastName: string; phoneNo: string; }
interface Rule { id: number; roundNo: number | null; ruleNumber: number; ruleDescription: string; }
interface Event {
  id: string; name: string; description: string; participationType: "solo" | "team";
  eventType: "technical" | "non-technical" | "flagship"; maxAllowed: number;
  minTeamSize: number; maxTeamSize: number; venue: string; startTime: string;
  endTime: string; registrationStart: string; registrationEnd: string;
  rounds: Round[]; prizes: Prize[]; organizers: Organizer[]; rules: Rule[];
}

const EventDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [expandedRound, setExpandedRound] = useState<number | null>(null);

  const { data: event, isLoading, error } = useQuery<Event>({
    queryKey: ["event", id],
    queryFn: async () => {
      const response = await api.get(`/events/${id}`);
      return response.data.data;
    },
    enabled: !!id,
  });

  // Helper Functions
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  const formatTime = (dateString: string) => new Date(dateString).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  
  const getEventTypeColor = (type: string) => {
    const colors = {
      technical: "bg-blue-500/10 text-blue-400 border-blue-500/20",
      "non-technical": "bg-green-500/10 text-green-400 border-green-500/20",
      flagship: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    };
    return colors[type as keyof typeof colors] || "bg-zinc-800 text-zinc-400 border-zinc-700";
  };

  const getStatusInfo = (event: Event) => {
    const now = new Date();
    if (now >= new Date(event.startTime) && now <= new Date(event.endTime)) return { text: "Event Ongoing", color: "bg-green-500/10 text-green-400 border-green-500/20" };
    if (now > new Date(event.endTime)) return { text: "Event Completed", color: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20" };
    if (now >= new Date(event.registrationStart) && now <= new Date(event.registrationEnd)) return { text: "Registration Open", color: "bg-blue-500/10 text-blue-400 border-blue-500/20" };
    return now < new Date(event.registrationStart) ? { text: "Coming Soon", color: "bg-purple-500/10 text-purple-400 border-purple-500/20" } : { text: "Registration Closed", color: "bg-red-500/10 text-red-400 border-red-500/20" };
  };

  if (isLoading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div></div>;
  if (error || !event) return <div className="flex flex-col items-center justify-center min-h-[60vh] text-center"><AlertCircle className="w-16 h-16 text-red-400 mb-4" /><h2 className="text-2xl font-bold mb-2">Event Not Found</h2><button onClick={() => navigate("/app/events")} className="mt-4 px-6 py-2 bg-purple-600 rounded-lg">Back to Events</button></div>;

  const status = getStatusInfo(event);
  const totalPrizePool = event.prizes?.reduce((sum, prize) => sum + prize.rewardValue, 0) || 0;
  const generalRules = event.rules?.filter((r) => r.roundNo === null) || [];

  return (
    <main className="flex-1 w-full p-4 md:p-8">
      <button onClick={() => navigate("/app/events")} className="flex items-center gap-2 text-zinc-400 hover:text-white mb-6 transition-colors">
        <ArrowLeft className="w-5 h-5" /> <span>Back to Events</span>
      </button>

      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-purple-500/20 via-blue-500/20 to-pink-500/20 rounded-2xl p-8 md:p-12 mb-8 overflow-hidden">
        <div className="relative z-10">
          <div className="flex flex-wrap gap-3 mb-4">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${status.color}`}>{status.text}</span>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getEventTypeColor(event.eventType)}`}>{event.eventType.toUpperCase()}</span>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-zinc-800/80 text-zinc-300 border border-zinc-700">{event.participationType === "solo" ? "Solo" : "Team"} Event</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{event.name}</h1>
          <p className="text-xl text-zinc-300 max-w-3xl">{event.description}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Info Grid */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-start gap-3"><Calendar className="w-5 h-5 text-purple-400 mt-1" /><div><p className="text-sm text-zinc-400">Date</p><p className="text-white font-medium">{formatDate(event.startTime)}</p></div></div>
            <div className="flex items-start gap-3"><Clock className="w-5 h-5 text-purple-400 mt-1" /><div><p className="text-sm text-zinc-400">Time</p><p className="text-white font-medium">{formatTime(event.startTime)} - {formatTime(event.endTime)}</p></div></div>
            <div className="flex items-start gap-3"><MapPin className="w-5 h-5 text-purple-400 mt-1" /><div><p className="text-sm text-zinc-400">Venue</p><p className="text-white font-medium">{event.venue}</p></div></div>
            <div className="flex items-start gap-3"><Users className="w-5 h-5 text-purple-400 mt-1" /><div><p className="text-sm text-zinc-400">Participants</p><p className="text-white font-medium">{event.minTeamSize}-{event.maxTeamSize} per {event.participationType}</p></div></div>
          </div>

          {/* Guidelines */}
          {generalRules.length > 0 && (
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2"><ShieldCheck className="w-6 h-6 text-purple-400" /> General Guidelines</h2>
              <div className="space-y-3">
                {generalRules.map((rule) => (
                  <div key={rule.id} className="flex gap-3 text-zinc-300 bg-zinc-800/30 p-3 rounded-lg border border-zinc-700/50">
                    <span className="text-purple-500 font-bold">•</span><p className="text-sm">{rule.ruleDescription}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Rounds Accordion */}
          {event.rounds?.length > 0 && (
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2"><Target className="w-6 h-6 text-purple-400" /> Event Rounds</h2>
              <div className="space-y-4">
                {event.rounds.map((round) => {
                  const roundRules = event.rules?.filter(r => r.roundNo === round.roundNo) || [];
                  const isExpanded = expandedRound === round.roundNo;
                  return (
                    <div key={round.roundNo} className="bg-zinc-800/50 border border-zinc-700 rounded-2xl overflow-hidden">
                      <button onClick={() => setExpandedRound(isExpanded ? null : round.roundNo)} className="w-full flex items-center justify-between p-5 text-left hover:bg-zinc-800/80 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-purple-500/20 text-purple-400 font-bold">{round.roundNo}</div>
                          <div><h3 className="font-semibold text-white text-lg">Round {round.roundNo}</h3><p className="text-sm text-zinc-400">{round.roundDescription}</p></div>
                        </div>
                        <ChevronDown className={`w-6 h-6 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                      </button>
                      {isExpanded && (
                        <div className="p-5 bg-zinc-900/30 border-t border-zinc-700/50">
                          {roundRules.length > 0 ? (
                            <ul className="space-y-2">
                              {roundRules.map(rule => <li key={rule.id} className="text-sm text-zinc-300 flex gap-2"><span className="text-purple-500/50 font-medium">{rule.ruleNumber}.</span>{rule.ruleDescription}</li>)}
                            </ul>
                          ) : <p className="text-sm text-zinc-500 italic text-center">No specific rules for this round.</p>}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Prize Pool */}
          {event.prizes?.length > 0 && (
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2"><Trophy className="w-6 h-6 text-yellow-500" /> Prize Pool</h2>
              <div className="mb-6"><p className="text-3xl font-bold text-yellow-500">₹{totalPrizePool.toLocaleString()}</p><p className="text-sm text-zinc-400">Total Prize Money</p></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {event.prizes.sort((a, b) => a.position - b.position).map((prize) => (
                  <div key={prize.position} className="flex items-center justify-between bg-zinc-800/50 border border-zinc-700 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold ${prize.position === 1 ? "bg-yellow-500/20 text-yellow-500" : "bg-zinc-400/20 text-zinc-400"}`}>{prize.position}</div>
                      <span className="font-medium text-white">{prize.position === 1 ? "First Prize" : prize.position === 2 ? "Second Prize" : `Position ${prize.position}`}</span>
                    </div>
                    <span className="text-xl font-bold text-yellow-500">₹{prize.rewardValue.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 sticky top-6">
            <h3 className="text-xl font-bold mb-4">Registration</h3>
            <div className="space-y-4 mb-6">
              <div><p className="text-sm text-zinc-400">Opens</p><p className="text-white font-medium">{formatDate(event.registrationStart)}</p></div>
              <div><p className="text-sm text-zinc-400">Closes</p><p className="text-white font-medium">{formatDate(event.registrationEnd)}</p></div>
            </div>
            <button className="w-full py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-semibold shadow-lg shadow-purple-500/20">Register Now</button>
          </div>

          {event.organizers?.length > 0 && (
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><User2 className="w-5 h-5" /> Organizers</h3>
              <div className="space-y-3">
                {event.organizers.map((org, i) => (
                  <div key={i} className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-4">
                    <div className="flex items-center gap-3 mb-2"><User2 className="w-5 h-5 text-purple-400" /><div><p className="font-semibold text-white">{org.firstName} {org.lastName}</p><p className="text-xs text-zinc-400">Event Organizer</p></div></div>
                    <div className="flex items-center gap-2 pt-2 border-t border-zinc-700/50"><Phone className="w-4 h-4 text-green-400" /><span className="text-sm text-zinc-300 font-medium">{org.phoneNo}</span></div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
};

export default EventDetail;