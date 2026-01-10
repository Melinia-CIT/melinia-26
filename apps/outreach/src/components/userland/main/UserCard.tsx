import { useState, useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import QRCode from "./QRCode"
import {
    User,
    Mail,
    Phone,
    OpenBook,
    GraduationCap,
    Building,
    Xmark,
    CheckCircle,
    InfoCircle,
    Refresh,
} from "iconoir-react"
import { paymentService } from "../../../services/payment"
import { ChevronDown } from "lucide-react";
import api from "../../../services/api";

const PreloaderCard = () => {
    return (
        <div className="w-full max-w-4xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-xl shadow-zinc-900/50 relative overflow-hidden p-6 sm:p-10">
            {/* Ambient background glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-zinc-800/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

            <div className="flex flex-col md:flex-row gap-8 items-start relative z-10">
                <div className="flex flex-col items-center shrink-0 w-full md:w-auto md:pr-8 gap-6">
                    {/* Shining Image Placeholder */}
                    <div className="relative w-[60vw] h-[60vw] max-w-[256px] max-h-[256px] bg-zinc-800/50 rounded-lg overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent" />

                    <div className="relative w-3/4 h-6 bg-zinc-800/50 rounded md:hidden overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent" />
                </div>

                <div className="hidden md:flex flex-1 flex-col space-y-8 border-l border-zinc-800/50 pl-8 w-full">
                    <div className="border-b border-zinc-800 pb-6 space-y-4">
                        <div className="relative w-1/2 h-8 bg-zinc-800/50 rounded overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent" />
                        <div className="relative w-1/3 h-4 bg-zinc-800/30 rounded overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent" />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-6">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className={`flex flex-col gap-2 ${i === 4 ? 'sm:col-span-2' : ''}`}>
                                <div className="relative w-12 h-3 bg-zinc-800/30 rounded overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent" />
                                <div className="relative w-full h-5 bg-zinc-800/50 rounded overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};


const fetchUserMe = async () => {
    const { data } = await api.get("/users/me")
    return data
}

const UserCard = () => {
    const {
        data: user,
        isLoading,
        isError,
        error,
    } = useQuery({
        queryKey: ["userMe"],
        queryFn: fetchUserMe,
        staleTime: 5 * 60 * 1000
    });

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);

    const { data: paymentStatus } = useQuery({
        queryKey: ["paymentStatus"],
        queryFn: paymentService.getPaymentStatus,
        retry: false,
    })

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape") setIsModalOpen(false)
        }
        window.addEventListener("keydown", handleEscape)
        return () => window.removeEventListener("keydown", handleEscape)
    }, [])

    if (isLoading) return <PreloaderCard />;

    if (isError) {
        return (
            <div className="text-center p-10 max-w-md mx-auto">
                <p className="text-red-400 font-medium mb-2">Failed to load profile</p>
                <p className="text-zinc-500 text-sm">{(error as Error).message}</p>
            </div>
        )
    }

    if (!user) return null

    return (
        <>
            {isModalOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-200"
                    onClick={() => setIsModalOpen(false)}
                >
                    <div
                        className="bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl p-16 max-w-[400px] w-full flex flex-col items-center relative animate-in zoom-in-95 duration-200"
                        onClick={e => e.stopPropagation()}
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
            <div className={`text-zinc-100 w-full max-w-4xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-xl shadow-zinc-900/50 relative overflow-hidden transition-all duration-300 ${isModalOpen ? 'blur-[2px] pointer-events-none' : ''}`}>
                <div className="absolute top-0 right-0 w-64 h-64 bg-zinc-800/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />


                <div className="flex flex-col md:flex-row p-6 sm:p-10 relative z-10">

                    {/* Left Column: QR Code & Mobile Name */}
                    <div className="flex flex-col items-center justify-center shrink-0 w-full md:w-auto md:pr-8">
                        <div
                            onClick={() => setIsModalOpen(true)}
                            className="group p-1 bg-zinc-800/50 rounded-xl border border-zinc-700 shadow-inner cursor-pointer hover:border-zinc-500 hover:bg-zinc-800 transition-all duration-300"
                        >
                            <div className="w-[60vw] h-[60vw] max-w-[256px] max-h-[256px] flex items-center justify-center bg-zinc-950 rounded-lg overflow-hidden relative">
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

                        {/* Mobile Name Section (Always Visible) */}
                        <div className="w-full text-center mt-6 md:hidden">
                            <h1 className="text-3xl font-bold text-white tracking-tight font-inst leading-tight">
                                {user.profile?.first_name} {user.profile?.last_name}
                            </h1>
                            <p className="text-zinc-500 text-xs flex items-center justify-center gap-1 mt-1">
                                <User width={12} height={12} /> {user.role}
				{paymentStatus && (
				    <PaymentStatusBadge status={paymentStatus.status} />
				)}
                            </p>
                        </div>
                    </div>

                    {/* Right Column: Desktop Details */}
                    <div className="hidden md:flex flex-1 flex-col space-y-8 border-l border-zinc-800/50 pl-8 w-full">
                        <div className="border-b border-zinc-800 pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
                            <div>
                                <h1 className="text-3xl font-bold text-white tracking-tight font-inst">
                                    {user.profile?.first_name} {user.profile?.last_name}
                                </h1>
                                <p className="text-zinc-400 mt-1 text-sm flex items-center gap-1">
                                    <User width={14} height={14} /> {user.role}
				    {paymentStatus && (
					<PaymentStatusBadge status={paymentStatus.status} />
				    )}
                                </p>
			   </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-6">
                            <DetailRow icon={<Building strokeWidth={2} />} label="College" value={user.profile?.college || "N/A"} />
                            <DetailRow icon={<OpenBook strokeWidth={2} />} label="Degree" value={user.profile?.degree || "N/A"} />
                            <DetailRow icon={<GraduationCap strokeWidth={2} />} label="Year" value={user.profile?.year?.toString() || "N/A"} />
                            <DetailRow icon={<Phone strokeWidth={2} />} label="Phone Number" value={user.ph_no || "N/A"} />
                            <div className="sm:col-span-2">
                                <DetailRow icon={<Mail strokeWidth={2} />} label="Email" value={user.email} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Mobile Toggle Section */}
                <div className="md:hidden w-full border-t border-zinc-800/50 bg-zinc-900/50 relative">
                    {/* Expandable Content Wrapper */}
                    <div
                        className={`overflow-hidden transition-[max-height] duration-500 ease-in-out ${isDetailsOpen ? 'max-h-[500px]' : 'max-h-0'
                            }`}
                    >
                        <div className="px-6 pb-6 pt-4 grid grid-cols-1 gap-y-6 gap-x-6">
                            <DetailRow icon={<Building strokeWidth={2} />} label="College" value={user.profile?.college || "N/A"} />
                            <DetailRow icon={<OpenBook strokeWidth={2} />} label="Degree" value={user.profile?.degree || "N/A"} />
                            <DetailRow icon={<GraduationCap strokeWidth={2} />} label="Year" value={user.profile?.year?.toString() || "N/A"} />
                            <DetailRow icon={<Phone strokeWidth={2} />} label="Phone Number" value={user.ph_no || "N/A"} />
                            <DetailRow icon={<Mail strokeWidth={2} />} label="Email" value={user.email} />
                        </div>
                    </div>

                    {/* Toggle Button Area */}
                    <div className="w-full flex justify-center py-3 bg-zinc-900 border-t border-zinc-800/30">
                        <button
                            onClick={() => setIsDetailsOpen(!isDetailsOpen)}
                            className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-sm font-medium active:scale-95 transform duration-150"
                        >
                            <span>{isDetailsOpen ? "Hide Details" : "View Details"}</span>
                            <ChevronDown
                                className={`transition-transform duration-300 ${isDetailsOpen ? 'rotate-180' : ''}`}
                                width={18}
                                height={18}
                            />
                        </button>
                    </div>
                </div>
            </div>
        </>
    )
}

interface DetailRowProps {
    icon: React.ReactNode
    label: string
    value: string
}

interface PaymentStatusBadgeProps {
    status: "PAID" | "FAILED" | "REFUNDED" | "PENDING"
}

const PaymentStatusBadge = ({ status }: PaymentStatusBadgeProps) => {
    const statusConfig = {
        PAID: {
            icon: <CheckCircle width={14} height={14} />,
            label: "Paid",
            className: "bg-green-500/10 text-green-400 border-green-500/20",
        },
        FAILED: {
            icon: <InfoCircle width={14} height={14} />,
            label: "Failed",
            className: "bg-red-500/10 text-red-400 border-red-500/20",
        },
        REFUNDED: {
            icon: <InfoCircle width={14} height={14} />,
            label: "Refunded",
            className: "bg-orange-500/10 text-orange-400 border-orange-500/20",
        },
        PENDING: {
            icon: <Refresh width={14} height={14} className="animate-spin" />,
            label: "Pending",
            className: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
        },
    }

    const config = statusConfig[status]

    return (
        <span
            className={`px-2 py-0.5 rounded-full text-xs font-semibold border flex items-center gap-1 ${config.className}`}
        >
            {config.icon}
            {config.label}
        </span>
    )
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
    )
}

export default UserCard
