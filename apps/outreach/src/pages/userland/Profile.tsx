import { useState, useEffect, useCallback, useMemo } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import toast from "react-hot-toast"
import { User, Mail, Phone, GraduationCap, NavArrowDown, Book } from "iconoir-react"
import { createProfileSchema, type CreateProfile } from "@melinia/shared"
import api from "../../services/api"
import SearchableSelect from "../../components/ui/SearchableSelect"

interface ProfileProps {
    initialData?: Record<string, unknown>
}

interface College {
    id: number
    name: string
    degrees: string[]
}

interface DegreeOption {
    name: string
}

function useCollegeSearch(debounceMs = 300) {
    const [query, setQuery] = useState("")
    const [results, setResults] = useState<College[]>([])
    const [isLoading, setIsLoading] = useState(false)

    const search = useCallback(async (searchTerm: string) => {
        setIsLoading(true)
        try {
            const res = await api.get(`/colleges?search=${encodeURIComponent(searchTerm)}`)
            const data = res.data.data || []

            const seen = new Set<string>()
            const deduplicated: College[] = []
            for (const college of data) {
                if (!seen.has(college.name)) {
                    seen.add(college.name)
                    deduplicated.push(college)
                }
            }
            setResults(deduplicated)
        } catch (err) {
            console.error("College search failed:", err)
            setResults([])
        } finally {
            setIsLoading(false)
        }
    }, [])

    useEffect(() => {
        const timer = setTimeout(() => {
            search(query)
        }, debounceMs)

        return () => clearTimeout(timer)
    }, [query, debounceMs, search])

    return { query, setQuery, results, isLoading }
}

const yearOptions = [1, 2, 3, 4, 5]

