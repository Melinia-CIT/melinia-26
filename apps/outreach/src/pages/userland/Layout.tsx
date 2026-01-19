import { Outlet, useLocation, useNavigate } from "react-router-dom"
import Navigator from "../../components/userland/Navigator"
import { useQuery } from "@tanstack/react-query"
import Profile from "./Profile"
import PaymentModal from "../../components/payment/PaymentModal"
import { paymentService } from "../../services/payment"
import { motion, AnimatePresence } from "framer-motion"
import { fetchUser } from "../../services/users"

const restrictedRoutes = ["/teams", "/leaderboard"]

const AppLayout = () => {
    const location = useLocation()
    const isRestrictedRoute = restrictedRoutes.some(route => location.pathname.includes(route));
    const navigator = useNavigate();

    const { data: userData, isLoading: userLoading } = useQuery({
        queryKey: ["userMe"],
        queryFn: fetchUser,
        staleTime: 5 * 60 * 1000,
    })

    const { data: paymentStatus, isLoading: paymentLoading } = useQuery({
        queryKey: ["paymentStatus"],
        queryFn: async () => {
            const response = await paymentService.getPaymentStatus()
            console.log(response)
            return response
        },
        staleTime: isRestrictedRoute ? 0 : 5 * 60 * 1000,
        refetchOnWindowFocus: isRestrictedRoute ? "always" : true,
        refetchOnMount: "always",
        enabled: (!!userData && userData.profile_completed) || isRestrictedRoute,
        retry: false,
    })

    const showProfileModal = !userLoading && userData && !userData.profile_completed
    const showPaymentModal =isRestrictedRoute && !paymentLoading && (!paymentStatus || !paymentStatus.paid)

    return (
        <div className="min-h-screen bg-zinc-950 text-white relative overflow-hidden">
            <Navigator />

            {/* Desktop: Main content with left padding for dock */}
            <main className="hidden md:block md:pl-32 md:pr-8 md:pt-6 pb-8 transition-all duration-300 relative z-0 min-h-screen">
                <Outlet />
            </main>

            {/* Mobile: Main content with bottom padding for mobile nav */}
            <main className="md:hidden px-4 pt-6 pb-8 transition-all duration-300 relative z-0 min-h-screen">
                <Outlet />
            </main>

            {/* Profile Modal */}
            <AnimatePresence>
                {showProfileModal && (
                    <motion.div
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 font-geist"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                            onClick={() => {}}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        />

                        <motion.div
                            className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden"
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            transition={{ type: "spring", damping: 20, stiffness: 300 }}
                        >
                            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/50">
                                <h2 className="text-lg font-semibold text-white font-inst">
                                    Complete Your Profile
                                </h2>
                                <span className="text-xs text-zinc-400">Required</span>
                            </div>
                            <div className="p-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
                                <Profile initialData={userData} />
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Payment Modal */}
            <AnimatePresence>
                {showPaymentModal && (
                    <PaymentModal
                        isOpen={true}
                        onClose={() => {navigator("/app")}}
                        userName={userData?.name || ""}
                        userEmail={userData?.email || ""}
                        onPaymentSuccess={() => {}}
                        isRequired={true}
                    />
                )}
            </AnimatePresence>
        </div>
    )
}

export default AppLayout
