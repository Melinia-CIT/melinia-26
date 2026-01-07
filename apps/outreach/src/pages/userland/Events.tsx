import { useQuery } from "@tanstack/react-query";
import Navigator from "../../components/userland/Navigator";
import EventsCard from "../../components/userland/main/EventsCard";
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

const EventsLayout = () => {
  const { data: eventsData, isLoading: eventsLoading } = useQuery<Event[]>({
    queryKey: ["events"],
    queryFn: async () => {
      const response = await api.get("/events/events");
      return response.data.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  return (
    <div className="min-h-screen bg-zinc-950 text-white relative overflow-hidden inset-0 fixed">
      <Navigator />

      <main className="px-6 md:pl-48 md:pr-8 pb-8 pt-20 md:pt-6 transition-all duration-300 relative z-0">
        {eventsLoading ? (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
              <p className="text-zinc-400">Loading events...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="text-center mb-16">
              <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-zinc-200 via-white to-zinc-200 bg-clip-text text-transparent font-inst mb-6">
                Events
              </h1>
              <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
                Explore upcoming competitions and register for your favorites
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {eventsData?.map((event) => (
                <EventsCard key={event.id} event={event} />
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default EventsLayout;