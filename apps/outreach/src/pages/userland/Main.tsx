import { useState, useRef } from "react"
import UserCard from "../../components/userland/main/UserCard"
import Notifications from "../../components/userland/main/Notifications"
import { NotificationIcon } from "../../components/userland/main/NotificationIcon"
import { motion } from "framer-motion"

const Main = () => {
    const [showNotifications, setShowNotifications] = useState(false)
    const [showDesktopNotifications, setShowDesktopNotifications] = useState(false)
    const desktopNotificationsRef = useRef<HTMLDivElement>(null)

    return (
        <main className="w-full bg-zinc-950 flex flex-col items-center p-4 font-geist selection:bg-indigo-500/30 relative">
            {/* Notification Icon - Desktop */}
            <div className="hidden lg:block absolute top-4 right-4 z-50 cursor-pointer">
                <NotificationIcon
                    onClick={() => {
                        console.log("Bell icon clicked, current state:", showDesktopNotifications)
                        setShowDesktopNotifications(!showDesktopNotifications)
                    }}
                    isOpen={showDesktopNotifications}
                />
            </div>

            {/* Desktop Layout */}
            <div className="hidden lg:flex w-full justify-center min-h-[600px] relative">
                <UserCard />

                {/* Notification Backdrop */}
                {showDesktopNotifications && (
                    <div
                        className="fixed inset-0 bg-black/20 z-40"
                        onClick={() => setShowDesktopNotifications(false)}
                    />
                )}

                <motion.div
                    ref={desktopNotificationsRef}
                    initial={{ x: 400, opacity: 0, scale: 0.95 }}
                    animate={{
                        x: showDesktopNotifications ? 0 : 400,
                        opacity: showDesktopNotifications ? 1 : 0,
                        scale: showDesktopNotifications ? 1 : 0.95,
                    }}
                    transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 30,
                        mass: 0.8,
                        bounce: 0.2,
                    }}
                    className="absolute top-0 right-4 w-[418px] z-50"
                    style={{ pointerEvents: showDesktopNotifications ? "auto" : "none" }}
                >
                    <Notifications
                        isOpen={false}
                        onClose={() => setShowDesktopNotifications(false)}
                        isDesktop={true}
                    />
                </motion.div>
            </div>

            {/* Mobile Layout */}
            <div className="lg:hidden w-full">
                {/* Mobile Notification Backdrop */}
                {showNotifications && (
                    <div
                        className="fixed inset-0 bg-black/30 z-40"
                        onClick={() => setShowNotifications(false)}
                    />
                )}

                <div className="flex justify-end relative mb-6">
                    <NotificationIcon
                        onClick={() => setShowNotifications(!showNotifications)}
                        isOpen={showNotifications}
                    />
                    <Notifications
                        isOpen={showNotifications}
                        onClose={() => setShowNotifications(false)}
                        isDesktop={false}
                    />
                </div>

                <UserCard />
            </div>
        </main>
    )
}

export default Main
