import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import Login from "./pages/auth/Login";
import Dashboard from "./pages/Dashboard";

function App() {
	return (
		<BrowserRouter>
			<Routes>
				<Route path="/" element={<Navigate to="/admin" replace />} />
				<Route path="/admin" element={<Login />} />
				<Route path="/dashboard" element={<Dashboard />} />
			</Routes>
		</BrowserRouter>
	);
}

export default App;
