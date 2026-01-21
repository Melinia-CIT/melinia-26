import { BrowserRouter, Routes, Route } from "react-router"
import { PublicRoute, ProtectedRoute } from "./components/Router"

import Home from "./pages/Home"
import NotFound from "./pages/NotFound"
import AppLayout from "./pages/userland/Layout"
import Login from "./pages/userland/auth/Login"
import Register from "./pages/userland/auth/Registration"
import ResetPassword from "./pages/userland/auth/ResetPassword"
import ForgotPassword from "./pages/userland/auth/ForgotPassword"
import Main from "./pages/userland/Main"
import EventLayout from "./pages/userland/events/Events"
import EventDetail from "./pages/userland/events/EventDetail"
import Teams from "./pages/userland/Teams"
import Leaderboard from "./pages/userland/Leaderboard"

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="*" element={<NotFound />} />
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
                        <Route path="leaderboard" element={<Leaderboard />} />
                        <Route path="teams" element={<Teams />} />
                    </Route>
                </Route>
            </Routes>
        </BrowserRouter>
    )
}

export default App
