import { motion } from "framer-motion"
import { useNavigate } from "react-router-dom"
import { useState, useEffect, useRef } from "react"
import { HudButton } from "../../components/ui/hud-button"
import { MouseScrollWheel } from "iconoir-react"

const Hero = () => {
    const navigate = useNavigate()
    const [isLogoHovered, setIsLogoHovered] = useState(false)
    const [videoPoster, setVideoPoster] = useState<string | null>(null)
    const [isVideoLoaded, setIsVideoLoaded] = useState(false)
    const videoRef = useRef<HTMLVideoElement>(null)

    useEffect(() => {
        const video = document.createElement("video")
        video.src = "https://cdn.melinia.in/mln-hero.mp4"
        video.muted = true
        video.crossOrigin = "anonymous"

        const handleLoaded = () => {
            video.currentTime = 0
        }

        const handleSeeked = () => {
            const canvas = document.createElement("canvas")
            canvas.width = video.videoWidth
            canvas.height = video.videoHeight
            const ctx = canvas.getContext("2d")
            if (ctx) {
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
                const posterUrl = canvas.toDataURL("image/jpeg", 0.8)
                setVideoPoster(posterUrl)
            }
            video.removeEventListener("loadeddata", handleLoaded)
            video.removeEventListener("seeked", handleSeeked)
        }

        video.addEventListener("loadeddata", handleLoaded)
        video.addEventListener("seeked", handleSeeked)
        video.load()

        return () => {
            video.removeEventListener("loadeddata", handleLoaded)
            video.removeEventListener("seeked", handleSeeked)
        }
    }, [])
    return (
        <section className="relative min-h-screen w-full overflow-hidden">
            {/* Video Background */}
            <div className="absolute inset-0 w-full h-full z-0">
                {/* Poster/First Frame Background */}
                {videoPoster && (
                    <img
                        src={videoPoster}
                        alt=""
                        className="absolute inset-0 w-full h-full object-cover"
                        style={{ opacity: isVideoLoaded ? 0 : 1 }}
                    />
                )}

                <video
                    ref={videoRef}
                    autoPlay
                    loop
                    muted
                    playsInline
                    onLoadedData={() => setIsVideoLoaded(true)}
                    className="absolute inset-0 w-full h-full object-cover"
                >
                    <source src="https://cdn.melinia.in/mln-hero.mp4" type="video/mp4" />
                </video>
            </div>

            {/* Cinematic Overlay - Multi-layer gradient */}
            <div className="absolute inset-0 z-10 bg-gradient-to-b from-zinc-950/70 via-zinc-950/50 to-zinc-950/30" />
            <div className="absolute inset-0 z-10 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(3,7,30,0.4)_70%,rgba(3,7,30,0.9)_100%)]" />

            {/* Top Left Corner - College Info */}
            <div className="absolute top-4 md:top-6 left-4 md:left-6 z-20 flex flex-col items-start gap-2 md:gap-3">
                <div className="flex items-center gap-2 md:gap-3">
                    <img
                        src="https://cdn.melinia.in/cit.webp"
                        alt="CIT"
                        className="h-8 md:h-10 lg:h-12 w-auto object-contain"
                    />
                    <div className="h-6 md:h-8 w-[2px] bg-white" />
                    <img
                        src="https://cdn.melinia.in/melinia-top-logo.webp"
                        alt="Melinia"
                        className="h-8 md:h-10 lg:h-12 w-auto object-contain"
                    />
                </div>
                <p className="font-heading text-white text-xs md:text-sm lg:text-base tracking-wide border-b border-white pb-1">
                    DEPARTMENT OF COMPUTING
                </p>
            </div>

            {/* Main Content */}
            <div className="relative z-20 flex flex-col items-center justify-center min-h-screen px-6 py-12">
                {/* Main Logo with Shimmer and Hover Effects */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.8, filter: "blur(10px)" }}
                    animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="relative cursor-pointer"
                    onHoverStart={() => setIsLogoHovered(true)}
                    onHoverEnd={() => setIsLogoHovered(false)}
                >
                    <motion.div
                        whileHover={{ scale: 1.02 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                        className="relative"
                    >
                        {/* Logo Image */}
                        <motion.img
                            src="https://cdn.melinia.in/mln-logo.svg"
                            alt="Melinia'26"
                            className="w-64 md:w-80 lg:w-[22rem] xl:w-[26rem] 2xl:w-[32rem]"
                            whileHover={{
                                filter: isLogoHovered
                                    ? "brightness(1.1) drop-shadow(0 0 20px rgba(157,0,255,0.5))"
                                    : "brightness(1)",
                            }}
                            transition={{ duration: 0.3 }}
                        />

                        {/* Shimmer Effect with mask */}
                        <motion.div
                            className="absolute inset-0 overflow-hidden pointer-events-none"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 1, duration: 0.5 }}
                            style={{
                                maskImage: "url(https://cdn.melinia.in/mln-logo.svg)",
                                maskSize: "contain",
                                maskRepeat: "no-repeat",
                                maskPosition: "center",
                                WebkitMaskImage: "url(https://cdn.melinia.in/mln-logo.svg)",
                                WebkitMaskSize: "contain",
                                WebkitMaskRepeat: "no-repeat",
                                WebkitMaskPosition: "center",
                            }}
                        >
                            <motion.div
                                className="absolute inset-0 w-full h-full"
                                style={{
                                    background:
                                        "linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.25) 50%, transparent 70%)",
                                }}
                                animate={{
                                    x: ["-100%", "100%"],
                                }}
                                transition={{
                                    duration: 3,
                                    repeat: Infinity,
                                    repeatDelay: 4,
                                    ease: "easeInOut",
                                }}
                            />
                        </motion.div>

                        {/* Hover Glow Effect */}
                        {isLogoHovered && (
                            <motion.div
                                className="absolute inset-0"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                style={{
                                    background: `radial-gradient(circle at center, rgba(157, 0, 255, 0.2) 0%, transparent 70%)`,
                                    filter: "blur(20px)",
                                }}
                            />
                        )}
                    </motion.div>

                    {/* Buttons - Positioned relative to logo bottom */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, duration: 0.6 }}
                        className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-[140%] flex flex-col md:flex-row gap-6 w-full max-w-md items-center justify-center"
                    >
                        <HudButton
                            style="style1"
                            variant="purple"
                            onClick={() => navigate("/login")}
                            delay={0.4}
                        >
                            Login
                        </HudButton>

                        <HudButton
                            style="style1"
                            variant="red"
                            onClick={() => navigate("/register")}
                            delay={0.5}
                        >
                            Register
                        </HudButton>
                    </motion.div>
                </motion.div>

                {/* Scroll Mouse Icon - Bottom Center */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.5, duration: 0.5 }}
                    className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20"
                >
                    <motion.div
                        animate={{ y: [0, -10, 0] }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut",
                        }}
                        className="text-white transition-colors cursor-pointer"
                    >
                        <MouseScrollWheel
                            width={24}
                            height={24}
                            strokeWidth={1.5}
                            className="md:w-[32px] md:h-[32px]"
                        />
                    </motion.div>
                </motion.div>

                <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-zinc-950 via-zinc-950/90 to-transparent pointer-events-none z-20" />
            </div>
        </section>
    )
}

export default Hero
