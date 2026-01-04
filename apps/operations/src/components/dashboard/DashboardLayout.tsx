import { useState } from "react";
import { Menu, Home, Calendar, Users, UserStar, Briefcase } from "lucide-react";

interface DashboardLayoutProps {
    children: React.ReactNode;
    activeSection: string;
    setActiveSection: (section: string) => void;
}

const menuItems = [
    { id: "overview", name: "Overview", icon: Home },
    { id: "events", name: "Event Management", icon: Calendar },
    { id: "participants", name: "Participant Management", icon: Users },
    { id: "volunteers", name: "Volunteer Management", icon: UserStar },
    { id: "organizers", name: "Organizer Management", icon: Briefcase },
];

const DashboardLayout = ({ children, activeSection, setActiveSection }: DashboardLayoutProps) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100 font-geist">
            {/* Sidebar */}
            <aside
                className={`fixed top-0 left-0 h-full bg-zinc-900 border-r border-zinc-800 transition-all duration-300 z-50 ${
                    isSidebarOpen ? "w-64" : "w-0"
                }`}
            >
                <div className={`${isSidebarOpen ? "block" : "hidden"} p-6`}>
                    <div className="mb-8">
                        <h1 className="font-inst text-2xl font-bold">Admin Panel</h1>
                        <p className="text-sm text-zinc-500">Melinia Operations</p>
                    </div>
                    <nav className="space-y-2">
                        {menuItems.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => setActiveSection(item.id)}
                                className={`w-full flex items-center gap-3 px-4 py-3 text-sm rounded-lg transition-colors ${
                                    activeSection === item.id
                                        ? "bg-zinc-700 text-zinc-100"
                                        : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
                                }`}
                            >
                                <item.icon size={20} />
                                <span>{item.name}</span>
                            </button>
                        ))}
                    </nav>
                </div>
            </aside>

            {/* Main Content */}
            <div className={`transition-all duration-300 ${isSidebarOpen ? "ml-64" : "ml-0"}`}>
                {/* Header */}
                <header className="sticky top-0 bg-zinc-900/95 backdrop-blur border-b border-zinc-800 px-6 py-4 z-40">
                    <div className="flex items-center justify-between">
                        <button
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
                        >
                            <Menu size={24} />
                        </button>
                        <div className="flex items-center gap-4">
                            <span className="text-sm text-zinc-400">Welcome, Admin</span>
                        </div>
                    </div>
                </header>

                {/* Content */}
                <main className="p-6">{children}</main>
            </div>
        </div>
    );
};

export default DashboardLayout;
