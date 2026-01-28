import { useEffect, useRef, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import QRCodeStyling, { TypeNumber } from "qr-code-styling"

// Render at 2x resolution internally, scale down via viewBox for crisp display
const RENDER_SCALE = 2
const BASE_MARGIN = 8
const BASE_LOGO_MARGIN = 8
const BASE_LOGO_SIZE = 0.25

interface QRCodeProps {
    userId: string
    userName?: string
    logoUrl?: string
    size: number
}

const fetchLogoAsBase64 = async (url: string): Promise<string> => {
    const response = await fetch(url)
    if (!response.ok) {
        throw new Error("Failed to load logo")
    }
    const blob = await response.blob()
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(blob)
    })
}

function generateInitialsBase64(name?: string): string {
    const CANVAS_SIZE = 2000
    const canvas = document.createElement("canvas")
    canvas.width = CANVAS_SIZE
    canvas.height = CANVAS_SIZE
    const ctx = canvas.getContext("2d")!

    ctx.fillStyle = "#ffffff"
    ctx.beginPath()
    ctx.arc(CANVAS_SIZE / 2, CANVAS_SIZE / 2, CANVAS_SIZE / 2, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = "#000000"
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    ctx.font = `bold ${CANVAS_SIZE * 0.5}px sans-serif`
    const text = (name || "ID").slice(0, 2).toUpperCase()
    ctx.fillText(text, CANVAS_SIZE / 2, CANVAS_SIZE / 2)

    return canvas.toDataURL("image/png")
}

const QRCode = ({ userId, userName, logoUrl, size = 256 }: QRCodeProps) => {
    const qrRef = useRef<HTMLDivElement>(null)
    const qrInstance = useRef<QRCodeStyling | null>(null)
    const [activeImage, setActiveImage] = useState<string | undefined>(() =>
        generateInitialsBase64(userName)
    )

    const { data: logoBase64 } = useQuery({
        queryKey: ["logo", logoUrl],
        queryFn: () => fetchLogoAsBase64(logoUrl!),
        enabled: !!logoUrl,
        staleTime: Infinity,
        retry: 1,
    })

    useEffect(() => {
        if (logoBase64) {
            setActiveImage(logoBase64)
        }
    }, [logoBase64])

    useEffect(() => {
        if (!qrInstance.current) {
            qrInstance.current = new QRCodeStyling({
                type: "svg",
                width: size,
                height: size,
                data: userId,
                margin: BASE_MARGIN,
                qrOptions: {
                    typeNumber: 7 as TypeNumber,
                    errorCorrectionLevel: "Q",
                },
                imageOptions: {
                    imageSize: BASE_LOGO_SIZE,
                    margin: BASE_LOGO_MARGIN,
                    saveAsBlob: true,
                    hideBackgroundDots: true,
                },
                dotsOptions: { type: "dots", color: "#fff" },
                backgroundOptions: { color: "#000" },
                cornersSquareOptions: { type: "extra-rounded", color: "#fff" },
                cornersDotOptions: { type: "dot", color: "#fff" },
            })
        }

        // Render QR at high resolution (displaySize × RENDER_SCALE), then scale down via viewBox
        const updateQR = (displaySize: number) => {
            const renderSize = displaySize * RENDER_SCALE
            const renderMargin = BASE_MARGIN * RENDER_SCALE
            const renderLogoMargin = BASE_LOGO_MARGIN * RENDER_SCALE

            qrInstance.current?.update({
                data: userId,
                image: activeImage,
                width: renderSize,
                height: renderSize,
                margin: renderMargin,
                imageOptions: {
                    imageSize: BASE_LOGO_SIZE,
                    margin: renderLogoMargin,
                    saveAsBlob: true,
                    hideBackgroundDots: true,
                },
            })

            if (qrRef.current) {
                qrRef.current.innerHTML = ""
                qrInstance.current?.append(qrRef.current)

                const svgElement = qrRef.current.querySelector("svg")
                if (svgElement) {
                    // viewBox defines internal coordinates, CSS width/height defines display size
                    svgElement.setAttribute("viewBox", `0 0 ${renderSize} ${renderSize}`)
                    svgElement.style.width = `${displaySize}px`
                    svgElement.style.height = `${displaySize}px`
                }
            }
        }

        updateQR(size)

        const resizeObserver = new ResizeObserver(entries => {
            for (let entry of entries) {
                const { width } = entry.contentRect
                if (width > 0) {
                    updateQR(width)
                }
            }
        })

        if (qrRef.current) {
            resizeObserver.observe(qrRef.current)
        }

        return () => {
            resizeObserver.disconnect()
        }
    }, [userId, activeImage, size])

    return <div ref={qrRef} className="w-full h-full flex justify-center items-center" />
}

export default QRCode
