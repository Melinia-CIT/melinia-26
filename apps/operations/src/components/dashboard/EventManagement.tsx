import { useState } from "react";
import { Plus, Edit, Trash2, X } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
    fetchEvents,
    createEvent as createEventRequest,
    updateEvent as updateEventRequest,
    deleteEvent as deleteEventRequest,
} from "../../services/events";
import { type Event as ApiEvent } from "@melinia/shared";

type FormState = {
    name: string;
    description: string;
    participationType: "solo" | "team";
    eventType: "technical" | "non-technical" | "flagship";
    maxAllowed: number;
    minTeamSize: number | null;
    maxTeamSize: number | null;
    venue: string;
    startTime: string;
    endTime: string;
    registrationStart: string;
    registrationEnd: string;
};

const emptyForm: FormState = {
    name: "",
    description: "",
    participationType: "solo",
    eventType: "technical",
    maxAllowed: 0,
    minTeamSize: 1,
    maxTeamSize: 1,
    venue: "",
    startTime: "",
    endTime: "",
    registrationStart: "",
    registrationEnd: "",
};

const formatDateTimeLocal = (value: string | Date) => {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 16);
};

const EventManagement = () => {
    const queryClient = useQueryClient();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState<ApiEvent | null>(null);
    const [formData, setFormData] = useState<FormState>(emptyForm);

    const getUserRole = () => localStorage.getItem("userRole");

    const ensureAdminAuth = () => {
        const token = localStorage.getItem("accessToken");
        const role = getUserRole();
        if (!token || role !== "admin") {
            toast.error("Admin access required. Please log in with admin credentials.");
            return false;
        }
        return true;
    };

    const ensureOrganizerOrAdminAuth = () => {
        const token = localStorage.getItem("accessToken");
        const role = getUserRole();
        if (!token) {
            toast.error("Please log in to perform this action.");
            return false;
        }
        if (role !== "admin" && role !== "organizer") {
            toast.error("You must be an admin or organizer to edit events.");
            return false;
        }
        return true;
    };

    const { data: events = [], isLoading: isEventsLoading } = useQuery({
        queryKey: ["events"],
        queryFn: fetchEvents,
    });

    const normalizePayload = (payload: FormState, includeCreatedBy: boolean = false) => {
        const normalized = {
            name: payload.name,
            description: payload.description,
            participationType: payload.participationType,
            eventType: payload.eventType,
            maxAllowed: Number(payload.maxAllowed),
            minTeamSize: payload.minTeamSize ? Number(payload.minTeamSize) : null,
            maxTeamSize: payload.maxTeamSize ? Number(payload.maxTeamSize) : null,
            venue: payload.venue,
            startTime: new Date(payload.startTime).toISOString(),
            endTime: new Date(payload.endTime).toISOString(),
            registrationStart: new Date(payload.registrationStart).toISOString(),
            registrationEnd: new Date(payload.registrationEnd).toISOString(),
        };
        
        if (includeCreatedBy) {
            const userEmail = localStorage.getItem('userEmail');
            return { ...normalized, createdBy: userEmail };
        }
        
        return normalized;
    };

    const createMutation = useMutation({
        mutationFn: createEventRequest,
        onSuccess: () => {
            toast.success("Event created successfully");
            queryClient.invalidateQueries({ queryKey: ["events"] });
            closeModal();
        },
        onError: (err: any) => {
            console.error("Create event failed", err);
            const message = err?.response?.data?.message ?? "Failed to create event";
            toast.error(message);
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, payload }: { id: string; payload: FormState }) =>
            updateEventRequest(id, normalizePayload(payload)),
        onSuccess: () => {
            toast.success("Event updated successfully");
            queryClient.invalidateQueries({ queryKey: ["events"] });
            closeModal();
        },
        onError: (err: any) => {
            console.error("Update event failed", err);
            const message = err?.response?.data?.message ?? "Failed to update event";
            toast.error(message);
        },
    });

    const deleteMutation = useMutation({
        mutationFn: deleteEventRequest,
        onSuccess: () => {
            toast.success("Event deleted successfully");
            queryClient.invalidateQueries({ queryKey: ["events"] });
        },
        onError: (err: any) => {
            console.error("Delete event failed", err);
            const message = err?.response?.data?.message ?? "Failed to delete event";
            toast.error(message);
        },
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        const numericFields = ["maxAllowed", "minTeamSize", "maxTeamSize"];
        setFormData((prev) => ({
            ...prev,
            [name]: numericFields.includes(name) ? (value === "" ? null : Number(value)) : value,
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (editingEvent) {
            // Edit requires admin or organizer
            if (!ensureOrganizerOrAdminAuth()) return;
            updateMutation.mutate({ id: editingEvent.id, payload: normalizePayload(formData, false) });
        } else {
            // Create requires admin only
            if (!ensureAdminAuth()) return;
            createMutation.mutate(normalizePayload(formData, true));
        }
    };

    const handleEdit = (event: ApiEvent) => {
        setEditingEvent(event);
        setFormData({
            name: event.name,
            description: event.description,
            participationType: event.participationType,
            eventType: event.eventType,
            maxAllowed: event.maxAllowed,
            minTeamSize: event.minTeamSize ?? null,
            maxTeamSize: event.maxTeamSize ?? null,
            venue: event.venue,
            startTime: formatDateTimeLocal(event.startTime),
            endTime: formatDateTimeLocal(event.endTime),
            registrationStart: formatDateTimeLocal(event.registrationStart),
            registrationEnd: formatDateTimeLocal(event.registrationEnd),
        });
        setIsModalOpen(true);
    };

    const handleDelete = (id: string) => {
        // Delete requires admin only
        if (!ensureAdminAuth()) return;
        if (confirm("Are you sure you want to delete this event?")) {
            deleteMutation.mutate(id);
        }
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingEvent(null);
        setFormData(emptyForm);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="font-inst text-2xl font-bold">Event Management</h2>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-white text-zinc-900 rounded-lg hover:bg-zinc-200 transition font-semibold"
                >
                    <Plus size={20} />
                    Add Event
                </button>
            </div>

            {/* Events Table */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-zinc-800">
                            <tr>
                                <th className="px-6 py-3 text-left text-sm font-semibold">Event Name</th>
                                <th className="px-6 py-3 text-left text-sm font-semibold">Type</th>
                                <th className="px-6 py-3 text-left text-sm font-semibold">Participant</th>
                                <th className="px-6 py-3 text-left text-sm font-semibold">Venue</th>
                                <th className="px-6 py-3 text-left text-sm font-semibold">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800">
                            {isEventsLoading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-zinc-500">
                                        Loading events...
                                    </td>
                                </tr>
                            ) : events.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-zinc-500">
                                        No events found. Click "Add Event" to create one.
                                    </td>
                                </tr>
                            ) : (
                                events.map((event) => (
                                    <tr key={event.id} className="hover:bg-zinc-800/50">
                                        <td className="px-6 py-4 text-sm">{event.name}</td>
                                        <td className="px-6 py-4 text-sm">
                                            <span className="px-2 py-1 bg-zinc-800 rounded text-xs capitalize">
                                                {event.eventType.replace("-", " ")}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm">
                                            <span className="px-2 py-1 bg-zinc-800 rounded text-xs capitalize">
                                                {event.participationType}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm">{event.venue}</td>
                                        <td className="px-6 py-4 text-sm">
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleEdit(event)}
                                                    className="p-2 hover:bg-zinc-700 rounded transition"
                                                    disabled={deleteMutation.isPending}
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(event.id)}
                                                    className="p-2 hover:bg-red-900/20 text-red-400 rounded transition disabled:opacity-50"
                                                    disabled={deleteMutation.isPending}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-zinc-900 border-b border-zinc-800 px-6 py-4 flex justify-between items-center">
                            <h3 className="font-inst text-xl font-bold">
                                {editingEvent ? "Edit Event" : "Add New Event"}
                            </h3>
                            <button onClick={closeModal} className="p-2 hover:bg-zinc-800 rounded transition">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">Event Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-600"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Description</label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    required
                                    rows={3}
                                    className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-600"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">Participant Type</label>
                                    <select
                                        name="participationType"
                                        value={formData.participationType}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-600"
                                    >
                                        <option value="solo">Solo</option>
                                        <option value="team">Team</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">Event Type</label>
                                    <select
                                        name="eventType"
                                        value={formData.eventType}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-600"
                                    >
                                        <option value="technical">Technical</option>
                                        <option value="non-technical">Non-Technical</option>
                                        <option value="flagship">Flagship</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">Max People</label>
                                    <input
                                        type="number"
                                        name="maxAllowed"
                                        value={formData.maxAllowed ?? ""}
                                        onChange={handleInputChange}
                                        required
                                        min="1"
                                        className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-600"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">Min Team Size</label>
                                    <input
                                        type="number"
                                        name="minTeamSize"
                                        value={formData.minTeamSize ?? ""}
                                        onChange={handleInputChange}
                                        min="1"
                                        className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-600"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">Max Team Size</label>
                                    <input
                                        type="number"
                                        name="maxTeamSize"
                                        value={formData.maxTeamSize ?? ""}
                                        onChange={handleInputChange}
                                        min="1"
                                        className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-600"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Venue</label>
                                <input
                                    type="text"
                                    name="venue"
                                    value={formData.venue}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-600"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">Registration Start</label>
                                    <input
                                        type="datetime-local"
                                        name="registrationStart"
                                        value={formData.registrationStart}
                                        onChange={handleInputChange}
                                        required
                                        className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-600"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">Registration End</label>
                                    <input
                                        type="datetime-local"
                                        name="registrationEnd"
                                        value={formData.registrationEnd}
                                        onChange={handleInputChange}
                                        required
                                        className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-600"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">Event Start</label>
                                    <input
                                        type="datetime-local"
                                        name="startTime"
                                        value={formData.startTime}
                                        onChange={handleInputChange}
                                        required
                                        className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-600"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">Event End</label>
                                    <input
                                        type="datetime-local"
                                        name="endTime"
                                        value={formData.endTime}
                                        onChange={handleInputChange}
                                        required
                                        className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-600"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="submit"
                                    disabled={createMutation.isPending || updateMutation.isPending}
                                    className="flex-1 px-4 py-2 bg-white text-zinc-900 rounded-lg hover:bg-zinc-200 transition font-semibold disabled:opacity-60"
                                >
                                    {editingEvent
                                        ? updateMutation.isPending
                                            ? "Updating..."
                                            : "Update Event"
                                        : createMutation.isPending
                                            ? "Creating..."
                                            : "Create Event"}
                                </button>
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="px-4 py-2 bg-zinc-800 rounded-lg hover:bg-zinc-700 transition"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EventManagement;
