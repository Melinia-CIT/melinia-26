import Countdown from "../components/outreach/Countdown"
import Events from "../components/outreach/Events"
import Hero from "../components/outreach/Hero"
import PrizePool from "../components/outreach/PrizePool"
import FAQ from "../components/outreach/FAQ"
import Footer from "../components/outreach/Footer"
import People from "../components/outreach/People"
import Sponsors from "../components/outreach/Sponsors"

const Home = () => {
    return (
        <main className="min-h-screen bg-zinc-950">
            <Hero />
            <Countdown />
            <Events />
            <PrizePool />
            <Sponsors />
            <People />
            <FAQ />
            <Footer />
        </main>
    )
}

export default Home
