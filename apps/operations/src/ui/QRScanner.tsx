/**
 * QR Code Scanner Component
 * Uses ZXing library for QR code scanning via camera
 */

import { BrowserMultiFormatReader } from "@zxing/library";
import { ScanQrCode, Xmark } from "iconoir-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "./Button";

interface QRScannerProps {
	onScan: (result: string) => void;
	onClose: () => void;
}

export function QRScanner({ onScan, onClose }: QRScannerProps) {
	const videoRef = useRef<HTMLVideoElement>(null);
	const [error, setError] = useState<string>("");
	const [isScanning, setIsScanning] = useState(false);
	const readerRef = useRef<BrowserMultiFormatReader | null>(null);

	useEffect(() => {
		let mounted = true;

		const startScanner = async () => {
			try {
				setIsScanning(true);
				setError("");

				const codeReader = new BrowserMultiFormatReader();
				readerRef.current = codeReader;

				// Get available video devices
				const videoInputDevices = await codeReader.listVideoInputDevices();

				if (videoInputDevices.length === 0) {
					throw new Error("No camera found");
				}

				// Use the first available camera (usually back camera on mobile)
				const selectedDeviceId = videoInputDevices[0].deviceId;

				if (videoRef.current && mounted) {
					await codeReader.decodeFromVideoDevice(
						selectedDeviceId,
						videoRef.current,
						(result, error) => {
							if (result && mounted) {
								const scannedText = result.getText();
								onScan(scannedText);
								// Stop scanning after successful scan
								stopScanner();
							}
							if (error && mounted) {
								// Ignore not found errors (normal during scanning)
								if (error.name !== "NotFoundException") {
									console.error("QR scan error:", error);
								}
							}
						},
					);
				}
			} catch (err) {
				if (mounted) {
					console.error("Failed to start scanner:", err);
					setError(
						err instanceof Error ? err.message : "Failed to access camera",
					);
					setIsScanning(false);
				}
			}
		};

		const stopScanner = () => {
			if (readerRef.current) {
				readerRef.current.reset();
				readerRef.current = null;
			}
			setIsScanning(false);
		};

		startScanner();

		return () => {
			mounted = false;
			stopScanner();
		};
	}, [onScan]);

	return createPortal(
		<div className="fixed inset-0 bg-black/90 z-[9999] flex items-center justify-center p-4 min-h-[100dvh]" style={{ height: '100dvh' }}>
			<div className="w-full max-w-2xl space-y-4">
				{/* Header */}
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<ScanQrCode className="w-6 h-6 text-white" />
						<h3 className="text-lg font-semibold text-white">Scan QR Code</h3>
					</div>
					<button
						type="button"
						onClick={onClose}
						className="p-2 text-neutral-400 hover:text-white transition-colors duration-150"
					>
						<Xmark className="w-6 h-6" />
					</button>
				</div>

				{/* Video container */}
				<div className="bg-neutral-950 border border-neutral-800 overflow-hidden aspect-video flex items-center justify-center relative">
					{error ? (
						<div className="text-center p-6 space-y-4">
							<p className="text-red-500">{error}</p>
							<Button variant="secondary" onClick={onClose}>
								Close
							</Button>
						</div>
					) : (
						<>
							<video
								ref={videoRef}
								className="w-full h-full object-cover"
								playsInline
								muted
							/>
							{/* Scanning Animation Overlay */}
							{isScanning && (
								<div className="absolute inset-0 pointer-events-none">
									{/* Corner brackets */}
									<div className="absolute inset-0 flex items-center justify-center">
										<div className="relative w-64 h-64">
											{/* Top-left corner */}
											<div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-green-500" />
											{/* Top-right corner */}
											<div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-green-500" />
											{/* Bottom-left corner */}
											<div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-green-500" />
											{/* Bottom-right corner */}
											<div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-green-500" />

											{/* Scanning line animation */}
											<div className="absolute inset-0 overflow-hidden">
												<div className="w-full h-1 bg-gradient-to-r from-transparent via-green-500 to-transparent animate-scan" />
											</div>
										</div>
									</div>
								</div>
							)}
						</>
					)}
				</div>

				{/* Instructions */}
				{isScanning && !error && (
					<div className="bg-neutral-950 border border-neutral-800 p-4">
						<p className="text-sm text-neutral-400 text-center">
							Position the QR code within the camera view
						</p>
					</div>
				)}

				{/* Close button */}
				<Button variant="secondary" onClick={onClose} className="w-full">
					Cancel
				</Button>
			</div>
		</div>,
		document.body
	);
}
