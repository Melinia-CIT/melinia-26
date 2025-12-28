import { Event } from './types';

export const eventsData: Event[] = [
    {
        id: 1,
        title: "CYBER PROTOCOL",
        category: "Technical",
        logo: "🛡️",
        tagline: "Navigate the digital frontier",
        teamSize: "2-3 members",
        prize: "₹25,000",
        about: "Dive into the world of cybersecurity protocols and network defense strategies. Test your skills in this intense technical challenge where participants will engage in real-world security scenarios, vulnerability assessments, and defensive programming.",
        coordinators: [
            { name: "Rahul Sharma", phone: "+91 98765 43210" },
            { name: "Priya Patel", phone: "+91 98765 43211" }
        ],
        rounds: [
            { title: "Round 1: Quiz", description: "Test your cybersecurity knowledge with challenging questions" },
            { title: "Round 2: CTF", description: "Capture the flag challenge with real-world scenarios" },
            { title: "Final: Live Hack", description: "Defend against live attacks in real-time" }
        ]
    },
    {
        id: 2,
        title: "CODE SPRINT",
        category: "Technical",
        logo: "⚡",
        tagline: "Race against time, code for glory",
        teamSize: "2-4 members",
        prize: "₹30,000",
        about: "A high-speed coding competition where teams race against time to solve complex algorithmic challenges. Push your problem-solving skills to the limit in this adrenaline-fueled contest.",
        coordinators: [
            { name: "Amit Kumar", phone: "+91 98765 43212" },
            { name: "Sneha Reddy", phone: "+91 98765 43213" }
        ],
        rounds: [
            { title: "Round 1: Speed Coding", description: "Quick problem solving under time pressure" },
            { title: "Round 2: Algorithm Design", description: "Design efficient solutions for complex problems" },
            { title: "Final: Grand Challenge", description: "The ultimate coding showdown" }
        ]
    },
    {
        id: 3,
        title: "DESIGN CLASH",
        category: "Non Technical",
        logo: "🎨",
        tagline: "Where creativity meets innovation",
        teamSize: "1-2 members",
        prize: "₹15,000",
        about: "Unleash your creative potential in this design extravaganza. From UI/UX to graphic design, showcase your artistic vision and technical prowess in creating stunning visual experiences.",
        coordinators: [
            { name: "Arjun Mehta", phone: "+91 98765 43214" },
            { name: "Kavya Singh", phone: "+91 98765 43215" }
        ],
        rounds: [
            { title: "Round 1: Design Challenge", description: "Create stunning visuals under theme constraints" },
            { title: "Final: Presentation", description: "Present your design philosophy and execution" }
        ]
    },
    {
        id: 4,
        title: "TECH TALK",
        category: "Workshop",
        logo: "💡",
        tagline: "Learn from industry experts",
        teamSize: "Individual",
        prize: "Certificates",
        about: "Join industry experts as they share insights on emerging technologies and future trends in software development. An interactive session designed to broaden your technical horizons.",
        coordinators: [
            { name: "Dr. Suresh Patel", phone: "+91 98765 43216" },
            { name: "Meera Iyer", phone: "+91 98765 43217" }
        ]
    }
];
