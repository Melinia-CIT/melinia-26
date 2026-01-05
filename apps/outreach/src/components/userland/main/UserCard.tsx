import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import QRCode from "./QRCode";
import { SystemRestart, User, Mail, Phone, OpenBook, GraduationCap, Building, Xmark } from "iconoir-react";
import api from "../../../services/api";

const Spinner = () => (
    <div className="flex flex-col items-center justify-center gap-4">
        <SystemRestart className="animate-spin text-zinc-500" width={48} height={48} strokeWidth={1.5} />
        <p className="text-zinc-500 animate-pulse">Loading profile...</p>
    </div>
);

const fetchUserMe = async () => {
    const { data } = await api.get("/users/me");
    return data;
};

const UserCard = () => {
    const { data: user, isLoading, isError, error } = useQuery({
        queryKey: ["userMe"],
        queryFn: fetchUserMe,
        retry: 1,
    });

    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape") setIsModalOpen(false);
        };
        window.addEventListener("keydown", handleEscape);
        return () => window.removeEventListener("keydown", handleEscape);
    }, []);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-zinc-950 text-zinc-100 flex justify-center items-center font-geist">
                <Spinner />
            </div>
        );
    }

    if (isError) {
        return (
            <div className="min-h-screen bg-zinc-950 text-zinc-100 flex justify-center items-center px-4 font-geist">
                <div className="text-center">
                    <p className="text-red-400 font-medium mb-2">Failed to load profile</p>
                    <p className="text-zinc-500 text-sm">{(error as Error).message}</p>
                </div>
            </div>
        );
    }

    if (!user) return null;

    return (
        <>
            {isModalOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-200"
                    onClick={() => setIsModalOpen(false)}
                >
                    <div
                        className="bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl p-16 max-w-[400px] w-full flex flex-col items-center relative animate-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={() => setIsModalOpen(false)}
                            className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors bg-zinc-950/50 rounded-full p-1"
                        >
                            <Xmark width={24} height={24} strokeWidth={2} />
                        </button>

                        <div className="mb-6 rounded-xl overflow-hidden">
                            <QRCode
                                userId={user.id}
                                userName={`${user.profile?.first_name} ${user.profile?.last_name}`}
                                logoUrl="https://cdn.melinia.in/melinia-qr-embed.png"
                                size={280}
                            />
                        </div>

                        <div className="w-full text-center space-y-2">
                            <p className="text-xl text-white font-geist bg-zinc-950 py-3 px-4 rounded-xl border border-zinc-800/50 select-all tracking-wide shadow-inner">
                                {user.id}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Card */}
            <div className={`bg-zinc-950 text-zinc-100 flex items-center justify-center px-4 font-geist transition-all duration-300 ${isModalOpen ? 'blur-[2px] pointer-events-none' : ''}`}>
                <div className="w-full max-w-4xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-xl shadow-zinc-900/50 p-6 sm:p-10 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-zinc-800/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                    <div className="flex flex-col md:flex-row gap-8 items-center justify-center relative z-10">
                        <div className="flex flex-col items-center justify-center shrink-0 w-full md:w-auto">
                            <div
                                onClick={() => setIsModalOpen(true)}
                                className="group p-1 bg-zinc-800/50 rounded-xl border border-zinc-700 shadow-inner cursor-pointer hover:border-zinc-500 hover:bg-zinc-800 transition-all duration-300"
                            >
                                <div className="w-[60vw] h-[60vw] max-w-[256px] max-h-[256px] flex items-center justify-center bg-zinc-950 rounded-lg overflow-hidden relative">
                                    {/* Hint Overlay */}
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300">
                                        <span className="text-white text-xs font-medium uppercase tracking-widest border border-white/20 px-3 py-1 rounded-full backdrop-blur-md">
                                            Tap to Scan
                                        </span>
                                    </div>

                                    <QRCode
                                        userId={user.id}
                                        userName={`${user.profile?.first_name} ${user.profile?.last_name}`}
                                        logoUrl="https://cdn.melinia.in/melinia-qr-embed.png"
                                        size={256}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 w-full space-y-8">
                            <div className="border-b border-zinc-800 pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
                                <div>
                                    <h1 className="text-3xl font-bold text-white tracking-tight font-inst">
                                        {user.profile?.first_name} {user.profile?.last_name}
                                    </h1>
                                    <p className="text-zinc-400 mt-1 text-sm flex items-center gap-1">
                                        <User width={14} height={14} /> {user.role}
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-6">
                                <DetailRow icon={<Building />} label="College" value={user.profile?.college || "N/A"} />
                                <DetailRow icon={<OpenBook />} label="Degree" value={user.profile?.degree || "N/A"} />
                                <DetailRow icon={<GraduationCap />} label="Year" value={user.profile?.year?.toString() || "N/A"} />
                                <DetailRow icon={<Phone />} label="Phone Number" value={user.ph_no || "N/A"} />
                                <div className="sm:col-span-2">
                                    <DetailRow icon={<Mail />} label="Email" value={user.email} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

interface DetailRowProps {
    icon: React.ReactNode;
    label: string;
    value: string;
}

const DetailRow = ({ icon, label, value }: DetailRowProps) => {
    return (
        <div className="group flex flex-col gap-1.5">
            <div className="flex items-center gap-2 text-zinc-500 text-xs font-semibold uppercase tracking-wider">
                {icon}
                <span>{label}</span>
            </div>
            <div className="text-zinc-100 text-base font-medium pl-6 group-hover:text-white transition-colors">
                {value}
            </div>
        </div>
    );
};

export default UserCard;
