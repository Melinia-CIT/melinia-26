import { useState } from "react"
import UserCard from "../../components/userland/main/UserCard"
import Notifications from "../../components/userland/main/Notifications"
import { NotificationIcon } from "../../components/userland/main/NotificationIcon"
import { motion } from "framer-motion"

const Main = () => {
    const [showNotifications, setShowNotifications] = useState(false)
    const [showDesktopNotifications, setShowDesktopNotifications] = useState(false)

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

                <motion.div
                    initial={{ x: 400, opacity: 0 }}
                    animate={{
                        x: showDesktopNotifications ? 0 : 400,
                        opacity: showDesktopNotifications ? 1 : 0,
                    }}
                    transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
                    className="absolute top-0 right-4 w-[418px] z-50 pointer-events-none"
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
