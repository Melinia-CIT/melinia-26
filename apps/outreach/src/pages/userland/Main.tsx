import { useState, useRef } from "react"
import { useQuery } from "@tanstack/react-query"
import UserCard from "../../components/userland/main/UserCard"
import Notifications from "../../components/userland/main/Notifications"
import RegisteredEvents from "../../components/userland/main/RegisteredEvents"
import { NotificationIcon } from "../../components/userland/main/NotificationIcon"
import { motion } from "framer-motion"
import TimelineView, { TimelineEvent } from "../../components/ui/timeline-view"
import { useNavigate } from "react-router-dom"
import api from "../../services/api"
import { type UserRegisteredEvents } from "@melinia/shared"

type RegEvents = {
    events: UserRegisteredEvents
}


const Main = () => {
    const navigate = useNavigate()
    const [showNotifications, setShowNotifications] = useState(false)
    const [showDesktopNotifications, setShowDesktopNotifications] = useState(false)
    const desktopNotificationsRef = useRef<HTMLDivElement>(null)

    const { data: registeredEvents } = useQuery<UserRegisteredEvents>({
        queryKey: ["user-registered-events"],
        queryFn: async () => {
            const response = await api.get<RegEvents>("/users/me/events");
            return response.data.events;
        },
        staleTime: 5 * 60 * 1000,
    })

    const hasEvents = registeredEvents && registeredEvents.length > 0

    const handleEventClick = (event: TimelineEvent) => {
        navigate(`/app/events/${event.id}`)
    }

    return (
        <div className="flex-1 w-full transition-all duration-300">
            {/* Desktop Layout */}
            <div className="hidden lg:flex lg:gap-6 xl:gap-8 lg:px-6 xl:px-8 lg:py-6 relative">
                {/* Left Content - Scrollable (Takes ~66% width) */}
                <div className="flex-1 min-w-0 w-full">
                    <div className="flex flex-col gap-6">
                        {/* Timeline Section */}
                        {hasEvents && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4, delay: 0.1 }}
                            >
                                <TimelineView onEventClick={handleEventClick} />
                            </motion.div>
                        )}

                        {/* Registered Events Section */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4 }}
                        >
                            <RegisteredEvents />
                        </motion.div>
                    </div>
                </div>

                <div className="flex flex-col items-end gap-14">
                    <div className="relative">
                        {/* Notification Icon */}
                        <div className="cursor-pointer">
                            <NotificationIcon
                                onClick={() => setShowDesktopNotifications(v => !v)}
                                isOpen={showDesktopNotifications}
                            />
                        </div>

                        {/* Desktop Notifications Overlay */}
                        {showDesktopNotifications && (
                            <div
                                className="fixed inset-0 z-40"
                                onClick={() => setShowDesktopNotifications(false)}
                            />
                        )}

                        {/* Notification Panel */}
                        <motion.div
                            ref={desktopNotificationsRef}
                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                            animate={
                                showDesktopNotifications
                                    ? { opacity: 1, y: 8, scale: 1 }
                                    : { opacity: 0, y: -10, scale: 0.95 }
                            }
                            transition={{ type: "spring", stiffness: 300, damping: 25 }}
                            className="
                                absolute top-full right-0
                                w-[360px] max-h-[70vh]
                                z-50
                            "
                            style={{ pointerEvents: showDesktopNotifications ? "auto" : "none" }}
                        >
                            <Notifications
                                isOpen={showDesktopNotifications}
                                onClose={() => setShowDesktopNotifications(false)}
                                isDesktop
                            />
                        </motion.div>
                    </div>

                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4, delay: 0.2 }}
                    >
                        <UserCard />
                    </motion.div>
                </div>
            </div>

            {/* Mobile Layout */}
            <div className="lg:hidden">
                {/* Mobile Notifications Overlay */}
                {showNotifications && (
                    <div
                        className="fixed inset-0 bg-black/20 z-40"
                        onClick={() => setShowNotifications(false)}
                    />
                )}

                {/* Notification Icon - Fixed Position */}
                <div className="fixed top-4 right-4 z-50">
                    <NotificationIcon
                        onClick={() => setShowNotifications(!showNotifications)}
                        isOpen={showNotifications}
                    />
                </div>

                {/* Mobile Notifications Panel */}
                <Notifications
                    isOpen={showNotifications}
                    onClose={() => setShowNotifications(false)}
                    isDesktop={false}
                />

                {/* Mobile Content with Consistent Spacing */}
                <div className="space-y-6 px-4 pt-4">
                    {/* User Card Section */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                        className="flex justify-center pt-12"
                    >
                        <div className="w-full max-w-md">
                            <UserCard />
                        </div>
                    </motion.div>

                    {/* Timeline Section */}
                    {hasEvents && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: 0.1 }}
                        >
                            <TimelineView onEventClick={handleEventClick} />
                        </motion.div>
                    )}

                    {/* Registered Events Section */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: hasEvents ? 0.2 : 0.1 }}
                    >
                        <RegisteredEvents />
                    </motion.div>
                </div>
            </div>
        </div>
    )
}

export default Main
