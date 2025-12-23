import { sign } from "hono/jwt";
import { getEnv } from "./lib";

export const createAccessToken = (email: string) =>
	sign(
		{ email: email, iss: "melinia", iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 15 * 60 },
		getEnv("JWT_SECRET_KEY")
	);

export const createRefreshToken = (email: string) =>
	sign(
		{ email: email, iss: "melinia", iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60 },
		getEnv("JWT_SECRET_KEY")
	);
