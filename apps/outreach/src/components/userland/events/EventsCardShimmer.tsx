import { motion } from "framer-motion"

const EventsCardShimmer = () => {
    return (
        <motion.div
            className="h-full rounded-3xl overflow-hidden flex flex-col border border-white/10 backdrop-blur-xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
        >
            <div className="absolute inset-0 bg-gradient-to-br from-zinc-900/40 via-zinc-800/30 via-zinc-700/20 to-transparent" />
            <div className="relative border border-white/10 p-5 rounded-3xl h-full flex flex-col">
                <div className="space-y-2 mb-4">
                    <div className="relative h-6 w-3/4 bg-zinc-800/50 rounded overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent" />
                    <div className="relative h-4 w-full bg-zinc-800/30 rounded overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent" />
                </div>

                <div className="space-y-2 mb-4 flex-1">
                    <div className="relative h-3.5 w-full bg-zinc-800/30 rounded overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent" />
                    <div className="relative h-3.5 w-5/6 bg-zinc-800/30 rounded overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent" />
                    <div className="relative h-3.5 w-4/6 bg-zinc-800/30 rounded overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent" />
                </div>

                <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5">
                            <div className="relative w-3 h-3 bg-zinc-800/50 rounded-full overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent" />
                            <div className="relative h-2.5 w-12 bg-zinc-800/30 rounded overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent" />
                        </div>
                        <span className="text-zinc-700">|</span>
                        <div className="flex items-center gap-1.5">
                            <div className="relative w-3 h-3 bg-zinc-800/50 rounded-full overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent" />
                            <div className="relative h-2.5 w-16 bg-zinc-800/30 rounded overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent" />
                        </div>
                    </div>
                    <div className="relative h-2.5 w-16 bg-zinc-800/30 rounded overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent" />
                </div>
            </div>
        </motion.div>
    )
}

export default EventsCardShimmer
