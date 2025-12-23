import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { generateOTPSchema, verifyOTPSchema, registrationSchema, loginSchema } from "@packages/shared/dist";
import { checkUserExists, getUser, insertUser } from "../db/queries";
import { redis } from "../utils/redis";
import { generateOTP, getEnv } from "../utils/lib";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import { sign, verify } from "hono/jwt";
import { HTTPException } from "hono/http-exception";
import { createAccessToken, createRefreshToken } from "../utils/jwt";


export const auth = new Hono();

auth.post("/send-otp", zValidator("json", generateOTPSchema), async (c) => {
    const { email } = c.req.valid("json");

    const user = await checkUserExists(email);

    if (user) {
        throw new HTTPException(409, { message: "Account already exists, try logging in" });
    }

    const OTP = generateOTP();
    const otpHash = await Bun.password.hash(OTP, { algorithm: "bcrypt" });

    redis.set(`otp:${email}`, otpHash, "EX", 600);
    const token = await sign({ email }, getEnv("JWT_SECRET_KEY"));

    // TODO: send OTP via email
    console.log(`OTP(${email}): ${OTP}`);

    setCookie(c, "registration_token", token, {
        httpOnly: true,
        secure: true,
        sameSite: "Lax",
        path: "/auth",
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

    const { email } = await verify(token, getEnv("JWT_SECRET_KEY"));
    const otpHash = await redis.get(`otp:${email}`);

    if (!otpHash) {
        throw new HTTPException(400, { message: "OTP expired or invalid" });
    }

    const isValidOTP = await Bun.password.verify(otp, otpHash);

    if (!isValidOTP) {
        throw new HTTPException(401, { message: "Invalid OTP" });
    }

    await redis.del(`otp:${email}`);

    const regToken = await sign({ email, otpVerified: true }, getEnv("JWT_SECRET_KEY"));
    setCookie(c, "registration_token", regToken, {
        httpOnly: true,
        secure: true,
        sameSite: "Lax",
        path: "/auth",
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

    const { email, otpVerified } = await verify(token, getEnv("JWT_SECRET_KEY"));
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

    deleteCookie(c, "registration-cookie");

    const accessToken = await createAccessToken(user.email);
    const refreshToken = await createRefreshToken(user.email);

    setCookie(c, "refresh_token", refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "Strict",
        path: "/auth/refresh",
        maxAge: 60 * 60 * 24 * 7,
    });

    return c.json({ message: "User created", data: user, accessToken }, 201);
});

auth.post("/login", zValidator("json", loginSchema), async (c) => {
    const { email, passwd } = c.req.valid("json");

    const user = await getUser(email);

    if (!user) {
        throw new HTTPException(404, { message: "User does not exists" });
    }

    if (!await Bun.password.verify(passwd, user.passwd_hash)) {
        throw new HTTPException(401, { message: "Invalid password" });
    }

    const accessToken = await createAccessToken(user.email);
    const refreshToken = await createRefreshToken(user.email);

    redis.set(`refresh:${user.email}`, refreshToken, "EX", 7 * 24 * 60 * 60);

    setCookie(c, "refresh_token", refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "Strict",
        path: "/auth/refresh",
        maxAge: 60 * 60 * 24 * 7,
    });

    return c.json({ login: "Ok", accessToken }, 200);
});

auth.post("/logout", async (c) => {
    const refreshToken = getCookie(c, "refresh_token");

    if (refreshToken) {
        try {
            await verify(refreshToken, getEnv("JWT_SECRET_KEY"));
            redis.del(`refresh:${refreshToken}`);
        } finally {
            deleteCookie(c, "refresh_token");
        }
    }

    return c.json({ message: "Ok" }, 200);
});

auth.post("/refresh", async (c) => {
    const refreshToken = getCookie(c, "refresh_token");

    if (!refreshToken) {
        throw new HTTPException(401, { message: "refresh token not provided" });
    }

    const decoded = await verify(refreshToken, getEnv("JWT_SECRET_KEY"));

    const storedToken = await redis.get(`refresh:${decoded.email}`);

    if (storedToken && storedToken !== refreshToken) {
        throw new HTTPException(401, { message: "Invalid refresh token" });
    }

    const accessToken = await createAccessToken(decoded.email as string);

    return c.json({ accessToken }, 200);
});
