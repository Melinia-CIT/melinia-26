import UserCard from "../../components/userland/main/UserCard"
import Notifications from "../../components/userland/main/Notifications"

const Main = () => {
    return (
        <main className="w-full bg-zinc-950 flex justify-center p-4 font-geist selection:bg-indigo-500/30">
            <div className="w-full max-w-4xl space-y-6">
                <UserCard />
                <Notifications />
            </div>
        </main>
    )
}

export default Main
