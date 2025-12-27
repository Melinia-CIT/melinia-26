import { useState } from "react";
import Hero from "../features/hero/Hero";
import Countdown from "../features/countdown/Countdown";
import Events from "../features/events/Events";
import Footer from "../components/Footer";
import IntroVideo from "../features/intro/IntroVideo";
import PrizePool from "../features/prize-pool/PrizePool";
import Sponsors from "../features/sponsors/Sponsors";
import People from "../features/people/People";

function Home() {
	const [showIntro, setShowIntro] = useState(true);
	const [heroVisible, setHeroVisible] = useState(false);

	const handleIntroComplete = () => {
		setHeroVisible(true);
		// We can unmount IntroVideo after it has faded out completely
		setTimeout(() => {
			setShowIntro(false);
		}, 1000); // Matches the 1s fade duration in IntroVideo
	};

	return (
		<div className="bg-black min-h-screen">
			{showIntro && <IntroVideo onComplete={handleIntroComplete} />}

			<div className={`transition-opacity duration-1000 ${heroVisible ? 'opacity-100' : 'opacity-0'}`}>
				<Hero isVisible={heroVisible} />
				<div className="flex flex-col w-full">
					<Countdown />
					<Events />
					<div className="h-[15px]" />
					<PrizePool />
					<div className="h-[15px]" />
					<Sponsors />
					<div className="h-[15px]" />
					<People />
				</div>
				<Footer />
			</div>
		</div>
	);
}

export default Home;
