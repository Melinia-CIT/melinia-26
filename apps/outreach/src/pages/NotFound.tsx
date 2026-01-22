import { clsx, type ClassValue } from "clsx"
import { useEffect, useMemo, useRef, useState, type UIEvent } from "react"
import { twMerge } from "tailwind-merge"

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

// --- Types ---

export type TerminalFontSize = "xtiny" | "tiny" | "small" | "medium" | "large" | "xlarge"

export interface TerminalProps {
    className?: string
    columns: number
    rows: number
    fontSize?: TerminalFontSize
    title?: string
    lines?: string[]
    whitespacePadding?: number
    disableScrolling?: boolean
    hideWindowChrome?: boolean
}

export type AnimationFrame = string[]

export type AnimatedTerminalProps = Omit<TerminalProps, "lines"> & {
    frames: AnimationFrame[]
    frameLengthMs?: number
}

// --- Components ---

function Terminal({
    columns,
    rows,
    fontSize = "large",
    className,
    title,
    lines,
    whitespacePadding = 0,
    disableScrolling = false,
    hideWindowChrome = false,
}: TerminalProps) {
    const [platformStyle, setPlatformStyle] = useState("macos")
    useEffect(() => {
        const userAgent = window?.navigator.userAgent
        const isLinux = /Linux/i.test(userAgent)
        setPlatformStyle(isLinux ? "adwaita" : "macos")
    }, [])

    const [autoScroll, setAutoScroll] = useState(true)
    const handleScroll = (e: UIEvent<HTMLElement>) => {
        const { scrollTop, scrollHeight, clientHeight } = e.target as HTMLElement
        const position = Math.ceil((scrollTop / (scrollHeight - clientHeight)) * 100)
        if (position < 100) {
            setAutoScroll(false)
        }
        if (position == 100) {
            setAutoScroll(true)
        }
    }

    const codeRef = useRef<HTMLPreElement>(null)
    useEffect(() => {
        if (autoScroll) {
            codeRef.current?.scrollTo({
                top: codeRef.current.scrollHeight,
                behavior: "instant",
            })
        }
    }, [lines?.length, autoScroll])

    const padding = " ".repeat(whitespacePadding)

    // Map font sizes to Tailwind classes or arbitrary values if needed
    const fontSizeClasses: Record<TerminalFontSize, string> = {
        xtiny: "text-[9px]",
        tiny: "text-xs",   // 12px
        small: "text-sm",  // 14px
        medium: "text-base", // 16px
        large: "text-lg",  // 18px
        xlarge: "text-xl", // 20px - original was undefined or fell through? Original CSS had xlarge? No, checked CSS: font-xlarge was 18px?? Check: .font-large { font-size: 18px; }. No .font-xlarge in CSS provided! Wait, let me re-check CSS read.
        // CSS read:
        // .font-large { font-size: 18px; }
        // No .font-xlarge in CSS. I'll assume 20px or same as large. Let's start with xl (20px).
    }

    return (
        <div
            className={cn(
                "flex flex-col overflow-hidden font-mono bg-black rounded-lg shadow-[0_4px_6px_rgba(0,0,0,0.3)]",
                className
            )}
            style={
                {
                    "--columns": columns + 2 * whitespacePadding,
                    "--rows": rows,
                } as React.CSSProperties
            }
        >
            {!hideWindowChrome && (
                <div className="flex items-center px-3 py-2 bg-[#16213e] border-b border-[#0f3460]">
                    {platformStyle === "adwaita" && <AdwaitaButtons />}
                    {platformStyle === "macos" && <MacosButtons />}
                    <span className="text-white text-[13px] font-medium">{title}</span>
                </div>
            )}
            <pre
                ref={codeRef}
                className={cn(
                    "flex-1 overflow-y-auto text-white bg-black leading-[1.4] whitespace-pre",
                    fontSizeClasses[fontSize] || "text-lg",
                    {
                        "overflow-hidden": disableScrolling,
                    },
                    // Custom scrollbar styles
                    "[&::-webkit-scrollbar]:w-2",
                    "[&::-webkit-scrollbar-track]:bg-[#1a1a2e]",
                    "[&::-webkit-scrollbar-thumb]:bg-[#4a4a6a] [&::-webkit-scrollbar-thumb]:rounded",
                    "[&::-webkit-scrollbar-thumb]:hover:bg-[#6a6a8a]",
                    // Span colors
                    "[&_span]:text-white",
                    "[&_.b]:text-white"
                )}
                onScroll={handleScroll}
            >
                {lines?.map((line, i) => {
                    return (
                        <div
                            key={i + line}
                            dangerouslySetInnerHTML={{
                                __html: `${padding}${line}${padding}`,
                            }}
                        />
                    )
                })}
            </pre>
        </div>
    )
}

