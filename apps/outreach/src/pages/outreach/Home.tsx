import Hero from "../../components/outreach/Hero"
import CountdownSection from "../../components/outreach/CountdownSection"
import PrizePoolSection from "../../components/outreach/PrizePoolSection"
import EventsSection from "../../components/outreach/EventsSection"
import FAQSection from "../../components/outreach/FAQSection"
import FooterSection from "../../components/outreach/FooterSection"

const Home = () => {
    return (
        <main className="min-h-screen bg-zinc-950">
            <Hero />
            <CountdownSection />
            <EventsSection />
            <PrizePoolSection />
            <FAQSection />
            <FooterSection />
        </main>
    )
}

export default Home
