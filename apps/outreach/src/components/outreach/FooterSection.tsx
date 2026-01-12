import { motion } from "framer-motion"
import { MapPin, Mail, Phone, ArrowUpRight } from "iconoir-react"

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
                <p className="font-heading text-white text-sm tracking-wide mb-1">{label}</p>
                <p className="font-body text-gray-300 text-sm leading-relaxed group-hover:text-[#FF69B4] transition-colors duration-300">
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
            <h3 className="font-heading text-white text-lg tracking-wider">Quick Links</h3>
            <div className="flex flex-col gap-4">
                {links.map(link => (
                    <a
                        key={link.label}
                        href={link.href}
                        className="flex items-center gap-2 group cursor-pointer"
                    >
                        <span className="font-body text-gray-300 text-sm group-hover:text-[#FF69B4] transition-colors duration-300">
                            {link.label}
                        </span>
                        <ArrowUpRight className="w-4 h-4 text-gray-400 group-hover:text-[#FF69B4] group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-all duration-300" />
                    </a>
                ))}
            </div>
        </div>
    )
}

export default function FooterSection() {
    return (
        <section className="relative w-full overflow-hidden bg-zinc-950">
            <div className="absolute inset-0 z-0">
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
                className="relative z-10 max-w-7xl mx-auto px-6 py-16"
            >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                    <div>
                        <iframe
                            src="https://maps.google.com/maps?q=Coimbatore%20Institute%20of%20Technology&t=&z=15&ie=UTF8&iwloc=&output=embed"
                            className="w-full h-64 md:h-80 lg:h-96 rounded-xl border border-white/10 shadow-2xl"
                            style={{ border: 0 }}
                            allowFullScreen
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                        />
                    </div>

                    <div className="flex flex-col gap-6">
                        <h3 className="font-heading text-white text-lg tracking-wider">Contact</h3>
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
                </div>

                <div className="mt-16 pt-8 border-t border-white/10 text-center">
                    <p className="font-body text-gray-500 text-sm tracking-wide">
                        &copy; Melinia 2026 Department of Computing
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