function AdwaitaButtons() {
    return (
        <>
            <ul className="flex gap-2 list-none m-0 p-0 mr-auto">
                <li className="w-3 h-3 rounded-full bg-[#e0e0e0] border border-[#b0b0b0]"></li>
            </ul>
            <ul className="flex gap-2 list-none m-0 p-0 ml-auto">
                <li className="w-3 h-3 rounded-full bg-[#e0e0e0] border border-[#b0b0b0]"></li>
                <li className="w-3 h-3 rounded-full bg-[#e0e0e0] border border-[#b0b0b0]"></li>
                <li className="w-3 h-3 rounded-full bg-[#e0e0e0] border border-[#b0b0b0]"></li>
            </ul>
        </>
    )
}

function MacosButtons() {
    return (
        <ul className="flex gap-2 list-none m-0 p-0 mr-auto">
            <li className="w-3 h-3 rounded-full bg-[#ff5f56]"></li>
            <li className="w-3 h-3 rounded-full bg-[#ffbd2e]"></li>
            <li className="w-3 h-3 rounded-full bg-[#27ca3f]"></li>
        </ul>
    )
}

class AnimationManager {
    _animation: number | null = null
    callback: () => void
    lastFrame = -1
    frameTime = 1000 / 30

    constructor(callback: () => void, fps = 30) {
        this.callback = callback
        this.frameTime = 1000 / fps
    }

    updateFPS(fps: number) {
        this.frameTime = 1000 / fps
    }

    start() {
        if (this._animation != null) return
        this._animation = requestAnimationFrame(this.update)
    }

    pause() {
        if (this._animation == null) return
        this.lastFrame = -1
        cancelAnimationFrame(this._animation)
        this._animation = null
    }

    update = (time: number) => {
        const { lastFrame } = this
        let delta = time - lastFrame
        if (this.lastFrame === -1) {
            this.lastFrame = time
        } else {
            while (delta >= this.frameTime) {
                this.callback()
                delta -= this.frameTime
                this.lastFrame += this.frameTime
            }
        }
        this._animation = requestAnimationFrame(this.update)
    }
}

const KONAMI_CODE = [
    "arrowup",
    "arrowup",
    "arrowdown",
    "arrowdown",
    "arrowleft",
    "arrowright",
    "arrowleft",
    "arrowright",
    "b",
    "a",
]

