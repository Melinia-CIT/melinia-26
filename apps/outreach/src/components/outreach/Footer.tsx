import { motion } from "framer-motion"
import { MapPin, Mail, ArrowRight } from "iconoir-react"
import { FloatingPathsBackground } from "../ui/floating-paths"

type FooterPerson = {
    name: string
    role: string
    phoneDisplay: string
    phoneHref: string
}

const footerContactPersons: FooterPerson[] = [
    {
        name: "Ratheesh Kumar S",
        role: "Chairperson, SS",
        phoneDisplay: "+91 95979 70123",
        phoneHref: "tel:+919597970123",
    },
    {
        name: "Omega S",
        role: "Chairperson, DCS",
        phoneDisplay: "+91 77082 75886",
        phoneHref: "tel:+917708275886",
    },
    {
        name: "Shree Kottes J",
        role: "Technical Lead",
        phoneDisplay: "+91 94429 28955",
        phoneHref: "tel:+919442928955",
    },
]

const InstagramIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <title>Instagram</title>
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
)

const LinkedInIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <title>LinkedIn</title>
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
            <Icon className="w-5 h-5 flex-shrink-0 text-white/60 group-hover:text-[#FF0066] transition-colors" />
            <div>
                <p
                    className="text-white/60 text-xs uppercase tracking-widest mb-1"
                    style={{ fontFamily: "Space Grotesk, sans-serif" }}
                >
                    {label}
                </p>
                <p
                    className="text-gray-200 text-sm md:text-base leading-relaxed group-hover:text-[#FF69B4] transition-colors duration-300"
                    style={{ fontFamily: "Inter, sans-serif" }}
                >
                    {value}
                </p>
            </div>
        </a>
    )
}

