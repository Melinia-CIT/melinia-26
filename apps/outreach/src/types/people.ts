export type PersonCategory = "organizer" | "faculty" | "dev-team"

export interface Person {
    id: string
    name: string
    role: string
    category: PersonCategory
    linkedinUrl?: string
    coverUrl?: string
    description?: string
    email?: string
    phone?: string
}

export const peopleByCategory: Record<PersonCategory, Person[]> = {
    organizer: [
        {
            id: "org-001",
            name: "Arjun Kumar",
            role: "Fest Coordinator",
            category: "organizer",
            linkedinUrl: "https://linkedin.com/in/arjun-kumar-melinia",
        },
        {
            id: "org-002",
            name: "Priya Sharma",
            role: "Technical Head",
            category: "organizer",
            linkedinUrl: "https://linkedin.com/in/priya-sharma-tech",
        },
        {
            id: "org-003",
            name: "Rahul Menon",
            role: "Events Manager",
            category: "organizer",
        },
    ],

    faculty: [
        {
            id: "fac-001",
            name: "Dr. Sarah Chen",
            role: "Department Head",
            category: "faculty",
            linkedinUrl: "https://linkedin.com/in/dr-sarah-chen-cs",
        },
        {
            id: "fac-002",
            name: "Prof. James Wilson",
            role: "Faculty Advisor",
            category: "faculty",
        },
        {
            id: "fac-003",
            name: "Dr. Maria Garcia",
            role: "Technical Mentor",
            category: "faculty",
            linkedinUrl: "https://linkedin.com/in/dr-maria-garcia-ai",
        },
    ],

    "dev-team": [
        {
            id: "dev-001",
            name: "Alex Johnson",
            role: "Lead Developer",
            category: "dev-team",
            linkedinUrl: "https://linkedin.com/in/alex-johnson-fullstack",
        },
        {
            id: "dev-002",
            name: "Sam Lee",
            role: "UI/UX Designer",
            category: "dev-team",
        },
    ],
}

export const categoryConfig = {
    organizer: {
        label: "Event Organizers",
        color: "#9D00FF",
        bgColor: "rgba(157, 0, 255, 0.1)",
        borderColor: "border-purple-500",
        icon: "User",
    },
    faculty: {
        label: "Faculty Members",
        color: "#0066FF",
        bgColor: "rgba(0, 102, 255, 0.1)",
        borderColor: "border-blue-500",
        icon: "GraduationCap",
    },
    "dev-team": {
        label: "Dev Team",
        color: "#FF0066",
        bgColor: "rgba(255, 0, 102, 0.1)",
        borderColor: "border-red-500",
        icon: "Code",
    },
} as const

export const getAllPeople = (): Person[] => {
    return [
        ...peopleByCategory.organizer,
        ...peopleByCategory.faculty,
        ...peopleByCategory["dev-team"],
    ]
}

export const peopleData = getAllPeople()

export const peopleUtils = {
    getByCategory: (category: PersonCategory): Person[] => {
        return peopleByCategory[category]
    },

    getAll: (): Person[] => {
        return getAllPeople()
    },

    getCategoryCount: (category: PersonCategory): number => {
        return peopleByCategory[category].length
    },

    getTotalCount: (): number => {
        return Object.values(peopleByCategory).reduce((total, people) => total + people.length, 0)
    },

    getCategoryColor: (category: PersonCategory): string => {
        return categoryConfig[category].color
    },

    getInitials: (name: string): string => {
        return name
            .split(" ")
            .map(word => word[0])
            .join("")
            .toUpperCase()
            .slice(0, 2)
    },

    hasLinkedIn: (person: Person): boolean => {
        return !!person.linkedinUrl && person.linkedinUrl.trim() !== ""
    },

    randomTilt: (): number => {
        return Math.floor(Math.random() * 17) - 8
    },
}
