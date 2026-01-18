import { sign, verify } from "hono/jwt";
import { getEnv } from "./lib";
import { HTTPException } from "hono/http-exception";
import type { JWTPayload } from "hono/utils/jwt/types";

export const createAccessToken = async (id: string, role: string): Promise<string> =>
	await sign(
		{ id, role, iss: "melinia", iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 15 * 60 }, // 15 mins expiry
		getEnv("JWT_SECRET_KEY")
	);

export const createRefreshToken = async (id: string, role: string): Promise<string> =>
	await sign(
		{ id, role, iss: "melinia", iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60 }, // 7 days expiry
		getEnv("JWT_SECRET_KEY")
	);

export const verifyToken = async (token: string): Promise<JWTPayload> => {
	try {
		return await verify(token, getEnv("JWT_SECRET_KEY"),"HS256");
	} catch {
		throw new HTTPException(401, { message: "Invalid or expired token" });
	}
}