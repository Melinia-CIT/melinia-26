import { TabType } from '../types';

interface TabBarProps {
    activeTab: TabType;
    onTabChange: (tab: TabType) => void;
}

export const TabBar = ({ activeTab, onTabChange }: TabBarProps) => {
    const tabs: { id: TabType; label: string }[] = [
        { id: 'overview', label: 'Overview' },
        { id: 'rounds', label: 'Rounds' },
        { id: 'prizes', label: 'Prizes & Team' },
    ];

    return (
        <div className="flex gap-1.5 bg-white/60 backdrop-blur-sm p-1 rounded-full border border-gray-200/50 shadow-sm flex-shrink-0">
            {tabs.map((tab) => (
                <button
                    key={tab.id}
                    onClick={() => onTabChange(tab.id)}
                    className={`px-6 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${activeTab === tab.id
                            ? 'bg-[#E1062C] text-white shadow-md'
                            : 'text-[#6F7FA3] hover:text-[#050608] hover:bg-white/50'
                        }`}
                >
                    {tab.label}
                </button>
            ))}
        </div>
    );
};
