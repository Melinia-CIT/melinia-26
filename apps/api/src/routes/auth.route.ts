import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { generateOTPSchema, verifyOTPSchema, registrationSchema, loginSchema } from "@packages/shared/dist";
import { checkUserExists, getUser, insertUser } from "../db/queries";
import { redis } from "../utils/redis";
import { generateOTP, getEnv } from "../utils/lib";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import { sign, verify } from "hono/jwt";
import { HTTPException } from "hono/http-exception";
import { createAccessToken, createRefreshToken, verifyToken } from "../utils/jwt";
import { createHash } from "crypto";


export const auth = new Hono();

auth.post("/send-otp", zValidator("json", generateOTPSchema), async (c) => {
    const { email } = c.req.valid("json");

    const user = await checkUserExists(email);

    if (user) {
        throw new HTTPException(409, { message: "Account already exists, try logging in" });
    }

    const OTP = generateOTP();
    const otpHash = createHash("sha256").update(OTP).digest("hex");

    await redis.set(`otp:${email}`, otpHash, "EX", 600);
    const token = await sign({ email, exp: Math.floor(Date.now() / 1000) + 10 * 60 }, getEnv("JWT_SECRET_KEY"));

    // TODO: send OTP via email
    console.log(`OTP(${email}): ${OTP}`);

    setCookie(c, "registration_token", token, {
        httpOnly: true,
        secure: true,
        sameSite: "Lax",
        path: "/api/v1/auth",
        maxAge: 600,
    });

    return c.json({ "msg": "OTP sent" }, 200);
});

auth.post("/verify-otp", zValidator("json", verifyOTPSchema), async (c) => {
    const { otp } = c.req.valid("json");
    const token = getCookie(c, "registration_token");

    if (!token) {
        throw new HTTPException(401, { message: "Registration token not provided" });
    }

    const { email } = await verifyToken(token);
    const storedOtpHash = await redis.get(`otp:${email}`);

    if (!storedOtpHash) {
        throw new HTTPException(400, { message: "OTP expired or invalid" });
    }

    const otpHash = createHash("sha256").update(otp).digest("hex");

    if (otpHash !== storedOtpHash) {
        throw new HTTPException(401, { message: "Invalid OTP" });
    }

    await redis.del(`otp:${email}`);

    const regToken = await sign({ email, otpVerified: true, exp: Math.floor(Date.now() / 1000) + 10 * 60 }, getEnv("JWT_SECRET_KEY"));
    setCookie(c, "registration_token", regToken, {
        httpOnly: true,
        secure: true,
        sameSite: "Lax",
        path: "/api/v1/auth",
        maxAge: 600,
    });

    return c.json({ message: "OTP verified successfully" }, 200);
});


auth.post("/register", zValidator("json", registrationSchema), async (c) => {
    const { passwd, confirmPasswd } = c.req.valid("json");
    const token = getCookie(c, "registration_token");

    if (!token) {
        throw new HTTPException(401, { message: "Registration token not provided" });
    }

    const { email, otpVerified } = await verifyToken(token);
    if (!otpVerified) {
        throw new HTTPException(401, { message: "Email not verified." });
    }

    if (passwd !== confirmPasswd) {
        throw new HTTPException(400, { message: "Password doesn't match" });
    }

    const exists = await checkUserExists(email as string);
    if (exists) {
        throw new HTTPException(409, { message: "User already exists, try logging in." })
    }

    const passwdHash = await Bun.password.hash(passwd);
    const user = await insertUser(email as string, passwdHash);

    deleteCookie(c, "registration_token", {
        path: "/api/v1/auth",
        httpOnly: true,
        secure: true,
        sameSite: "Lax",
    });

    const accessToken = await createAccessToken(user.id, user.role);
    const refreshToken = await createRefreshToken(user.id, user.role);

    await redis.set(`refresh:${user.id}`, refreshToken, "EX", 7 * 24 * 60 * 60);

    setCookie(c, "refresh_token", refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "Strict",
        path: "/api/v1/auth",
        maxAge: 60 * 60 * 24 * 7,
    });

    return c.json({ message: "User created", data: user, accessToken }, 201);
});

auth.post("/login", zValidator("json", loginSchema), async (c) => {
    const { email, passwd } = c.req.valid("json");

    const user = await getUser(email);

    if (!user) {
        throw new HTTPException(401, { message: "User does not exists" });
    }

    if (!await Bun.password.verify(passwd, user.passwd_hash)) {
        throw new HTTPException(401, { message: "Invalid password" });
    }

    const accessToken = await createAccessToken(user.id, user.role);
    const refreshToken = await createRefreshToken(user.id, user.role);

    await redis.set(`refresh:${user.id}`, refreshToken, "EX", 7 * 24 * 60 * 60);

    setCookie(c, "refresh_token", refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "Strict",
        path: "/api/v1/auth",
        maxAge: 60 * 60 * 24 * 7,
    });

    return c.json({ message: "Ok", accessToken }, 200);
});

auth.post("/logout", async (c) => {
    const refreshToken = getCookie(c, "refresh_token");

    if (refreshToken) {
        const { id } = await verify(refreshToken, getEnv("JWT_SECRET_KEY"));
        await redis.del(`refresh:${id}`);
    }

    deleteCookie(c, "refresh_token", { path: "/api/v1/auth", httpOnly: true, secure: true, sameSite: "Strict" });

    return c.json({ message: "Ok" }, 200);
});

auth.post("/refresh", async (c) => {
    const refreshToken = getCookie(c, "refresh_token");

    if (!refreshToken) {
        throw new HTTPException(401, { message: "refresh token not provided" });
    }

    const { id, role } = await verifyToken(refreshToken);

    const storedToken = await redis.get(`refresh:${id}`);

    if (!storedToken || storedToken !== refreshToken) {
        throw new HTTPException(401, { message: "Invalid refresh token" });
    }

    const accessToken = await createAccessToken(id as string, role as string);

    return c.json({ accessToken }, 200);
});
