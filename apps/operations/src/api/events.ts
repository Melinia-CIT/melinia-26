import type { AxiosInstance } from "axios";

// ── Registration types ─────────────────────────────────────────────────────

export interface SoloRegistration {
    type: "SOLO";
    participant_id: string;
    first_name: string;
    last_name: string;
    college: string;
    degree: string;
    registered_at: string;
}

export interface TeamMember {
    participant_id: string;
    first_name: string;
    last_name: string;
    college: string;
    degree: string;
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

// ── API factory ────────────────────────────────────────────────────────────

export function createEventsApi(http: AxiosInstance) {
    return {
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
