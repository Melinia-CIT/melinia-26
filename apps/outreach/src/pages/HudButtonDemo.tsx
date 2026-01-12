"use client"

import { motion } from "framer-motion"
import { HudButton } from "../components/ui/hud-button"

export default function HudButtonDemo() {
    const containerVariants: any = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.2,
            },
        },
    }

    const itemVariants: any = {
        hidden: {
            opacity: 0,
            y: 20,
            scale: 0.95,
        },
        visible: {
            opacity: 1,
            y: 0,
            scale: 1,
            transition: {
                type: "spring",
                stiffness: 400,
                damping: 25,
            },
        },
    }

    return (
        <div className="min-h-screen p-8 bg-zinc-950 flex items-center justify-center">
            <motion.div
                className="max-w-6xl w-full space-y-12"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                <motion.div variants={itemVariants} className="space-y-6">
                    <h2 className="text-2xl font-semibold text-white">Style 1 - Diagonal Design</h2>
                    <div className="flex flex-wrap gap-6 justify-center">
                        <HudButton
                            style="style1"
                            variant="primary"
                            onClick={() => console.log("Primary clicked!")}
                        >
                            Primary Button
                        </HudButton>
                        <HudButton
                            style="style1"
                            variant="secondary"
                            onClick={() => console.log("Secondary clicked!")}
                        >
                            Secondary Button
                        </HudButton>
                    </div>
                </motion.div>

                <motion.div variants={itemVariants} className="space-y-6">
                    <h2 className="text-2xl font-semibold text-white">
                        Style 2 - Hexagonal Design
                    </h2>

                    <div className="space-y-4">
                        <h3 className="text-lg font-medium text-white">Primary Variants</h3>
                        <div className="flex flex-wrap gap-6 justify-center">
                            <HudButton
                                style="style2"
                                variant="primary"
                                size="small"
                                onClick={() => console.log("Small primary clicked!")}
                            >
                                Small
                            </HudButton>
                            <HudButton
                                style="style2"
                                variant="primary"
                                size="default"
                                onClick={() => console.log("Default primary clicked!")}
                            >
                                Default
                            </HudButton>
                            <HudButton
                                style="style2"
                                variant="primary"
                                size="large"
                                onClick={() => console.log("Large primary clicked!")}
                            >
                                Large Button
                            </HudButton>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-lg font-medium text-white">Secondary Variants</h3>
                        <div className="flex flex-wrap gap-6 justify-center">
                            <HudButton
                                style="style2"
                                variant="secondary"
                                size="small"
                                onClick={() => console.log("Small secondary clicked!")}
                            >
                                Small
                            </HudButton>
                            <HudButton
                                style="style2"
                                variant="secondary"
                                size="default"
                                onClick={() => console.log("Default secondary clicked!")}
                            >
                                Default
                            </HudButton>
                            <HudButton
                                style="style2"
                                variant="secondary"
                                size="large"
                                onClick={() => console.log("Large secondary clicked!")}
                            >
                                Large Button
                            </HudButton>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </div>
    )
}
