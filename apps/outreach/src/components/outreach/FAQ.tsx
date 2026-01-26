import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus } from "lucide-react"
import { FloatingPathsBackground } from "../ui/floating-paths"
import { useId } from "react"

interface FAQItem {
    id: string
    question: string
    answer: string
}

const faqData: FAQItem[] = [
    {
        id: "1",
        question: "How do I register for events?",
        answer: "Registration is simple! Navigate to the Events section, browse through our Flagship, Technical, and Non-Technical events. Click on 'Know More' button. You'll be redirected to the registration page where you can complete the process. Make sure you're logged in to register.",
    },
    {
        id: "2",
        question: "Who can participate in Melinia'26?",
        answer: "Melinia'26 is open to all college students across India. Whether you're from engineering, arts, science, or any other discipline, we welcome you to participate in our events. Some events may have specific prerequisites, which will be mentioned in the event description.",
    },
    {
        id: "3",
        question:
            "Is Flagship event registrations are different from Melinia main track registration?",
        answer: "Flagship-event registration is separate from Melinia registration, Flagship events are hosted on Unstop platform and require their own payment, To enter the main-track events, login & pay inside the Melinia web app.",
    },
    {
        id: "4",
        question: "Is accommodation available for outstation participants?",
        answer: "Accommodation is not provided for participants. However, we can help guide you to nearby hotels and PG accommodations in Coimbatore. Please contact our team at +91 9597970123 for assistance.",
    },
    {
        id: "5",
        question: "Can I participate solo or do I need a team?",
        answer: "It depends on the event! Some events are designed for individual participation, while others require teams. Each event listing clearly specifies the minimum and maximum team size allowed. You can register as a solo participant for individual events, and team-based events will allow you to form teams during registration.",
    },
    {
        id: "6",
        question: "Who should I contact for additional queries?",
        answer: "For any queries, you can reach out to our team via email at helpdesk@melinia.in or call the respective event organizers mentioned. You can also visit our campus at Civil Aerodrome Post, Coimbatore, Tamilnadu, India – 641 014. Our team is available to assist you throughout the fest period.",
    },
]

interface FAQItemProps {
    item: FAQItem
    isOpen: boolean
    onToggle: () => void
    index: number
}

