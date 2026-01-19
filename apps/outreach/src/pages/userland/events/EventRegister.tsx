import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    CheckCircle, 
    AlertTriangle, 
    Loader2, 
    X, 
    CreditCard, 
    PlusCircle, 
    AlertCircle,
    User
} from "lucide-react";
import api from "../../../services/api";
import { useNavigate } from "react-router-dom";
import PaymentModal from "../../../components/payment/PaymentModal";

interface Team {
    id: string;
    team_name: string;
    member_count: string | number;
    leader_id: string;
}

interface EventRegisterProps {
    event: any;
    onClose: () => void;
    onSuccess: () => void;
}

const EventRegister = ({ event, onClose, onSuccess }: EventRegisterProps) => {
    const navigate = useNavigate();
    const [step, setStep] = useState<"checking" | "Payment required" | "team_selection" | "no_teams" | "confirm" | "success" | "error">("checking");
    const [teams, setTeams] = useState<Team[]>([]);
    const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [isSoloChoice, setIsSoloChoice] = useState(false);
    const registrationInitiated = useRef(false);
    const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);

    useEffect(() => {
        let isSubscribed = true;
        const checkEligibilityAndProcess = async () => {
            if (registrationInitiated.current) return;
            try {
                // This call triggers the paymentStatusMiddleware on the backend
                const payRes = await api.get("/payment/payment-status");
                if (!isSubscribed) return;
                
                const paymentStatus = payRes.data.paid; 

                if (!paymentStatus) {
                    setStep("Payment required");
                    return;
                }

                if (event.participationType.toLowerCase() === "solo") {
                    registrationInitiated.current = true;
                    handleFinalRegister(null, "solo"); 
                } else {
                    const teamRes = await api.get("/teams");
                    if (!isSubscribed) return;

                    const userTeams = teamRes.data.data || [];
                    setTeams(userTeams);

                    if (userTeams.length === 0 && event.minTeamSize > 1) {
                        setStep("no_teams");
                    } else {
                        setStep("team_selection");
                    }
                }
            } catch (err: any) {
                if (!isSubscribed) return;

                // FIX: Check if the middleware threw a 402 Payment Required error
                if (err.response?.status === 402) {
                    setStep("Payment required");
                } else {
                    setErrorMessage(err.response?.data?.message || "Failed to verify eligibility.");
                    setStep("error");
                }
            }
        };

        checkEligibilityAndProcess();

        return () => { isSubscribed = false; };
    }, [event.id]); 

    const handleFinalRegister = async (teamId: string | null, typeOverride?: string) => {
        if (loading) return;
        setLoading(true);
        try {
            const response = await api.post(`/events/${event.id}/register`, { 
                teamId,
                participationType: typeOverride || (isSoloChoice ? "solo" : event.participationType),
                minTeamSize: event.minTeamSize,
                maxTeamSize: event.maxTeamSize,
                registrationStart: event.registrationStart,
                registrationEnd: event.registrationEnd
            });
            
            if (response.data.status) {
                setStep("success");
                onSuccess(); 
                setTimeout(() => onClose(), 2500);
            }
        } catch (err: any) {
            // FIX: Also check for 402 here in case status changed mid-session
            if (err.response?.status === 402) {
                setStep("Payment required");
            } else {
                setErrorMessage(err.response?.data?.message || "Registration failed. One or more members might already be registered.");
                setStep("error");
            }
        } finally {
            setLoading(false);
        }
    };

    const handlePaymentRedirect = async () => {
        setLoading(true);
        try {
            // const res = await api.post("/payment/register-melinia");
            // if (res.data.url) {
            //     window.location.href = res.data.url;
            // }
            setShowPaymentModal(true)
        } catch (err: any) {
            setErrorMessage("Could not initialize payment. Please try again later.");
            setStep("error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/85 backdrop-blur-sm"
                onClick={step !== "success" && step !== "checking" ? onClose : undefined}
            />
            
            <motion.div 
                initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                className="relative w-full max-w-md bg-zinc-900 border border-white/10 rounded-2xl p-7 shadow-2xl overflow-hidden"
            >
                {step !== "success" && (
                    <button onClick={onClose} className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                )}

                <AnimatePresence mode="wait">
                    {step === "checking" && (
                        <motion.div key="checking" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center py-10">
                            <Loader2 className="w-12 h-12 text-orange-500 animate-spin mb-4" />
                            <p className="text-zinc-400 font-medium tracking-tight">Checking eligibility...</p>
                        </motion.div>
                    )}

                    {step === "error" && (
                        <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-4">
                            <div className="w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                <AlertCircle className="w-8 h-8 text-rose-500" />
                            </div>
                            <h2 className="text-xl font-bold mb-2 text-white">{errorMessage}</h2>
                            <button onClick={onClose} className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl font-bold transition-colors text-white">
                                Close
                            </button>
                        </motion.div>
                    )}

                    {step === "Payment required" && (
                        <motion.div key="pay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-4">
                            <div className="w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CreditCard className="w-8 h-8 text-rose-500" />
                            </div>
                            <h2 className="text-xl font-bold mb-2 text-white">Payment Required</h2>
                            <p className="text-sm text-zinc-400 mb-6 px-2">You need to complete your Melinia registration payment before participating in events.</p>
                            <button onClick={handlePaymentRedirect} disabled={loading} className="w-full py-3 bg-orange-500 hover:bg-orange-600 rounded-xl font-bold transition-all flex items-center justify-center gap-2 text-white">
                                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                                Pay Now
                            </button>
                        </motion.div>
                    )}

                    {step === "no_teams" && (
                        <motion.div key="noteam" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-4">
                            <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                <PlusCircle className="w-8 h-8 text-blue-500" />
                            </div>
                            <h2 className="text-xl font-bold mb-2 text-white">No Team Found</h2>
                            <p className="text-sm text-zinc-400 mb-6">This is a team event. You must create a team in the teams section first.</p>
                            <button onClick={() => navigate("/app/teams")} className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl font-bold transition-colors text-white">
                                Go to Teams Section
                            </button>
                        </motion.div>
                    )}

                    {step === "team_selection" && (
                        <motion.div key="select" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-2">
                            <h2 className="text-lg font-bold mb-4 text-white">Select Participation</h2>
                            <div className="space-y-3 max-h-60 overflow-y-auto pr-2 mb-6 custom-scrollbar">
                                {event.minTeamSize === 1 && (
                                    <label className={`flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer ${isSoloChoice ? 'border-orange-500 bg-orange-500/5' : 'bg-white/5 border-white/10 hover:border-white/20'}`}>
                                        <div className="flex items-center gap-3">
                                            <input 
                                                type="radio" name="team"
                                                checked={isSoloChoice}
                                                onChange={() => {
                                                    setSelectedTeamId(null);
                                                    setIsSoloChoice(true);
                                                }}
                                                className="accent-orange-500 w-4 h-4"
                                            />
                                            <div className="flex items-center gap-2">
                                                <User className="w-4 h-4 text-orange-500" />
                                                <p className="text-sm font-bold text-white">Solo Registration</p>
                                            </div>
                                        </div>
                                    </label>
                                )}

                                {teams.map((t) => {
                                    const isValidSize = Number(t.member_count) >= event.minTeamSize && Number(t.member_count) <= event.maxTeamSize;
                                    const isSelected = selectedTeamId === t.id;
                                    return (
                                        <label key={t.id} className={`flex items-center justify-between p-4 rounded-xl border transition-all ${isValidSize ? (isSelected ? 'border-orange-500 bg-orange-500/5' : 'bg-white/5 border-white/10 cursor-pointer hover:border-orange-500/50') : 'bg-zinc-950 border-white/5 opacity-50 grayscale cursor-not-allowed'}`}>
                                            <div className="flex items-center gap-3">
                                                <input 
                                                    type="radio" name="team" disabled={!isValidSize}
                                                    checked={isSelected}
                                                    onChange={() => {
                                                        setSelectedTeamId(t.id);
                                                        setIsSoloChoice(false);
                                                    }}
                                                    className="accent-orange-500 w-4 h-4"
                                                />
                                                <div>
                                                    <p className="text-sm font-bold text-white">{t.team_name}</p>
                                                    <p className="text-[10px] text-zinc-500 uppercase font-semibold">{t.member_count} Members</p>
                                                </div>
                                            </div>
                                            {!isValidSize && <AlertTriangle className="w-4 h-4 text-amber-500" />}
                                        </label>
                                    );
                                })}
                            </div>
                            <button 
                                disabled={(!selectedTeamId && !isSoloChoice) || loading}
                                onClick={() => setStep("confirm")}
                                className="w-full py-3 bg-orange-500 disabled:opacity-50 hover:bg-orange-600 rounded-xl font-bold transition-all text-white"
                            >
                                Continue
                            </button>
                        </motion.div>
                    )}

                    {step === "confirm" && (
                        <motion.div key="confirm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-4">
                            <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-4 text-amber-500 font-bold text-2xl">!</div>
                            <h2 className="text-xl font-bold mb-2 text-white">Final Confirmation</h2>
                            <p className="text-sm text-zinc-400 mb-6 leading-relaxed">Once registered, your participation details cannot be modified. Do you wish to proceed?</p>
                            <div className="flex gap-3">
                                <button onClick={() => setStep("team_selection")} className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl font-bold transition-colors text-white">Cancel</button>
                                <button onClick={() => handleFinalRegister(selectedTeamId)} disabled={loading} className="flex-1 py-3 bg-orange-500 hover:bg-orange-600 rounded-xl font-bold transition-all flex items-center justify-center gap-2 text-white">
                                    {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                                    Register
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {step === "success" && (
                        <motion.div key="success" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center py-12">
                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1.1 }} className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-green-500/20">
                                <CheckCircle className="w-14 h-14 text-white" />
                            </motion.div>
                            <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">Registered!</h2>
                            <p className="text-zinc-400">Success! You are now in {event.name}.</p>
                        </motion.div>
                    )}
                    {
                        showPaymentModal &&(
                            <PaymentModal
                                isOpen={showPaymentModal}
                                onClose={()=>setShowPaymentModal(false)}
                            />
                        ) 
                        
                    }
                </AnimatePresence>
            </motion.div>
        </div>
    );
};

export default EventRegister;