function PersonContactCard({ person }: { person: FooterPerson }) {
    return (
        <a href={person.phoneHref} className="group cursor-pointer block">
            <p
                className="text-gray-200 text-base md:text-lg font-medium mb-1 group-hover:text-white transition-colors duration-300"
                style={{ fontFamily: "Inter, sans-serif" }}
            >
                {person.name}
            </p>
            <p
                className="text-white/60 text-[10px] uppercase tracking-widest mb-2"
                style={{ fontFamily: "Space Grotesk, sans-serif" }}
            >
                {person.role}
            </p>
            <p
                className="text-white text-lg md:text-xl font-light group-hover:text-[#FF69B4] transition-colors duration-300"
                style={{ fontFamily: "Inter, sans-serif" }}
            >
                {person.phoneDisplay}
            </p>
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
            <h3 className="font-space text-white text-lg md:text-xl tracking-wider flex items-center gap-2">
                <span className="w-1 h-6 bg-[#FF0066]" />
                Quick Links
            </h3>
            <div className="flex flex-col gap-2">
                {links.map(link => (
                    <a
                        key={link.label}
                        href={link.href}
                        className="flex items-center gap-3 group cursor-pointer p-2 -mx-2 rounded hover:bg-white/5 transition-all"
                    >
                        <ArrowRight className="w-4 h-4 text-[#9D00FF] group-hover:translate-x-1 transition-transform" />
                        <span
                            className="text-gray-300 text-sm md:text-base group-hover:text-white transition-colors"
                            style={{ fontFamily: "Inter, sans-serif" }}
                        >
                            {link.label}
                        </span>
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
            <h3 className="font-space text-white text-lg md:text-xl tracking-wider flex items-center gap-2">
                <span className="w-1 h-6 bg-[#9D00FF]" />
                Socials
            </h3>
            <div className="flex gap-3">
                {socialLinks.map(social => (
                    <a
                        key={social.label}
                        href={social.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={social.label}
                        className="group cursor-pointer bg-white/5 hover:bg-white/10 p-3 rounded-lg border border-white/5 hover:border-[#FF0066]/50 transition-all duration-300 hover:scale-110"
                    >
                        <social.icon className="w-5 h-5 text-gray-400 group-hover:text-[#FF69B4] transition-colors" />
                    </a>
                ))}
            </div>
        </div>
    )
}

export default function Footer() {
    return (
        <section className="relative w-full overflow-hidden bg-zinc-950 border-t border-white/10">
            {/* Spiderman Background Image */}
            <div className="absolute inset-0 z-0">
                <img
                    src="https://cdn.melinia.in/spiderman.webp"
                    alt=""
                    className="w-full h-full object-cover opacity-40"
                />
                <div className="absolute inset-0 bg-zinc-950/50" />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-zinc-950/40 to-zinc-950/20" />
            </div>

            <FloatingPathsBackground position={1} className="absolute inset-0 opacity-20">
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/30 via-transparent to-transparent" />
            </FloatingPathsBackground>

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="relative z-10 max-w-7xl mx-auto px-6 py-16 md:py-24"
            >
                {/* Row 1: Brand, Contact, Links & Social */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 mb-16">
                    {/* Brand & Contact Column */}
                    <div className="lg:col-span-6 flex flex-col gap-8">
                        <div>
                            <motion.img
                                src="https://cdn.melinia.in/mln-logo.svg"
                                alt="Melinia'26"
                                className="w-48 md:w-56 mb-8"
                                initial={{ opacity: 0, scale: 0.9 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6 }}
                            />
                            <p
                                className="text-gray-400 max-w-sm"
                                style={{ fontFamily: "Inter, sans-serif" }}
                            >
                                Where innovation meets excellence. Join us for the ultimate
                                technical symposium.
                            </p>
                        </div>

                        <div className="flex flex-col gap-4">
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
                        </div>
                    </div>

                    {/* Links & Social Column */}
                    <div className="lg:col-span-6 lg:pl-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <QuickLinks />
                            <SocialLinks />
                        </div>
                    </div>
                </div>

                {/* Row 2: Contact Persons - Full Width */}
                <div className="mb-16">
                    <h3 className="font-space text-white text-lg md:text-xl tracking-wider flex items-center gap-2 mb-6">
                        <span className="w-1 h-6 bg-[#FF0066]" />
                        Contacts
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                        {footerContactPersons.map(person => (
                            <PersonContactCard key={person.phoneHref} person={person} />
                        ))}
                    </div>
                </div>

                {/* Row 3: Map - Full Width */}
                <div className="mb-16">
                    <h3 className="font-space text-white text-lg md:text-xl tracking-wider flex items-center gap-2 mb-6">
                        <span className="w-1 h-6 bg-white" />
                        Find Us
                    </h3>
                    <div className="relative group overflow-hidden border border-white/10 hover:border-[#FF0066]/50 transition-colors duration-500 shadow-2xl">
                        {/* HUD Corners */}
                        <div className="absolute top-0 left-0 w-8 h-8 border-l-[3px] border-t-[3px] border-[#FF0066] z-20 drop-shadow-[0_0_8px_rgba(255,0,102,0.8)]" />
                        <div className="absolute top-0 right-0 w-8 h-8 border-r-[3px] border-t-[3px] border-[#9D00FF] z-20 drop-shadow-[0_0_8px_rgba(157,0,255,0.8)]" />
                        <div className="absolute bottom-0 left-0 w-8 h-8 border-l-[3px] border-b-[3px] border-[#9D00FF] z-20 drop-shadow-[0_0_8px_rgba(157,0,255,0.8)]" />
                        <div className="absolute bottom-0 right-0 w-8 h-8 border-r-[3px] border-b-[3px] border-[#FF0066] z-20 drop-shadow-[0_0_8px_rgba(255,0,102,0.8)]" />

                        <iframe
                            title="Google Maps Location"
                            src="https://maps.google.com/maps?q=Coimbatore%20Institute%20of%20Technology&t=&z=15&ie=UTF8&iwloc=&output=embed"
                            className="w-full h-64 md:h-80 transition-all duration-500"
                            style={{ border: 0 }}
                            allowFullScreen
                            referrerPolicy="no-referrer-when-downgrade"
                        />
                    </div>
                </div>

                {/* Footer Bottom */}
                <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
                    <p
                        className="text-gray-500 text-xs md:text-sm tracking-wide"
                        style={{ fontFamily: "Inter, sans-serif" }}
                    >
                        Copyright &copy; Melinia 2026 Department of Computing
                    </p>
                    <div className="flex items-center gap-6">
                        <div className="h-1 w-1 rounded-full bg-[#FF0066]" />
                        <p className="font-space text-gray-600 text-xs uppercase tracking-widest">
                            Melinia'26 Dev Team
                        </p>
                        <div className="h-1 w-1 rounded-full bg-[#9D00FF]" />
                    </div>
                </div>
            </motion.div>
        </section>
    )
}
