import Hero from "../components/Hero";
import Countdown from "../components/Countdown";
import Events from "../components/Events";
import Footer from "../components/Footer";
import IntroVideo from "../components/IntroVideo";
import { useState } from "react";

function Home() {
	const [showIntro, setShowIntro] = useState(true);

	return (
		<>
			{showIntro && <IntroVideo onComplete={() => setShowIntro(false)} />}
			<Hero />
			<div className="flex flex-col h-[100dvh] w-full">
				<Countdown />
				<Events />
			</div>
			<Footer />
		</>
	);
}

export default Home;
