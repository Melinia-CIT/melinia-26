import { useState } from "react";
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

// Added Rule interface to match backend data
interface Rule {
  id: number;
  roundNo: number | null;
  ruleNumber: number;
  ruleDescription: string;
}

export interface Event {
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
  rules: Rule[]; // Integrated rules into the interface
}

type EventFilter = "all" | "flagship" | "technical" | "non-technical";

const EventsLayout = () => {
  const [activeFilter, setActiveFilter] = useState<EventFilter>("all");

  const { data: eventsData, isLoading: eventsLoading } = useQuery<Event[]>({
    queryKey: ["events"],
    queryFn: async () => {
      const response = await api.get("/events/events");
      return response.data.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const filteredEvents = eventsData?.filter((event) => {
    if (activeFilter === "all") return true;
    return event.eventType === activeFilter;
  });

  const filters: { label: string; value: EventFilter }[] = [
    { label: "All", value: "all" },
    { label: "Flagship", value: "flagship" },
    { label: "Technical", value: "technical" },
    { label: "Non-Technical", value: "non-technical" },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-white relative overflow-hidden">
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
            <div className="text-center mb-8">
              {/* RESTORED FONT + REDUCED SIZE */}
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-zinc-200 via-white to-zinc-200 bg-clip-text text-transparent font-inst mb-6">
                Events
              </h1>
              <p className="text-lg text-zinc-400 max-w-2xl mx-auto mb-8">
                Explore upcoming competitions and register for your favorites
              </p>

              <div className="flex flex-wrap justify-center gap-3">
                {filters.map((filter) => (
                  <button
                    key={filter.value}
                    onClick={() => setActiveFilter(filter.value)}
                    className={`px-6 py-2.5 rounded-lg font-semibold transition-all duration-300 ${
                      activeFilter === filter.value
                        ? "bg-purple-600 text-white shadow-lg shadow-purple-500/30"
                        : "bg-zinc-800/50 text-zinc-400 hover:bg-zinc-800 hover:text-white border border-zinc-700"
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="text-center mb-4">
              <p className="text-sm text-zinc-500">
                Showing {filteredEvents?.length || 0} event{filteredEvents?.length !== 1 ? "s" : ""}
              </p>
            </div>

            {filteredEvents && filteredEvents.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredEvents.map((event) => (
                  <EventsCard key={event.id} event={event} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center min-h-[40vh]">
                <div className="text-center">
                  <h3 className="text-xl font-semibold text-white mb-2">No events found</h3>
                  <p className="text-zinc-400">
                    No {activeFilter !== "all" && activeFilter} events available at the moment
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default EventsLayout;