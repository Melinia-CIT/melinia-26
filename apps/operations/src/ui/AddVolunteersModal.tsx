import { Xmark, Mail, Plus, Trash } from "iconoir-react";
import { useState } from "react";
import { Button } from "./Button";
import { Input } from "./Input";

interface AddVolunteersModalProps {
    open: boolean;
    onClose: () => void;
    eventName: string;
}

export function AddVolunteersModal({ open, onClose, eventName }: AddVolunteersModalProps) {
    const [emails, setEmails] = useState<{ id: string; value: string }[]>([{ id: crypto.randomUUID(), value: "" }]);

    const handleAddEmail = () => {
        setEmails([...emails, { id: crypto.randomUUID(), value: "" }]);
    };

    const handleEmailChange = (id: string, value: string) => {
        setEmails(prev => prev.map(e => e.id === id ? { ...e, value } : e));
    };

    const handleRemoveEmail = (id: string) => {
        if (emails.length === 1) {
            setEmails([{ id: crypto.randomUUID(), value: "" }]);
            return;
        }
        setEmails(emails.filter(e => e.id !== id));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const validEmails = emails.map(e => e.value.trim()).filter(email => email !== "");
        console.log("Adding volunteers:", validEmails);
        // API integration will go here
        onClose();
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="w-full max-w-lg bg-neutral-950 border border-neutral-800 shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="px-6 py-5 border-b border-neutral-800 flex items-center justify-between bg-neutral-900/40">
                    <div className="space-y-1">
                        <h3 className="text-xl font-bold text-white tracking-tight">Add Volunteers</h3>
                        <p className="text-xs text-neutral-500 font-medium uppercase tracking-widest leading-none">
                            For {eventName}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-neutral-500 hover:text-white transition-colors duration-150"
                    >
                        <Xmark className="w-6 h-6" />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest">
                                Volunteer Emails
                            </label>
                            <button
                                type="button"
                                onClick={handleAddEmail}
                                className="text-[10px] font-bold text-white uppercase tracking-widest hover:text-neutral-300 transition-colors flex items-center gap-1.5"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                Add Another
                            </button>
                        </div>

                        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                            {emails.map((email) => (
                                <div key={email.id} className="flex gap-2 group animate-in slide-in-from-top-2 duration-150">
                                    <div className="relative flex-1">
                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-600 group-focus-within:text-white transition-colors">
                                            <Mail className="w-4 h-4" />
                                        </div>
                                        <Input
                                            type="email"
                                            placeholder="volunteer@example.com"
                                            value={email.value}
                                            onChange={(e) => handleEmailChange(email.id, e.target.value)}
                                            className="pl-10"
                                            required
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveEmail(email.id)}
                                        className="p-2.5 border border-neutral-800 text-neutral-600 hover:text-red-500 hover:border-red-900/50 hover:bg-red-950/20 transition-all duration-150"
                                    >
                                        <Trash className="w-5 h-5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="pt-4 flex gap-3">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={onClose}
                            className="flex-1 border border-neutral-800 hover:bg-neutral-900 font-bold"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            className="flex-1 bg-white text-black hover:bg-neutral-200 font-bold border-none"
                        >
                            Send Invitations
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
