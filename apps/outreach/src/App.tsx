import { BrowserRouter, Routes, Route } from "react-router";
import Home from "./components/Home";

import { useState } from "react";
import IntroVideo from "./components/IntroVideo";

function App() {
	const [showIntro, setShowIntro] = useState(true);

	return (
		<BrowserRouter>
			{showIntro && <IntroVideo onComplete={() => setShowIntro(false)} />}
			<Routes>
				<Route path="/" element={<Home />} />
			</Routes>
		</BrowserRouter>
	);
}

export default App;
