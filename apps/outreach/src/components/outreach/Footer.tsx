import { motion } from "framer-motion"
import { MapPin, Mail, Phone, ArrowUpRight } from "iconoir-react"

const InstagramIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
)

const LinkedInIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M4.98 3.5c0 1.381-1.11 2.5-2.48 2.5s-2.48-1.119-2.48-2.5c0-1.38 1.11-2.5 2.48-2.5s2.48 1.12 2.48 2.5zm.02 4.5h-5v16h5v-16zm7.982 0h-4.968v16h4.969v-8.399c0-4.67 6.029-5.052 6.029 0v8.399h4.988v-10.131c0-7.88-8.922-7.593-11.018-3.714v-2.155z" />
    </svg>
)

interface ContactItemProps {
    icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>
    label: string
    value: string
    href: string
}

function ContactItem({ icon: Icon, label, value, href }: ContactItemProps) {
    const isExternal = href.startsWith("http")

    return (
        <a
            href={href}
            target={isExternal ? "_blank" : undefined}
            rel={isExternal ? "noopener noreferrer" : undefined}
            className="flex items-start gap-4 group cursor-pointer"
        >
            <Icon className="w-5 h-5 flex-shrink-0" style={{ fill: "url(#icon-gradient)" }} />
            <div>
                <p className="font-heading text-white text-sm md:text-base tracking-wide mb-1">
                    {label}
                </p>
                <p className="font-body text-gray-300 text-sm md:text-base leading-relaxed group-hover:text-[#FF69B4] transition-colors duration-300">
                    {value}
                </p>
            </div>
        </a>
    )
}

function QuickLinks() {
    const links = [
        { label: "Login", href: "/login" },
        { label: "Register", href: "/register" },
        { label: "Events", href: "/app/events" },
    ]

    return (
        <div className="flex flex-col gap-6">
            <h3 className="font-heading text-white text-lg md:text-2xl tracking-wider">
                Quick Links
            </h3>
            <div className="flex flex-col gap-4">
                {links.map(link => (
                    <a
                        key={link.label}
                        href={link.href}
                        className="flex items-center gap-2 group cursor-pointer"
                    >
                        <span className="font-body text-gray-300 text-sm md:text-base group-hover:text-[#FF69B4] transition-colors duration-300">
                            {link.label}
                        </span>
                        <ArrowUpRight className="w-4 h-4 text-gray-400 group-hover:text-[#FF69B4] group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-all duration-300" />
                    </a>
                ))}
            </div>
        </div>
    )
}

function SocialLinks() {
    const socialLinks = [
        { href: "https://www.instagram.com/melinia.cit", icon: InstagramIcon, label: "Instagram" },
        {
            href: "https://www.linkedin.com/company/melinia-cit",
            icon: LinkedInIcon,
            label: "LinkedIn",
        },
    ]

    return (
        <div className="flex flex-col gap-6">
            <h3 className="font-heading text-white text-lg md:text-2xl tracking-wider">Social</h3>
            <div className="flex flex-col gap-4">
                {socialLinks.map(social => (
                    <a
                        key={social.label}
                        href={social.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 group cursor-pointer"
                    >
                        <social.icon className="w-5 h-5 text-gray-400 group-hover:text-[#FF69B4] transition-colors duration-300" />
                        <span className="font-body text-gray-300 text-sm md:text-base group-hover:text-[#FF69B4] transition-colors duration-300">
                            {social.label}
                        </span>
                    </a>
                ))}
            </div>
        </div>
    )
}

export default function Footer() {
    return (
        <section className="relative w-full overflow-hidden bg-zinc-950">
            <div className="absolute -top-24 -right-16 inset-0 z-0">
                <img
                    src="https://cdn.melinia.in/spiderman.webp"
                    alt=""
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-zinc-950/70" />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-zinc-950/20 to-zinc-950" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="relative z-10 max-w-7xl mx-auto px-6 py-8"
            >
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-12 relative"
                >
                    <h2 className="font-heading text-3xl md:text-4xl font-semibold text-white tracking-wide">
                        Get in Touch
                    </h2>
                    <div className="h-2 w-24 bg-gradient-to-r from-[#FF0066] to-[#FF69B4] mx-auto mt-4 rotate-[-2deg] shadow-[0_0_15px_rgba(255,0,102,0.8)]" />
                </motion.div>

                {/* Row 1: Contact, Quick Links, Phone */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
                    <div className="flex flex-col gap-6">
                        <h3 className="font-heading text-white text-lg md:text-2xl tracking-wider">
                            Contact
                        </h3>
                        <ContactItem
                            icon={MapPin}
                            label="Location"
                            value="Civil Aerodrome Post, Coimbatore, Tamilnadu, India – 641 014"
                            href="https://maps.google.com/?q=Coimbatore+Institute+of+Technology"
                        />
                        <ContactItem
                            icon={Mail}
                            label="Email"
                            value="helpdesk@melinia.in"
                            href="mailto:helpdesk@melinia.in"
                        />
                        <ContactItem
                            icon={Phone}
                            label="Phone"
                            value="+91 9597970123"
                            href="tel:+919597970123"
                        />
                    </div>

                    <QuickLinks />

                    <SocialLinks />
                </div>

                {/* Row 2: Map spanning full width */}
                <div>
                    <iframe
                        src="https://maps.google.com/maps?q=Coimbatore%20Institute%20of%20Technology&t=&z=15&ie=UTF8&iwloc=&output=embed"
                        className="w-full h-64 md:h-80 rounded-xl border border-white/10 shadow-2xl"
                        style={{ border: 0 }}
                        allowFullScreen
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                    />
                </div>

                <div className="mt-8 md:mt-16 pt-4 md:pt-8 border-t border-white/10 text-center px-4">
                    <p className="font-body text-gray-500 text-xs sm:text-sm md:text-base tracking-wide">
                        Copyright &copy; Melinia 2026 Department of Computing
                    </p>
                </div>
            </motion.div>

            <svg className="hidden">
                <defs>
                    <linearGradient id="icon-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#FF0066" />
                        <stop offset="100%" stopColor="#FF69B4" />
                    </linearGradient>
                </defs>
            </svg>
        </section>
    )
}
