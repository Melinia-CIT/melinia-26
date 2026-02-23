import { Xmark, Group, User } from "iconoir-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { AxiosError } from "axios";
import type { RoundParticipant } from "@/api/events";
import { Button } from "@/ui/Button";

export interface RoundCheckInPopupProps {
    open: boolean;
    onClose: () => void;
    participant: RoundParticipant | null;
    isLoading: boolean;
    error: Error | null;
    onCheckIn: (data: { userIds: string[]; teamId: string | null }) => void;
    isCheckingIn: boolean;
    checkInSuccess: boolean;
    checkInError: string | null;
}

export function RoundCheckInPopup({
    open,
    onClose,
    participant,
    isLoading,
    error,
    onCheckIn,
    isCheckingIn,
    checkInSuccess,
    checkInError,
}: RoundCheckInPopupProps) {
    const [removedUserIds, setRemovedUserIds] = useState<string[]>([]);

    useEffect(() => {
        if (!open) {
            setRemovedUserIds([]);
        }
    }, [open]);

    const handleToggleRemove = (userId: string) => {
        setRemovedUserIds(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
    };

    useEffect(() => {
        if (!open || !checkInSuccess) return;
        const timeoutId = window.setTimeout(() => {
            onClose();
        }, 3000);
        return () => window.clearTimeout(timeoutId);
    }, [open, checkInSuccess, onClose]);

    if (!open) return null;

    return createPortal(
        <div className="fixed inset-0 bg-black/90 z-[9999] flex items-center justify-center p-2 sm:p-4 min-h-[100dvh]" style={{ height: '100dvh' }}>
            <div className="w-full max-w-4xl max-h-[calc(100dvh-1rem)] bg-neutral-950 border border-neutral-800 flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-4 md:px-6 py-4 border-b border-neutral-800">
                    <div className="space-y-1">
                        <h3 className="text-lg md:text-xl font-semibold text-white">
                            Round Check-in
                        </h3>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 text-neutral-400 hover:text-white transition-colors duration-150"
                        aria-label="Close"
                    >
                        <Xmark className="w-6 h-6" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-4 md:p-6 space-y-6 flex-1 overflow-y-auto">
                    {/* Success */}
                    {checkInSuccess && (
                        <div className="p-4 bg-green-950/50 border border-green-900 text-green-500 text-sm">
                            ✓ Successfully checked in!
                        </div>
                    )}

                    {/* Loading or Errors */}
                    {isLoading && (
                        <div className="text-sm text-neutral-500">Loading participant details...</div>
                    )}

                    {error && (
                        <div className="p-4 bg-red-950/50 border border-red-900 text-red-500 text-sm">
                            Failed to load participant: {(error as AxiosError<{ message?: string }>)?.response?.data?.message || error.message}
                        </div>
                    )}

                    {checkInError && (
                        <div className="p-4 bg-red-950/50 border border-red-900 text-red-500 text-sm">
                            {checkInError}
                        </div>
                    )}

                    {/* Participant details */}
                    {participant && !isLoading && !error && (
                        <div className="space-y-4">
                            {participant.type === "TEAM" ? (() => {
                                const activeUserIds = (participant.members ?? [])
                                    .map(m => m.user_id)
                                    .filter(id => !removedUserIds.includes(id));

                                return (
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2">
                                            <Group className="w-5 h-5 text-neutral-500" />
                                            <h4 className="text-lg font-bold text-white uppercase tracking-wider">{participant.team_name}</h4>
                                            <span className="text-xs text-neutral-600 font-mono ml-2">ID: {participant.team_id}</span>
                                        </div>

                                        <div className="space-y-3">
                                            {participant.members?.map(member => {
                                                const isRemoved = removedUserIds.includes(member.user_id);
                                                return (
                                                    <div key={member.user_id} className={`p-4 border flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all duration-200 ${isRemoved ? 'bg-neutral-950/50 border-neutral-900 opacity-50' : 'bg-neutral-900 border-neutral-800'}`}>
                                                        <div className="space-y-1">
                                                            <p className={`font-semibold text-sm transition-colors ${isRemoved ? 'text-neutral-500 line-through' : 'text-white'}`}>{member.first_name} {member.last_name}</p>
                                                            <p className="text-xs text-neutral-400 font-mono">{member.user_id} • {member.email}</p>
                                                            <div className="flex gap-2 mt-1.5">
                                                                <span className={`inline-flex items-center gap-1.5 text-[10px] px-2 py-0.5 border uppercase font-bold tracking-wider ${member.status?.toUpperCase() === 'ACTIVE' ? 'text-emerald-400 border-emerald-800 bg-emerald-950/40' : 'border-neutral-700 bg-neutral-800 text-neutral-400'}`}>
                                                                    {member.status?.toUpperCase() === 'ACTIVE' && <span className="w-1 h-1 rounded-full bg-emerald-400" />}
                                                                    {member.status}
                                                                </span>
                                                                <span className={`text-[10px] px-2 py-0.5 border uppercase font-bold tracking-wider ${member.payment_status?.toUpperCase() === 'PAID' ? 'text-emerald-400 border-emerald-800 bg-emerald-950/40' : 'border-neutral-700 bg-neutral-800 text-neutral-400'}`}>
                                                                    {member.payment_status}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <Button
                                                            variant="secondary"
                                                            onClick={() => handleToggleRemove(member.user_id)}
                                                            disabled={isCheckingIn || checkInSuccess}
                                                            className="shrink-0"
                                                        >
                                                            {isRemoved ? "Undo Remove" : "Remove"}
                                                        </Button>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                        <div className="pt-2">
                                            <Button
                                                variant="primary"
                                                onClick={() => onCheckIn({ userIds: activeUserIds, teamId: participant.team_id ?? null })}
                                                disabled={isCheckingIn || checkInSuccess || activeUserIds.length === 0}
                                                className="w-full py-3"
                                            >
                                                {isCheckingIn ? "Checking in..." : `Check In ${activeUserIds.length} Member${activeUserIds.length === 1 ? '' : 's'}`}
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })() : (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2">
                                        <User className="w-5 h-5 text-neutral-500" />
                                        <h4 className="text-lg font-bold text-white uppercase tracking-wider">Solo Participant</h4>
                                        <span className="text-xs text-neutral-600 font-mono ml-2">ID: {participant.user_id}</span>
                                    </div>
                                    <div className="p-4 bg-neutral-900 border border-neutral-800 flex items-center justify-between">
                                        <div className="space-y-1">
                                            <p className="font-semibold text-white text-sm">{participant.first_name} {participant.last_name}</p>
                                            <p className="text-xs text-neutral-400 font-mono">{participant.user_id}</p>
                                        </div>
                                        <Button
                                            variant="primary"
                                            onClick={() => onCheckIn({ userIds: [participant.user_id ?? ""], teamId: null })}
                                            disabled={isCheckingIn || checkInSuccess}
                                        >
                                            {isCheckingIn ? "Checking in..." : "Check In"}
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

            </div>
        </div>,
        document.body
    );
}
