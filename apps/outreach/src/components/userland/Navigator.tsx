import { useState } from "react"
import { NavLink } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { Home, Group, Trophy, Medal1st, LogOut, Xmark, CreditCard } from "iconoir-react"
import { logout } from "../../services/auth"
import { ChevronRight, ChevronUp } from "lucide-react"
import PaymentModal from "../payment/PaymentModal"
import { paymentService } from "../../services/payment"
import { useQuery } from "@tanstack/react-query"

export default function Navigator() {
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)

    const { data: paymentStatus } = useQuery({
        queryKey: ["paymentStatus"],
        queryFn: async () => {
            const response = await paymentService.getPaymentStatus()
            return response
        },
        staleTime: 5 * 60 * 1000,
        retry: false,
    })

    const navItems = [
        { to: "/app", Icon: Home, label: "Home", end: true },
        { to: "/app/events", Icon: Trophy, label: "Events" },
        { to: "/app/teams", Icon: Group, label: "Teams" },
        { to: "/app/leaderboard", Icon: Medal1st, label: "Leaderboard" },
    ]

    const toggleMenu = () => setIsMenuOpen(!isMenuOpen)

    return (
        <>
            {/* Global Backdrop (Click outside to close) */}
            <AnimatePresence>
                {isMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-40 bg-transparent cursor-default"
                        onClick={() => setIsMenuOpen(false)}
                    />
                )}
            </AnimatePresence>

            {/* Desktop Navigation (Vertical Dock) */}
            <div className="hidden md:flex fixed top-1/2 -translate-y-1/2 left-6 z-50">
                <div className="flex flex-col items-center gap-2 p-2 rounded-2xl bg-zinc-900/60 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/50 relative">
                    {navItems.map(({ to, Icon, end }) => (
                        <NavLink
                            key={to}
                            to={to}
                            end={end}
                            onClick={() => {
                                setIsMenuOpen(false)
                            }}
                            className={({ isActive }) =>
                                `relative group flex items-center justify-center w-12 h-12 rounded-xl transition-colors duration-300 active:scale-95 ${
                                    isActive
                                        ? "text-white"
                                        : "text-zinc-500 group-hover:text-zinc-300"
                                }`
                            }
                        >
                            {({ isActive }) => (
                                <>
                                    {isActive && (
                                        <motion.div
                                            layoutId="highlight-desktop"
                                            className="absolute inset-0 rounded-xl bg-white/10"
                                        />
                                    )}
                                    <Icon
                                        strokeWidth={2}
                                        width={24}
                                        height={24}
                                        className={`relative z-10 transition-colors duration-300 ${isActive ? "text-white" : "text-zinc-400"}`}
                                    />
                                </>
                            )}
                        </NavLink>
                    ))}

                    <div className="w-full h-px bg-white/10 my-1" />

                    {/* Chevron Right / Menu Trigger (Desktop) */}
                    <motion.button
                        onClick={toggleMenu}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`relative flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-300 ${isMenuOpen ? "text-white bg-white/10" : "text-zinc-500 hover:text-zinc-300"}`}
                    >
                        <ChevronRight strokeWidth={2} width={24} height={24} />
                    </motion.button>

                    {/* Sub Menu Popup Wrapper (Desktop) */}
                    <AnimatePresence>
                        {isMenuOpen && (
                            <motion.div
                                className="absolute left-full top-1/2 -translate-y-1/2 w-48 pointer-events-none ml-3"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.2 }}
                            >
                                {/* The actual Menu Box */}
                                <motion.div
                                    className="bg-zinc-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-1 overflow-hidden pointer-events-auto"
                                    initial={{ scale: 0.95 }}
                                    animate={{ scale: 1 }}
                                    exit={{ scale: 0.95 }}
                                >
                                    {/* Close Button */}
                                    <motion.div
                                        onClick={() => setIsMenuOpen(false)}
                                        whileHover={{ backgroundColor: "rgba(255, 255, 255, 0.1)" }}
                                        className="flex justify-end p-2 cursor-pointer text-zinc-500 hover:text-white rounded-xl transition-colors"
                                    >
                                        <Xmark strokeWidth={2} width={16} height={16} />
                                    </motion.div>

                                    {!import.meta.env.DEV && (
                                        <motion.div
                                            onClick={() => {
                                                setIsMenuOpen(false)
                                                setIsPaymentModalOpen(true)
                                            }}
                                            whileHover={{
                                                backgroundColor: "rgba(255, 255, 255, 0.1)",
                                            }}
                                            className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-zinc-400 hover:text-white cursor-pointer"
                                        >
                                            <CreditCard strokeWidth={2} width={20} height={20} />
                                            <span className="text-sm font-medium">Payment</span>
                                        </motion.div>
                                    )}

                                    <motion.div
                                        onClick={async () => {
                                            await logout()
                                            window.location.href = "/login"
                                        }}
                                        whileHover={{ backgroundColor: "rgba(239, 68, 68, 0.1)" }}
                                        className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-zinc-400 hover:text-red-400 cursor-pointer"
                                    >
                                        <LogOut strokeWidth={2} width={20} height={20} />
                                        <span className="text-sm font-medium">Logout</span>
                                    </motion.div>
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Mobile Navigation (Bottom Dock) */}
            <div className="md:hidden fixed bottom-6 left-4 right-4 z-50">
                <div className="flex items-center justify-between p-1.5 rounded-2xl bg-zinc-900/60 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/50 relative">
                    {navItems.map(({ to, Icon, end }) => (
                        <NavLink
                            key={to}
                            to={to}
                            end={end}
                            onClick={() => {
                                setIsMenuOpen(false)
                            }}
                            className={({ isActive }) =>
                                `relative group flex flex-col items-center justify-center gap-1 p-2 w-16 rounded-xl transition-colors duration-300 active:scale-95 ${
                                    isActive ? "text-white" : "text-zinc-500"
                                }`
                            }
                        >
                            {({ isActive }) => (
                                <>
                                    {isActive && (
                                        <motion.div
                                            layoutId="highlight-mobile"
                                            className="absolute inset-0 rounded-xl bg-white/10"
                                        />
                                    )}
                                    <div className="relative z-10">
                                        <Icon
                                            strokeWidth={2}
                                            width={22}
                                            height={22}
                                            className={`transition-colors duration-300 ${isActive ? "text-white" : "text-zinc-400"}`}
                                        />
                                    </div>
                                </>
                            )}
                        </NavLink>
                    ))}

                    <div className="w-px h-8 bg-white/10 mx-1" />

                    {/* Chevron Up / Menu Trigger (Mobile) */}
                    <motion.button
                        onClick={toggleMenu}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`relative flex items-center justify-center p-2 w-12 rounded-xl transition-all duration-300 ${isMenuOpen ? "text-white bg-white/10" : "text-zinc-500 hover:text-zinc-300"}`}
                    >
                        <motion.div
                            animate={{ rotate: isMenuOpen ? 180 : 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            <ChevronUp strokeWidth={2} width={22} height={22} />
                        </motion.div>
                    </motion.button>

                    {/* Sub Menu Popup Wrapper (Mobile) */}
                    <AnimatePresence>
                        {isMenuOpen && (
                            <motion.div
                                className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 w-48 pointer-events-none"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 20 }}
                                transition={{ duration: 0.2 }}
                            >
                                {/* The actual Menu Box */}
                                <motion.div
                                    className="bg-zinc-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-1 overflow-hidden pointer-events-auto"
                                    initial={{ scale: 0.95 }}
                                    animate={{ scale: 1 }}
                                    exit={{ scale: 0.95 }}
                                >
                                    {/* Close Button */}
                                    <motion.div
                                        onClick={() => setIsMenuOpen(false)}
                                        whileHover={{ backgroundColor: "rgba(255, 255, 255, 0.1)" }}
                                        className="flex justify-end p-2 cursor-pointer text-zinc-500 hover:text-white rounded-xl transition-colors"
                                    >
                                        <Xmark strokeWidth={2} width={16} height={16} />
                                    </motion.div>

                                    {!import.meta.env.DEV && (
                                        <motion.div
                                            onClick={() => {
                                                setIsMenuOpen(false)
                                                setIsPaymentModalOpen(true)
                                            }}
                                            whileHover={{
                                                backgroundColor: "rgba(255, 255, 255, 0.1)",
                                            }}
                                            className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-zinc-400 hover:text-white cursor-pointer"
                                        >
                                            <CreditCard strokeWidth={2} width={20} height={20} />
                                            <span className="text-sm font-medium">Payment</span>
                                        </motion.div>
                                    )}

                                    <motion.div
                                        onClick={async () => {
                                            await logout()
                                            window.location.href = "/login"
                                        }}
                                        whileHover={{ backgroundColor: "rgba(239, 68, 68, 0.1)" }}
                                        className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-zinc-400 hover:text-red-400 cursor-pointer"
                                    >
                                        <LogOut strokeWidth={2} width={20} height={20} />
                                        <span className="text-sm font-medium">Logout</span>
                                    </motion.div>
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            <PaymentModal
                isOpen={isPaymentModalOpen}
                onClose={() => setIsPaymentModalOpen(false)}
                hasAlreadyPaid={paymentStatus?.paid || false}
            />
        </>
    )
}
