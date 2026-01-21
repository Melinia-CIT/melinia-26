import { useState, useEffect, useRef } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import toast from "react-hot-toast"
import { User, Mail, Phone, GraduationCap, NavArrowDown, Book } from "iconoir-react"
import { createProfileSchema, type CreateProfile } from "@melinia/shared"
import api from "../../services/api"

interface ProfileProps {
    initialData?: Record<string, unknown>
}

interface College {
    id: number
    name: string
}

interface Degree {
    id: number
    name: string
}

const yearOptions = [1, 2, 3, 4, 5]

const SearchableDropdown = ({
    query,
    setQuery,
    results,
    isOpen,
    setIsOpen,
    focusedIndex,
    setFocusedIndex,
    isLoading,
    hasSearched,
    onSelect,
    inputClassName,
    placeholder,
    icon: Icon,
}: {
    query: string
    setQuery: (val: string) => void
    results: Array<{ id: number; name: string }>
    isOpen: boolean
    setIsOpen: React.Dispatch<React.SetStateAction<boolean>>
    focusedIndex: number | null
    setFocusedIndex: React.Dispatch<React.SetStateAction<number | null>>
    isLoading: boolean
    hasSearched: boolean
    onSelect: (item: { id: number; name: string }) => void
    inputClassName: string
    placeholder: string
    icon?: React.ComponentType<{ className?: string; width?: number; height?: number }>
}) => {
    const containerRef = useRef<HTMLDivElement>(null)
    const dropdownRef = useRef<HTMLDivElement>(null)
    const itemRefs = useRef<(HTMLDivElement | null)[]>([])

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }

        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [setIsOpen])

    useEffect(() => {
        if (focusedIndex !== null && itemRefs.current[focusedIndex]) {
            itemRefs.current[focusedIndex]?.scrollIntoView({ block: "nearest" })
        }
    }, [focusedIndex])

    const showDropdown = isOpen && query.length >= 2

    return (
        <div ref={containerRef} className="relative">
            <div className="relative">
                {Icon && (
                    <Icon
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 z-10"
                        width={18}
                        height={18}
                    />
                )}
                <input
                    type="text"
                    value={query}
                    onChange={e => {
                        setQuery(e.target.value)
                        if (e.target.value.length >= 2) {
                            setIsOpen(true)
                        }
                    }}
                    onFocus={() => {
                        if (query.length >= 2) {
                            setIsOpen(true)
                        }
                    }}
                    onBlur={() => {
                        setIsOpen(false)
                    }}
                    onKeyDown={e => {
                        if (!isOpen || results.length === 0) {
                            if (e.key === "Enter") {
                                e.preventDefault()
                                if (results.length > 0) {
                                    setFocusedIndex(0)
                                    setIsOpen(true)
                                }
                            }
                            return
                        }

                        switch (e.key) {
                            case "ArrowDown":
                                e.preventDefault()
                                setFocusedIndex((prev: number | null) => {
                                    if (prev === null) return 0
                                    return Math.min(prev + 1, results.length - 1)
                                })
                                break
                            case "ArrowUp":
                                e.preventDefault()
                                setFocusedIndex((prev: number | null) => {
                                    if (prev === null || prev === 0) return results.length - 1
                                    return prev - 1
                                })
                                break
                            case "Enter":
                                e.preventDefault()
                                if (focusedIndex !== null && results[focusedIndex]) {
                                    onSelect(results[focusedIndex])
                                } else if (results.length > 0) {
                                    onSelect(results[0])
                                }
                                break
                            case "Escape":
                                setIsOpen(false)
                                setFocusedIndex(null)
                                break
                        }
                    }}
                    className={inputClassName}
                    placeholder={placeholder}
                />
            </div>

            {showDropdown && (
                <div
                    ref={dropdownRef}
                    tabIndex={-1}
                    className="absolute z-50 w-full mt-1 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl max-h-60 overflow-auto outline-none"
                >
                    {isLoading && <div className="px-4 py-3 text-sm text-zinc-500">Loading...</div>}

                    {!isLoading &&
                        results.map((item, idx) => (
                            <div
                                key={item.id}
                                ref={el => {
                                    itemRefs.current[idx] = el
                                }}
                                tabIndex={-1}
                                onPointerDown={e => e.preventDefault()}
                                onClick={() => onSelect(item)}
                                className={`px-4 py-3 text-sm cursor-pointer transition-colors ${
                                    focusedIndex === idx
                                        ? "bg-zinc-800 text-zinc-100"
                                        : "text-zinc-300 hover:bg-zinc-800/50"
                                }`}
                            >
                                {item.name}
                            </div>
                        ))}

                    {hasSearched && !isLoading && results.length === 0 && (
                        <div className="px-4 py-3 text-sm text-zinc-500">
                            No results found. Your input will be taken.
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

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

    const watchedYear = watch("year")

    const [activeDropdown, setActiveDropdown] = useState<"college" | "degree" | null>(null)

    const [collegeQuery, setCollegeQuery] = useState((initialData?.college as string) || "")
    const [collegeResults, setCollegeResults] = useState<College[]>([])
    const [collegeFocused, setCollegeFocused] = useState<number | null>(null)
    const [isCollegeSearching, setIsCollegeSearching] = useState(false)
    const [hasCollegeSearched, setHasCollegeSearched] = useState(false)
    const [collegeSelectedQuery, setCollegeSelectedQuery] = useState("")

    const [degreeQuery, setDegreeQuery] = useState((initialData?.degree as string) || "")
    const [degreeResults, setDegreeResults] = useState<Degree[]>([])
    const [degreeFocused, setDegreeFocused] = useState<number | null>(null)
    const [isDegreeSearching, setIsDegreeSearching] = useState(false)
    const [hasDegreeSearched, setHasDegreeSearched] = useState(false)
    const [degreeSelectedQuery, setDegreeSelectedQuery] = useState("")

    const isCollegeOpen = activeDropdown === "college"
    const isDegreeOpen = activeDropdown === "degree"

    useEffect(() => {
        if (collegeQuery.length < 2 || collegeQuery === collegeSelectedQuery) {
            setCollegeResults([])
            setHasCollegeSearched(false)
            return
        }

        const timer = setTimeout(async () => {
            setIsCollegeSearching(true)
            try {
                const res = await api.get("/colleges", { q: encodeURIComponent(collegeQuery) })
                const data = res.data.data || []
                setCollegeResults(data)
                setHasCollegeSearched(true)
                if (data.length > 0) {
                    setActiveDropdown("college")
                    setCollegeFocused(0)
                }
            } catch {
                setCollegeResults([])
                setHasCollegeSearched(false)
            } finally {
                setIsCollegeSearching(false)
            }
        }, 300)

        return () => clearTimeout(timer)
    }, [collegeQuery, collegeSelectedQuery])

    useEffect(() => {
        if (degreeQuery.length < 2 || degreeQuery === degreeSelectedQuery) {
            setDegreeResults([])
            setHasDegreeSearched(false)
            return
        }

        const timer = setTimeout(async () => {
            setIsDegreeSearching(true)
            try {
                const res = await api.get("/colleges/degrees", {
                    q: encodeURIComponent(degreeQuery),
                })
                const data = res.data.data || []
                setDegreeResults(data)
                setHasDegreeSearched(true)
                if (data.length > 0) {
                    setActiveDropdown("degree")
                    setDegreeFocused(0)
                }
            } catch {
                setDegreeResults([])
                setHasDegreeSearched(false)
            } finally {
                setIsDegreeSearching(false)
            }
        }, 300)

        return () => clearTimeout(timer)
    }, [degreeQuery, degreeSelectedQuery])

    const selectCollege = (college: College) => {
        setCollegeQuery(college.name)
        setCollegeSelectedQuery(college.name)
        setValue("college", college.name)
        setActiveDropdown(null)
        setCollegeFocused(null)
    }

    const selectDegree = (degree: Degree) => {
        setDegreeQuery(degree.name)
        setDegreeSelectedQuery(degree.name)
        setValue("degree", degree.name)
        setActiveDropdown(null)
        setDegreeFocused(null)
    }

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
                                placeholder="Peter"
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
                            placeholder="Parker"
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
                            tabIndex={-1}
                            className="w-full rounded-lg bg-zinc-900/50 border border-zinc-800 pl-10 pr-4 py-2 text-sm text-zinc-400 cursor-not-allowed"
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
                    <SearchableDropdown
                        query={collegeQuery}
                        setQuery={val => {
                            setCollegeQuery(val)
                            setValue("college", val)
                        }}
                        results={collegeResults}
                        isOpen={isCollegeOpen}
                        setIsOpen={open =>
                            open ? setActiveDropdown("college") : setActiveDropdown(null)
                        }
                        focusedIndex={collegeFocused}
                        setFocusedIndex={setCollegeFocused}
                        isLoading={isCollegeSearching}
                        hasSearched={hasCollegeSearched}
                        onSelect={selectCollege}
                        inputClassName={`${getInputClass("college")} pl-10 pr-10`}
                        placeholder="Search college..."
                        icon={GraduationCap}
                    />
                    {errors.college && (
                        <p className="text-red-400 text-[10px] mt-1">{errors.college.message}</p>
                    )}
                </div>

                <div>
                    <label className={`block text-xs font-medium mb-1 ${getLabelClass("degree")}`}>
                        Degree *
                    </label>
                    <SearchableDropdown
                        query={degreeQuery}
                        setQuery={val => {
                            setDegreeQuery(val)
                            setValue("degree", val)
                        }}
                        results={degreeResults}
                        isOpen={isDegreeOpen}
                        setIsOpen={open =>
                            open ? setActiveDropdown("degree") : setActiveDropdown(null)
                        }
                        focusedIndex={degreeFocused}
                        setFocusedIndex={setDegreeFocused}
                        isLoading={isDegreeSearching}
                        hasSearched={hasDegreeSearched}
                        onSelect={selectDegree}
                        inputClassName={`${getInputClass("degree")} pl-10 pr-10`}
                        placeholder="Search degree..."
                        icon={Book}
                    />
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
