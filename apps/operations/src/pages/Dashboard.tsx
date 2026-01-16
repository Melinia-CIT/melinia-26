import { useState } from "react";
import DashboardLayout from "../components/dashboard/DashboardLayout";
import EventManagement from "../components/dashboard/EventManagement";
import ParticipantManagement from "../components/dashboard/ParticipantManagement";
import VolunteerManagement from "../components/dashboard/VolunteerManagement";
import OrganizerManagement from "../components/dashboard/OrganizerManagement";

const Dashboard = () => {
    const [activeSection, setActiveSection] = useState("overview");

    const renderContent = () => {
        switch (activeSection) {
            case "events":
                return <EventManagement />;
            case "participants":
                return <ParticipantManagement />;
            case "volunteers":
                return <VolunteerManagement />;
            case "organizers":
                return <OrganizerManagement />;
            default:
                return (
                    <div className="space-y-6">
                        <h1 className="font-inst text-3xl font-bold">Dashboard Overview</h1>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                                <h3 className="text-zinc-400 text-sm mb-2">Total Events</h3>
                                <p className="text-3xl font-bold">12</p>
                            </div>
                            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                                <h3 className="text-zinc-400 text-sm mb-2">Participants</h3>
                                <p className="text-3xl font-bold">245</p>
                            </div>
                            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                                <h3 className="text-zinc-400 text-sm mb-2">Volunteers</h3>
                                <p className="text-3xl font-bold">18</p>
                            </div>
                            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                                <h3 className="text-zinc-400 text-sm mb-2">Organizers</h3>
                                <p className="text-3xl font-bold">5</p>
                            </div>
                        </div>
                    </div>
                );
        }
    };

    return (
        <DashboardLayout activeSection={activeSection} setActiveSection={setActiveSection}>
            {renderContent()}
        </DashboardLayout>
    );
};

export default Dashboard;
