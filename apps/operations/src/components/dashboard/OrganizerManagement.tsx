import { useState } from "react";
import { Plus, Edit, Trash2, X } from "lucide-react";
import toast from "react-hot-toast";

interface Organizer {
    id: string;
    name: string;
    email: string;
    phone: string;
    role: string;
    department: string;
    joinedAt: string;
}

const OrganizerManagement = () => {
    const [organizers, setOrganizers] = useState<Organizer[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingOrganizer, setEditingOrganizer] = useState<Organizer | null>(null);
    const [formData, setFormData] = useState<Omit<Organizer, "id">>({
        name: "",
        email: "",
        phone: "",
        role: "",
        department: "",
        joinedAt: "",
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (editingOrganizer) {
            setOrganizers(
                organizers.map((o) => (o.id === editingOrganizer.id ? { ...formData, id: editingOrganizer.id } : o))
            );
            toast.success("Organizer updated successfully!");
        } else {
            const newOrganizer = { ...formData, id: Date.now().toString() };
            setOrganizers([...organizers, newOrganizer]);
            toast.success("Organizer added successfully!");
        }

        closeModal();
    };

    const handleEdit = (organizer: Organizer) => {
        setEditingOrganizer(organizer);
        setFormData(organizer);
        setIsModalOpen(true);
    };

    const handleDelete = (id: string) => {
        if (confirm("Are you sure you want to delete this organizer?")) {
            setOrganizers(organizers.filter((o) => o.id !== id));
            toast.success("Organizer deleted successfully!");
        }
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingOrganizer(null);
        setFormData({
            name: "",
            email: "",
            phone: "",
            role: "",
            department: "",
            joinedAt: "",
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="font-inst text-2xl font-bold">Organizer Management</h2>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-white text-zinc-900 rounded-lg hover:bg-zinc-200 transition font-semibold"
                >
                    <Plus size={20} />
                    Add Organizer
                </button>
            </div>

            {/* Organizers Table */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-zinc-800">
                            <tr>
                                <th className="px-6 py-3 text-left text-sm font-semibold">Name</th>
                                <th className="px-6 py-3 text-left text-sm font-semibold">Email</th>
                                <th className="px-6 py-3 text-left text-sm font-semibold">Phone</th>
                                <th className="px-6 py-3 text-left text-sm font-semibold">Role</th>
                                <th className="px-6 py-3 text-left text-sm font-semibold">Department</th>
                                <th className="px-6 py-3 text-left text-sm font-semibold">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800">
                            {organizers.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-zinc-500">
                                        No organizers found. Click "Add Organizer" to create one.
                                    </td>
                                </tr>
                            ) : (
                                organizers.map((organizer) => (
                                    <tr key={organizer.id} className="hover:bg-zinc-800/50">
                                        <td className="px-6 py-4 text-sm">{organizer.name}</td>
                                        <td className="px-6 py-4 text-sm">{organizer.email}</td>
                                        <td className="px-6 py-4 text-sm">{organizer.phone}</td>
                                        <td className="px-6 py-4 text-sm">
                                            <span className="px-2 py-1 bg-zinc-800 rounded text-xs">
                                                {organizer.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm">{organizer.department}</td>
                                        <td className="px-6 py-4 text-sm">
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleEdit(organizer)}
                                                    className="p-2 hover:bg-zinc-700 rounded transition"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(organizer.id)}
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
                                {editingOrganizer ? "Edit Organizer" : "Add New Organizer"}
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
                                <label className="block text-sm font-medium mb-2">Phone</label>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-600"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Role</label>
                                <input
                                    type="text"
                                    name="role"
                                    value={formData.role}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-600"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Department</label>
                                <input
                                    type="text"
                                    name="department"
                                    value={formData.department}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-600"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Joined At</label>
                                <input
                                    type="date"
                                    name="joinedAt"
                                    value={formData.joinedAt}
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
                                    {editingOrganizer ? "Update Organizer" : "Add Organizer"}
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

export default OrganizerManagement;
