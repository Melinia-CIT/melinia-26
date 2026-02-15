import { cn } from "../../lib/utils"

type Logo = {
    src: string
    alt: string
    width?: number
    height?: number
}

type LogoCloudProps = React.ComponentProps<"div">

export function LogoCloud({ className, ...props }: LogoCloudProps) {
    return (
        <div className={cn("relative grid grid-cols-2 md:grid-cols-4")} {...props}>
            <div className="-translate-x-1/2 -top-px pointer-events-none absolute left-1/2 w-screen" />

            <LogoCard
                className="relative border-r border-b bg-secondary dark:bg-secondary/30"
                logo={{
                    src: "https://cdn.prod.website-files.com/6460e45975a21d411d2a643a/646510dbf4087793bd721c37_Group%20(3).svg",
                    alt: "Nvidia Logo",
                }}
            ></LogoCard>

            <LogoCard
                className="border-b md:border-r"
                logo={{
                    src: "https://svgl.app/library/supabase_wordmark_light.svg",
                    alt: "Supabase Logo",
                }}
            />

            <LogoCard
                className="relative border-r border-b md:bg-secondary dark:md:bg-secondary/30"
                logo={{
                    src: "https://svgl.app/library/github_wordmark_light.svg",
                    alt: "GitHub Logo",
                }}
            ></LogoCard>

            <LogoCard
                className="relative border-b bg-secondary md:bg-background dark:bg-secondary/30 md:dark:bg-background"
                logo={{
                    src: "https://svgl.app/library/openai_wordmark_light.svg",
                    alt: "OpenAI Logo",
                }}
            />

            <LogoCard
                className="relative border-r border-b bg-secondary md:border-b-0 md:bg-background dark:bg-secondary/30 md:dark:bg-background"
                logo={{
                    src: "https://svgl.app/library/turso-wordmark-light.svg",
                    alt: "Turso Logo",
                }}
            ></LogoCard>

            <LogoCard
                className="border-b bg-background md:border-r md:border-b-0 md:bg-secondary dark:md:bg-secondary/30"
                logo={{
                    src: "https://svgl.app/library/clerk-wordmark-light.svg",
                    alt: "Clerk Logo",
                }}
            />

            <LogoCard
                className="border-r"
                logo={{
                    src: "https://svgl.app/library/claude-ai-wordmark-icon_light.svg",
                    alt: "Claude AI Logo",
                }}
            />

            <LogoCard
                className="bg-secondary dark:bg-secondary/30"
                logo={{
                    src: "https://svgl.app/library/vercel_wordmark.svg",
                    alt: "Vercel Logo",
                }}
            />
        </div>
    )
}

type LogoCardProps = React.ComponentProps<"div"> & {
    logo: Logo
}

function LogoCard({ logo, className, children, ...props }: LogoCardProps) {
    return (
        <div
            className={"flex items-center justify-center bg-background px-4 py-8 md:p-8"}
            {...props}
        >
            <img
                alt={logo.alt}
                className="pointer-events-none h-4 select-none md:h-5 dark:brightness-0 dark:invert"
                height={logo.height || "auto"}
                src={logo.src}
                width={logo.width || "auto"}
            />
            {children}
        </div>
    )
}
