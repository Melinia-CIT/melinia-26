import Hero from "./Hero";
import Countdown from "./Countdown";
import Events from "./Events";
import Footer from "./Footer";

function Home() {

	return (
		<>
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
