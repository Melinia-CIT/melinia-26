import { cn } from "../../lib/utils"

type Logo = {
    src: string
    alt: string
    href?: string
    width?: number
    height?: number
}

type LogoCloudProps = React.ComponentProps<"div"> & {
    logos?: Logo[]
}

export function LogoCloud({ className, logos, ...props }: LogoCloudProps) {
    const defaultLogos: Logo[] = [
        {
            src: "https://cdn.prod.website-files.com/6460e45975a21d411d2a643a/646510dbf4087793bd721c37_Group%20(3).svg",
            alt: "ShellKode logo",
            href: "https://shellkode.com",
        },
        {
            src: "https://podu.pics/kc_JVVRk9V",
            alt: "Privacy logo",
            href: "https://www.privacyweave.in/",
        },
        {
            src: "https://podu.pics/LEx71JYvOY",
            alt: "Lenova",
            href: "https://lenovo.com",
        },
    ]

    const displayLogos = logos || defaultLogos

    return (
        <div
            className={cn("relative grid grid-cols-1 md:grid-cols-3 gap-8 mt-6", className)}
            {...props}
        >
            {displayLogos.map((logo, index) => (
                <LogoCard key={index} logo={logo} />
            ))}
        </div>
    )
}

type LogoCardProps = React.ComponentProps<"div"> & {
    logo: Logo
}

function LogoCard({ logo, className, children, ...props }: LogoCardProps) {
    const content = (
        <img
            alt={logo.alt}
            className="pointer-events-none h-12 md:h-16 lg:h-20 select-none md:brightness-0 md:invert max-w-[180px] object-contain transition-transform duration-300 hover:scale-110"
            height={logo.height || "auto"}
            src={logo.src}
            width={logo.width || "auto"}
        />
    )

    if (logo.href) {
        return (
            <a
                href={logo.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center bg-background px-8 py-12 md:px-12 md:py-16"
            >
                {content}
            </a>
        )
    }

    return (
        <div
            className={
                "flex items-center justify-center bg-background px-8 py-12 md:px-12 md:py-16"
            }
            {...props}
        >
            {content}
            {children}
        </div>
    )
}
