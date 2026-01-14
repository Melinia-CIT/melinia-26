import React from "react"
import toast, { Toaster, ToastBar, Toast } from "react-hot-toast"
import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion"
import { Xmark } from "iconoir-react";

const ToastContent = ({ t }: { t: Toast }) => {
    const x = useMotionValue(0)
    const opacity = useTransform(x, [-150, 0, 150], [0, 1, 0])
    const pointerType = React.useRef<string | null>(null)

    const handlePointerDown = (e: React.PointerEvent) => {
        if (pointerType.current === null) {
            pointerType.current = e.pointerType
        }
    }

    const handleDragEnd = (_e: MouseEvent | TouchEvent | PointerEvent, { offset, velocity }: PanInfo) => {
        const swipe = Math.abs(offset.x) > 100
        const flick = Math.abs(velocity.x) > 400
        const isClick = pointerType.current === "mouse" &&
            Math.abs(offset.x) < 5 && Math.abs(offset.y) < 5

        if (swipe || flick || isClick) {
            toast.dismiss(t.id)
        }
        pointerType.current = null
    }

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={1}
            onPointerDown={handlePointerDown}
            onDragEnd={handleDragEnd}
            style={{ x, opacity, cursor: "grab" }}
            whileTap={{ cursor: "grabbing" }}
        >
            <ToastBar toast={t}>
                {({ icon, message }) => (
                    <div className="flex items-center w-full gap-2 min-w-0">
                        {icon}
                        <div className="flex-1 truncate">{message}</div>
                        {t.type !== "loading" && (
                            <button
                                onClick={() => toast.dismiss(t.id)}
                                className="text-gray-500 hover:text-gray-400 px-1 p-0.5 rounded-md hover:bg-white/10 transition-colors flex-shrink-0"
                            >
                                <Xmark height={16} width={16} strokeWidth={2} />
                            </button>
                        )}
                    </div>
                )}
            </ToastBar>
        </motion.div>
    )
}

const GestureToaster = () => (
    <Toaster
        position="top-center"
        reverseOrder={false}
        gutter={8}
        toastOptions={{
            duration: 5000,
            style: {
                background: "rgba(24, 24, 27, 0.85)",
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
                color: "#fafafa",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.5)",
                borderRadius: "12px",
                padding: "14px 16px",
                fontSize: "15px",
            },
            success: {
                iconTheme: { primary: "#4ade80", secondary: "#18181b" },
            },
            error: {
                iconTheme: { primary: "#f87171", secondary: "#18181b" },
            },
        }}
    >
        {(t) => <ToastContent t={t} />}
    </Toaster>
)

export default GestureToaster;

