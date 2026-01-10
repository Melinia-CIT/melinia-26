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
  Phone,
  User2,
  ChevronDown 
} from "lucide-react";
import api from "../../services/api";

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

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  const formatTime = (dateString: string) => new Date(dateString).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  
  const getTheme = (type: string) => {
    const themes = {
      technical: {
        banner: "from-orange-400/10 via-rose-600/5 to-zinc-950",
        badge: "bg-orange-500/10 text-orange-400 border-orange-500/20",
        accent: "text-orange-400",
        icon: "text-orange-400",
        button: "bg-orange-600 hover:bg-orange-700 shadow-orange-500/20"
      },
      "non-technical": {
        banner: "from-emerald-500/10 via-emerald-900/5 to-zinc-950",
        badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
        accent: "text-emerald-400",
        icon: "text-emerald-400",
        button: "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20"
      },
      flagship: {
        banner: "from-blue-600/10 via-blue-900/5 to-zinc-950",
        badge: "bg-blue-500/10 text-blue-400 border-blue-500/20",
        accent: "text-blue-400",
        icon: "text-blue-400",
        button: "bg-blue-600 hover:bg-blue-700 shadow-blue-500/20"
      },
    };
    return themes[type as keyof typeof themes] || {
      banner: "from-zinc-800/10 via-zinc-900/5 to-zinc-950",
      badge: "bg-zinc-800 text-zinc-400 border-zinc-700",
      accent: "text-purple-400",
      icon: "text-purple-400",
      button: "bg-purple-600 hover:bg-purple-700 shadow-purple-500/20"
    };
  };

  const getStatusInfo = (event: Event) => {
    const now = new Date();
    if (now >= new Date(event.startTime) && now <= new Date(event.endTime)) return { text: "Ongoing", color: "bg-green-500/10 text-green-400 border-green-500/20" };
    if (now > new Date(event.endTime)) return { text: "Completed", color: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20" };
    if (now >= new Date(event.registrationStart) && now <= new Date(event.registrationEnd)) return { text: "Open", color: "bg-blue-500/10 text-blue-400 border-blue-500/20" };
    return { text: "Closed", color: "bg-red-500/10 text-red-400 border-red-500/20" };
  };

  if (isLoading) return <div className="flex items-center justify-center min-h-[50vh] bg-zinc-950"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div></div>;
  if (error || !event) return <div className="flex flex-col items-center justify-center min-h-[50vh] bg-zinc-950"><AlertCircle className="w-12 h-12 text-red-400 mb-2" /><button onClick={() => navigate("/app/events")} className="px-4 py-2 bg-zinc-800 rounded-lg text-sm">Back</button></div>;

  const status = getStatusInfo(event);
  const theme = getTheme(event.eventType.toLowerCase());
  const totalPrizePool = event.prizes?.reduce((sum, prize) => sum + prize.rewardValue, 0) || 0;
  const generalRules = event.rules?.filter((r) => r.roundNo === null) || [];

  return (
    <main className="flex-1 w-full p-3 md:p-6 bg-zinc-950 min-h-screen">
      <button onClick={() => navigate("/app/events")} className="flex items-center gap-2 text-zinc-500 hover:text-white mb-4 transition-colors group">
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> 
        <span className="text-[10px] font-bold uppercase tracking-widest">Back</span>
      </button>

      {/* Hero Section - Compact */}
      <div className={`relative bg-gradient-to-br ${theme.banner} border border-zinc-800/50 rounded-2xl p-5 md:p-8 mb-6 overflow-hidden`}>
        <div className="relative z-10">
          <div className="flex flex-wrap gap-2 mb-3">
            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold tracking-tighter uppercase border ${status.color}`}>{status.text}</span>
            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold tracking-tighter uppercase border ${theme.badge}`}>{event.eventType}</span>
          </div>
          <h1 className="text-2xl md:text-4xl font-bold mb-3 italic uppercase tracking-tighter text-white">{event.name}</h1>
          <p className="text-sm text-zinc-400 max-w-2xl leading-snug">{event.description}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Info Grid - More compact gap */}
          <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-xl p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-start gap-2">
              <Calendar className={`w-4 h-4 ${theme.icon} mt-0.5`} />
              <div><p className="text-[9px] uppercase tracking-tighter text-zinc-500 font-bold">Date</p><p className="text-xs text-white font-medium">{formatDate(event.startTime)}</p></div>
            </div>
            <div className="flex items-start gap-2">
              <Clock className={`w-4 h-4 ${theme.icon} mt-0.5`} />
              <div><p className="text-[9px] uppercase tracking-tighter text-zinc-500 font-bold">Time</p><p className="text-xs text-white font-medium">{formatTime(event.startTime)}</p></div>
            </div>
            <div className="flex items-start gap-2">
              <MapPin className={`w-4 h-4 ${theme.icon} mt-0.5`} />
              <div><p className="text-[9px] uppercase tracking-tighter text-zinc-500 font-bold">Venue</p><p className="text-xs text-white font-medium truncate w-24">{event.venue}</p></div>
            </div>
            <div className="flex items-start gap-2">
              <Users className={`w-4 h-4 ${theme.icon} mt-0.5`} />
              <div><p className="text-[9px] uppercase tracking-tighter text-zinc-500 font-bold">Size</p><p className="text-xs text-white font-medium">{event.maxTeamSize} Max</p></div>
            </div>
          </div>

          {/* Guidelines - Reduced padding */}
          {generalRules.length > 0 && (
            <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-xl p-5">
              <h2 className="text-sm font-bold mb-4 flex items-center gap-2 uppercase italic text-zinc-200"><ShieldCheck className={`w-4 h-4 ${theme.icon}`} /> Guidelines</h2>
              <div className="grid gap-2">
                {generalRules.map((rule) => (
                  <div key={rule.id} className="flex gap-3 text-zinc-400 bg-zinc-800/10 p-3 rounded-lg border border-zinc-800/50">
                    <span className={`${theme.accent} font-black text-xs`}>/</span>
                    <p className="text-xs leading-tight">{rule.ruleDescription}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Timeline - Reduced padding & icon sizes */}
          {event.rounds?.length > 0 && (
            <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-xl p-5">
              <h2 className="text-sm font-bold mb-4 flex items-center gap-2 uppercase italic text-zinc-200"><Target className={`w-4 h-4 ${theme.icon}`} /> Timeline</h2>
              <div className="space-y-2">
                {event.rounds.map((round) => {
                  const roundRules = event.rules?.filter(r => r.roundNo === round.roundNo) || [];
                  const isExpanded = expandedRound === round.roundNo;
                  return (
                    <div key={round.roundNo} className={`bg-zinc-800/10 border border-zinc-800/50 rounded-xl overflow-hidden`}>
                      <button onClick={() => setExpandedRound(isExpanded ? null : round.roundNo)} className="w-full flex items-center justify-between p-3 text-left">
                        <div className="flex items-center gap-3">
                          <div className={`flex items-center justify-center w-8 h-8 rounded-lg ${theme.badge} border font-black text-xs`}>{round.roundNo}</div>
                          <div><h3 className="text-xs font-bold text-white uppercase">{round.roundDescription}</h3></div>
                        </div>
                        <ChevronDown className={`w-4 h-4 text-zinc-500 transition-transform ${isExpanded ? 'rotate-180 text-white' : ''}`} />
                      </button>
                      {isExpanded && (
                        <div className="px-3 pb-3 bg-black/10">
                          <ul className="space-y-1 pt-2 border-t border-zinc-800/50">
                            {roundRules.map(rule => (
                              <li key={rule.id} className="text-[11px] text-zinc-400 flex gap-2"><span className={`${theme.accent} font-bold`}>{rule.ruleNumber}.</span>{rule.ruleDescription}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Prizes - Fixed overlapping for Mobile */}
          {event.prizes?.length > 0 && (
            <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-xl p-4 md:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                <h2 className="text-sm font-bold flex items-center gap-2 uppercase italic text-zinc-200"><Trophy className="w-4 h-4 text-yellow-500 shrink-0" /> Rewards</h2>
                <div className="text-left sm:text-right border-l-2 sm:border-l-0 sm:border-r-2 border-yellow-500/50 pl-3 sm:pr-3">
                  <p className="text-[8px] text-zinc-500 uppercase tracking-widest font-black">Total Pool</p>
                  <p className="text-base font-black text-white">₹{totalPrizePool.toLocaleString()}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {event.prizes.sort((a, b) => a.position - b.position).map((prize) => (
                  <div key={prize.position} className="flex items-center justify-between gap-2 bg-zinc-800/10 border border-zinc-800/50 rounded-xl p-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={`shrink-0 flex items-center justify-center w-6 h-6 rounded-full font-black text-[10px] ${prize.position === 1 ? "bg-yellow-500/10 text-yellow-500" : "bg-zinc-800 text-zinc-500"}`}>{prize.position}</div>
                      <span className="font-bold text-zinc-400 text-[10px] uppercase truncate">{prize.position === 1 ? "Winner" : `Rank ${prize.position}`}</span>
                    </div>
                    <span className="text-sm font-black text-white">₹{prize.rewardValue.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar - Compact */}
        <div className="space-y-4">
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5 md:sticky md:top-6">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-4">Registration</h3>
            <div className="grid grid-cols-2 lg:grid-cols-1 gap-3 mb-4">
              <div className="p-2.5 bg-zinc-800/20 rounded-xl border border-zinc-800/50">
                <p className="text-[8px] text-zinc-500 uppercase font-black mb-0.5">Start</p>
                <p className="text-[11px] text-white font-bold">{formatDate(event.registrationStart)}</p>
              </div>
              <div className="p-2.5 bg-zinc-800/20 rounded-xl border border-zinc-800/50">
                <p className="text-[8px] text-zinc-500 uppercase font-black mb-0.5">End</p>
                <p className="text-[11px] text-white font-bold">{formatDate(event.registrationEnd)}</p>
              </div>
            </div>
            <button className={`w-full py-3 ${theme.button} text-white rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg`}>
              Register
            </button>
          </div>

          {event.organizers?.length > 0 && (
            <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-2xl p-5">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-4 flex items-center gap-2"><User2 className="w-3 h-3" /> Help</h3>
              <div className="space-y-2">
                {event.organizers.map((org, i) => (
                  <div key={i} className="bg-zinc-800/10 border border-zinc-800/50 rounded-xl p-3">
                    <p className="font-bold text-white text-[11px] uppercase truncate">{org.firstName} {org.lastName}</p>
                    <a href={`tel:${org.phoneNo}`} className="flex items-center justify-between gap-2 mt-2 p-1.5 bg-zinc-950/50 rounded-lg border border-zinc-800">
                       <span className="text-[10px] text-zinc-400 font-mono">{org.phoneNo}</span>
                       <Phone className="w-3 h-3 text-green-500" />
                    </a>
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