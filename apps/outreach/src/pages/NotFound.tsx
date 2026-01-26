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

    const fontSizeClasses: Record<TerminalFontSize, string> = {
        xtiny: "text-[9px]",
        tiny: "text-xs",
        small: "text-sm",
        medium: "text-base",
        large: "text-lg",
        xlarge: "text-xl",
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
                    "[&::-webkit-scrollbar]:w-2",
                    "[&::-webkit-scrollbar-track]:bg-[#1a1a2e]",
                    "[&::-webkit-scrollbar-thumb]:bg-[#4a4a6a] [&::-webkit-scrollbar-thumb]:rounded",
                    "[&::-webkit-scrollbar-thumb]:hover:bg-[#6a6a8a]",
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

// --- New Draggable Window Component (Responsive & Blurry) ---

function DraggableWindow({ title, children }: { title: string; children: React.ReactNode }) {
    const [position, setPosition] = useState({
        x: window.innerWidth / 2 - 250,
        y: window.innerHeight / 2 - 150,
    })
    const [size, setSize] = useState({ width: 500, height: 400 })
    const [isDragging, setIsDragging] = useState(false)
    const [isResizing, setIsResizing] = useState(false)
    const [isMobile, setIsMobile] = useState(window.innerWidth < 640)

    // Refs to track initial mouse offset
    const dragOffset = useRef({ x: 0, y: 0 })
    const resizeOffset = useRef({ x: 0, y: 0 })

    // 1. Handle Responsive Resizing
    useEffect(() => {
        const handleResize = () => {
            const w = window.innerWidth
            const h = window.innerHeight
            const isNowMobile = w < 640

            setIsMobile(isNowMobile)

            if (isNowMobile) {
                // Mobile Mode: Full Width Modal
                const newW = w - 32 // 16px padding on sides
                const newH = Math.min(h - 100, 400) // Max height 400, or fits screen
                const newX = 16
                const newY = Math.max(0, (h - newH) / 2) // Center vertically

                setSize({ width: newW, height: newH })
                setPosition({ x: newX, y: newY })
            } else {
                // Desktop Mode: Ensure window stays within bounds
                let newX = position.x
                let newY = position.y
                let newW = size.width
                let newH = size.height

                // If we just came from mobile, window might be huge. Reset size.
                if (size.width > 800) newW = 500
                if (size.height > 800) newH = 400

                // Keep window inside viewport
                if (newX + newW > w) newX = w - newW - 20
                if (newY + newH > h) newY = h - newH - 20
                if (newX < 0) newX = 20
                if (newY < 0) newY = 20

                setPosition({ x: newX, y: newY })
                setSize({ width: newW, height: newH })
            }
        }

        window.addEventListener("resize", handleResize)
        handleResize() // Init on mount

        return () => {
            window.removeEventListener("resize", handleResize)
        }
    }, [position.x, position.y, size.width, size.height])

    // Drag Handlers (Disabled on Mobile)
    const startDrag = (e: React.MouseEvent) => {
        if (isMobile) return
        setIsDragging(true)
        dragOffset.current = {
            x: e.clientX - position.x,
            y: e.clientY - position.y,
        }
    }

    // Resize Handlers (Disabled on Mobile)
    const startResize = (e: React.MouseEvent) => {
        if (isMobile) return
        e.stopPropagation()
        setIsResizing(true)
        resizeOffset.current = {
            x: e.clientX - size.width,
            y: e.clientY - size.height,
        }
    }

    // Window Event Listeners for Move/Up
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (isDragging) {
                setPosition({
                    x: e.clientX - dragOffset.current.x,
                    y: e.clientY - dragOffset.current.y,
                })
            } else if (isResizing) {
                setSize({
                    width: Math.max(300, e.clientX - resizeOffset.current.x),
                    height: Math.max(200, e.clientY - resizeOffset.current.y),
                })
            }
        }

        const handleMouseUp = () => {
            setIsDragging(false)
            setIsResizing(false)
        }

        if (isDragging || isResizing) {
            window.addEventListener("mousemove", handleMouseMove)
            window.addEventListener("mouseup", handleMouseUp)
        }

        return () => {
            window.removeEventListener("mousemove", handleMouseMove)
            window.removeEventListener("mouseup", handleMouseUp)
        }
    }, [isDragging, isResizing])

    return (
        <div
            className="fixed z-50 flex flex-col font-mono rounded-lg shadow-[0_20px_50px_rgba(0,0,0,0.8)] border border-white/20"
            style={{
                left: position.x,
                top: position.y,
                width: size.width,
                height: size.height,
                overflow: "hidden",
                // CHANGED: Dark Frosted Glass Background
                backgroundColor: "rgba(0, 0, 0, 0.5)",
                backdropFilter: "blur(16px)",
                WebkitBackdropFilter: "blur(16px)", // Safari support
            }}
        >
            {/* Header / Drag Handle */}
            <div
                className={`flex items-center px-3 py-2 border-b border-white/10 select-none backdrop-blur-md ${isMobile ? "cursor-default" : "cursor-move"}`}
                // CHANGED: Semi-transparent white for the header to match glass
                style={{ backgroundColor: "rgba(255, 255, 255, 0.05)" }}
                onMouseDown={startDrag}
            >
                <MacosButtons />
                <span className="text-white text-[13px] font-medium ml-2 flex-1 text-center drop-shadow-md">
                    {title}
                </span>
            </div>

            {/* Content */}
            <div
                className="flex-1 relative flex items-center justify-center overflow-auto p-6"
                // CHANGED: More transparent content area so background is very blurry but visible
                style={{ backgroundColor: "rgba(0, 0, 0, 0.3)" }}
            >
                {children}
            </div>

            {/* Resize Handle (Hidden on Mobile) */}
            {!isMobile && (
                <div
                    className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize  opacity-50 hover:opacity-100"
                    onMouseDown={startResize}
                />
            )}
        </div>
    )
}

