export interface Coordinator {
    name: string;
    phone: string;
}

export interface Round {
    title: string;
    description: string;
}

export interface Event {
    id: number;
    title: string;
    category: 'Technical' | 'Non Technical' | 'Workshop';
    logo: string;
    tagline: string;
    teamSize: string;
    prize: string;
    about: string;
    coordinators: Coordinator[];
    rounds?: Round[];
}

export type TabType = 'overview' | 'rounds' | 'prizes';
