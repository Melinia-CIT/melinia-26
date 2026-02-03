import { lazy } from "react"
import Hero from "../components/outreach/Hero"
import LazyLoad from "../components/common/LazyLoad"

const Countdown = lazy(() => import("../components/outreach/Countdown"))
const Events = lazy(() => import("../components/outreach/Events"))
const PrizePool = lazy(() => import("../components/outreach/PrizePool"))
const FAQ = lazy(() => import("../components/outreach/FAQ"))
const Footer = lazy(() => import("../components/outreach/Footer"))
const People = lazy(() => import("../components/outreach/People"))

const Home = () => {
    return (
        <main className="min-h-screen bg-zinc-950">
            <Hero />
            <LazyLoad>
                <Countdown />
            </LazyLoad>
            <LazyLoad>
                <Events />
            </LazyLoad>
            <LazyLoad>
                <PrizePool />
            </LazyLoad>
            <LazyLoad>
                <People />
            </LazyLoad>
            <LazyLoad>
                <FAQ />
            </LazyLoad>
            <LazyLoad>
                <Footer />
            </LazyLoad>
        </main>
    )
}

export default Home
