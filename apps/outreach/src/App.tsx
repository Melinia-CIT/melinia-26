import { BrowserRouter, Routes, Route } from "react-router"

import { PublicRoute, ProtectedRoute } from "./components/Router"

import Home from "./pages/Home";
import Login from "./pages/auth/Login";
import ResetPassword from "./pages/auth/ResetPassword";
import AppLayout from "./pages/userland/Layout";
import ForgotPassword from "./pages/auth/ForgotPassword";
import EventLayout from "./pages/userland/events/Events";
import EventDetail from "./pages/userland/events/EventDetail";
import Main from "./pages/userland/Main";
import Register from "./pages/auth/Registration";
import Teams from "./pages/userland/Teams";

function App() {
	return (
		<BrowserRouter>
			<Routes>
				<Route path="/" element={<Home />} />
				<Route element={<PublicRoute />}>
					<Route path="/login" element={<Login />} />
					<Route path="/forgot-password" element={<ForgotPassword />} />
					<Route path="/reset-password" element={<ResetPassword />} />
					<Route path="/register" element={<Register />} />
				</Route>

				<Route element={<ProtectedRoute />}>
					<Route path="/app" element={<AppLayout />}>
						<Route index element={<Main />} />
						<Route path="events" element={<EventLayout />} />
						<Route path="events/:id" element={<EventDetail />} />
						<Route path="leaderboard" />
						<Route path="teams" element={<Teams />} />
					</Route>
				</Route>
			</Routes>
		</BrowserRouter>
	);
}

export default App