const ROWS = 100
const COLUMNS = 400

export default function NotFound() {
    const [animationFrames, setAnimationFrames] = useState<AnimationFrame[]>([])
    const [loadingProgress, setLoadingProgress] = useState(0)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        let mounted = true

        const loadFrames = async () => {
            try {
                let response = await fetch("https://cdn.melinia.in/output.txt.gz")

                if (!response.ok) {
                    response = await fetch("/animation_frames/output.txt.gz")
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`)
                    }
                }

                const contentLength = response.headers.get("content-length")
                const totalBytes = contentLength ? parseInt(contentLength, 10) : 0

                const reader = response.body?.getReader()
                if (!reader) {
                    throw new Error("Response body is not readable")
                }

                const compressedChunks: Uint8Array[] = []
                let loadedBytes = 0

                while (true) {
                    const { done, value } = await reader.read()
                    if (done) break

                    if (value) {
                        compressedChunks.push(value)
                        loadedBytes += value.length

                        if (mounted && totalBytes > 0) {
                            const progress = Math.min(
                                100,
                                Math.floor((loadedBytes / totalBytes) * 100)
                            )
                            setLoadingProgress(progress)
                        }
                    }
                }

                if (!mounted) return

                const compressedData = new Uint8Array(
                    compressedChunks.reduce((acc, chunk) => acc + chunk.length, 0)
                )
                let offset = 0
                for (const chunk of compressedChunks) {
                    compressedData.set(chunk, offset)
                    offset += chunk.length
                }

                // --- FIX: Check for Gzip Header (Magic Number 0x1f 0x8b) ---
                let decompressedText = ""
                const isGzipped = compressedData[0] === 0x1f && compressedData[1] === 0x8b

                if (isGzipped) {
                    const decompressedStream = new Response(compressedData).body?.pipeThrough(
                        new DecompressionStream("gzip")
                    )

                    if (!decompressedStream) {
                        throw new Error("Failed to create decompression stream")
                    }
                    decompressedText = await new Response(decompressedStream).text()
                } else {
                    decompressedText = new TextDecoder().decode(compressedData)
                }
                // --------------------------------------------------------------

                const frameStrings = decompressedText.split("\0")

                if (frameStrings.length > 0 && frameStrings[frameStrings.length - 1] === "") {
                    frameStrings.pop()
                }

                const parsedFrames = frameStrings.map(frame => frame.split("\n"))

                if (mounted) {
                    setAnimationFrames(parsedFrames)
                    setIsLoading(false)
                }
            } catch (err) {
                console.error("Failed to load animation frames:", err)
                if (mounted) {
                    setError(err instanceof Error ? err.message : String(err))
                    setIsLoading(false)
                }
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

    const errorFrame = useMemo(() => {
        const frame = new Array(ROWS).fill(" ".repeat(COLUMNS))
        const centerY = Math.floor(ROWS / 2)
        const centerX = Math.floor(COLUMNS / 2)

        const errorMsg = `Error: ${error || "Unknown error"}`
        const startX = Math.max(0, centerX - Math.floor(errorMsg.length / 2))

        const lineContent =
            " ".repeat(startX) +
            errorMsg +
            " ".repeat(Math.max(0, COLUMNS - startX - errorMsg.length))

        frame[centerY] = lineContent
        return frame
    }, [error])

    return (
        <div className="relative w-screen h-screen bg-black flex flex-col items-center justify-center overflow-hidden p-0">
            {/* Terminal Animation Layer (Background) */}
            {isLoading ? (
                <Terminal
                    fontSize="tiny"
                    whitespacePadding={0}
                    columns={COLUMNS}
                    rows={ROWS}
                    lines={loadingFrame}
                    hideWindowChrome={true}
                />
            ) : error ? (
                <Terminal
                    fontSize="tiny"
                    whitespacePadding={0}
                    columns={COLUMNS}
                    rows={ROWS}
                    lines={errorFrame}
                    hideWindowChrome={true}
                />
            ) : (
                animationFrames.length > 0 && (
                    <AnimatedTerminal
                        className="scale-120"
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

            {/* Draggable Terminal Window (Foreground) */}
            <DraggableWindow title="bash — 404">
                <div className="text-center w-full font-mono">
                    {/* ASCII Style 404 Title - Responsive Sizing */}
                    <h1 className="text-5xl sm:text-7xl md:text-[8rem] font-black mb-4 leading-none text-white">
                        404
                    </h1>

                    <button
                        onClick={() => (window.location.href = "/")}
                        className="px-4 py-2 sm:px-6 sm:py-2 border-2 border-white text-white font-bold text-lg sm:text-xl tracking-wider sm:tracking-widest hover:bg-white hover:text-black transition-colors duration-200"
                    >
                        [ BACK_HOME ]
                    </button>
                </div>
            </DraggableWindow>
        </div>
    )
}
