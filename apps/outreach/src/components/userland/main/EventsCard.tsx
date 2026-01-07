import { Link } from "react-router-dom";
import { Calendar, Users, Trophy, MapPin, Clock, Target } from "lucide-react";

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
}

interface EventsCardProps {
  event: Event;
}

const EventsCard = ({ event }: EventsCardProps) => {
  const totalPrizePool = event.prizes?.reduce((sum, prize) => sum + prize.rewardValue, 0) || 0;
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
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

  const getStatusColor = (event: Event) => {
    const now = new Date();
    const regStart = new Date(event.registrationStart);
    const regEnd = new Date(event.registrationEnd);
    const eventStart = new Date(event.startTime);
    const eventEnd = new Date(event.endTime);

    if (now >= eventStart && now <= eventEnd) {
      return "bg-green-500/10 text-green-400 border-green-500/20";
    } else if (now > eventEnd) {
      return "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";
    } else if (now >= regStart && now <= regEnd) {
      return "bg-blue-500/10 text-blue-400 border-blue-500/20";
    } else {
      return "bg-purple-500/10 text-purple-400 border-purple-500/20";
    }
  };

  const getStatusText = (event: Event) => {
    const now = new Date();
    const regStart = new Date(event.registrationStart);
    const regEnd = new Date(event.registrationEnd);
    const eventStart = new Date(event.startTime);
    const eventEnd = new Date(event.endTime);

    if (now >= eventStart && now <= eventEnd) {
      return "ONGOING";
    } else if (now > eventEnd) {
      return "COMPLETED";
    } else if (now >= regStart && now <= regEnd) {
      return "REGISTRATION OPEN";
    } else {
      return "UPCOMING";
    }
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case "technical":
        return "bg-blue-500/10 text-blue-400";
      case "non-technical":
        return "bg-green-500/10 text-green-400";
      case "flagship":
        return "bg-yellow-500/10 text-yellow-400";
      default:
        return "bg-zinc-800 text-zinc-400";
    }
  };

  return (
    <Link to={`/app/events/${event.id}`}>
      <div className="group relative bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 rounded-2xl overflow-hidden hover:border-zinc-700 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/10 h-full flex flex-col">
        {/* Header with gradient background */}
        <div className="relative h-32 overflow-hidden bg-gradient-to-br from-purple-500/20 via-blue-500/20 to-pink-500/20">
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 to-transparent" />
          <div className="absolute top-4 right-4 flex gap-2">
            <span className={`px-2 py-1 rounded text-xs font-semibold ${getEventTypeColor(event.eventType)}`}>
              {event.eventType.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-6 flex-1 flex flex-col">
          {/* Status Badge */}
          <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border mb-4 w-fit ${getStatusColor(event)}`}>
            {getStatusText(event)}
          </span>

          {/* Event Name */}
          <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-purple-400 transition-colors">
            {event.name}
          </h3>

          {/* Participation Type Badge */}
          <span className="inline-block px-2 py-1 bg-zinc-800 text-zinc-400 text-xs rounded mb-3 w-fit">
            {event.participationType === "solo" ? "Solo Event" : `Team Event (${event.minTeamSize}-${event.maxTeamSize} members)`}
          </span>

          {/* Description */}
          <p className="text-zinc-400 text-sm mb-4 line-clamp-2">
            {event.description}
          </p>

          {/* Event Details */}
          <div className="space-y-3 mt-auto">
            {/* Date & Time */}
            <div className="flex items-center gap-2 text-sm text-zinc-400">
              <Calendar className="w-4 h-4 text-purple-400" />
              <span>{formatDate(event.startTime)}</span>
              <Clock className="w-4 h-4 text-purple-400 ml-2" />
              <span>{formatTime(event.startTime)}</span>
            </div>

            {/* Venue */}
            <div className="flex items-center gap-2 text-sm text-zinc-400">
              <MapPin className="w-4 h-4 text-purple-400" />
              <span>{event.venue}</span>
            </div>

            {/* Max Participants */}
            <div className="flex items-center gap-2 text-sm text-zinc-400">
              <Users className="w-4 h-4 text-purple-400" />
              <span>Max {event.maxAllowed} {event.participationType === "team" ? "teams" : "participants"}</span>
            </div>

            {/* Prize Pool */}
            {totalPrizePool > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <Trophy className="w-4 h-4 text-yellow-500" />
                <span className="text-yellow-500 font-semibold">
                  ₹{totalPrizePool.toLocaleString()} Prize Pool
                </span>
              </div>
            )}

            {/* Rounds Count */}
            {event.rounds && event.rounds.length > 0 && (
              <div className="flex items-center gap-2 text-sm text-zinc-400">
                <Target className="w-4 h-4 text-purple-400" />
                <span>{event.rounds.length} Round{event.rounds.length > 1 ? "s" : ""}</span>
              </div>
            )}
          </div>

          {/* Registration Deadline */}
          <div className="mt-4 pt-4 border-t border-zinc-800">
            <p className="text-xs text-zinc-500">
              Registration: {formatDate(event.registrationStart)} - {formatDate(event.registrationEnd)}
            </p>
          </div>
        </div>

        {/* Hover Effect Overlay */}
        <div className="absolute inset-0 border-2 border-transparent group-hover:border-purple-500/20 rounded-2xl transition-all duration-300 pointer-events-none" />
      </div>
    </Link>
  );
};

export default EventsCard;