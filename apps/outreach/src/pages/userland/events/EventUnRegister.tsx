import { motion, AnimatePresence } from "framer-motion";
import { Trash2, Loader2, X, CheckCircle, ShieldAlert } from "lucide-react";
import { useState } from "react";
import api from "../../../services/api";

interface EventUnRegisterProps {
    eventName: string;
    eventId: string;
    registrationStatus: any;
    onClose: () => void;
    onSuccess: () => void;
}

const EventUnRegister = ({ eventName, eventId, registrationStatus, onClose, onSuccess }: EventUnRegisterProps) => {
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState<"confirm" | "success" | "unauthorized">("confirm");
    const [errorMessage, setErrorMessage] = useState("");

    const handleUnregisterExecute = async () => {
        setLoading(true);
        try {
            const response = await api.post(`/events/${eventId}/unregister`, {
                participationType: registrationStatus?.mode || "solo",
                teamId: registrationStatus?.team_id || null
            });

            if (response.data.status) {
                setStep("success");
                onSuccess();
                setTimeout(() => onClose(), 2000);
            }
        } catch (err: any) {
            if (err.response?.status === 403) {
                setErrorMessage("Only the team leader can unregister from the event.");
                setStep("unauthorized");
            } else {
                console.error("Unregistration failed", err);
                onClose();
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/90 backdrop-blur-md"
                onClick={!loading ? onClose : undefined}
            />
            <motion.div 
                initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                className="relative w-full max-w-sm bg-zinc-900 border border-white/10 rounded-2xl p-7 shadow-2xl text-center overflow-hidden"
            >
                <AnimatePresence mode="wait">
                    {step === "confirm" && (
                        <motion.div key="confirm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <button onClick={onClose} className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                            
                            <div className="w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Trash2 className="w-8 h-8 text-rose-500" />
                            </div>
                            
                            <h2 className="text-xl font-bold text-white mb-2">Unregister?</h2>
                            <p className="text-sm text-zinc-400 mb-6 leading-relaxed">
                                You are about to unregister from <span className="text-white font-medium">{eventName}</span>. This action cannot be undone.
                            </p>
                            
                            <div className="flex gap-3">
                                <button onClick={onClose} disabled={loading} className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl font-bold text-white transition-colors disabled:opacity-50">
                                    Cancel
                                </button>
                                <button onClick={handleUnregisterExecute} disabled={loading} className="flex-1 py-3 bg-rose-500 hover:bg-rose-600 rounded-xl font-bold text-white transition-colors flex items-center justify-center gap-2">
                                    {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                                    Confirm
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {step === "unauthorized" && (
                        <motion.div key="unauthorized" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="py-2">
                            <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                <ShieldAlert className="w-8 h-8 text-amber-500" />
                            </div>
                            <h2 className="text-xl font-bold text-white mb-2">Action Restricted</h2>
                            <p className="text-sm text-zinc-400 mb-6 leading-relaxed">
                                {errorMessage}
                            </p>
                            <button 
                                onClick={onClose}
                                className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl font-bold text-white transition-colors"
                            >
                                Understood
                            </button>
                        </motion.div>
                    )}

                    {step === "success" && (
                        <motion.div key="success" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="py-6 flex flex-col items-center">
                            <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mb-4">
                                <CheckCircle className="w-10 h-10 text-green-500" />
                            </div>
                            <h2 className="text-xl font-bold text-white mb-1">Unregistered</h2>
                            <p className="text-zinc-400 text-sm">Successfully removed from event</p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
};

export default EventUnRegister;