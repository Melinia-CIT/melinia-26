import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
    Home,
    Group,
    LogOut,
    Trophy,
    Menu,
    Xmark,
    Medal1st
} from 'iconoir-react';
import { logout } from '../../services/auth';

export default function Navigator() {
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);

    const navItems = [
        { to: '/app', Icon: Home, label: 'Home', end: true },
        { to: '/app/events', Icon: Trophy, label: 'Events' },
        { to: '/app/teams', Icon: Group, label: 'Teams' },
        { to: '/app/leaderboard', Icon: Medal1st, label: 'Leaderboard' },
    ];

    const toggleMenu = () => setIsOpen(!isOpen);

    return (
        <>
            {/* Desktop Navigation */}
            <nav className="hidden md:flex fixed top-1/2 -translate-y-1/2 left-12 rounded-2xl border border-white/10 bg-zinc-900/80 backdrop-blur-md shadow-xl z-50">
                <div className="flex flex-col gap-2 p-2">
                    {navItems.map(({ to, Icon, end }) => (
                        <NavLink
                            key={to}
                            to={to}
                            end={end}
                            className={({ isActive }) =>
                                `group flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-300 relative ${isActive ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
                                }`
                            }
                        >
                            {({ isActive }) => (
                                <div className="relative p-1">
                                    <span className={`absolute top-0 right-0 h-1 w-1 rounded-full bg-white transition-all duration-300 ${isActive ? 'opacity-100' : 'opacity-0'
                                        }`} />
                                    <Icon strokeWidth={2} width={20} height={20} />
                                </div>
                            )}
                        </NavLink>
                    ))}

                    <div className="border-t border-white/10 my-1 w-full" />

                    <div
                        onClick={async () => {
                            await logout(); 
                            navigate("/login", { replace: true });
                        }}
                        className="group flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-300 text-zinc-500 hover:text-red-400 hover:bg-red-500/10"
                    >
                        <LogOut strokeWidth={2} width={20} height={20} />
                    </div>
                </div>
            </nav>

            {/* Mobile Navigation */}
            <div className="md:hidden fixed top-4 left-4 z-50">
                <button
                    onClick={toggleMenu}
                    className="p-3 rounded-full border border-white/10 bg-zinc-900/80 backdrop-blur-md text-zinc-300 hover:text-white hover:border-white/20 transition-all shadow-lg"
                    aria-label="Toggle navigation menu"
                >
                    {isOpen ? <Xmark strokeWidth={2} width={24} height={24} /> : <Menu strokeWidth={2} width={24} height={24} />}
                </button>

                {/* Dropdown Menu */}
                {isOpen && (
                    <div className="absolute top-14 left-0 rounded-2xl border border-white/10 bg-zinc-900/95 backdrop-blur-xl shadow-2xl overflow-hidden min-w-[200px] animate-in slide-in-from-top-2 duration-200">
                        <div className="flex flex-col p-2 gap-1">
                            {navItems.map(({ to, Icon, label, end }) => (
                                <NavLink
                                    key={to}
                                    to={to}
                                    end={end}
                                    onClick={() => setIsOpen(false)}
                                    className={({ isActive }) =>
                                        `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${isActive
                                            ? 'bg-white/10 text-white font-medium'
                                            : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200'
                                        }`
                                    }
                                >
                                    <Icon strokeWidth={2} width={20} height={20} />
                                    <span className="text-sm font-medium">{label}</span>
                                </NavLink>
                            ))}

                            <div className="border-t border-white/10 my-1" />

                            <div
                                onClick={async () => {
                                    await logout();
                                    navigate("/login", { replace: true });
                                }}
                                className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                            >
                                <LogOut strokeWidth={2} width={20} height={20} />
                                <span className="text-sm font-medium">Logout</span>
                            </div>
                        </div>
                    </div>
                )}
            </div >
        </>
    );
}

