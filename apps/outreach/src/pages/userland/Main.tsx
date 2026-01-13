import { useState } from "react"
import UserCard from "../../components/userland/main/UserCard"
import Notifications from "../../components/userland/main/Notifications"
import { NotificationIcon } from "../../components/userland/main/NotificationIcon"

const Main = () => {
    const [showNotifications, setShowNotifications] = useState(false)

    return (
        <main className="w-full bg-zinc-950 flex justify-center p-4 font-geist selection:bg-indigo-500/30">
            <div className="w-full max-w-4xl space-y-6">
                <div className="flex justify-end">
                    <NotificationIcon
                        onClick={() => setShowNotifications(!showNotifications)}
                        isOpen={showNotifications}
                    />
                </div>

                <UserCard />

                <Notifications isOpen={showNotifications} />
            </div>
        </main>
    )
}

export default Main
