import { motion } from "framer-motion"
import { FloatingPathsBackground } from "../ui/floating-paths"

type Sponsor = {
    src: string
    alt: string
    href: string
}

const sponsors: Sponsor[] = [
    {
        src: "https://cdn.melinia.in/kla-corp.svg",
        alt: "KLA Corporation",
        href: "https://www.kla.com",
    },
    {
        src: "https://cdn.melinia.in/aivar.webp",
        alt: "Aivar Innovations",
        href: "https://aivar.tech",
    },
    {
        src: "https://cdn.melinia.in/shellkode.svg",
        alt: "ShellKode",
        href: "https://www.shellkode.com",
    },
    {
        src: "https://cdn.melinia.in/privacyweave.png",
        alt: "PrivacyWeave",
        href: "https://www.privacyweave.in/",
    },
    {
        src: "https://cdn.melinia.in/gal_cl.png",
        alt: "Galaxy Computer Land",
        href: "https://www.gclcbe.com/",
    },
    {
        src: "https://cdn.melinia.in/profitstory.avif",
        alt: "profitstory.ai",
        href: "https://www.profitstory.ai/",
    },
]

export default function Sponsors() {
    const klaSponsor = sponsors.find(sponsor => sponsor.alt === "KLA Corporation") || sponsors[0]
    const privacyWeaveSponsor =
        sponsors.find(sponsor => sponsor.alt === "PrivacyWeave") || sponsors[2]
    const shellKodeSponsor = sponsors.find(sponsor => sponsor.alt === "ShellKode") || sponsors[1]
    const aivarSponsor =
        sponsors.find(sponsor => sponsor.alt === "Aivar Innovations") || sponsors[1]
    const profitStorySponsor =
        sponsors.find(sponsor => sponsor.alt === "profitstory.ai") || sponsors[4]
    const galaxySponsor =
        sponsors.find(sponsor => sponsor.alt === "Galaxy Computer Land") || sponsors[3]
    const cardBaseClassName =
        "flex items-center justify-center bg-white rounded-xl sm:rounded-2xl border border-black/10 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 w-full sm:w-auto overflow-hidden"
    const platinumCardClassName = `${cardBaseClassName} px-4 py-3 sm:px-5 sm:py-4 md:px-6 md:py-5 max-w-[240px] sm:max-w-[260px] md:max-w-[280px] min-h-[88px] sm:min-h-[96px] md:min-h-[104px]`
    const goldCardClassName = `${cardBaseClassName} px-3 py-2 sm:px-4 sm:py-3 md:px-5 md:py-4 max-w-[220px] sm:max-w-[240px] md:max-w-[260px] min-h-[72px] sm:min-h-[80px] md:min-h-[96px]`
    const silverCardClassName = `${cardBaseClassName} px-3 py-2 sm:px-4 sm:py-3 md:px-4 md:py-3 max-w-[200px] sm:max-w-[220px] md:max-w-[240px] min-h-[68px] sm:min-h-[76px] md:min-h-[84px]`
    const bronzeCardClassName = `${cardBaseClassName} px-3 py-2 sm:px-3 sm:py-2 md:px-4 md:py-2 max-w-[180px] sm:max-w-[200px] md:max-w-[220px] min-h-[64px] sm:min-h-[72px] md:min-h-[80px]`
    const getLogoClassName = (alt: string) =>
        alt === "PrivacyWeave"
            ? "h-8 sm:h-9 md:h-11 lg:h-12 w-[160px] sm:w-[180px] md:w-[200px] lg:w-[220px] object-cover rounded-lg"
            : alt === "Aivar Innovations"
              ? "h-17 sm:h-19 md:h-21 lg:h-23 w-17 sm:w-19 md:w-21 lg:w-23 object-contain"
              : alt === "profitstory.ai"
                ? "h-7 sm:h-8 md:h-10 lg:h-11 w-[150px] sm:w-[170px] md:w-[190px] lg:w-[200px] object-contain scale-[2.2]"
                : alt === "Galaxy Computer Land"
                  ? "h-6 sm:h-7 md:h-8 lg:h-9 w-[130px] sm:w-[150px] md:w-[170px] lg:w-[180px] object-contain"
                  : "h-7 sm:h-8 md:h-10 lg:h-12 w-auto max-w-[140px] sm:max-w-[160px] md:max-w-[180px] lg:max-w-[200px] object-contain"

    return (
        <section className="relative w-full py-12 md:py-16 lg:py-24 overflow-hidden bg-zinc-950">
            <FloatingPathsBackground position={2} mirror={true} className="absolute inset-0">
                <div className="absolute inset-0" />
            </FloatingPathsBackground>
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6"
            >
                <div className="flex flex-col items-center">
                    <h2 className="font-space text-2xl md:text-3xl lg:text-4xl font-semibold text-white tracking-wide">
                        Our Sponsors
                    </h2>
                    <div className="h-1.5 sm:h-2 w-20 sm:w-28 bg-gradient-to-r from-[#FF0066] to-[#FF69B4] mx-auto mt-3 sm:mt-4 rotate-[2deg] shadow-[0_0_15px_rgba(255,0,102,0.8)]" />

                    <div className="mt-8 sm:mt-10 md:mt-12 text-center">
                        <h3 className="font-space text-base sm:text-lg md:text-xl font-bold uppercase tracking-[0.25em] bg-gradient-to-r from-[#B8860B] via-[#FFD700] to-[#FFB300] bg-clip-text text-transparent">
                            Elite
                        </h3>
                        <div className="h-0.5 w-16 sm:w-20 bg-gradient-to-r from-transparent via-[#FFD700] to-transparent mx-auto mt-2" />
                    </div>
                    {/* KLA Logo - Larger, First Row */}
                    <div className="mt-4 sm:mt-6 md:mt-8 mb-8 sm:mb-10 md:mb-12 lg:mb-16 flex justify-center w-full">
                        <a
                            href={klaSponsor.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group relative block bg-white rounded-xl sm:rounded-2xl border border-black/10 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 px-8 py-5 sm:px-12 sm:py-4 md:px-16 md:py-6 lg:px-20 lg:py-8"
                        >
                            <motion.div
                                className="absolute inset-0 overflow-hidden pointer-events-none rounded-xl sm:rounded-2xl z-20"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.4, duration: 0.5 }}
                            >
                                <motion.div
                                    className="absolute inset-0 opacity-60 mix-blend-multiply"
                                    style={{
                                        background:
                                            "linear-gradient(120deg, transparent 30%, rgba(0,0,0,0.18) 50%, transparent 70%)",
                                    }}
                                    animate={{
                                        x: ["-120%", "120%"],
                                    }}
                                    transition={{
                                        duration: 1.6,
                                        repeat: Infinity,
                                        repeatDelay: 4,
                                        ease: "easeInOut",
                                    }}
                                />
                            </motion.div>
                            <div className="relative z-10">
                                {/* Logo Image */}
                                <img
                                    src={klaSponsor.src}
                                    alt={klaSponsor.alt}
                                    className="relative z-10 h-12 w-[220px] sm:h-12 sm:w-auto md:h-14 lg:h-16 object-contain"
                                />

                                {/* Shimmer Effect with mask - only on logo */}
                                <motion.div
                                    className="absolute inset-0 overflow-hidden pointer-events-none"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.6, duration: 0.5 }}
                                    style={{
                                        maskImage: `url(${klaSponsor.src})`,
                                        maskSize: "contain",
                                        maskRepeat: "no-repeat",
                                        maskPosition: "center",
                                        WebkitMaskImage: `url(${klaSponsor.src})`,
                                        WebkitMaskSize: "contain",
                                        WebkitMaskRepeat: "no-repeat",
                                        WebkitMaskPosition: "center",
                                    }}
                                >
                                    <motion.div
                                        className="absolute inset-0 w-full h-full opacity-90"
                                        style={{
                                            background:
                                                "linear-gradient(120deg, transparent 25%, rgba(255,255,255,0.65) 50%, transparent 75%)",
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
                            </div>
                        </a>
                    </div>

                    <div className="text-center">
                        <h3 className="font-space text-base sm:text-lg md:text-xl font-bold uppercase tracking-[0.25em] bg-gradient-to-r from-[#E5E4E2] via-[#F5F5F5] to-[#E5E4E2] bg-clip-text text-transparent">
                            Plantinum
                        </h3>
                        <div className="h-0.5 w-16 sm:w-20 bg-gradient-to-r from-transparent via-[#E5E4E2] to-transparent mx-auto mt-2" />
                    </div>
                    <div className="mt-4 sm:mt-6 md:mt-8 mb-8 sm:mb-10 md:mb-12 flex justify-center w-full">
                        <motion.a
                            key={aivarSponsor.alt}
                            href={aivarSponsor.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5 }}
                            className={platinumCardClassName}
                        >
                            <img
                                src={aivarSponsor.src}
                                alt={aivarSponsor.alt}
                                className={getLogoClassName(aivarSponsor.alt)}
                            />
                        </motion.a>
                    </div>

                    <div className="text-center">
                        <h3 className="font-space text-base sm:text-lg md:text-xl font-bold uppercase tracking-[0.25em] bg-gradient-to-r from-[#E8D9B0] via-[#F6E7C8] to-[#E8D9B0] bg-clip-text text-transparent">
                            Gold
                        </h3>
                        <div className="h-0.5 w-16 sm:w-20 bg-gradient-to-r from-transparent via-[#F6E7C8] to-transparent mx-auto mt-2" />
                    </div>
                    <div className="mt-4 sm:mt-6 md:mt-8 flex justify-center w-full">
                        <motion.a
                            key={privacyWeaveSponsor.alt}
                            href={privacyWeaveSponsor.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5 }}
                            className={goldCardClassName}
                        >
                            <img
                                src={privacyWeaveSponsor.src}
                                alt={privacyWeaveSponsor.alt}
                                className={getLogoClassName(privacyWeaveSponsor.alt)}
                            />
                        </motion.a>
                    </div>

                    <div className="mt-8 sm:mt-10 md:mt-12 text-center">
                        <h3 className="font-space text-base sm:text-lg md:text-xl font-bold uppercase tracking-[0.25em] bg-gradient-to-r from-[#C0C0C0] via-[#E8E8E8] to-[#C0C0C0] bg-clip-text text-transparent">
                            Silver
                        </h3>
                        <div className="h-0.5 w-16 sm:w-20 bg-gradient-to-r from-transparent via-[#C0C0C0] to-transparent mx-auto mt-2" />
                    </div>
                    <div className="mt-4 sm:mt-6 md:mt-8 flex flex-col sm:flex-row gap-6 sm:gap-8 w-full items-center justify-center">
                        {[profitStorySponsor, shellKodeSponsor].map((sponsor, index) => (
                            <motion.a
                                key={sponsor.alt}
                                href={sponsor.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                                className={silverCardClassName}
                            >
                                <img
                                    src={sponsor.src}
                                    alt={sponsor.alt}
                                    className={getLogoClassName(sponsor.alt)}
                                />
                            </motion.a>
                        ))}
                    </div>

                    <div className="mt-8 sm:mt-10 md:mt-12 text-center">
                        <h3 className="font-space text-base sm:text-lg md:text-xl font-bold uppercase tracking-[0.25em] bg-gradient-to-r from-[#B76E79] via-[#E6A8B0] to-[#B76E79] bg-clip-text text-transparent">
                            Bronze
                        </h3>
                        <div className="h-0.5 w-16 sm:w-20 bg-gradient-to-r from-transparent via-[#E6A8B0] to-transparent mx-auto mt-2" />
                    </div>
                    <div className="mt-4 sm:mt-6 md:mt-8 flex justify-center w-full">
                        <motion.a
                            key={galaxySponsor.alt}
                            href={galaxySponsor.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5 }}
                            className={bronzeCardClassName}
                        >
                            <img
                                src={galaxySponsor.src}
                                alt={galaxySponsor.alt}
                                className={getLogoClassName(galaxySponsor.alt)}
                            />
                        </motion.a>
                    </div>
                </div>
            </motion.div>
        </section>
    )
}
