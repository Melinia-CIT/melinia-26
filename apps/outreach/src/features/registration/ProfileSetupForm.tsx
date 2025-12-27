import React from "react";
import { Errors, FormData } from "./types";

// Profile Step Component
interface ProfileStepProps {
    formData: Omit<FormData, 'email' | 'otp' | 'passwd' | 'confirmPasswd'>;
    onInputChange: (name: string, value: string) => void;
    errors: Errors;
    onSubmit: any
}

export const ProfileStep: React.FC<ProfileStepProps> = ({
    formData,
    onInputChange,
    errors,
    onSubmit
}) => {
    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\D/g, '').slice(0, 10);
        onInputChange('ph_no', value);
    };

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-6">Complete Your Profile</h2>

            <div className="grid grid-cols-2 gap-4">
                {/* First Name */}
                <div>
                    <label className="block text-xs font-medium mb-1">First Name *</label>
                    <input
                        type="text"
                        value={formData.firstName}
                        onChange={(e) => onInputChange('firstName', e.target.value)}
                        placeholder="John"
                        className="w-full px-3 py-1.5 rounded-md bg-zinc-800 text-zinc-100 placeholder-zinc-500 border border-zinc-700 focus:outline-none focus:border-zinc-500 text-sm"
                    />
                    {errors.firstName && (
                        <p className="text-red-500 text-xs mt-0.5">{errors.firstName}</p>
                    )}
                </div>

                {/* Last Name */}
                <div>
                    <label className="block text-xs font-medium mb-1">Last Name</label>
                    <input
                        type="text"
                        value={formData.lastName}
                        onChange={(e) => onInputChange('lastName', e.target.value)}
                        placeholder="Doe"
                        className="w-full px-3 py-1.5 rounded-md bg-zinc-800 text-zinc-100 placeholder-zinc-500 border border-zinc-700 focus:outline-none focus:border-zinc-500 text-sm"
                    />
                </div>

                {/* College - Full Width */}
                <div className="col-span-2">
                    <label className="block text-xs font-medium mb-1">College *</label>
                    <input
                        type="text"
                        value={formData.college}
                        onChange={(e) => onInputChange('college', e.target.value)}
                        placeholder="Your College"
                        className="w-full px-3 py-1.5 rounded-md bg-zinc-800 text-zinc-100 placeholder-zinc-500 border border-zinc-700 focus:outline-none focus:border-zinc-500 text-sm"
                    />
                    {errors.college && <p className="text-red-500 text-xs mt-0.5">{errors.college}</p>}
                </div>

                {/* Degree */}
                <div>
                    <label className="block text-xs font-medium mb-1">Degree *</label>
                    <select
                        value={formData.degree}
                        onChange={(e) => onInputChange('degree', e.target.value)}
                        className="w-full px-3 py-1.5 rounded-md bg-zinc-800 text-zinc-100 border border-zinc-700 focus:outline-none focus:border-zinc-500 text-sm"
                    >
                        <option value="">Select Degree</option>
                        <option value="B.Tech">B.Tech</option>
                        <option value="B.Sc">B.Sc</option>
                        <option value="B.A">B.A</option>
                        <option value="M.Tech">M.Tech</option>
                        <option value="Other">Other</option>
                    </select>
                    {errors.degree && <p className="text-red-500 text-xs mt-0.5">{errors.degree}</p>}
                </div>

                {/* Year */}
                <div>
                    <label className="block text-xs font-medium mb-1">Year *</label>
                    <select
                        value={formData.year}
                        onChange={(e) => onInputChange('year', e.target.value)}
                        className="w-full px-3 py-1.5 rounded-md bg-zinc-800 text-zinc-100 border border-zinc-700 focus:outline-none focus:border-zinc-500 text-sm"
                    >
                        <option value="">Select Year</option>
                        <option value="1">1st Year</option>
                        <option value="2">2nd Year</option>
                        <option value="3">3rd Year</option>
                        <option value="4">4th Year</option>
                        <option value="5">5th Year</option>
                    </select>
                    {errors.year && <p className="text-red-500 text-xs mt-0.5">{errors.year}</p>}
                </div>

                {/* Other Degree - Conditional */}
                {formData.degree.toLowerCase() === 'other' && (
                    <div className="col-span-2">
                        <label className="block text-xs font-medium mb-1">Specify Degree *</label>
                        <input
                            type="text"
                            value={formData.otherDegree}
                            onChange={(e) => onInputChange('otherDegree', e.target.value)}
                            placeholder="Your Degree"
                            className="w-full px-3 py-1.5 rounded-md bg-zinc-800 text-zinc-100 placeholder-zinc-500 border border-zinc-700 focus:outline-none focus:border-zinc-500 text-sm"
                        />
                        {errors.otherDegree && (
                            <p className="text-red-500 text-xs mt-0.5">{errors.otherDegree}</p>
                        )}
                    </div>
                )}

                {/* Phone Number - Full Width */}
                <div className="col-span-2">
                    <label className="block text-xs font-medium mb-1">Phone Number *</label>
                    <input
                        type="tel"
                        value={formData.ph_no}
                        onChange={handlePhoneChange}
                        placeholder="1234567890"
                        maxLength={10}
                        className="w-full px-3 py-1.5 rounded-md bg-zinc-800 text-zinc-100 placeholder-zinc-500 border border-zinc-700 focus:outline-none focus:border-zinc-500 text-sm"
                    />
                    {errors.ph_no && <p className="text-red-500 text-xs mt-0.5">{errors.ph_no}</p>}
                </div>
            </div>
            <button
                onClick={onSubmit}
                className="w-full mt-4 px-4 py-2 bg-zinc-100 hover:bg-zinc-200 disabled:opacity-50 text-zinc-950 rounded font-medium transition"
            >
                Submit
            </button>

        </div>
    );
};