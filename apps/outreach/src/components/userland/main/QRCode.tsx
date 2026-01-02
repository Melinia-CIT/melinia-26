import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import QRCodeStyling, { TypeNumber } from "qr-code-styling";

interface QRCodeProps {
    userId: string;
    userName?: string;
    logoUrl?: string;
    size: number;
}

// React Query fetcher function
const fetchLogoAsBase64 = async (url: string): Promise<string> => {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error("Failed to load logo");
    }
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
};

function generateInitialsBase64(name?: string): string {
    const canvas = document.createElement("canvas");
    const size = 1000;
    canvas.width = size;
    canvas.height = size;

    const ctx = canvas.getContext("2d")!;

    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#000000";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `bold ${size * 0.5}px sans-serif`;

    const text = (name || "ID").slice(0, 2).toUpperCase();
    ctx.fillText(text, size / 2, size / 2);

    return canvas.toDataURL("image/png");
}

const QRCode = ({ userId, userName, logoUrl, size = 256 }: QRCodeProps) => {
    const qrRef = useRef<HTMLDivElement>(null);
    const qrInstance = useRef<QRCodeStyling | null>(null);

    // State to track the currently active image (Base64 string) to pass to the QR library
    const [activeImage, setActiveImage] = useState<string | undefined>(() =>
        generateInitialsBase64(userName)
    );

    // TanStack Query to fetch and cache the logo
    const { data: logoBase64 } = useQuery({
        queryKey: ["logo", logoUrl],
        queryFn: () => fetchLogoAsBase64(logoUrl!),
        enabled: !!logoUrl, // Only run if logoUrl exists
        staleTime: Infinity, // Cache forever, logo URLs rarely change content
        retry: 1,
    });

    // Effect: Update the active image whenever the Query returns a new logo
    useEffect(() => {
        if (logoBase64) {
            setActiveImage(logoBase64);
        }
    }, [logoBase64]);

    useEffect(() => {
        if (!qrInstance.current) {
            qrInstance.current = new QRCodeStyling({
                type: "canvas",
                width: size,
                height: size,
                data: userId,
                margin: 8,
                qrOptions: {
                    typeNumber: 7 as TypeNumber,
                    errorCorrectionLevel: "Q",
                },
                imageOptions: {
                    imageSize: 0.4,
                    margin: 10,
                    saveAsBlob: true,
                    hideBackgroundDots: true,
                },
                dotsOptions: { type: "dots", color: "#fff" },
                backgroundOptions: { color: "#000" },
                cornersSquareOptions: { type: "extra-rounded", color: "#fff" },
                cornersDotOptions: { type: "dot", color: "#fff" },
            });
        }

        const updateQR = (currentWidth: number) => {
            qrInstance.current?.update({
                data: userId,
                image: activeImage,
                width: currentWidth,
                height: currentWidth,
            });

            if (qrRef.current) {
                qrRef.current.innerHTML = "";
                qrInstance.current?.append(qrRef.current);
            }
        };

        // Initial Draw
        updateQR(size);

        // Resize Observer to handle responsiveness
        const resizeObserver = new ResizeObserver((entries) => {
            for (let entry of entries) {
                const { width } = entry.contentRect;
                if (width > 0) {
                    updateQR(Math.floor(width));
                }
            }
        });

        if (qrRef.current) {
            resizeObserver.observe(qrRef.current);
        }

        return () => {
            resizeObserver.disconnect();
        };
    }, [userId, activeImage, size]); // Re-draw if activeImage changes

    return <div ref={qrRef} className="w-full h-full flex justify-center items-center" />;
};

export default QRCode;