function AnimatedTerminal({
    className,
    columns,
    rows,
    fontSize,
    title,
    frames,
    whitespacePadding,
}: AnimatedTerminalProps) {
    const [currentFrame, setCurrentFrame] = useState(16)
    const [animationManager] = useState(
        () =>
            new AnimationManager(() => {
                setCurrentFrame(currentFrame => (currentFrame + 1) % frames.length)
            })
    )

    useEffect(() => {
        const codeInProgress: string[] = []
        const handleKeyUp = (event: KeyboardEvent) => {
            const key = event.key.toLowerCase()
            if (KONAMI_CODE[codeInProgress.length] === key) {
                codeInProgress.push(key)
            } else {
                codeInProgress.length = 0
            }
            if (codeInProgress.length !== KONAMI_CODE.length) {
                return
            }
            if (animationManager.frameTime === 1000 / 30) {
                animationManager.updateFPS(240)
            } else {
                animationManager.updateFPS(30)
            }
            codeInProgress.length = 0
        }
        window.addEventListener("keyup", handleKeyUp)

        // Always start animation
        animationManager.start()

        return () => {
            window.removeEventListener("keyup", handleKeyUp)
            animationManager.pause()
        }
    }, [animationManager, frames.length])

    const lines = frames[currentFrame]

    return (
        <Terminal
            className={className}
            columns={columns}
            whitespacePadding={whitespacePadding}
            rows={rows}
            title={title}
            fontSize={fontSize}
            lines={lines}
            disableScrolling={true}
            hideWindowChrome={true}
        />
    )
}

// --- Main Page Component ---

const TOTAL_FRAMES = 481
const ROWS = 100
const COLUMNS = 400

const animationFramesModules = import.meta.glob("/src/animation_frames/frame_*.txt", {
    query: "?raw",
    import: "default",
})

export default function NotFound() {
    const [animationFrames, setAnimationFrames] = useState<AnimationFrame[]>([])
    const [loadingProgress, setLoadingProgress] = useState(0)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        let mounted = true

        const loadFrames = async () => {
            let loadedCount = 0

            const promises = Array.from({ length: TOTAL_FRAMES }).map(async (_, i) => {
                const frameNumber = i.toString().padStart(4, "0")
                const framePath = `/src/animation_frames/frame_${frameNumber}.txt`
                const loadModule = animationFramesModules[framePath] as () => Promise<string>

                if (loadModule) {
                    try {
                        const content = await loadModule()
                        if (mounted) {
                            loadedCount++
                            setLoadingProgress(Math.floor((loadedCount / TOTAL_FRAMES) * 100))
                        }
                        return content.split("\n")
                    } catch (e) {
                        console.error(`Error loading frame ${framePath}:`, e)
                        return null
                    }
                }
                return null
            })

            const results = await Promise.all(promises)

            if (mounted) {
                const validFrames = results.filter((f): f is string[] => f !== null)
                setAnimationFrames(validFrames)
                setIsLoading(false)
            }
        }

        loadFrames()

        return () => {
            mounted = false
        }
    }, [])

    const loadingFrame = useMemo(() => {
        if (!isLoading) return []

        const frame = new Array(ROWS).fill(" ".repeat(COLUMNS))
        const centerY = Math.floor(ROWS / 2)
        const centerX = Math.floor(COLUMNS / 2)

        const barWidth = 50
        const filledWidth = Math.floor((loadingProgress / 100) * barWidth)
        const emptyWidth = barWidth - filledWidth

        const bar = "[" + "#".repeat(filledWidth) + ".".repeat(emptyWidth) + "]"
        const percentage = ` ${loadingProgress}%`
        const text = bar + percentage

        const startX = Math.max(0, centerX - Math.floor(text.length / 2))

        const lineContent =
            " ".repeat(startX) + text + " ".repeat(Math.max(0, COLUMNS - startX - text.length))

        frame[centerY] = lineContent
        return frame
    }, [isLoading, loadingProgress])

    return (
        <div className="w-screen h-screen bg-black flex flex-col items-center justify-center overflow-hidden p-0">
                {isLoading ? (
                    <Terminal
                        fontSize="tiny"
                        whitespacePadding={0}
                        columns={COLUMNS}
                        rows={ROWS}
                        lines={loadingFrame}
                        hideWindowChrome={true}
                    />
                ) : (
                    animationFrames.length > 0 && (
                        <AnimatedTerminal
                            className="sm:scale-140"
                            fontSize="tiny"
                            whitespacePadding={0}
                            columns={COLUMNS}
                            rows={ROWS}
                            frames={animationFrames}
                            frameLengthMs={31}
                            hideWindowChrome={true}
                        />
                    )
                )}
        </div>
    )
}
