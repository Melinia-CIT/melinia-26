import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createProfileSchema, type createProfileType } from "@melinia/shared";

interface ProfileStepProps {
  formData: createProfileType;
  onInputChange: (name: string, value: string) => void;
  onSubmit: (data: createProfileType) => Promise<void>;
  errors: Record<string, string>;
  isLoading: boolean;
}

export const ProfileStep: React.FC<ProfileStepProps> = ({
  formData,
  onInputChange,
  onSubmit,
  errors,
  isLoading,
}) => {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors: formErrors, isDirty, isValid },
  } = useForm<createProfileType>({
    resolver: zodResolver(createProfileSchema),
    mode: "onChange",
    defaultValues: formData,
  });

  const degree = watch("degree", formData.degree);

  // Debug validation state
  React.useEffect(() => {
    console.log("isValid:", isValid);
    console.log("formErrors:", formErrors);
    console.log("isDirty:", isDirty);
  }, [isValid, formErrors, isDirty]);

  // Wrap onSubmit to handle loading state properly
  const handleFormSubmit = async (data: createProfileType) => {
    try {
      await onSubmit(data);
    } catch (error) {
      // Error is handled by parent component
      console.error("Form submission error:", error);
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit(handleFormSubmit)}>
      <h2 className="text-xl font-semibold mb-6">Complete Your Profile</h2>

      <div className="grid grid-cols-2 gap-4">
        {/* First Name */}
        <div>
          <label className="block text-xs font-medium mb-1">First Name *</label>
          <input
            type="text"
            placeholder="John"
            disabled={isLoading}
            {...register("firstName")}
            className={`w-full px-3 py-1.5 rounded-md bg-zinc-800 text-zinc-100 placeholder-zinc-500 border transition focus:outline-none text-sm ${
              formErrors.firstName
                ? "border-red-500 focus:border-red-500"
                : "border-zinc-700 focus:border-zinc-500"
            } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
          />
          {formErrors.firstName?.message && (
            <p className="text-red-500 text-xs mt-0.5">
              {String(formErrors.firstName.message)}
            </p>
          )}
        </div>

        {/* Last Name */}
        <div>
          <label className="block text-xs font-medium mb-1">Last Name</label>
          <input
            type="text"
            placeholder="Doe"
            disabled={isLoading}
            {...register("lastName")}
            className={`w-full px-3 py-1.5 rounded-md bg-zinc-800 text-zinc-100 placeholder-zinc-500 border transition focus:outline-none text-sm ${
              formErrors.lastName
                ? "border-red-500 focus:border-red-500"
                : "border-zinc-700 focus:border-zinc-500"
            } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
          />
        </div>

        {/* College - Full Width */}
        <div className="col-span-2">
          <label className="block text-xs font-medium mb-1">College *</label>
          <input
            type="text"
            placeholder="Your College"
            disabled={isLoading}
            {...register("college")}
            className={`w-full px-3 py-1.5 rounded-md bg-zinc-800 text-zinc-100 placeholder-zinc-500 border transition focus:outline-none text-sm ${
              formErrors.college
                ? "border-red-500 focus:border-red-500"
                : "border-zinc-700 focus:border-zinc-500"
            } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
          />
          {formErrors.college?.message && (
            <p className="text-red-500 text-xs mt-0.5">
              {String(formErrors.college.message)}
            </p>
          )}
        </div>

        {/* Degree */}
        <div>
          <label className="block text-xs font-medium mb-1">Degree *</label>
          <select
            disabled={isLoading}
            {...register("degree")}
            className={`w-full px-3 py-1.5 rounded-md bg-zinc-800 text-zinc-100 border transition focus:outline-none text-sm ${
              formErrors.degree
                ? "border-red-500 focus:border-red-500"
                : "border-zinc-700 focus:border-zinc-500"
            } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <option value="">Select Degree</option>
            <option value="B.Tech">B.Tech</option>
            <option value="B.Sc">B.Sc</option>
            <option value="B.A">B.A</option>
            <option value="M.Tech">M.Tech</option>
            <option value="Other">Other</option>
          </select>
          {formErrors.degree?.message && (
            <p className="text-red-500 text-xs mt-0.5">
              {String(formErrors.degree.message)}
            </p>
          )}
        </div>

        {/* Year */}
        <div>
          <label className="block text-xs font-medium mb-1">Year *</label>
          <select
            disabled={isLoading}
            {...register("year", { valueAsNumber: true })}
            className={`w-full px-3 py-1.5 rounded-md bg-zinc-800 text-zinc-100 border transition focus:outline-none text-sm ${
              formErrors.year
                ? "border-red-500 focus:border-red-500"
                : "border-zinc-700 focus:border-zinc-500"
            } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <option value="">Select Year</option>
            <option value="1">1st Year</option>
            <option value="2">2nd Year</option>
            <option value="3">3rd Year</option>
            <option value="4">4th Year</option>
            <option value="5">5th Year</option>
          </select>
          {formErrors.year?.message && (
            <p className="text-red-500 text-xs mt-0.5">
              {String(formErrors.year.message)}
            </p>
          )}
        </div>

        {/* Other Degree - Conditional */}
        {degree && degree.toLowerCase() === "other" && (
          <div className="col-span-2">
            <label className="block text-xs font-medium mb-1">
              Specify Degree *
            </label>
            <input
              type="text"
              placeholder="Your Degree"
              disabled={isLoading}
              {...register("otherDegree")}
              className={`w-full px-3 py-1.5 rounded-md bg-zinc-800 text-zinc-100 placeholder-zinc-500 border transition focus:outline-none text-sm ${
                formErrors.otherDegree
                  ? "border-red-500 focus:border-red-500"
                  : "border-zinc-700 focus:border-zinc-500"
              } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
            />
            {formErrors.otherDegree?.message && (
              <p className="text-red-500 text-xs mt-0.5">
                {String(formErrors.otherDegree.message)}
              </p>
            )}
          </div>
        )}

        {/* Phone Number - Full Width */}
        <div className="col-span-2">
          <label className="block text-xs font-medium mb-1">
            Phone Number *
          </label>
          <input
            type="tel"
            placeholder="1234567890"
            disabled={isLoading}
            maxLength={10}
            {...register("ph_no")}
            className={`w-full px-3 py-1.5 rounded-md bg-zinc-800 text-zinc-100 placeholder-zinc-500 border transition focus:outline-none text-sm ${
              formErrors.ph_no
                ? "border-red-500 focus:border-red-500"
                : "border-zinc-700 focus:border-zinc-500"
            } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
            onInput={(e) => {
              // Allow only digits
              e.currentTarget.value = e.currentTarget.value
                .replace(/\D/g, "")
                .slice(0, 10);
            }}
          />
          {formErrors.ph_no?.message && (
            <p className="text-red-500 text-xs mt-0.5">
              {String(formErrors.ph_no.message)}
            </p>
          )}
        </div>
      </div>

      {/* Form-level error */}
      {errors.form && (
        <div className="bg-red-500/10 border border-red-500 rounded-md p-3 mt-4">
          <p className="text-red-500 text-sm">{errors.form}</p>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full mt-4 px-4 py-2 bg-zinc-100 hover:bg-zinc-200 hover:enabled:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed text-zinc-950 rounded font-medium transition"
      >
        {isLoading ? "Submitting..." : "Complete Registration"}
      </button>
    </form>
  );
};