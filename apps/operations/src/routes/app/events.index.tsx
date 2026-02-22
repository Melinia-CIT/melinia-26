import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import {
  Clock,
  MapPin,
  Search,
  NavArrowRight,
  Group,
  User,
  ArrowLeft,
} from 'iconoir-react'
import { useState } from 'react'
import { Input } from '@/ui/Input'

export const Route = createFileRoute('/app/events/')({
  component: EventsPage,
})

// ── helpers ───────────────────────────────────────────────────────────────────


function fmtTime(iso: string) {
  return new Date(iso)
    .toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
    .toUpperCase()
}

const EVENT_TYPE_LABEL: Record<string, string> = {
  technical: 'Technical',
  'non-technical': 'Non-Technical',
  flagship: 'Flagship',
}

// ── page ──────────────────────────────────────────────────────────────────────

function EventsPage() {
  const { api } = Route.useRouteContext()
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')

  const { data: events, isLoading, error } = useQuery({
    queryKey: ['my-events'],
    queryFn: () => api.users.getMyEvents(),
  })

  const filteredEvents = events?.filter(
    (event: any) =>
      event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.venue.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Back link */}
      <Link
        to="/app"
        className="inline-flex items-center gap-2 text-xs text-neutral-500 hover:text-white transition-colors duration-150 uppercase tracking-widest focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to Dashboard
      </Link>

      {/* Page header */}
      <div className="space-y-1">
        <h2 className="text-3xl font-bold text-white">My Events</h2>
        <p className="text-neutral-500">Select an event to view its registrations.</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 z-10" />
        <Input
          type="text"
          placeholder="Search events or venues…"
          className="pl-10"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* States */}
      {isLoading ? (
        <div className="text-neutral-500 text-sm">Loading events…</div>
      ) : error ? (
        <div className="p-4 bg-red-950/50 border border-red-900 text-sm text-red-500">
          Failed to load events. Please try again or contact the system administrator.
        </div>
      ) : filteredEvents && filteredEvents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEvents.map((event: any) => (
            <EventCard
              key={event.id}
              event={event}
              onClick={() =>
                navigate({ to: '/app/events/$eventId', params: { eventId: event.id } })
              }
            />
          ))}
        </div>
      ) : (
        <div className="py-20 border border-neutral-800 bg-neutral-950/30 flex flex-col items-center justify-center space-y-4">
          <div className="text-center space-y-1">
            <p className="text-neutral-400 font-medium">No events found</p>
            <p className="text-neutral-600 text-xs">
              Try adjusting your search or contact the operations lead.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

// ── event card ────────────────────────────────────────────────────────────────

interface EventCardProps {
  event: any
  onClick: () => void
}

function EventCard({ event, onClick }: EventCardProps) {
  const isSolo = event.participation_type === 'solo'

  return (
    <button
      type="button"
      onClick={onClick}
      className="group w-full text-left bg-neutral-950 border border-neutral-800 hover:border-neutral-600 hover:bg-neutral-900 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
    >
      {/* Card top strip */}
      <div className="px-5 pt-4 pb-3 border-b border-neutral-800 flex items-center justify-between">
        <span className="text-[9px] font-bold uppercase tracking-widest text-neutral-500">
          {EVENT_TYPE_LABEL[event.event_type] ?? event.event_type}
        </span>
        <span className="flex items-center gap-1 text-[9px] uppercase tracking-widest text-neutral-600">
          {isSolo ? <User className="w-3 h-3" /> : <Group className="w-3 h-3" />}
          {event.participation_type}
        </span>
      </div>

      {/* Card body */}
      <div className="px-5 py-4 space-y-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-base font-bold text-white leading-tight group-hover:text-stone-50 transition-colors">
            {event.name}
          </h3>
          <NavArrowRight className="w-4 h-4 text-neutral-600 group-hover:text-neutral-300 shrink-0 mt-0.5 transition-colors" />
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-neutral-500">
            <MapPin className="w-3.5 h-3.5 text-neutral-600 shrink-0" />
            <span className="truncate">{event.venue}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-neutral-500">
            <Clock className="w-3.5 h-3.5 text-neutral-600 shrink-0" />
            <span>
              {fmtTime(event.start_time)} – {fmtTime(event.end_time)}
            </span>
          </div>
        </div>
      </div>
    </button>
  )
}
