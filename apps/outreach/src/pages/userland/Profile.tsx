import { useEffect, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { User, Mail, Phone, GraduationCap, Xmark, NavArrowDown } from "iconoir-react";
import { createProfileSchema, type CreateProfile } from "@melinia/shared";
import api from "../../services/api";

interface ProfileProps {
    initialData?: any;
}

interface College {
    id: number;
    name: string;
    degrees: string[];
}

const Profile = ({ initialData }: ProfileProps) => {
    const queryClient = useQueryClient();

    const [collegeSearchQuery, setCollegeSearchQuery] = useState("");
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [degreeSearchQuery, setDegreeSearchQuery] = useState("");
    const [isDegreeDropdownOpen, setIsDegreeDropdownOpen] = useState(false);
    const degreeDropdownRef = useRef<HTMLDivElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        formState: { errors },
    } = useForm<CreateProfile>({
        resolver: zodResolver(createProfileSchema),
        defaultValues: {
            first_name: initialData?.first_name || "",
            last_name: initialData?.last_name || "",
            ph_no: initialData?.ph_no || "",
            college: initialData?.college || "",
            degree: initialData?.degree || "",
            year: initialData?.year || "",
        },
    });

    const watchedCollege = watch("college");

    const { data: colleges = [] } = useQuery<College[]>({
        queryKey: ["colleges"],
        queryFn: async () => {
            const response = await api.get("/colleges");
            return response.data;
        },
    });

    useEffect(() => {
        if (initialData?.college && !collegeSearchQuery) {
            setCollegeSearchQuery(initialData.college);
        } else if (watchedCollege && watchedCollege !== collegeSearchQuery) {
            // Sync if changed programmatically
            setCollegeSearchQuery(watchedCollege);
        }
    }, [initialData, watchedCollege]);

    useEffect(() => {
        setValue("degree", "");
    }, [watchedCollege, setValue]);

    useEffect(() => {
        if (initialData?.degree && !degreeSearchQuery) {
            setDegreeSearchQuery(initialData.degree);
        } else if (watch("degree") && watch("degree") !== degreeSearchQuery) {
            setDegreeSearchQuery(watch("degree"));
        }
    }, [initialData, watch("degree")]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (degreeDropdownRef.current && !degreeDropdownRef.current.contains(event.target as Node)) {
                setIsDegreeDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);


    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const filteredColleges = colleges.filter((c) =>
        c.name.toLowerCase().includes(collegeSearchQuery.toLowerCase())
    );
    const selectedCollegeObj = colleges.find((c) => c.name === watchedCollege);
    const availableDegrees = selectedCollegeObj?.degrees || [];
    const filteredDegrees = availableDegrees.filter((d) =>
        d.toLowerCase().includes(degreeSearchQuery.toLowerCase())
    );

    const updateMutation = useMutation({
        mutationFn: async (values: CreateProfile) => {
            await api.post("/users/profile", values);
        },
        onSuccess: () => {
            toast.success("Profile setup completed!");
            queryClient.invalidateQueries({ queryKey: ["userMe"] });
        },
        onError: (error: any) => {
            console.error(error);
            toast.error(error.response?.data?.message || "Failed to setup profile.");
        },
    });

    const onSubmit = (data: CreateProfile) => {
        updateMutation.mutate(data);
    };

    const getInputClass = (fieldName: keyof typeof errors) => {
        const base = "w-full rounded-lg bg-zinc-950 border px-4 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-1 transition-colors duration-200";
        const errorClass = errors[fieldName] ? "border-red-500 focus:ring-red-500/50" : "border-zinc-800 focus:ring-zinc-600";
        return `${base} ${errorClass}`;
    };

    const getLabelClass = (fieldName: keyof typeof errors) => {
        return errors[fieldName] ? "text-red-400" : "text-zinc-400";
    };

    return (
        <div className="w-full font-geist text-base text-zinc-100">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

                {/* Name */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className={`block text-xs font-medium mb-1 ${getLabelClass("first_name")}`}>First Name *</label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" width={18} height={18} />
                            <input className={`${getInputClass("first_name")} pl-10`} placeholder="Spider" {...register("first_name")} />
                        </div>
                        {errors.first_name && <p className="text-red-400 text-[10px] mt-1">{errors.first_name.message}</p>}
                    </div>
                    <div>
                        <label className={`block text-xs font-medium mb-1 text-zinc-400`}>Last Name</label>
                        <input className={getInputClass("last_name")} placeholder="Man" {...register("last_name")} />
                    </div>
                </div>

                {/* Email (Read Only) */}
                <div>
                    <label className="block text-xs font-medium mb-1 text-zinc-500">Email</label>
                    <div className="relative opacity-75">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" width={18} height={18} />
                        <input
                            type="email"
                            value={initialData?.email || ""}
                            readOnly
                            className="w-full rounded-lg bg-zinc-900/50 border border-zinc-800 pl-10 pr-4 py-2 text-sm text-zinc-500 cursor-not-allowed"
                        />
                    </div>
                </div>

                {/* Phone */}
                <div>
                    <label className={`block text-xs font-medium mb-1 ${getLabelClass("ph_no")}`}>Phone Number *</label>
                    <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" width={18} height={18} />
                        <input className={`${getInputClass("ph_no")} pl-10`} type="tel" placeholder="1234567890" maxLength={10} {...register("ph_no")} />
                    </div>
                    {errors.ph_no && <p className="text-red-400 text-[10px] mt-1">{errors.ph_no.message}</p>}
                </div>

                {/* Searchable College Input */}
                <div className="relative" ref={dropdownRef}>
                    <label className={`block text-xs font-medium mb-1 ${getLabelClass("college")}`}>College *</label>
                    <div className="relative">
                        <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" width={18} height={18} />
                        <input
                            type="text"
                            placeholder="Search or type college..."
                            value={collegeSearchQuery}
                            onChange={(e) => {
                                setCollegeSearchQuery(e.target.value);
                                setValue("college", e.target.value); // Keep form value in sync
                                setIsDropdownOpen(true);
                            }}
                            onFocus={() => setIsDropdownOpen(true)}
                            className={`${getInputClass("college")} pl-10 pr-10`}
                        />

                        {/* Clear Button */}
                        {collegeSearchQuery && (
                            <button
                                type="button"
                                onClick={() => {
                                    setCollegeSearchQuery("");
                                    setValue("college", "");
                                }}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                            >
                                <Xmark width={16} height={16} strokeWidth={2.5} />
                            </button>
                        )}
                    </div>

                    {/* Dropdown List */}
                    {isDropdownOpen && (
                        <div className="absolute z-50 w-full mt-1 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                            {filteredColleges.length > 0 ? (
                                filteredColleges.map((college) => (
                                    <div
                                        key={college.id}
                                        onClick={() => {
                                            setValue("college", college.name);
                                            setCollegeSearchQuery(college.name);
                                            setIsDropdownOpen(false);
                                        }}
                                        className="px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 cursor-pointer transition-colors"
                                    >
                                        {college.name}
                                    </div>
                                ))
                            ) : (
                                <div className="p-3 text-xs text-zinc-500 text-center">
                                    No matches found. Your input will be saved.
                                </div>
                            )}
                        </div>
                    )}

                    {/* Hidden input ensures validation works if needed, though we bind directly to the visible input's onChange */}
                    <input type="hidden" {...register("college")} />
                    {errors.college && <p className="text-red-400 text-[10px] mt-1">{errors.college.message}</p>}
                </div>

                {/* Degree Field */}
                <div>
                    <label className={`block text-xs font-medium mb-1 ${getLabelClass("degree")}`}>
                        Degree *
                    </label>

                    <div className="relative" ref={degreeDropdownRef}>
                        <div className="relative">
                            <input
                                type="text"
                                placeholder={!watchedCollege ? "Select college first" : "Search or type degree..."}
                                disabled={!watchedCollege}
                                value={degreeSearchQuery}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setDegreeSearchQuery(val);
                                    setValue("degree", val);
                                    setIsDegreeDropdownOpen(true);
                                }}
                                onFocus={() => setIsDegreeDropdownOpen(true)}
                                className={`${getInputClass("degree")} pr-10`}
                            />

                            {degreeSearchQuery && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setDegreeSearchQuery("");
                                        setValue("degree", "");
                                    }}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                                >
                                    <Xmark width={16} height={16} strokeWidth={2.5} />
                                </button>
                            )}
                        </div>

                        {/* Dropdown List */}
                        {isDegreeDropdownOpen && selectedCollegeObj && selectedCollegeObj.degrees.length > 0 && (
                            <div className="absolute z-50 w-full mt-1 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                                {filteredDegrees.length > 0 ? (
                                    filteredDegrees.map((deg) => (
                                        <div
                                            key={deg}
                                            onClick={() => {
                                                setValue("degree", deg);
                                                setDegreeSearchQuery(deg);
                                                setIsDegreeDropdownOpen(false);
                                            }}
                                            className="px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 cursor-pointer transition-colors"
                                        >
                                            {deg}
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-3 text-xs text-zinc-500 text-center">
                                        No degrees found. Your input will be saved.
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {errors.degree && <p className="text-red-400 text-[10px] mt-1">{errors.degree.message}</p>}
                </div>

                {/* Year Field */}
                <div>
                    <label className={`block text-xs font-medium mb-1 ${getLabelClass("year")}`}>Year *</label>
                    <div className="relative">
                        <select
                            className={`${getInputClass("year")} appearance-none pl-4 pr-10`}
                            {...register("year", { valueAsNumber: true })}
                        >
                            <option value="" disabled>Select Year</option>
                            {[1, 2, 3, 4, 5].map((yr) => (
                                <option key={yr} value={yr.toString()}>{yr}</option>
                            ))}
                        </select>

                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none">
                            <NavArrowDown width={16} height={16} strokeWidth={2} />
                        </div>
                    </div>
                    {errors.year && <p className="text-red-400 text-[10px] mt-1">{errors.year.message}</p>}
                </div>

                <button
                    type="submit"
                    disabled={updateMutation.isPending}
                    className="w-full rounded-lg bg-zinc-100 py-2.5 text-sm text-zinc-900 font-semibold hover:bg-white transition disabled:opacity-70 mt-6"
                >
                    {updateMutation.isPending ? "Saving..." : "Finish"}
                </button>
            </form>
        </div>
    );
};

export default Profile;