const Profile = ({ initialData }: ProfileProps) => {
    const queryClient = useQueryClient()

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        formState: { errors },
    } = useForm<CreateProfile>({
        resolver: zodResolver(createProfileSchema),
        defaultValues: {
            first_name: (initialData?.first_name as string) || "",
            last_name: (initialData?.last_name as string) || "",
            ph_no: (initialData?.ph_no as string) || "",
            college: (initialData?.college as string) || "",
            degree: (initialData?.degree as string) || "",
            year: typeof initialData?.year === "number" ? initialData.year : 0,
        },
    })

    const watchedCollege = watch("college")
    const watchedDegree = watch("degree")
    const watchedYear = watch("year")

    const {
        query,
        setQuery,
        results: colleges,
        isLoading: isSearchingColleges,
    } = useCollegeSearch(300)

    useEffect(() => {
        if (watchedCollege && query !== watchedCollege) {
            setQuery(watchedCollege)
        }
    }, [watchedCollege, query, setQuery])

    const selectedCollegeObj = colleges.find(c => c.name === watchedCollege)
    const availableDegrees = selectedCollegeObj?.degrees || []
    const degreeOptions: DegreeOption[] = useMemo(() => {
        const seen = new Set<string>()
        return availableDegrees
            .filter(d => {
                if (seen.has(d)) return false
                seen.add(d)
                return true
            })
            .map(d => ({ name: d }))
    }, [availableDegrees])

    useEffect(() => {
        setValue("degree", "")
    }, [watchedCollege, setValue])

    const updateMutation = useMutation({
        mutationFn: async (values: CreateProfile) => {
            await api.post("/users/profile", values)
        },
        onSuccess: () => {
            toast.success("Profile setup completed!")
            queryClient.invalidateQueries({ queryKey: ["userMe"] })
        },
        onError: (error: any) => {
            console.error(error)
            toast.error(error.response?.data?.message || "Failed to setup profile.")
        },
    })

    const onSubmit = (data: CreateProfile) => {
        updateMutation.mutate(data)
    }

    const getInputClass = (fieldName: keyof typeof errors) => {
        const base =
            "w-full rounded-lg bg-zinc-950 border px-4 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-1 transition-colors duration-200"
        const errorClass = errors[fieldName]
            ? "border-red-500 focus:ring-red-500/50"
            : "border-zinc-800 focus:ring-zinc-600"
        return `${base} ${errorClass}`
    }

    const getLabelClass = (fieldName: keyof typeof errors) => {
        return errors[fieldName] ? "text-red-400" : "text-zinc-400"
    }

    return (
        <div className="w-full font-geist text-base text-zinc-100">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label
                            className={`block text-xs font-medium mb-1 ${getLabelClass("first_name")}`}
                        >
                            First Name *
                        </label>
                        <div className="relative">
                            <User
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
                                width={18}
                                height={18}
                            />
                            <input
                                className={`${getInputClass("first_name")} pl-10`}
                                placeholder="Spider"
                                {...register("first_name")}
                            />
                        </div>
                        {errors.first_name && (
                            <p className="text-red-400 text-[10px] mt-1">
                                {errors.first_name.message}
                            </p>
                        )}
                    </div>
                    <div>
                        <label className="block text-xs font-medium mb-1 text-zinc-400">
                            Last Name
                        </label>
                        <input
                            className={getInputClass("last_name")}
                            placeholder="Man"
                            {...register("last_name")}
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-medium mb-1 text-zinc-500">Email</label>
                    <div className="relative opacity-75">
                        <Mail
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
                            width={18}
                            height={18}
                        />
                        <input
                            type="email"
                            value={(initialData?.email as string) || ""}
                            readOnly
                            className="w-full rounded-lg bg-zinc-900/50 border border-zinc-800 pl-10 pr-4 py-2 text-sm text-zinc-500 cursor-not-allowed"
                        />
                    </div>
                </div>

                <div>
                    <label className={`block text-xs font-medium mb-1 ${getLabelClass("ph_no")}`}>
                        Phone Number *
                    </label>
                    <div className="relative">
                        <Phone
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
                            width={18}
                            height={18}
                        />
                        <input
                            className={`${getInputClass("ph_no")} pl-10`}
                            type="tel"
                            placeholder="1234567890"
                            maxLength={10}
                            {...register("ph_no")}
                        />
                    </div>
                    {errors.ph_no && (
                        <p className="text-red-400 text-[10px] mt-1">{errors.ph_no.message}</p>
                    )}
                </div>

                <div>
                    <label className={`block text-xs font-medium mb-1 ${getLabelClass("college")}`}>
                        College *
                    </label>
                    <div className="relative">
                        <GraduationCap
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 z-10"
                            width={18}
                            height={18}
                        />
                        <SearchableSelect<College>
                            data={colleges}
                            searchKeys={["name"]}
                            placeholder="Search college..."
                            value={query}
                            onChange={val => {
                                setQuery(val)
                                setValue("college", val)
                            }}
                            displayKey="name"
                            isLoading={isSearchingColleges}
                            inputClassName={`${getInputClass("college")} pl-10 pr-10`}
                        />
                    </div>
                    {errors.college && (
                        <p className="text-red-400 text-[10px] mt-1">{errors.college.message}</p>
                    )}
                </div>

                <div>
                    <label className={`block text-xs font-medium mb-1 ${getLabelClass("degree")}`}>
                        Degree *
                    </label>
                    <div className="relative">
                        <Book
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 z-10"
                            width={18}
                            height={18}
                        />
                        <SearchableSelect<DegreeOption>
                            data={degreeOptions}
                            searchKeys={["name"]}
                            placeholder={
                                !watchedCollege
                                    ? "Select college first"
                                    : "Search or type degree..."
                            }
                            value={watchedDegree}
                            onChange={val => setValue("degree", val)}
                            disabled={!watchedCollege}
                            displayKey="name"
                            inputClassName={`${getInputClass("degree")} pl-10 pr-10`}
                        />
                    </div>
                    {errors.degree && (
                        <p className="text-red-400 text-[10px] mt-1">{errors.degree.message}</p>
                    )}
                </div>

                <div>
                    <label className={`block text-xs font-medium mb-1 ${getLabelClass("year")}`}>
                        Year *
                    </label>
                    <div className="relative">
                        <select
                            className={`${getInputClass("year")} appearance-none pl-4 pr-10 w-full cursor-pointer`}
                            {...register("year", { valueAsNumber: true })}
                            value={watchedYear || ""}
                        >
                            <option value="" disabled>
                                Select Year
                            </option>
                            {yearOptions.map(yr => (
                                <option key={yr} value={yr.toString()}>
                                    {yr}
                                </option>
                            ))}
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none">
                            <NavArrowDown width={16} height={16} strokeWidth={2} />
                        </div>
                    </div>
                    {errors.year && (
                        <p className="text-red-400 text-[10px] mt-1">{errors.year.message}</p>
                    )}
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
    )
}

export default Profile
