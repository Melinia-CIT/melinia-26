function TimelineShimmer() {
    return (
        <div className="w-full bg-zinc-900/50 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden">
            <div className="px-4 py-3 border-b border-white/10">
                <div className="h-6 w-32 bg-zinc-800 rounded animate-pulse" />
            </div>
            <div className="p-4">
                <div className="flex gap-4 mb-4">
                    <div className="h-8 w-24 bg-zinc-800 rounded animate-pulse" />
                    <div className="h-8 w-24 bg-zinc-800 rounded animate-pulse" />
                </div>
                <div className="relative h-40">
                    <div className="absolute inset-0 flex">
                        {[8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22].map(hour => (
                            <div key={hour} className="flex-1 border-r border-white/5">
                                <div className="h-4 w-8 bg-zinc-800/50 rounded animate-pulse -mt-5" />
                            </div>
                        ))}
                    </div>
                    <div className="pt-8 space-y-3">
                        <div className="h-10 rounded-lg bg-zinc-800/50 animate-pulse w-1/4" />
                        <div className="h-10 rounded-lg bg-zinc-800/50 animate-pulse w-1/3 ml-[20%]" />
                        <div className="h-10 rounded-lg bg-zinc-800/50 animate-pulse w-1/5 ml-[45%]" />
                    </div>
                </div>
            </div>
        </div>
    )
}

export default TimelineShimmer
