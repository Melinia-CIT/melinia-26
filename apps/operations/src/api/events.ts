import type { AxiosInstance } from "axios";

// ── Registration types ─────────────────────────────────────────────────────

export interface SoloRegistration {
    type: "SOLO";
    participant_id: string;
    first_name: string;
    last_name: string;
    college: string;
    degree: string;
    ph_no: string;
    registered_at: string;
}

export interface TeamMember {
    participant_id: string;
    first_name: string;
    last_name: string;
    college: string;
    degree: string;
    ph_no: string;
}

export interface TeamRegistration {
    type: "TEAM";
    name: string;
    members: TeamMember[];
    registered_at: string;
}

export type EventRegistration = SoloRegistration | TeamRegistration;

export interface Pagination {
    from: number;
    limit: number;
    total: number;
    returned: number;
    has_more: boolean;
}

export interface EventRegistrationsResponse {
    data: EventRegistration[];
    pagination: Pagination;
}

export interface GetEventRegistrationsParams {
    from?: number;
    limit?: number;
}

export interface Rule {
    id: number;
    rule_no: number;
    rule_description: string;
}

export interface Round {
    id: number;
    round_no: number;
    round_name: string;
    round_description: string;
    start_time: string;
    end_time: string;
    rules: Rule[];
}

export interface EventDetail {
    id: string;
    name: string;
    description: string;
    participation_type: string;
    event_type: string;
    venue: string;
    start_time: string;
    end_time: string;
    rounds: Round[];
}

// ── API factory ────────────────────────────────────────────────────────────

export function createEventsApi(http: AxiosInstance) {
    return {
        async getById(id: string): Promise<EventDetail> {
            const { data } = await http.get<{ event: EventDetail }>(`/events/${id}`);
            return data.event;
        },

        async getRegistrations(
            eventId: string,
            params: GetEventRegistrationsParams = {},
        ): Promise<EventRegistrationsResponse> {
            const { data } = await http.get<EventRegistrationsResponse>(
                `/events/${eventId}/registrations`,
                {
                    params: {
                        from: params.from ?? 0,
                        limit: params.limit ?? 10,
                    },
                },
            );
            return data;
        },
    };
}

export type EventsApi = ReturnType<typeof createEventsApi>;