function FAQItem({ item, isOpen, onToggle, index }: FAQItemProps) {
    const uniqueId = useId()
    const gradientId = `faq-gradient-${uniqueId}`

    const itemVariants = {
        hidden: {
            opacity: 0,
            y: 20,
            x: 0,
        },
        visible: {
            opacity: 1,
            y: 0,
            x: 0,
            transition: {
                type: "spring" as const,
                stiffness: 300,
                damping: 25,
                delay: index * 0.1,
            },
        },
        hover: {
            x: [0, -2, 2, -1, 1, 0],
            y: [0, 1, -1, 0.5, -0.5, 0],
            transition: { duration: 0.3, times: [0, 0.2, 0.4, 0.6, 0.8, 1] },
        },
    }

    const iconVariants = {
        closed: { rotate: 0 },
        open: { rotate: 45 },
    }

    const answerVariants = {
        closed: {
            gridTemplateRows: "0fr",
            opacity: 0,
        },
        open: {
            gridTemplateRows: "1fr",
            opacity: 1,
            transition: {
                type: "spring" as const,
                stiffness: 200,
                damping: 30,
            },
        },
    }

    const glowVariants = {
        rest: {
            opacity: 0,
            scale: 0.8,
        },
        hover: {
            opacity: 0.4,
            scale: 1.1,
            transition: {
                type: "spring" as const,
                stiffness: 300,
                damping: 20,
            },
        },
    }

    return (
        <motion.div
            variants={itemVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            whileHover="hover"
            className="relative w-full"
        >
            <motion.div
                className="absolute inset-0 pointer-events-none"
                style={{
                    background:
                        "radial-gradient(circle, rgba(157, 0, 255, 0.3) 0%, transparent 70%)",
                    filter: "blur(15px)",
                }}
                variants={glowVariants}
                initial="rest"
                whileHover="hover"
            />

            <div
                className="relative bg-zinc-900/90 overflow-hidden"
                style={{
                    clipPath:
                        "polygon(12px 0%, calc(100% - 12px) 0%, 100% 12px, 100% calc(100% - 12px), calc(100% - 12px) 100%, 12px 100%, 0% calc(100% - 12px), 0% 12px)",
                }}
            >
                {/* Grouped Dots - Bottom Right Corner */}
                <div
                    className="absolute flex flex-col gap-1"
                    style={{
                        bottom: "6%",
                        right: "4%",
                    }}
                >
                    <div className="flex gap-1.5">
                        {[0, 1].map(i => (
                            <div
                                key={`row1-${i}`}
                                className="w-px h-px rounded-full"
                                style={{
                                    backgroundColor: "#9D00FF",
                                    boxShadow: "0 0 4px #9D00FF, 0 0 8px rgba(157, 0, 255, 0.6)",
                                    animation: `dotPulse 2s ease-in-out infinite ${i * 0.3}s`,
                                }}
                            />
                        ))}
                    </div>
                    <div className="flex gap-1.5">
                        {[0, 1].map(i => (
                            <div
                                key={`row2-${i}`}
                                className="w-px h-px rounded-full"
                                style={{
                                    backgroundColor: "#9D00FF",
                                    boxShadow: "0 0 4px #9D00FF, 0 0 8px rgba(157, 0, 255, 0.6)",
                                    animation: `dotPulse 2s ease-in-out infinite ${(i + 2) * 0.3}s`,
                                }}
                            />
                        ))}
                    </div>
                </div>
                <svg
                    className="absolute inset-0 w-full h-full pointer-events-none"
                    viewBox="0 0 400 80"
                    preserveAspectRatio="none"
                >
                    <defs>
                        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#9D00FF" stopOpacity="0.15" />
                            <stop offset="50%" stopColor="#9D00FF" stopOpacity="0.05" />
                            <stop offset="100%" stopColor="#9D00FF" stopOpacity="0" />
                        </linearGradient>
                    </defs>
                    <path
                        d="M8,0 L392,0 L400,8 L400,72 L392,80 L8,80 L0,72 L0,8 Z"
                        fill={`url(#${gradientId})`}
                        stroke="#9D00FF"
                        strokeWidth="1"
                        opacity="0.5"
                    />
                </svg>

                <button
                    onClick={onToggle}
                    className="relative w-full flex items-center justify-between p-5 md:p-6 text-left cursor-pointer"
                >
                    <span className="flex-1 font-space text-lg md:text-xl font-semibold text-white tracking-wide pr-4">
                        {item.question}
                    </span>
                    <motion.div
                        variants={iconVariants}
                        animate={isOpen ? "open" : "closed"}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        className="flex-shrink-0 p-1.5 md:p-2 rounded bg-zinc-800/50 flex items-center justify-center"
                    >
                        <Plus
                            size={14}
                            className="text-[#FF0066] drop-shadow-[0_0_6px_rgba(255,0,102,0.8)]"
                            strokeWidth={2.5}
                        />
                    </motion.div>
                </button>

                <AnimatePresence mode="wait">
                    {isOpen && (
                        <motion.div
                            variants={answerVariants}
                            initial="closed"
                            animate="open"
                            exit="closed"
                            className="grid grid-rows-[0fr] border-t border-white/10"
                        >
                            <div className="min-h-0 overflow-hidden">
                                <motion.p
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.1, duration: 0.3 }}
                                    className="px-5 md:px-6 pt-4 md:pt-6 pb-8 md:pb-10 text-base md:text-lg text-gray-300 leading-relaxed"
                                    style={{ fontFamily: "Inter, sans-serif" }}
                                >
                                    {item.answer}
                                </motion.p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    )
}

export default function FAQ() {
    const [openItemId, setOpenItemId] = useState<string | null>(null)

    const toggleItem = (id: string) => {
        setOpenItemId(prev => (prev === id ? null : id))
    }

    return (
        <section className="relative w-full py-16 md:py-24 overflow-hidden bg-zinc-950">
            <FloatingPathsBackground position={2} className="absolute inset-0 opacity-30">
                <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/50 via-zinc-950/30 to-zinc-950/60" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(157,0,255,0.1),_transparent_50%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_rgba(255,0,102,0.1),_transparent_50%)]" />
            </FloatingPathsBackground>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="relative z-10 max-w-7xl mx-auto px-6"
            >
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-8 md:mb-12 relative"
                >
                    <h2 className="font-space text-2xl md:text-3xl lg:text-4xl font-semibold text-white tracking-wide">
                        Frequently Asked Questions
                    </h2>
                    <div className="h-2 w-24 bg-gradient-to-r from-[#FF0066] to-[#FF69B4] mx-auto mt-4 rotate-[2deg] shadow-[0_0_15px_rgba(255,0,102,0.8)]" />
                </motion.div>

                <div className="relative">
                    <div className="absolute top-0 bottom-0 left-0 w-px bg-gradient-to-b from-transparent via-[#9D00FF]/50 to-transparent" />
                    <div className="absolute top-0 bottom-0 right-0 w-px bg-gradient-to-b from-transparent via-[#FF0066]/50 to-transparent" />

                    <div className="flex flex-col gap-4 md:gap-6 pl-4 pr-4">
                        {faqData.map((item, index) => (
                            <div key={item.id} className="relative">
                                {index > 0 && (
                                    <div className="absolute -top-2 left-8 right-8 h-px bg-gradient-to-r from-[#9D00FF]/0 via-[#9D00FF]/30 to-[#FF0066]/0" />
                                )}
                                <FAQItem
                                    item={item}
                                    isOpen={openItemId === item.id}
                                    onToggle={() => toggleItem(item.id)}
                                    index={index}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </motion.div>
        </section>
    )
}
