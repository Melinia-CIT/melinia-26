import Hero from "../../components/outreach/Hero"
import CountdownSection from "../../components/outreach/CountdownSection"
import FooterSection from "../../components/outreach/FooterSection"

const Home = () => {
    return (
        <main className="min-h-screen bg-zinc-950">
            <Hero />
            <CountdownSection />
            <FooterSection />
        </main>
    )
}

export default Home
