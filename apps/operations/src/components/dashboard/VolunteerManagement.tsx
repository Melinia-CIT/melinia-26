import { useState } from "react";
import { Plus, Edit, Trash2, X } from "lucide-react";
import toast from "react-hot-toast";

interface Volunteer {
    id: string;
    name: string;
    email: string;
    eventName: string;
    assignedAt: string;
    assignedBy: string;
}

const VolunteerManagement = () => {
    const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingVolunteer, setEditingVolunteer] = useState<Volunteer | null>(null);
    const [formData, setFormData] = useState<Omit<Volunteer, "id">>({
        name: "",
        email: "",
        eventName: "",
        assignedAt: "",
        assignedBy: "",
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (editingVolunteer) {
            setVolunteers(
                volunteers.map((v) => (v.id === editingVolunteer.id ? { ...formData, id: editingVolunteer.id } : v))
            );
            toast.success("Volunteer updated successfully!");
        } else {
            const newVolunteer = { ...formData, id: Date.now().toString() };
            setVolunteers([...volunteers, newVolunteer]);
            toast.success("Volunteer added successfully!");
        }

        closeModal();
    };

    const handleEdit = (volunteer: Volunteer) => {
        setEditingVolunteer(volunteer);
        setFormData(volunteer);
        setIsModalOpen(true);
    };

    const handleDelete = (id: string) => {
        if (confirm("Are you sure you want to delete this volunteer?")) {
            setVolunteers(volunteers.filter((v) => v.id !== id));
            toast.success("Volunteer deleted successfully!");
        }
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingVolunteer(null);
        setFormData({
            name: "",
            email: "",
            eventName: "",
            assignedAt: "",
            assignedBy: "",
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="font-inst text-2xl font-bold">Volunteer Management</h2>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-white text-zinc-900 rounded-lg hover:bg-zinc-200 transition font-semibold"
                >
                    <Plus size={20} />
                    Add Volunteer
                </button>
            </div>

            {/* Volunteers Table */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-zinc-800">
                            <tr>
                                <th className="px-6 py-3 text-left text-sm font-semibold">Name</th>
                                <th className="px-6 py-3 text-left text-sm font-semibold">Email</th>
                                <th className="px-6 py-3 text-left text-sm font-semibold">Event Name</th>
                                <th className="px-6 py-3 text-left text-sm font-semibold">Assigned At</th>
                                <th className="px-6 py-3 text-left text-sm font-semibold">Assigned By</th>
                                <th className="px-6 py-3 text-left text-sm font-semibold">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800">
                            {volunteers.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-zinc-500">
                                        No volunteers found. Click "Add Volunteer" to create one.
                                    </td>
                                </tr>
                            ) : (
                                volunteers.map((volunteer) => (
                                    <tr key={volunteer.id} className="hover:bg-zinc-800/50">
                                        <td className="px-6 py-4 text-sm">{volunteer.name}</td>
                                        <td className="px-6 py-4 text-sm">{volunteer.email}</td>
                                        <td className="px-6 py-4 text-sm">
                                            <span className="px-2 py-1 bg-zinc-800 rounded text-xs">
                                                {volunteer.eventName}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm">
                                            {new Date(volunteer.assignedAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-sm">{volunteer.assignedBy}</td>
                                        <td className="px-6 py-4 text-sm">
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleEdit(volunteer)}
                                                    className="p-2 hover:bg-zinc-700 rounded transition"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(volunteer.id)}
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
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-lg">
                        <div className="border-b border-zinc-800 px-6 py-4 flex justify-between items-center">
                            <h3 className="font-inst text-xl font-bold">
                                {editingVolunteer ? "Edit Volunteer" : "Add New Volunteer"}
                            </h3>
                            <button onClick={closeModal} className="p-2 hover:bg-zinc-800 rounded transition">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">Name</label>
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
                                <label className="block text-sm font-medium mb-2">Email</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-600"
                                />
                            </div>

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
                                <label className="block text-sm font-medium mb-2">Assigned At</label>
                                <input
                                    type="datetime-local"
                                    name="assignedAt"
                                    value={formData.assignedAt}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-600"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Assigned By</label>
                                <input
                                    type="text"
                                    name="assignedBy"
                                    value={formData.assignedBy}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-600"
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-white text-zinc-900 rounded-lg hover:bg-zinc-200 transition font-semibold"
                                >
                                    {editingVolunteer ? "Update Volunteer" : "Add Volunteer"}
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

export default VolunteerManagement;
