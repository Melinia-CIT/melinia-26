import { Link } from "react-router-dom";

interface Event {
  id: string;
  name: string;
  description: string;
  eventType: string; 
}

interface EventsCardProps {
  event: Event;
}

const EventsCard = ({ event }: EventsCardProps) => {
  // Define color mapping based on eventType
  const colorMap: Record<string, { header: string; badge: string; tagline: string; hoverBorder: string }> = {
    "flagship": {
      header: "from-blue-600 via-blue-900 to-black",
      badge: "bg-blue-500 text-white",
      tagline: "text-blue-500/60",
      hoverBorder: "group-hover:border-blue-500/30"
    },
    "technical": {
      header: "from-orange-400/40 via-rose-200/20 to-black", 
      badge: "bg-orange-500/90 text-white shadow-md",
      tagline: "text-orange-400/60",
      hoverBorder: "group-hover:border-orange-400/30"
    },
    "non-technical": {
      header: "from-emerald-500 via-emerald-900 to-black",
      badge: "bg-emerald-500 text-black",
      tagline: "text-emerald-500/60",
      hoverBorder: "group-hover:border-emerald-500/30"
    }
  };

  // Fallback to zinc/monochrome if type doesn't match
  const styles = colorMap[event.eventType.toLowerCase()] || {
    header: "from-zinc-800 via-zinc-900 to-black",
    badge: "bg-white text-black",
    tagline: "text-zinc-600",
    hoverBorder: "group-hover:border-zinc-400"
  };

  return (
    <Link to={`/app/events/${event.id}`}>
      <div className={`group relative bg-black border border-zinc-800 rounded-2xl overflow-hidden transition-all duration-300 h-full flex flex-col ${styles.hoverBorder}`}>
        
        {/* Dynamic Header Area */}
        <div className={`relative h-20 overflow-hidden bg-gradient-to-br ${styles.header}`}>
          <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent" />
          <div className="absolute top-4 right-4">
            <span className={`px-2 py-1 rounded text-[10px] font-black tracking-widest uppercase ${styles.badge}`}>
              {event.eventType}
            </span>
          </div>
        </div>

        <div className="p-5 flex-1 flex flex-col">

          <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-zinc-300 transition-colors italic uppercase tracking-tighter">
            {event.name}
          </h3>

          <p className="text-zinc-500 text-sm leading-relaxed font-medium line-clamp-3">
            {event.description}
          </p>
          
          <div className="mt-auto pt-6">
            <span className="text-[10px] text-white font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
              View Details —
            </span>
          </div>
        </div>

        {/* The thin glow border effect on hover */}
        <div className={`absolute inset-0 border-2 border-transparent rounded-2xl transition-all duration-300 pointer-events-none ${styles.hoverBorder}`} />
      </div>
    </Link>
  );
};

export default EventsCard;