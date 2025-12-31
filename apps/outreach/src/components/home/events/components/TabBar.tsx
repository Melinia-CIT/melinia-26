import { TabType } from '../types';

interface TabBarProps {
    activeTab: TabType;
    onTabChange: (tab: TabType) => void;
}

export const TabBar = ({ activeTab, onTabChange }: TabBarProps) => {
    const tabs: { id: TabType; label: string }[] = [
        { id: 'overview', label: 'Overview' },
        { id: 'rounds', label: 'Rounds' },
        { id: 'prizes', label: 'Prizes' },
    ];

    return (
        <div className="relative group">
            <div
                className="flex gap-1 p-1 rounded-full border border-white/10 shadow-lg overflow-x-auto scrollbar-hide max-w-full relative backdrop-blur-xl"
                style={{
                    background: 'linear-gradient(135deg, rgba(15, 11, 19, 0.8) 0%, rgba(52, 20, 63, 0.6) 100%)',
                    boxShadow: '0 4px 24px rgba(15, 11, 19, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                }}
            >
                <div className="flex gap-1 flex-nowrap min-w-max">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => onTabChange(tab.id)}
                            className={`px-4 md:px-6 py-1.5 md:py-2 rounded-full text-xs md:text-sm font-semibold transition-all duration-300 whitespace-nowrap ${activeTab === tab.id
                                ? 'bg-gradient-to-r from-[#D24623] to-[#EA8427] text-[#0F0B13] shadow-lg shadow-[#D24623]/40'
                                : 'text-[#F2F2F2]/60 hover:text-[#F2F2F2] hover:bg-white/10 hover:scale-105 backdrop-blur-sm'
                                }`}
                            style={activeTab === tab.id ? {
                                boxShadow: '0 0 20px rgba(210, 70, 35, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
                            } : {}}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};
