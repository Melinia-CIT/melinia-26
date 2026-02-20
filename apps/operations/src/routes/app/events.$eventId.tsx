import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowLeft,
  Building,
  Group,
  User,
  NavArrowLeft,
  NavArrowRight,
} from 'iconoir-react'
import { useState } from 'react'
import type { EventRegistration, EventRegistrationsResponse } from '@/api/events'

export const Route = createFileRoute('/app/events/$eventId')({
  component: EventRegistrationsPage,
})

// ── helpers ───────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function fmtTime(iso: string) {
  return new Date(iso)
    .toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
    .toUpperCase()
}

// ── page ──────────────────────────────────────────────────────────────────────

const LIMIT = 10

function EventRegistrationsPage() {
  const { eventId } = Route.useParams()
  const { api } = Route.useRouteContext()
  const [from, setFrom] = useState(0)

  // Pull the event name from cached events list (no extra fetch needed)
  const { data: myEvents } = useQuery<any[]>({
    queryKey: ['my-events'],
    queryFn: () => api.users.getMyEvents(),
    staleTime: 1000 * 60,
  })

  const event = myEvents?.find((e: any) => e.id === eventId)

  const {
    data,
    isLoading,
    error,
  } = useQuery<EventRegistrationsResponse>({
    queryKey: ['event-registrations', eventId, from],
    queryFn: () => api.events.getRegistrations(eventId, { from, limit: LIMIT }),
    staleTime: 1000 * 30,
  })

  const pagination = data?.pagination
  const registrations = data?.data ?? []

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Back link */}
      <Link
        to="/app/events"
        className="inline-flex items-center gap-2 text-xs text-neutral-500 hover:text-white transition-colors duration-150 uppercase tracking-widest focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to events
      </Link>

      {/* Page header */}
      <div className="space-y-1">
        <h2 className="text-3xl font-bold text-white">
          {event?.name ?? 'Registrations'}
        </h2>
        <p className="text-neutral-500">
          {pagination
            ? `${pagination.total} registration${pagination.total !== 1 ? 's' : ''} total`
            : 'Loading…'}
        </p>
      </div>

      {/* Content */}
      {isLoading ? (
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
        <div className="border border-neutral-800 bg-neutral-950 overflow-hidden">
          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-800 bg-neutral-900/60">
                  <th className="px-6 py-3 text-left text-[10px] font-semibold text-neutral-400 uppercase tracking-widest">
                    Mode
                  </th>
                  <th className="px-6 py-3 text-left text-[10px] font-semibold text-neutral-400 uppercase tracking-widest">
                    Participant / Team
                  </th>
                  <th className="px-6 py-3 text-left text-[10px] font-semibold text-neutral-400 uppercase tracking-widest hidden md:table-cell">
                    College & Degree
                  </th>
                  <th className="px-6 py-3 text-left text-[10px] font-semibold text-neutral-400 uppercase tracking-widest hidden lg:table-cell">
                    Registered At
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60">
                {registrations.map((reg, idx) => (
                  <RegistrationRow key={`${reg.type}-${idx}`} reg={reg} />
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination && (
            <div className="flex items-center justify-between px-6 py-3 border-t border-neutral-800">
              <span className="text-[10px] text-neutral-600 uppercase tracking-widest">
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
      )}
    </div>
  )
}

// ── registration rows ────────────────────────────────────────────────────────

function RegistrationRow({ reg }: { reg: EventRegistration }) {
  if (reg.type === 'SOLO') {
    return (
      <tr className="hover:bg-neutral-900/40 transition-colors duration-150">
        <td className="px-6 py-3.5">
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-bold border uppercase tracking-tighter bg-neutral-950 text-neutral-500 border-neutral-800">
            <User className="w-2.5 h-2.5" />
            Solo
          </span>
        </td>
        <td className="px-6 py-3.5">
          <div className="text-sm font-semibold text-white">
            {reg.first_name} {reg.last_name}
          </div>
          <div className="text-[10px] text-neutral-500 font-mono mt-0.5">{reg.participant_id}</div>
        </td>
        <td className="px-6 py-3.5 hidden md:table-cell">
          <div className="flex items-start gap-1.5 text-xs text-neutral-400">
            <Building className="w-3 h-3 text-neutral-600 shrink-0 mt-0.5" />
            <div>
              <div className="truncate max-w-[220px]">{reg.college}</div>
              <div className="text-[10px] text-neutral-600 mt-0.5">{reg.degree}</div>
            </div>
          </div>
        </td>
        <td className="px-6 py-3.5 hidden lg:table-cell">
          <div className="text-xs text-neutral-400">{fmtDate(reg.registered_at)}</div>
          <div className="text-[10px] text-neutral-600 mt-0.5">{fmtTime(reg.registered_at)}</div>
        </td>
      </tr>
    )
  }

  return (
    <>
      <tr className="bg-neutral-900/40">
        <td className="px-6 py-3">
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-bold border uppercase tracking-tighter bg-neutral-900 text-neutral-400 border-neutral-700">
            <Group className="w-2.5 h-2.5" />
            Team
          </span>
        </td>
        <td colSpan={2} className="px-6 py-3">
          <div className="text-xs font-bold text-white uppercase tracking-wider">
            {reg.name}
          </div>
          <div className="text-[10px] text-neutral-500 mt-0.5">
            {reg.members.length} member{reg.members.length !== 1 ? 's' : ''}
          </div>
        </td>
        <td className="px-6 py-3 hidden lg:table-cell">
          <div className="text-xs text-neutral-400">{fmtDate(reg.registered_at)}</div>
          <div className="text-[10px] text-neutral-600 mt-0.5">{fmtTime(reg.registered_at)}</div>
        </td>
      </tr>

      {reg.members.map((member) => (
        <tr
          key={member.participant_id}
          className="hover:bg-neutral-900/20 transition-colors duration-150"
        >
          <td className="pl-10 pr-6 py-2.5">
            <div className="w-1.5 h-1.5 border border-neutral-700" />
          </td>
          <td className="px-6 py-2.5">
            <div className="text-sm text-neutral-300">
              {member.first_name} {member.last_name}
            </div>
            <div className="text-[10px] text-neutral-600 font-mono mt-0.5">
              {member.participant_id}
            </div>
          </td>
          <td className="px-6 py-2.5 hidden md:table-cell">
            <div className="flex items-start gap-1.5 text-xs text-neutral-500">
              <Building className="w-3 h-3 text-neutral-700 shrink-0 mt-0.5" />
              <div>
                <div className="truncate max-w-[220px]">{member.college}</div>
                <div className="text-[10px] text-neutral-700 mt-0.5">{member.degree}</div>
              </div>
            </div>
          </td>
          <td className="hidden lg:table-cell" />
        </tr>
      ))}
    </>
  )
}
