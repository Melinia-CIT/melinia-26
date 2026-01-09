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
  ChevronDown // Added for dropdown icon
} from "lucide-react";
import api from "../../services/api";

interface Round {
  roundNo: number;
  roundDescription: string;
}

interface Prize {
  position: number;
  rewardValue: number;
}

interface Organizer {
  userId: string;
  assignedBy: string;
  firstName: string;
  lastName: string;
  phoneNo: string;
}

interface Rule {
  id: number;
  roundNo: number | null;
  ruleNumber: number;
  ruleDescription: string;
}

interface Event {
  id: string;
  name: string;
  description: string;
  participationType: "solo" | "team";
  eventType: "technical" | "non-technical" | "flagship";
  maxAllowed: number;
  minTeamSize: number;
  maxTeamSize: number;
  venue: string;
  startTime: string;
  endTime: string;
  registrationStart: string;
  registrationEnd: string;
  rounds: Round[];
  prizes: Prize[];
  organizers: Organizer[];
  rules: Rule[];
}

const EventDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  // State to track which round's rules are expanded
  const [expandedRound, setExpandedRound] = useState<number | null>(null);

  const { data: event, isLoading, error } = useQuery<Event>({
    queryKey: ["event", id],
    queryFn: async () => {
      const response = await api.get(`/events/${id}`);
      return response.data.data;
    },
    enabled: !!id,
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case "technical":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case "non-technical":
        return "bg-green-500/10 text-green-400 border-green-500/20";
      case "flagship":
        return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
      default:
        return "bg-zinc-800 text-zinc-400 border-zinc-700";
    }
  };

  const getStatusInfo = (event: Event) => {
    const now = new Date();
    const regStart = new Date(event.registrationStart);
    const regEnd = new Date(event.registrationEnd);
    const eventStart = new Date(event.startTime);
    const eventEnd = new Date(event.endTime);

    if (now >= eventStart && now <= eventEnd) {
      return { text: "Event Ongoing", color: "bg-green-500/10 text-green-400 border-green-500/20" };
    } else if (now > eventEnd) {
      return { text: "Event Completed", color: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20" };
    } else if (now >= regStart && now <= regEnd) {
      return { text: "Registration Open", color: "bg-blue-500/10 text-blue-400 border-blue-500/20" };
    } else if (now < regStart) {
      return { text: "Coming Soon", color: "bg-purple-500/10 text-purple-400 border-purple-500/20" };
    } else {
      return { text: "Registration Closed", color: "bg-red-500/10 text-red-400 border-red-500/20" };
    }
  };

  const toggleRound = (roundNo: number) => {
    setExpandedRound(expandedRound === roundNo ? null : roundNo);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <AlertCircle className="w-16 h-16 text-red-400 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Event Not Found</h2>
        <button
          onClick={() => navigate("/app/events")}
          className="mt-4 px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
        >
          Back to Events
        </button>
      </div>
    );
  }

  const status = getStatusInfo(event);
  const totalPrizePool = event.prizes?.reduce((sum, prize) => sum + prize.rewardValue, 0) || 0;
  const generalRules = event.rules?.filter((r) => r.roundNo === null) || [];
  const getRoundRules = (roundNo: number) => event.rules?.filter((r) => r.roundNo === roundNo) || [];

  return (
    <main className="flex-1 w-full transition-all duration-300">
      {/* Back Button */}
      <button
        onClick={() => navigate("/app/events")}
        className="flex items-center gap-2 text-zinc-400 hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>Back to Events</span>
      </button>

      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-purple-500/20 via-blue-500/20 to-pink-500/20 rounded-2xl p-8 md:p-12 mb-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 to-transparent opacity-60" />
        <div className="relative z-10">
          <div className="flex flex-wrap gap-3 mb-4">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${status.color}`}>
              {status.text}
            </span>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getEventTypeColor(event.eventType)}`}>
              {event.eventType.toUpperCase()}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-zinc-800/80 text-zinc-300 border border-zinc-700">
              {event.participationType === "solo" ? "Solo Event" : "Team Event"}
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{event.name}</h1>
          <p className="text-xl text-zinc-300 max-w-3xl">{event.description}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 rounded-2xl p-6">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Calendar className="w-6 h-6 text-purple-400" />
              Event Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-purple-400 mt-1" />
                <div>
                  <p className="text-sm text-zinc-400">Event Date</p>
                  <p className="text-white font-medium">{formatDate(event.startTime)}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-purple-400 mt-1" />
                <div>
                  <p className="text-sm text-zinc-400">Event Time</p>
                  <p className="text-white font-medium">
                    {formatTime(event.startTime)} - {formatTime(event.endTime)}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-purple-400 mt-1" />
                <div>
                  <p className="text-sm text-zinc-400">Venue</p>
                  <p className="text-white font-medium">{event.venue}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Users className="w-5 h-5 text-purple-400 mt-1" />
                <div>
                  <p className="text-sm text-zinc-400">Participants</p>
                  <p className="text-white font-medium">
                    {event.minTeamSize} - {event.maxTeamSize} {event.participationType === "team" ? "per team" : "participants"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* General Guidelines */}
          {generalRules.length > 0 && (
            <div className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 rounded-2xl p-6">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <ShieldCheck className="w-6 h-6 text-purple-400" />
                General Guidelines
              </h2>
              <div className="space-y-3">
                {generalRules.map((rule) => (
                  <div key={rule.id} className="flex gap-3 text-zinc-300 bg-zinc-800/30 p-3 rounded-lg border border-zinc-700/50">
                    <span className="text-purple-500 font-bold">•</span>
                    <p className="text-sm leading-relaxed">{rule.ruleDescription}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Rounds with Dropdown Accordion */}
          {event.rounds && event.rounds.length > 0 && (
            <div className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 rounded-2xl p-6">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Target className="w-6 h-6 text-purple-400" />
                Event Rounds
              </h2>
              <div className="space-y-4">
                {event.rounds.map((round) => {
                  const roundRules = getRoundRules(round.roundNo);
                  const isExpanded = expandedRound === round.roundNo;
                  
                  return (
                    <div key={round.roundNo} className="bg-zinc-800/50 border border-zinc-700 rounded-2xl overflow-hidden">
                      {/* Clickable Header */}
                      <button 
                        onClick={() => toggleRound(round.roundNo)}
                        className="w-full flex items-center justify-between p-5 text-left hover:bg-zinc-800/80 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-purple-500/20 text-purple-400 font-bold">
                            {round.roundNo}
                          </div>
                          <div>
                            <h3 className="font-semibold text-white text-lg">Round {round.roundNo}</h3>
                            <p className="text-sm text-zinc-400">{round.roundDescription}</p>
                          </div>
                        </div>
                        <ChevronDown 
                          className={`w-6 h-6 text-zinc-500 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} 
                        />
                      </button>

                      {/* Dropdown Content */}
                      <div className={`transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-[500px] border-t border-zinc-700/50' : 'max-h-0'}`}>
                        <div className="p-5 bg-zinc-900/30">
                          {roundRules.length > 0 ? (
                            <div className="space-y-4">
                              <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                                <ListChecks className="w-4 h-4" /> Round Rules
                              </h4>
                              <ul className="space-y-2">
                                {roundRules.map((rule) => (
                                  <li key={rule.id} className="text-sm text-zinc-300 flex gap-2">
                                    <span className="text-purple-500/50 font-medium">{rule.ruleNumber}.</span>
                                    {rule.ruleDescription}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ) : (
                            <p className="text-sm text-zinc-500 italic text-center">No specific rules listed for this round.</p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {/* Prizes Section */}
          {event.prizes && event.prizes.length > 0 && (
            <div className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 rounded-2xl p-6">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Trophy className="w-6 h-6 text-yellow-500" />
                Prize Pool
              </h2>
              <div className="mb-6">
                <p className="text-3xl font-bold text-yellow-500">
                  ₹{totalPrizePool.toLocaleString()}
                </p>
                <p className="text-sm text-zinc-400">Total Prize Money</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Specifically filter and display 1st and 2nd for emphasis */}
                {event.prizes
                  .sort((a, b) => a.position - b.position)
                  .slice(0, 2)
                  .map((prize) => (
                    <div
                      key={prize.position}
                      className="flex items-center justify-between bg-zinc-800/50 border border-zinc-700 rounded-xl p-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold ${
                          prize.position === 1 ? "bg-yellow-500/20 text-yellow-500" : "bg-zinc-400/20 text-zinc-400"
                        }`}>
                          {prize.position}
                        </div>
                        <span className="font-medium text-white">
                          {prize.position === 1 ? "First Prize" : "Second Prize"}
                        </span>
                      </div>
                      <span className="text-xl font-bold text-yellow-500">
                        ₹{prize.rewardValue.toLocaleString()}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 rounded-2xl p-6 sticky top-6">
            <h3 className="text-xl font-bold mb-4">Registration</h3>
            <div className="space-y-4 mb-6">
              <div>
                <p className="text-sm text-zinc-400">Registration Opens</p>
                <p className="text-white font-medium">{formatDate(event.registrationStart)}</p>
              </div>
              <div>
                <p className="text-sm text-zinc-400">Registration Closes</p>
                <p className="text-white font-medium">{formatDate(event.registrationEnd)}</p>
              </div>
            </div>
            <button className="w-full py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-semibold transition-colors shadow-lg shadow-purple-500/20">
              Register Now
            </button>
          </div>

          {event.organizers && event.organizers.length > 0 && (
            <div className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 rounded-2xl p-6">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <User2 className="w-5 h-5" />
                Organizers
              </h3>
              <div className="space-y-3">
                {event.organizers.map((organizer, index) => (
                  <div key={index} className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <User2 className="w-5 h-5 text-purple-400 flex-shrink-0" />
                      <div>
                        <p className="font-semibold text-white">
                          {organizer.firstName} {organizer.lastName}
                        </p>
                        <p className="text-xs text-zinc-400">Event Organizer</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 pt-2 border-t border-zinc-700/50">
                      <Phone className="w-4 h-4 text-green-400 flex-shrink-0" />
                      <span className="text-sm text-zinc-300 font-medium">
                        {organizer.phoneNo}
                      </span>
                    </div>
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