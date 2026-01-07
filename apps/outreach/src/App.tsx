import { BrowserRouter, Routes, Route } from "react-router";

import { PublicRoute, ProtectedRoute } from "./components/Router";

import Home from "./pages/Home";
import Login from "./pages/auth/Login";
import ResetPassword from "./pages/auth/ResetPassword";
import AppLayout from "./pages/userland/Layout";
import ForgotPassword from "./pages/auth/ForgotPassword";
import EventLayout from "./pages/userland/Events";
import EventDetail from "./pages/userland/EventDetail";
import Main from "./pages/userland/Main";
import Register from "./pages/auth/Registration";

function App() {
	return (
		<BrowserRouter>
			<Routes>
				<Route path="/" element={<Home />} />
				<Route element={<PublicRoute />}>
					<Route path="/login" element={<Login />} />
					<Route path="/forgot-password" element={<ForgotPassword />} />
					<Route path="/reset-password" element={<ResetPassword />} />
				</Route>

				<Route element={<ProtectedRoute />}>
					<Route path="/app" element={<AppLayout />}>
						<Route index element={<Main />} />
						<Route path="events" element={<EventLayout />} /> 
						<Route path="events/:id" element={<EventDetail />} />
						<Route path="leaderboard" />
						<Route path="teams" />
					</Route>
				</Route>
				<Route path="/register" element={<Register />} />
			</Routes>
		</BrowserRouter>
	);
}

export default App;
