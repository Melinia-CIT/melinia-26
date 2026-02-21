import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowLeft,
  Group,
  User,
  NavArrowLeft,
  NavArrowRight,
  Clock,
  Plus,
} from 'iconoir-react'
import { useState } from 'react'
import { Button } from '@/ui/Button'
import { AddVolunteersModal } from '@/ui/AddVolunteersModal'
import type { EventRegistration, EventRegistrationsResponse, Round, EventDetail } from '@/api/events'

export const Route = createFileRoute('/app/events/$eventId/')({
  component: EventRegistrationsPage,
})

// ── helpers ───────────────────────────────────────────────────────────────────


function fmtTime(date: string | Date) {
  return new Date(date)
    .toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
    .toUpperCase()
}

function TypeBadge({ type }: { type: 'TEAM' | 'SOLO' }) {
  if (type === 'TEAM') {
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-bold border uppercase tracking-tighter bg-blue-950/50 text-blue-400 border-blue-800 w-fit">
        <Group className="w-2.5 h-2.5" />
        Team
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-bold border uppercase tracking-tighter bg-blue-950/50 text-blue-400 border-blue-800 w-fit">
      <User className="w-2.5 h-2.5" />
      Solo
    </span>
  )
}
// ── page ──────────────────────────────────────────────────────────────────────

const LIMIT = 10

