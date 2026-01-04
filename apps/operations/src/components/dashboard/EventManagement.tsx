import { useState } from "react";
import { Plus, Edit, Trash2, X } from "lucide-react";
import toast from "react-hot-toast";

interface Event {
    id: string;
    eventName: string;
    description: string;
    participantType: "solo" | "team";
    eventType: "tech" | "non-tech";
    maxPeopleAllowed: number;
    minTeamSize: number;
    maxTeamSize: number;
    venue: string;
    registrationStartTime: string;
    registrationEndTime: string;
    eventStartTime: string;
    eventEndTime: string;
}

const EventManagement = () => {
    const [events, setEvents] = useState<Event[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState<Event | null>(null);
    const [formData, setFormData] = useState<Omit<Event, "id">>({
        eventName: "",
        description: "",
        participantType: "solo",
        eventType: "tech",
        maxPeopleAllowed: 0,
        minTeamSize: 1,
        maxTeamSize: 1,
        venue: "",
        registrationStartTime: "",
        registrationEndTime: "",
        eventStartTime: "",
        eventEndTime: "",
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: name.includes("Size") || name === "maxPeopleAllowed" ? Number(value) : value,
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (editingEvent) {
            setEvents(events.map((event) => (event.id === editingEvent.id ? { ...formData, id: editingEvent.id } : event)));
            toast.success("Event updated successfully!");
        } else {
            const newEvent = { ...formData, id: Date.now().toString() };
            setEvents([...events, newEvent]);
            toast.success("Event created successfully!");
        }
        
        closeModal();
    };

    const handleEdit = (event: Event) => {
        setEditingEvent(event);
        setFormData(event);
        setIsModalOpen(true);
    };

    const handleDelete = (id: string) => {
        if (confirm("Are you sure you want to delete this event?")) {
            setEvents(events.filter((event) => event.id !== id));
            toast.success("Event deleted successfully!");
        }
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingEvent(null);
        setFormData({
            eventName: "",
            description: "",
            participantType: "solo",
            eventType: "tech",
            maxPeopleAllowed: 0,
            minTeamSize: 1,
            maxTeamSize: 1,
            venue: "",
            registrationStartTime: "",
            registrationEndTime: "",
            eventStartTime: "",
            eventEndTime: "",
        });
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
                            {events.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-zinc-500">
                                        No events found. Click "Add Event" to create one.
                                    </td>
                                </tr>
                            ) : (
                                events.map((event) => (
                                    <tr key={event.id} className="hover:bg-zinc-800/50">
                                        <td className="px-6 py-4 text-sm">{event.eventName}</td>
                                        <td className="px-6 py-4 text-sm">
                                            <span className="px-2 py-1 bg-zinc-800 rounded text-xs">
                                                {event.eventType}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm">
                                            <span className="px-2 py-1 bg-zinc-800 rounded text-xs">
                                                {event.participantType}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm">{event.venue}</td>
                                        <td className="px-6 py-4 text-sm">
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleEdit(event)}
                                                    className="p-2 hover:bg-zinc-700 rounded transition"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(event.id)}
                                                    className="p-2 hover:bg-red-900/20 text-red-400 rounded transition"
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
                                    name="eventName"
                                    value={formData.eventName}
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
                                        name="participantType"
                                        value={formData.participantType}
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
                                        <option value="tech">Tech</option>
                                        <option value="non-tech">Non-Tech</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">Max People</label>
                                    <input
                                        type="number"
                                        name="maxPeopleAllowed"
                                        value={formData.maxPeopleAllowed}
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
                                        value={formData.minTeamSize}
                                        onChange={handleInputChange}
                                        required
                                        min="1"
                                        className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-600"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">Max Team Size</label>
                                    <input
                                        type="number"
                                        name="maxTeamSize"
                                        value={formData.maxTeamSize}
                                        onChange={handleInputChange}
                                        required
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
                                        name="registrationStartTime"
                                        value={formData.registrationStartTime}
                                        onChange={handleInputChange}
                                        required
                                        className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-600"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">Registration End</label>
                                    <input
                                        type="datetime-local"
                                        name="registrationEndTime"
                                        value={formData.registrationEndTime}
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
                                        name="eventStartTime"
                                        value={formData.eventStartTime}
                                        onChange={handleInputChange}
                                        required
                                        className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-600"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">Event End</label>
                                    <input
                                        type="datetime-local"
                                        name="eventEndTime"
                                        value={formData.eventEndTime}
                                        onChange={handleInputChange}
                                        required
                                        className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-600"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-white text-zinc-900 rounded-lg hover:bg-zinc-200 transition font-semibold"
                                >
                                    {editingEvent ? "Update Event" : "Create Event"}
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
