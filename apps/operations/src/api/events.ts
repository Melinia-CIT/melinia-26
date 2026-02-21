import type { AxiosInstance } from "axios";

import type {
    EventRegistration,
    ScanResult,
    Rule,
    Round,
    VerboseEvent as EventDetail,
    GetEventCheckIn,
    GetEventParticipant,
    AssignRoundResults,
    BulkOperationResult,
    RoundResult,
    UserResultError,
    TeamResultError,
} from "@melinia/shared";

import type { GetEventRegistration, ScanResult, Rule, Round, VerboseEvent as EventDetail } from "@melinia/shared";

export type EventRegistration = GetEventRegistration;

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



export type RoundParticipant = ScanResult;

// Re-export shared result types for use in routes
export type { AssignRoundResults, BulkOperationResult, RoundResult, UserResultError, TeamResultError };
export type RoundResultStatus = "QUALIFIED" | "ELIMINATED" | "DISQUALIFIED";

export interface CheckInRoundResponse {
    user_ids: string[];
    team_id: string | null;
}

export interface RoundCheckInsResponse {
    data: RoundCheckInEntry[];
    pagination: Pagination;
}

export interface RoundParticipantsResponse {
    data: RoundQualifiedParticipant[];
    pagination: Pagination;
}

// ── Post round results response shape ─────────────────────────────────────

export interface PostRoundResultsResponse {
    message: string;
    data: BulkOperationResult;
    user_errors?: UserResultError[];
    team_errors?: TeamResultError[];
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

        async getRoundParticipant(
            eventId: string,
            roundNo: number,
            userId: string,
        ): Promise<RoundParticipant> {
            const { data } = await http.get<RoundParticipant>(
                `/ops/events/${eventId}/round/${roundNo}/participants`,
                {
                    params: { user_id: userId },
                },
            );
            return data;
        },

        async checkInRound(
            eventId: string,
            roundNo: number,
            userIds: string[],
            teamId: string | null
        ): Promise<{ message: string }> {
            const { data } = await http.post<{ message: string }>(
                `/ops/events/${eventId}/round/${roundNo}/check-in`,
                { user_ids: userIds, team_id: teamId }
            );
            return data;
        },

        async getRoundCheckIns(
            eventId: string,
            roundId: number | string,
            params: { from?: number; limit?: number } = {},
        ): Promise<RoundCheckInsResponse> {
            const { data } = await http.get<RoundCheckInsResponse>(
                `/events/${eventId}/rounds/${roundId}/checkins`,
                {
                    params: {
                        from: params.from ?? 0,
                        limit: params.limit ?? 10,
                    },
                },
            );
            return data;
        },

        async getRoundParticipants(
            eventId: string,
            roundNo: number | string,
            params: { from?: number; limit?: number } = {},
        ): Promise<RoundParticipantsResponse> {
            const { data } = await http.get<RoundParticipantsResponse>(
                `/events/${eventId}/rounds/${roundNo}/participants`,
                {
                    params: {
                        from: params.from ?? 0,
                        limit: params.limit ?? 10,
                    },
                },
            );
            return data;
        },

        async postRoundResults(
            eventId: string,
            roundNo: number | string,
            payload: AssignRoundResults,
        ): Promise<PostRoundResultsResponse> {
            const { data } = await http.post<PostRoundResultsResponse>(
                `/ops/events/${eventId}/rounds/${roundNo}/results`,
                payload,
            );
            return data;
        },
    };
}

export type EventsApi = ReturnType<typeof createEventsApi>;
