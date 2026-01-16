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
        <div className="w-full bg-zinc-950 flex flex-col items-center p-4 font-geist selection:bg-indigo-500/30 relative min-h-screen">
            {/* Desktop Layout */}
            <div className="hidden lg:flex w-full flex-row items-start gap-8 relative h-screen">
                {/* Notification Icon - Desktop */}
                <div className="absolute top-0 right-0 z-50 cursor-pointer">
                    <NotificationIcon
                        onClick={() => setShowDesktopNotifications(!showDesktopNotifications)}
                        isOpen={showDesktopNotifications}
                    />
                </div>

                <div className="flex-1 w-full">
                    <RegisteredEvents />
                </div>

                <div className="my-auto w-md">
                    <UserCard />
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
                    className="fixed top-22 right-14 w-[418px] z-50"
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
            <div className="lg:hidden w-full relative flex flex-col items-center gap-6 pt-12">
                {/* Mobile Notification Backdrop */}
                {showNotifications && (
                    <div
                        className="fixed inset-0 bg-black/20 z-40"
                        onClick={() => setShowNotifications(false)}
                    />
                )}

                <div className="flex justify-end fixed top-0 right-0 z-50">
                    <div className="p-4">
                        <NotificationIcon
                            onClick={() => setShowNotifications(!showNotifications)}
                            isOpen={showNotifications}
                        />
                    </div>
                </div>
                <Notifications
                    isOpen={showNotifications}
                    onClose={() => setShowNotifications(false)}
                    isDesktop={false}
                />

                {/* Vertical Stack: UserCard then RegisteredEvents */}
                <UserCard />
                <RegisteredEvents />
            </div>
        </div>
    )
}

export default Main
