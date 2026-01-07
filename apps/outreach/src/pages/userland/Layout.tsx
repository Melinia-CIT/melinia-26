import { Outlet } from "react-router-dom";
import Navigator from "../../components/userland/Navigator";
import { useQuery } from "@tanstack/react-query";
import Profile from "./Profile";
import api from "../../services/api";


const AppLayout = () => {
    const { data: userData, isLoading } = useQuery({
        queryKey: ["userMe"],
        queryFn: async () => {
            const response = await api.get("/users/me");
            return response.data;
        },
        staleTime: 5 * 60 * 1000,
    });

    const showProfileModal = !isLoading && userData && !userData.profile_completed;

    return (
        <div className="min-h-screen bg-zinc-950 text-white relative overflow-hidden inset-0 fixed">
            <Navigator />

            <main className="px-6 md:pl-48 md:pr-8 pb-8 pt-20 md:pt-6 pb-4 transition-all duration-300 relative z-0">
                <Outlet />
            </main>

            {showProfileModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 font-geist">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                    <div className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300">

                        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/50">
                            <h2 className="text-lg font-semibold text-white font-inst">Complete Your Profile</h2>
                            <span className="text-xs text-zinc-400">Required</span>
                        </div>

                        <div className="p-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
                            <Profile initialData={userData} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AppLayout;