function EventRegistrationsPage() {
  const { eventId } = Route.useParams()
  const { api } = Route.useRouteContext()
  const [from, setFrom] = useState(0)
  const [showVolunteersModal, setShowVolunteersModal] = useState(false)

  // Fetch detailed event data (includes rounds)
  const { data: event, isLoading: isEventLoading } = useQuery<EventDetail>({
    queryKey: ['event-detail', eventId],
    queryFn: () => api.events.getById(eventId),
    staleTime: 1000 * 60,
  })

  const {
    data,
    isLoading: isRegistrationsLoading,
    error,
  } = useQuery<EventRegistrationsResponse>({
    queryKey: ['event-registrations', eventId, from],
    queryFn: () => api.events.getRegistrations(eventId, { from, limit: LIMIT }),
    staleTime: 1000 * 30,
  })

  const pagination = data?.pagination
  const registrations = data?.data ?? []


  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Back link */}
      <Link
        to="/app/events"
        className="inline-flex items-center gap-2 text-xs text-neutral-500 hover:text-white transition-colors duration-150 uppercase tracking-widest focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to events
      </Link>

      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold text-white">
            {event?.name ?? 'Loading…'}
          </h2>
          <div className="flex items-center gap-4 text-sm text-neutral-500">
            <span>{event?.event_type?.toUpperCase()}</span>
            <span>•</span>
            <span>{event?.participation_type?.toUpperCase()} participation</span>
          </div>
        </div>
        <Button
          onClick={() => setShowVolunteersModal(true)}
          className="bg-white text-black hover:bg-neutral-200 border-none px-6 py-2.5 font-bold flex items-center gap-2 shrink-0 h-fit"
        >
          <Plus className="w-5 h-5" />
          Add Volunteers
        </Button>
      </div>

      <AddVolunteersModal
        open={showVolunteersModal}
        onClose={() => setShowVolunteersModal(false)}
        eventName={event?.name ?? ''}
      />

      {/* Rounds section */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-2">
          Rounds
          <span className="h-[1px] flex-1 bg-neutral-800" />
        </h3>
        {isEventLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-neutral-900/50 border border-neutral-800 animate-pulse" />
            ))}
          </div>
        ) : event?.rounds && event.rounds.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {event.rounds.sort((a, b) => a.round_no - b.round_no).map((round) => (
              <RoundCard key={round.id} round={round} eventId={eventId} />
            ))}
          </div>
        ) : (
          <div className="p-6 border border-neutral-800 text-neutral-500 text-sm italic">
            No rounds defined for this event.
          </div>
        )}
      </div>

      {/* Registrations section */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-2">
          Registrations
          <span className="h-[1px] flex-1 bg-neutral-800" />
        </h3>

        {isRegistrationsLoading ? (
          <div className="text-neutral-500 text-sm">Loading registrations…</div>
        ) : error ? (
          <div className="p-4 bg-red-950/50 border border-red-900 text-sm text-red-500">
            Failed to load registrations. Please try again.
          </div>
        ) : registrations.length === 0 ? (
          <div className="py-20 border border-neutral-800 bg-neutral-950/30 flex flex-col items-center justify-center space-y-4">
            <Group className="w-10 h-10 text-neutral-800" />
            <div className="text-center space-y-1">
              <p className="text-neutral-400 font-medium">No registrations yet</p>
              <p className="text-neutral-600 text-xs">Nobody has registered for this event.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Mobile View */}
            <div className="md:hidden divide-y divide-neutral-800 border border-neutral-800 bg-neutral-950 shadow-xl">
              {registrations.map((reg, idx) => (
                <RegistrationMobileCard key={`${reg.type}-${idx}`} reg={reg} />
              ))}
            </div>

            {/* Desktop View */}
            <div className="hidden md:block border border-neutral-800 bg-neutral-950 overflow-hidden shadow-2xl">
              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-neutral-800 bg-neutral-900/60">
                      {event?.participation_type?.toUpperCase() === 'TEAM' && (
                        <th className="px-6 py-3 text-left text-[10px] font-semibold text-neutral-400 uppercase tracking-widest border-r border-neutral-800/60 w-[200px]">
                          Team / Entry
                        </th>
                      )}
                      <th className="px-6 py-3 text-left text-[10px] font-semibold text-neutral-400 uppercase tracking-widest">
                        Participant Name
                      </th>
                      <th className="px-6 py-3 text-left text-[10px] font-semibold text-neutral-400 uppercase tracking-widest hidden md:table-cell">
                        College & Degree
                      </th>
                      <th className="px-6 py-3 text-left text-[10px] font-semibold text-neutral-400 uppercase tracking-widest">
                        Phone Number
                      </th>
                    </tr>
                  </thead>
                  <tbody className="">
                    {registrations.map((reg, idx) => (
                      <RegistrationRow
                        key={`${reg.type}-${idx}`}
                        reg={reg}
                        showTeamColumn={event?.participation_type?.toUpperCase() === 'TEAM'}
                      />
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination && (
                <div className="flex items-center justify-between px-6 py-3 border-t border-neutral-800 bg-neutral-950">
                  <span className="text-[10px] text-neutral-600 uppercase tracking-widest font-mono">
                    {pagination.total === 0
                      ? '0 results'
                      : `${from + 1}–${Math.min(from + LIMIT, pagination.total)} of ${pagination.total}`}
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={from === 0}
                      onClick={() => setFrom(Math.max(0, from - LIMIT))}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs border border-neutral-800 text-neutral-400 hover:bg-neutral-900 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                    >
                      <NavArrowLeft className="w-3 h-3" />
                      Prev
                    </button>
                    <button
                      type="button"
                      disabled={!pagination.has_more}
                      onClick={() => setFrom(from + LIMIT)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs border border-neutral-800 text-neutral-400 hover:bg-neutral-900 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                    >
                      Next
                      <NavArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── mobile card ──────────────────────────────────────────────────────────────

function RegistrationMobileCard({ reg }: { reg: EventRegistration }) {
  if (reg.type === 'SOLO') {
    return (
      <div className="p-4 space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1.5 flex-1 min-w-0">
            <TypeBadge type="SOLO" />
            <div className="text-sm font-bold text-white uppercase tracking-wider truncate">
              {reg.first_name} {reg.last_name}
            </div>
            <div className="text-[10px] text-neutral-500 font-mono">{reg.participant_id}</div>
          </div>
          <div className="shrink-0 pl-4">
            <div className="text-[11px] text-neutral-400 font-mono tracking-tight">{reg.ph_no}</div>
          </div>
        </div>
        <div className="pt-3 border-t border-neutral-800/40">
          <div className="text-[11px] text-neutral-300 font-medium leading-relaxed">{reg.college}</div>
          <div className="text-[10px] text-neutral-600 mt-0.5">{reg.degree}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-start justify-between">
        <div className="space-y-1.5">
          <TypeBadge type="TEAM" />
          <div className="text-sm font-black text-white uppercase tracking-widest">{reg.name}</div>
          <div className="text-[9px] text-neutral-600 uppercase tracking-widest font-black">
            {reg.members.length} members
          </div>
        </div>
      </div>
      <div className="space-y-4 pl-3 border-l-2 border-neutral-800 ml-1">
        {reg.members.map((m) => (
          <div key={m.participant_id} className="space-y-1.5">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-bold text-neutral-300">
                {m.first_name} {m.last_name}
              </span>
              <span className="text-[10px] text-neutral-600 font-mono shrink-0">{m.ph_no}</span>
            </div>
            <div className="text-[10px] leading-relaxed">
              <span className="text-neutral-500 font-medium">{m.college}</span>
              <span className="mx-1.5 text-neutral-800">·</span>
              <span className="text-neutral-700">{m.degree}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── round card ──────────────────────────────────────────────────────────────

function RoundCard({ round, eventId }: { round: EventDetail['rounds'][number]; eventId: string }) {
  return (
    <Link
      to="/app/events/$eventId/$roundNo"
      params={{ eventId, roundNo: round.round_no.toString() }}
      className="bg-neutral-950 border border-neutral-800 p-5 space-y-4 relative overflow-hidden group block hover:border-neutral-600 hover:bg-neutral-900 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
    >
      <div className="absolute top-0 right-0 p-3 text-[40px] font-black text-neutral-900/50 leading-none pointer-events-none select-none italic group-hover:text-neutral-800/50 transition-colors">
        #{round.round_no}
      </div>

      <div className="space-y-1 relative z-10">
        <div className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest">Round {round.round_no}</div>
        <h4 className="text-lg font-bold text-white leading-tight">{round.round_name}</h4>
      </div>

      <div className="relative z-10 pt-1">
        <div className="flex items-center gap-2 text-[11px] text-neutral-500">
          <Clock className="w-3.5 h-3.5 text-neutral-700 shrink-0" />
          <span>{fmtTime(round.start_time)} – {fmtTime(round.end_time)}</span>
        </div>
      </div>
    </Link>
  )
}


// ── registration rows ────────────────────────────────────────────────────────

function RegistrationRow({ reg, showTeamColumn }: { reg: EventRegistration; showTeamColumn: boolean }) {
  if (reg.type === 'SOLO') {
    return (
      <tr className="hover:bg-neutral-900/40 transition-colors duration-150 border-b border-neutral-800/60 last:border-0">
        {showTeamColumn && (
          <td className="px-6 py-4 border-r border-neutral-800/60 bg-neutral-950/20 align-middle">
            <div className="flex flex-col items-center justify-center">
              <TypeBadge type="SOLO" />
            </div>
          </td>
        )}
        <td className="px-6 py-4">
          <div className="flex flex-col gap-2">
            {!showTeamColumn && <TypeBadge type="SOLO" />}
            <div className="text-sm font-semibold text-white">
              {reg.first_name} {reg.last_name}
            </div>
            <div className="text-[10px] text-neutral-500 font-mono mt-0.5">{reg.participant_id}</div>
          </div>
        </td>
        <td className="px-6 py-4 hidden md:table-cell">
          <div className="text-xs text-neutral-400">
            <div className="truncate max-w-[240px] font-medium text-neutral-300">{reg.college}</div>
            <div className="text-[10px] text-neutral-600 mt-0.5">{reg.degree}</div>
          </div>
        </td>
        <td className="px-6 py-4">
          <div className="text-xs text-neutral-400 font-mono">{reg.ph_no}</div>
        </td>
      </tr>
    )
  }

  return (
    <>
      {reg.members.map((member, idx) => (
        <tr
          key={member.participant_id}
          className={`hover:bg-neutral-900/20 transition-colors duration-150 border-b border-neutral-800/60 last:border-0 ${idx === 0 ? '' : 'border-t-0'
            }`}
        >
          {idx === 0 && showTeamColumn && (
            <td
              rowSpan={reg.members.length}
              className="px-6 py-6 border-r border-neutral-800/60 bg-neutral-950/30 align-middle"
            >
              <div className="flex flex-col items-center justify-center space-y-2 sticky top-4 text-center">
                <TypeBadge type="TEAM" />
                <div className="text-sm font-black text-white uppercase tracking-widest leading-none">
                  {reg.name}
                </div>
                <div className="text-[9px] text-neutral-600 uppercase tracking-widest font-bold">
                  {reg.members.length} members
                </div>
              </div>
            </td>
          )}
          <td className="px-6 py-3.5">
            <div className="text-sm text-neutral-300 font-medium">
              {member.first_name} {member.last_name}
            </div>
            <div className="text-[10px] text-neutral-600 font-mono mt-0.5">
              {member.participant_id}
            </div>
          </td>
          <td className="px-6 py-3.5 hidden md:table-cell">
            <div className="text-xs text-neutral-500">
              <div className="truncate max-w-[240px] text-neutral-400">{member.college}</div>
              <div className="text-[10px] text-neutral-700 mt-0.5">{member.degree}</div>
            </div>
          </td>
          <td className="px-6 py-3.5">
            <div className="text-xs text-neutral-500 font-mono">{member.ph_no}</div>
          </td>
        </tr>
      ))}
    </>
  )
}
