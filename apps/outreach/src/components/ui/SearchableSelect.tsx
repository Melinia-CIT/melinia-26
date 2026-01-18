import { useEffect, useState, useRef, useCallback } from "react"
import Fuse from "fuse.js"
import { Xmark } from "iconoir-react"

interface SearchableSelectProps<T> {
    data: T[]
    searchKeys: (keyof T)[]
    placeholder: string
    value: string
    onChange: (value: string) => void
    disabled?: boolean
    displayKey: keyof T
    fuseOptions?: Record<string, unknown>
    inputClassName?: string
    dropdownClassName?: string
    isLoading?: boolean
}

export default function SearchableSelect<T>({
    data,
    searchKeys,
    placeholder,
    value,
    onChange,
    disabled = false,
    displayKey,
    fuseOptions,
    inputClassName,
    dropdownClassName,
    isLoading = false,
}: SearchableSelectProps<T>) {
    const [query, setQuery] = useState(value)
    const [isOpen, setIsOpen] = useState(false)
    const [highlightedIndex, setHighlightedIndex] = useState(-1)
    const [filteredResults, setFilteredResults] = useState<
        Array<Record<string, unknown> & { item: T }>
    >([])
    const [fuseInstance, setFuseInstance] = useState<unknown>(null)

    const containerRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)
    const resultRefs = useRef<(HTMLDivElement | null)[]>([])

    const defaultFuseOptions = {
        threshold: 0.5,
        distance: 100,
        ignoreLocation: true,
        minMatchCharLength: 1,
        includeScore: true,
        keys: searchKeys as string[],
        ...fuseOptions,
    }

    useEffect(() => {
        if (data.length > 0) {
            const fuse = new Fuse(data, defaultFuseOptions)
            setFuseInstance(fuse)
        }
    }, [data])

    useEffect(() => {
        setQuery(value)
    }, [value])

    useEffect(() => {
        if (!query || query.length < 2 || !fuseInstance) {
            setFilteredResults([])
            setHighlightedIndex(-1)
            return
        }

        const results = (fuseInstance as any).search(query)
        setFilteredResults(results)
        setHighlightedIndex(-1)
    }, [query, fuseInstance])

    const highlightMatch = useCallback((text: string, query: string) => {
        if (!query) return text
        const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
        const regex = new RegExp(`(${escapedQuery})`, "gi")
        return text.replace(regex, "<mark class='bg-zinc-700 text-white rounded px-0.5'>$1</mark>")
    }, [])

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }

        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    useEffect(() => {
        if (highlightedIndex >= 0 && resultRefs.current[highlightedIndex]) {
            resultRefs.current[highlightedIndex]?.scrollIntoView({
                block: "nearest",
                behavior: "smooth",
            })
        }
    }, [highlightedIndex])

    const handleSelect = useCallback(
        (selectedValue: string) => {
            onChange(selectedValue)
            setQuery(selectedValue)
            setIsOpen(false)
            inputRef.current?.blur()
        },
        [onChange]
    )

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            e.preventDefault()

            if (isOpen && filteredResults.length > 0) {
                const firstResult = filteredResults[0]
                const selectedValue = String(firstResult.item[displayKey])
                handleSelect(selectedValue)
            } else if (query.trim() && query.length >= 2) {
                handleSelect(query)
            }
            return
        }

        if (!isOpen) {
            if (e.key === "ArrowDown" || e.key === "ArrowUp") {
                setIsOpen(true)
            }
            if (e.key === "ArrowDown") {
                e.preventDefault()
                setHighlightedIndex(0)
            }
            return
        }

        const maxIndex =
            filteredResults.length > 0 ? filteredResults.length - 1 : query.length >= 2 ? 0 : -1

        switch (e.key) {
            case "ArrowDown":
                e.preventDefault()
                if (maxIndex >= 0) {
                    setHighlightedIndex(prev => (prev < maxIndex ? prev + 1 : 0))
                }
                break
            case "ArrowUp":
                e.preventDefault()
                if (maxIndex >= 0) {
                    setHighlightedIndex(prev => (prev > 0 ? prev - 1 : maxIndex))
                }
                break
            case "Escape":
                e.preventDefault()
                setIsOpen(false)
                setHighlightedIndex(-1)
                break
        }
    }

    const handleResultClick = (result: T) => {
        const selectedValue = String(result[displayKey])
        handleSelect(selectedValue)
    }

    const handleClear = () => {
        setQuery("")
        onChange("")
        inputRef.current?.focus()
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value
        setQuery(newValue)
        onChange(newValue)
        if (newValue.length >= 2 && filteredResults.length > 0) {
            setIsOpen(true)
        }
    }

    const handleInputFocus = () => {
        if (filteredResults.length > 0) {
            setIsOpen(true)
        }
    }

    return (
        <div className="relative" ref={containerRef}>
            <div className="relative">
                <input
                    ref={inputRef}
                    type="text"
                    placeholder={placeholder}
                    value={query}
                    onChange={handleInputChange}
                    onFocus={handleInputFocus}
                    onKeyDown={handleKeyDown}
                    disabled={disabled}
                    className={`${inputClassName} ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
                />

                {query && !isLoading && (
                    <button
                        type="button"
                        onClick={handleClear}
                        tabIndex={-1}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                    >
                        <Xmark width={16} height={16} strokeWidth={2.5} />
                    </button>
                )}

                {isLoading && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <div className="w-4 h-4 border-2 border-zinc-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                )}
            </div>

            {isOpen && filteredResults.length > 0 && (
                <div
                    className={`${dropdownClassName} absolute z-50 w-full mt-1 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl max-h-60 overflow-y-auto custom-scrollbar`}
                >
                    {filteredResults.map((result, index) => (
                        <div
                            key={index}
                            ref={el => {
                                resultRefs.current[index] = el
                            }}
                            onClick={() => handleResultClick(result.item)}
                            className={`px-4 py-2 text-sm text-zinc-300 cursor-pointer transition-colors ${
                                index === highlightedIndex ? "bg-zinc-700" : "hover:bg-zinc-800"
                            }`}
                            dangerouslySetInnerHTML={{
                                __html: highlightMatch(String(result.item[displayKey]), query),
                            }}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}
