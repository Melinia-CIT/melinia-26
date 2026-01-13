import Hero from "../../components/outreach/Hero"
import CountdownSection from "../../components/outreach/CountdownSection"
import PrizePoolSection from "../../components/outreach/PrizePoolSection"
import EventsSection from "../../components/outreach/EventsSection"
import FooterSection from "../../components/outreach/FooterSection"

const Home = () => {
    return (
        <main className="min-h-screen bg-zinc-950">
            <Hero />
            <CountdownSection />
            <EventsSection />
            <PrizePoolSection />
            <FooterSection />
        </main>
    )
}

export default Home
