
export interface SectionData {
    title: string
    people: {
        name: string
        role?: string
        imageUrl?: string
        linkedinUrl?: string
        color?: string
    }[]
}

export const peopleData: SectionData[] = [
    {
        title: "Core Team",
        people: [
            {
                name: "Alice Johnson",
                role: "Coordinator",
                imageUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400",
                linkedinUrl: "#",
                color: "#FF0055",
            },
            {
                name: "Bob Smith",
                role: "Coordinator",
                imageUrl: "https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=400",
                linkedinUrl: "#",
                color: "#FF0055",
            },
            {
                name: "Charlie Davis",
                role: "Lead",
                imageUrl: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=400",
                linkedinUrl: "#",
                color: "#FF0055",
            },
            {
                name: "Diana Prince",
                role: "Manager",
                imageUrl: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400",
                linkedinUrl: "#",
                color: "#FF0055",
            },
            {
                name: "Eve Wilson",
                role: "Coordinator",
                imageUrl: "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?w=400",
                linkedinUrl: "#",
                color: "#FF0055",
            },
            {
                name: "Frank Miller",
                role: "Lead",
                imageUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400",
                linkedinUrl: "#",
                color: "#FF0055",
            },
            {
                name: "Grace Lee",
                role: "Coordinator",
                imageUrl: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=400",
                linkedinUrl: "#",
                color: "#FF0055",
            },
            {
                name: "Henry Brown",
                role: "Manager",
                imageUrl: "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=400",
                linkedinUrl: "#",
                color: "#FF0055",
            },
            {
                name: "Ivy Martinez",
                role: "Coordinator",
                imageUrl: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400",
                linkedinUrl: "#",
                color: "#FF0055",
            },
            {
                name: "Jack Thompson",
                role: "Lead",
                imageUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400",
                linkedinUrl: "#",
                color: "#FF0055",
            },
            {
                name: "Karen White",
                role: "Coordinator",
                imageUrl: "https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?w=400",
                linkedinUrl: "#",
                color: "#FF0055",
            },
            {
                name: "Leo Chen",
                role: "Manager",
                imageUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400",
                linkedinUrl: "#",
                color: "#FF0055",
            },
            {
                name: "Maria Garcia",
                role: "Coordinator",
                imageUrl: "https://images.unsplash.com/photo-1520813792240-56fc4a3765a7?w=400",
                linkedinUrl: "#",
                color: "#FF0055",
            },
            {
                name: "Nathan Scott",
                role: "Lead",
                imageUrl: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400",
                linkedinUrl: "#",
                color: "#FF0055",
            },
            {
                name: "Olivia Taylor",
                role: "Coordinator",
                imageUrl: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=400",
                linkedinUrl: "#",
                color: "#FF0055",
            },
            {
                name: "Peter Johnson",
                role: "Manager",
                imageUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=400",
                linkedinUrl: "#",
                color: "#FF0055",
            },
        ],
    },

    {
        title: "Dev Team",
        people: [
            {
                name: "Morpheus",
                role: "Tech Lead",
                imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400",
                linkedinUrl: "#",
                color: "#9D00FF",
            },

            {
                name: "Vishal D",
                role: "Lead Developer",
                imageUrl: "https://podu.pics/M6mZKBGA17",
                linkedinUrl: "https://www.linkedin.com/in/vishal-dhanasekaran/",
                color: "#9D00FF",
            },
            {
                name: "John Doe",
                role: "Frontend Developer",
                imageUrl: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=400",
                linkedinUrl: "#",
                color: "#9D00FF",
            },
            {
                name: "Neo Anderson",
                role: "Backend Developer",
                imageUrl: "https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=400",
                linkedinUrl: "#",
                color: "#9D00FF",
            },
            {
                name: "Trinity Moss",
                role: "Product Engineer",
                imageUrl: "https://images.unsplash.com/photo-1524503033411-c9566986fc8f?w=400",
                linkedinUrl: "#",
                color: "#9D00FF",
            },
            {
                name: "Cypher Reagan",
                role: "DevOps Engineer",
                imageUrl: "https://images.unsplash.com/photo-1545996124-0501ebae84d0?w=400",
                linkedinUrl: "#",
                color: "#9D00FF",
            },
            {
                name: "Tank",
                role: "System Administrator",
                imageUrl: "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=400",
                linkedinUrl: "#",
                color: "#9D00FF",
            },
            {
                name: "Agent Smith",
                role: "Full Stack Developer",
                imageUrl: "https://images.unsplash.com/photo-1499996860823-5214fcc65f8f?w=400",
                linkedinUrl: "#",
                color: "#9D00FF",
            },
        ],
    },
];

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

//export const peopleData = getAllPeople()

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
