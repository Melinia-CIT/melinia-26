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
  ShieldCheck, // Added for Rules icon
  ListChecks   // Added for sub-rules icon
} from "lucide-react";
import api from "../../services/api";
import Navigator from "../../components/userland/Navigator";

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
}

// Added Rule Interface
interface Rule {
  id: number;
  roundNo: number | null; // null means General Rule
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
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  rounds: Round[];
  prizes: Prize[];
  organizers: Organizer[];
  rules: Rule[]; // Added rules to Event interface
}

const EventDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: event, isLoading, error } = useQuery<Event>({
    queryKey: ["event", id],
    queryFn: async () => {
      const response = await api.get(`/events/events/${id}`);
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

  const totalPrizePool = event?.prizes?.reduce((sum, prize) => sum + prize.rewardValue, 0) || 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white">
        <Navigator />
        <main className="px-6 md:pl-48 md:pr-8 pb-8 pt-20 md:pt-6">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
              <p className="text-zinc-400">Loading event details...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white">
        <Navigator />
        <main className="px-6 md:pl-48 md:pr-8 pb-8 pt-20 md:pt-6">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Event Not Found</h2>
              <p className="text-zinc-400 mb-6">The event you're looking for doesn't exist.</p>
              <button
                onClick={() => navigate("/app/events")}
                className="px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
              >
                Back to Events
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const status = getStatusInfo(event);

  // Logic to separate general rules from round rules
  const generalRules = event.rules?.filter((r) => r.roundNo === null) || [];
  const getRoundRules = (roundNo: number) => event.rules?.filter((r) => r.roundNo === roundNo) || [];

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <Navigator />
      <main className="px-6 md:pl-48 md:pr-8 pb-8 pt-20 md:pt-6">
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
            {/* Event Details */}
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
                      Max {event.maxAllowed} {event.participationType === "team" ? "teams" : "participants"}
                    </p>
                    {event.participationType === "team" && (
                      <p className="text-sm text-zinc-400 mt-1">
                        Team Size: {event.minTeamSize} - {event.maxTeamSize} members
                      </p>
                    )}
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

            {/* Rounds */}
            {event.rounds && event.rounds.length > 0 && (
              <div className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 rounded-2xl p-6">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  <Target className="w-6 h-6 text-purple-400" />
                  Event Rounds
                </h2>
                <div className="space-y-6">
                  {event.rounds.map((round) => {
                    const roundRules = getRoundRules(round.roundNo);
                    return (
                      <div
                        key={round.roundNo}
                        className="bg-zinc-800/50 border border-zinc-700 rounded-2xl p-5"
                      >
                        <div className="flex items-center gap-3 mb-4">
                          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-purple-500/20 text-purple-400 font-bold">
                            {round.roundNo}
                          </div>
                          <div>
                            <h3 className="font-semibold text-white text-lg">Round {round.roundNo}</h3>
                            <p className="text-sm text-zinc-400">{round.roundDescription}</p>
                          </div>
                        </div>

                        {/* Round Specific Rules */}
                        {roundRules.length > 0 && (
                          <div className="mt-4 pt-4 border-t border-zinc-700/50">
                            <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3 flex items-center gap-2">
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
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Prizes */}
            {event.prizes && event.prizes.length > 0 && (
              <div className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 rounded-2xl p-6">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  <Trophy className="w-6 h-6 text-yellow-500" />
                  Prize Pool
                </h2>
                <div className="mb-4">
                  <p className="text-3xl font-bold text-yellow-500">
                    ₹{totalPrizePool.toLocaleString()}
                  </p>
                  <p className="text-sm text-zinc-400">Total Prize Money</p>
                </div>
                <div className="space-y-3">
                  {event.prizes.map((prize) => (
                    <div
                      key={prize.position}
                      className="flex items-center justify-between bg-zinc-800/50 border border-zinc-700 rounded-xl p-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-yellow-500/20 text-yellow-500 font-bold">
                          {prize.position}
                        </div>
                        <span className="font-medium text-white">
                          {prize.position === 1 ? "1st" : prize.position === 2 ? "2nd" : prize.position === 3 ? "3rd" : `${prize.position}th`} Place
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
            {/* Registration Card */}
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

            {/* Quick Stats */}
            <div className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 rounded-2xl p-6">
              <h3 className="text-xl font-bold mb-4">Quick Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400">Event Type</span>
                  <span className="text-white font-medium capitalize">{event.eventType}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400">Format</span>
                  <span className="text-white font-medium capitalize">{event.participationType}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400">Rounds</span>
                  <span className="text-white font-medium">{event.rounds.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400">Organizers</span>
                  <span className="text-white font-medium">{event.organizers.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default EventDetail;