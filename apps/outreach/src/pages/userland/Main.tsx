import { useState, useRef } from "react"
import UserCard from "../../components/userland/main/UserCard"
import Notifications from "../../components/userland/main/Notifications"
import RegisteredEvents from "../../components/userland/main/RegisteredEvents"
import { NotificationIcon } from "../../components/userland/main/NotificationIcon"
import { motion } from "framer-motion"

const Main = () => {
    const [showNotifications, setShowNotifications] = useState(false)
    const [showDesktopNotifications, setShowDesktopNotifications] = useState(false)
    const desktopNotificationsRef = useRef<HTMLDivElement>(null)

    return (
        <main className="w-full bg-zinc-950 flex flex-col items-center p-4 font-geist selection:bg-indigo-500/30 relative min-h-screen">
            {/* Notification Icon - Desktop */}
            <div className="hidden lg:block absolute top-4 right-4 z-50 cursor-pointer">
                <NotificationIcon
                    onClick={() => setShowDesktopNotifications(!showDesktopNotifications)}
                    isOpen={showDesktopNotifications}
                />
            </div>

            {/* Desktop Layout */}
            <div className="hidden lg:flex w-full flex-col items-center relative gap-8 max-w-7xl">
                {/* Vertical Stack: UserCard then RegisteredEvents */}
                <UserCard />
                
                <div className="w-full">
                    <RegisteredEvents />
                </div>

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
                    }}
                    className="absolute top-0 right-0 w-[418px] z-50"
                    style={{ pointerEvents: showDesktopNotifications ? "auto" : "none" }}
                >
                    <Notifications
                        isOpen={showDesktopNotifications}
                        onClose={() => setShowDesktopNotifications(false)}
                        isDesktop={true}
                    />
                </motion.div>
            </div>

            {/* Mobile Layout */}
            <div className="lg:hidden w-full relative flex flex-col gap-6">
                {/* Mobile Notification Backdrop */}
                {showNotifications && (
                    <div
                        className="fixed inset-0 bg-black/20 z-40"
                        onClick={() => setShowNotifications(false)}
                    />
                )}

                <div className="flex justify-end relative z-50">
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

                {/* Vertical Stack: UserCard then RegisteredEvents */}
                <UserCard />
                <RegisteredEvents />
            </div>
        </main>
    )
}

export default Main