import React from "react";

interface Step {
    number: number;
    label: string;
}

// Progress Bar Component
interface ProgressBarProps {
    currentStep: number;
    totalSteps: number;
    steps: Step[];
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ currentStep, totalSteps, steps }) => {
    return (
        <div className="w-full mb-8 flex flex-col items-center justify-between">
            <div className="flex justify-between items-center mb-4">
                {steps.map((step, index) => (
                    <div key={step.number} className="flex items-center flex-1">
                        <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors ${currentStep >= step.number
                                    ? 'bg-zinc-100 text-zinc-950'
                                    : 'bg-zinc-700 text-zinc-100'
                                }`}
                        >
                            {step.number}
                        </div>
                        {index < steps.length - 1 && (
                            <div
                                className={`flex-1 h-1 mx-2 transition-colors z-100 ${currentStep > step.number ? 'bg-zinc-100' : 'bg-zinc-700'
                                    }`}
                            />
                        )}
                    </div>
                ))}
            </div>
            <div className="text-center text-zinc-400 text-sm">
                Step {currentStep} of {totalSteps} - {steps[currentStep - 1].label}
            </div>
        </div>
    );
};
