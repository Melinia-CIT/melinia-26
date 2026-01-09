import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
  firstName?: string | null;
  lastName?: string | null;
  phoneNo?: string | null;
}

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
  participationType: string;
  eventType: string;
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
  rules: Rule[];
}

type EventFilter = "all" | "flagship" | "technical" | "non-technical";

const Events = () => {
  const [activeFilter, setActiveFilter] = useState<EventFilter>("all");

  const { data: eventsData, isLoading: eventsLoading } = useQuery<Event[]>({
    queryKey: ["events"],
    queryFn: async () => {
      const response = await api.get("/events");
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
    <main className="flex-1 w-full transition-all duration-300">
      {eventsLoading ? (
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-zinc-400">Loading events...</p>
          </div>
        </div>
      ) : (
        /* Increased max-width to accommodate 4 columns comfortably */
        <div className="max-w-[1600px] mx-auto space-y-10 px-4 md:px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-zinc-200 via-white to-zinc-200 bg-clip-text text-transparent font-inst">
              Events
            </h1>

            <div className="flex flex-wrap justify-center gap-3">
              {filters.map((filter) => (
                <button
                  key={filter.value}
                  onClick={() => setActiveFilter(filter.value)}
                  className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 border ${
                    activeFilter === filter.value
                      ? "bg-purple-600 text-white shadow-lg shadow-purple-500/30 border-purple-500"
                      : "bg-zinc-800/50 text-zinc-400 hover:bg-zinc-800 hover:text-white border-zinc-700"
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          {/* Grid Layout:
              - 1 col on mobile
              - 2 cols on medium (tablets)
              - 3 cols on large desktop 
              - 4 cols on extra large desktop (2xl) 
          */}
          {filteredEvents && filteredEvents.length > 0 ? (
            // <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl: grid-cols-4 2xl:grid-cols-5 gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
              {filteredEvents.map((event) => (
                <EventsCard key={event.id} event={event as any} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center min-h-[40vh] text-center">
              <h3 className="text-xl font-semibold text-zinc-300 mb-2">No events found</h3>
              <p className="text-zinc-500">
                No {activeFilter !== "all" ? activeFilter : ""} events available at the moment.
              </p>
            </div>
          )}
        </div>
      )}
    </main>
  );
};

export default Events;
