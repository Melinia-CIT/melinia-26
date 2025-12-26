import { useState } from "react";
import Hero from "../components/home/hero/Hero";
import Countdown from "../components/home/countdown/Countdown";
import Events from "../components/home/events/Events";
import Footer from "../components/common/Footer";
import IntroVideo from "../components/home/intro/IntroVideo";
import PrizePool from "../components/home/prize-pool/PrizePool";
import Sponsors from "../components/home/sponsors/Sponsors";
import People from "../components/home/people/People";
import DotGrid from "../components/common/DotGrid";

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

			<div className={`transition-opacity duration-1000 tracking-widest ${heroVisible ? 'opacity-100' : 'opacity-0'}`}>
				<Hero isVisible={heroVisible} />
				<div className="flex flex-col w-full">
					<Countdown />
					<div className="relative bg-gradient-to-br from-[#0F0B13] via-[#0F0B13] to-[#200a26]">
						{/* Background DotGrid */}
						<div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
							<DotGrid
								dotSize={7}
								gap={32}
								baseColor="rgba(255, 255, 255, 0.1)"
								activeColor="#5227FF"
								proximity={200}
								className="!p-0"
							/>
						</div>

						{/* Sections */}
						<div className="relative z-10 flex flex-col w-full">
							<Events />
							<div className="h-[15px] bg-black" />
							<PrizePool />
							<div className="h-[15px] bg-black" />
							<Sponsors />
							<div className="h-[15px] bg-black" />
							<People />
						</div>
					</div>
				</div>
				<Footer />
			</div>
		</div>
	);
}

export default Home;
