import { Outlet } from "react-router-dom";
import Navigator from "../../components/userland/Navigator";

const AppLayout = () => {
    return (
        <div className="min-h-screen bg-zinc-950 text-white">
            <Navigator />
            <main className="px-6 sm:pl-24 md:pr-8 pb-8 pt-16 pb-4 transition-all duration-300">
                <Outlet />
            </main>
        </div>
    );
};

export default AppLayout;
