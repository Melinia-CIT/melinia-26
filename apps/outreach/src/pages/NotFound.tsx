import { useEffect, useMemo, useState } from "react"
import AnimatedTerminal, { AnimationFrame } from "../components/terminal/AnimatedTerminal"
import Terminal from "../components/terminal/Terminal"
import "./NotFound.css"

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
        // Ensure we don't overflow or create invalid line length if avoidable, though Terminal might clip or wrap.
        // But Terminal generally renders pre content.

        const lineContent =
            " ".repeat(startX) + text + " ".repeat(Math.max(0, COLUMNS - startX - text.length))

        frame[centerY] = lineContent
        return frame
    }, [isLoading, loadingProgress])

    return (
        <div className="not-found-page">
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
                            fontSize="large"
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
