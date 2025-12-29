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
        <div className="relative group">
            <div
                className="absolute inset-0 translate-x-2 translate-y-2 rounded-full border-2 border-[#0F0B13] bg-[#0F0B13] -z-10"
                aria-hidden="true"
            />
            <div className="flex gap-1 bg-[#0F0B13] p-1 rounded-full border border-[#0F0B13] shadow-sm overflow-x-auto scrollbar-hide max-w-full relative z-10">
                <div className="flex gap-1 flex-nowrap min-w-max">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => onTabChange(tab.id)}
                            className={`px-4 md:px-6 py-1.5 md:py-2 rounded-full text-xs md:text-sm font-semibold transition-all duration-300 whitespace-nowrap ${activeTab === tab.id
                                ? 'bg-[#D24623] text-[#0F0B13] shadow-md'
                                : 'text-[#F2F2F2]/50 hover:text-[#F2F2F2]'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};
