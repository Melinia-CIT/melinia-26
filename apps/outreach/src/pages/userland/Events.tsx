import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence, Variants } from "framer-motion";
import EventsCard from "../../components/userland/main/EventsCard";
import api from "../../services/api";

interface Round { roundNo: number; roundDescription: string; }
interface Prize { position: number; rewardValue: number; }
interface Organizer { userId: string; assignedBy: string; firstName?: string | null; lastName?: string | null; phoneNo?: string | null; }
interface Rule { id: number; roundNo: number | null; ruleNumber: number; ruleDescription: string; }

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

const Events = () => {
  const [activeFilter, setActiveFilter] = useState<string>("all");

  const { data: eventsData, isLoading: eventsLoading } = useQuery<Event[]>({
    queryKey: ["events"],
    queryFn: async () => {
      const response = await api.get("/events");
      return response.data?.data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const filters = useMemo(() => {
    if (!eventsData || !Array.isArray(eventsData)) return ["all"];
    const types = Array.from(new Set(eventsData.map((e) => e.eventType.trim())));
    return ["all", ...types];
  }, [eventsData]);

  const filteredEvents = useMemo(() => {
    if (!eventsData) return [];
    if (activeFilter === "all") return eventsData;
    return eventsData.filter((event) => 
      event.eventType.trim().toLowerCase() === activeFilter.trim().toLowerCase()
    );
  }, [eventsData, activeFilter]);

  // FIXED: Explicitly typed as Variants to resolve ease: number[] error
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08, delayChildren: 0.1 },
    },
  };

  const cardVariants: Variants = {
    hidden: { opacity: 0, y: 40 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.5, 
        ease: [0.22, 1, 0.36, 1] 
      }
    },
    exit: { 
      opacity: 0, 
      scale: 0.95, 
      transition: { duration: 0.2 } 
    }
  };

  return (
    <main className="flex-1 w-full bg-zinc-950 min-h-screen selection:bg-white selection:text-black overflow-x-hidden">
      <style>{`
        @keyframes text-shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }

        .animate-text-shimmer {
          background: linear-gradient(
            110deg,
            #ffffff 35%,
            #a1a1aa 45%,
            #ffffff 55%
          );
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: text-shimmer 4s linear infinite;
        }

        @keyframes diagonal-shimmer {
          0% { transform: translateX(-250%) skewX(-45deg); }
          100% { transform: translateX(250%) skewX(-45deg); }
        }
        
        .shimmer-bar {
          animation: diagonal-shimmer 3s infinite linear;
        }
      `}</style>

      {eventsLoading ? (
        <div className="flex items-center justify-center min-h-[70vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-white mx-auto mb-4"></div>
            <p className="text-zinc-500 uppercase tracking-[0.3em] text-[10px]">Syncing Data</p>
          </div>
        </div>
      ) : (
        <div className="max-w-[1600px] mx-auto space-y-12 px-4 md:px-8 py-12">
          
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8 border-b border-white/10 pb-10">
            
            <motion.h1 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-4xl sm:text-5xl font-bold font-inst animate-text-shimmer drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]"
            >
              Events
            </motion.h1>

            <div className="flex flex-wrap justify-center gap-3">
              {filters.map((filter) => (
                <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-4 py-1.5 sm:px-6 sm:py-2 rounded-xl text-[13px] sm:text-[15px] font-bold uppercase tracking-widest sm:tracking-[0.15em] transition-all duration-500 border-[0.5px] relative overflow-hidden group ${
                  activeFilter === filter
                    ? "bg-white text-black border-white shadow-[0_0_30px_rgba(255,255,255,0.15)]"
                    : "bg-transparent text-zinc-500 border-zinc-800 hover:border-zinc-500 hover:text-zinc-200"
                } font-medium`}
              >
                <span className="relative z-10">{filter}</span>
                
                <div className={`absolute inset-0 pointer-events-none z-0 ${activeFilter === filter ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
                  <div className="shimmer-bar absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                </div>
              </button>
              ))}
            </div>
          </div>

          <AnimatePresence mode="popLayout">
            {filteredEvents.length > 0 ? (
              <motion.div 
                key={activeFilter} 
                layout
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-10"
              >
                {filteredEvents.map((event) => (
                  <motion.div
                    key={event.id}
                    layout
                    variants={cardVariants}
                  >
                    {/* Fixed prop passing to use the typed event */}
                    <EventsCard event={event} />
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center min-h-[40vh] text-center border border-white/5 bg-zinc-950/30 rounded-3xl"
              >
                <h3 className="text-[10px] uppercase tracking-[0.5em] text-zinc-500 font-bold">
                  No events found in this category
                </h3>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </main>
  );
};

export default Events;