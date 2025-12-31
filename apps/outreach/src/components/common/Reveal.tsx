import { motion } from "motion/react";
import { ReactNode } from "react";

interface RevealProps {
    children: ReactNode;
    width?: "fit-content" | "100%";
    delay?: number;
    duration?: number;
    distance?: number;
    direction?: "up" | "down" | "left" | "right";
}

export const Reveal = ({
    children,
    width = "100%",
    delay = 0.2,
    duration = 0.5,
    distance = 50,
    direction = "up"
}: RevealProps) => {
    const variants = {
        hidden: {
            opacity: 0,
            x: direction === "left" ? distance : direction === "right" ? -distance : 0,
            y: direction === "up" ? distance : direction === "down" ? -distance : 0,
        },
        visible: {
            opacity: 1,
            x: 0,
            y: 0,
        },
    };

    return (
        <div style={{ position: "relative", width }}>
            <motion.div
                variants={variants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-100px" }}
                transition={{
                    duration,
                    delay,
                    type: "spring",
                    damping: 25,
                    stiffness: 100
                }}
            >
                {children}
            </motion.div>
        </div>
    );
};

export default Reveal;
