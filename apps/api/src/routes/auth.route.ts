import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { generateOTPSchema, verifyOTPSchema, registrationSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } from "@packages/shared";
import { checkUserExists, getUserByMail, insertUser, updatePasswd } from "../db/queries";
import { ioredis } from "../utils/redis";
import { generateOTP, getEnv } from "../utils/lib";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import { sign, verify } from "hono/jwt";
import { HTTPException } from "hono/http-exception";
import { createAccessToken, createRefreshToken, verifyToken } from "../utils/jwt";
import { createHash } from "crypto";
import { sendOTP, sendResetLink } from "../workers/email/service";
import { createRateLimiter } from "../middleware/ratelimiter.middleware";
import type { CookieOptions } from "hono/utils/cookie";
import { couponExists, couponRedeemed, redeemCoupon } from "../db/queries/coupons.queries";

export const auth = new Hono();

const getCookieOptions = (maxAge: number, path: string = "/") => {
    const isDev = process.env.NODE_ENV !== 'production';

    return {
        httpOnly: true,
        secure: true,
        sameSite: "None",
        path,
        maxAge,
        domain: isDev ? undefined : ".melinia.in"
    } as CookieOptions;
};

auth.post("/send-otp",
    zValidator("json", generateOTPSchema),
    createRateLimiter({ prefix: "auth-register" }),
    async (c) => {
        const { email } = c.req.valid("json");

        const user = await checkUserExists(email);

        if (user) {
            throw new HTTPException(409, { message: "Account already exists, try logging in" });
        }

        const OTP = generateOTP();
        const otpHash = createHash("sha256").update(OTP).digest("hex");

        console.log(`${email}:${OTP}`);
        // const jobId = await sendOTP(email, OTP);
        // if (!jobId) {
        //     console.error(`Failed to send OTP to ${email}`);
        //     throw new HTTPException(500, { message: "Failed to send OTP, Please try again" });
        // }

        await ioredis.set(`otp:${email}`, otpHash, "EX", 600);

        const token = await sign({ email, exp: Math.floor(Date.now() / 1000) + 10 * 60 }, getEnv("JWT_SECRET_KEY"));
        setCookie(c, "registration_token", token, getCookieOptions(600, "/api/v1/auth"));

        return c.json({ "msg": "OTP sent" }, 200);
    }
);

auth.post("/verify-otp", zValidator("json", verifyOTPSchema), async (c) => {
    const { otp } = c.req.valid("json");
    const token = getCookie(c, "registration_token");

    if (!token) {
        throw new HTTPException(401, { message: "Registration token not provided" });
    }

    const { email } = await verifyToken(token);
    const storedOtpHash = await ioredis.get(`otp:${email}`);

    if (!storedOtpHash) {
        throw new HTTPException(400, { message: "OTP expired or invalid" });
    }

    const otpHash = createHash("sha256").update(otp).digest("hex");

    if (otpHash !== storedOtpHash) {
        throw new HTTPException(403, { message: "Invalid OTP" });
    }

    await ioredis.del(`otp:${email}`);

    const regToken = await sign({ email, otpVerified: true, exp: Math.floor(Date.now() / 1000) + 10 * 60 }, getEnv("JWT_SECRET_KEY"));
    setCookie(c, "registration_token", regToken, getCookieOptions(600, "/api/v1/auth"));

    return c.json({ message: "OTP verified successfully" }, 200);
});


auth.post("/register", zValidator("json", registrationSchema), async (c) => {
    const { passwd, confirmPasswd, couponCode } = c.req.valid("json");
    const token = getCookie(c, "registration_token");
    console.log(couponCode);

    if (!token) {
        throw new HTTPException(401, { message: "Registration token not provided" });
    }

    const { email, otpVerified } = await verifyToken(token);
    if (!otpVerified) {
        throw new HTTPException(401, { message: "Email not verified." });
    }

    const exists = await checkUserExists(email as string);
    if (exists) {
        throw new HTTPException(409, { message: "User already exists, try logging in." })
    }

    if (passwd !== confirmPasswd) {
        throw new HTTPException(400, { message: "Password doesn't match" });
    }
    const passwdHash = await Bun.password.hash(passwd);

    const validCoupon = !!couponCode && (await couponExists(couponCode) && !await couponRedeemed(couponCode));
    if (couponCode !== undefined && !validCoupon) {
        throw new HTTPException(400, { message: "Invalid coupon code" });
    }

    const user = await insertUser(email as string, passwdHash, validCoupon);
    if (user && validCoupon) {
        await redeemCoupon(user.id, couponCode);
    }

    deleteCookie(c, "registration_token", getCookieOptions(0, "/api/v1/auth"));

    const accessToken = await createAccessToken(user.id, user.role);
    const refreshToken = await createRefreshToken(user.id, user.role);

    await ioredis.set(`refresh:${user.id}`, refreshToken, "EX", 7 * 24 * 60 * 60);

    setCookie(c, "refresh_token", refreshToken, getCookieOptions(7 * 24 * 60 * 60, "/api/v1/auth"));

    return c.json({ message: "User created", data: user, accessToken }, 201);
});

auth.post("/login", zValidator("json", loginSchema), async (c) => {
    const { email, passwd } = c.req.valid("json");

    const user = await getUserByMail(email);

    if (!user || !await Bun.password.verify(passwd, user.passwd_hash)) {
        throw new HTTPException(401, { message: "Invalid email or password." });
    }

    const accessToken = await createAccessToken(user.id, user.role);
    const refreshToken = await createRefreshToken(user.id, user.role);

    await ioredis.set(`refresh:${user.id}`, refreshToken, "EX", 7 * 24 * 60 * 60);

    setCookie(c, "refresh_token", refreshToken, getCookieOptions(7 * 24 * 60 * 60, "/api/v1/auth"));

    return c.json({ message: "Ok", accessToken }, 200);
});

auth.post("/logout", async (c) => {
    const refreshToken = getCookie(c, "refresh_token");

    if (refreshToken) {
        const { id } = await verify(refreshToken, getEnv("JWT_SECRET_KEY"));
        await ioredis.del(`refresh:${id}`);
    }

    deleteCookie(c, "refresh_token", getCookieOptions(0, "/api/v1/auth"));

    return c.json({ message: "Ok" }, 200);
});

auth.post("/refresh", async (c) => {
    const refreshToken = getCookie(c, "refresh_token");

    if (!refreshToken) {
        throw new HTTPException(401, { message: "refresh token not provided" });
    }

    const { id, role } = await verifyToken(refreshToken);

    const storedToken = await ioredis.get(`refresh:${id}`);

    if (!storedToken || storedToken !== refreshToken) {
        throw new HTTPException(401, { message: "Invalid refresh token" });
    }

    const accessToken = await createAccessToken(id as string, role as string);

    return c.json({ accessToken }, 200);
});

auth.post(
    "/forgot-password",
    zValidator("json", forgotPasswordSchema),
    createRateLimiter({ prefix: "forgot-pwd" }),
    async (c) => {
        const { email } = c.req.valid("json");

        const user = await checkUserExists(email);
        console.log(user)
        if (user) {
            const token = crypto.randomUUID();

            const resetLink = `${getEnv("MELINIA_UI_URL")}/reset-password?token=${token}`;

            const jobId = await sendResetLink(email, resetLink);
            if (!jobId) {
                console.error(`Failed to send reset link to ${email}`);
                throw new HTTPException(500, { message: "Failed to send password reset link, Please try again" });
            }

            await ioredis.set(`reset:token:${token}`, email, "EX", 900); // Valid for 15 mins
            // console.log(resetLink);
        } else {
            console.error(`User doesn't exists. ${email}`);
        }

        return c.json({ message: "If a user with this email exists, a reset link has been sent." }, 200);
    }
);

auth.post(
    "/reset-password",
    zValidator("json", resetPasswordSchema),
    async (c) => {
        const { token, newPasswd } = c.req.valid("json");

        const tokenKey = `reset:token:${token}`;

        const email = await ioredis.get(tokenKey);
        if (!email) {
            throw new HTTPException(400, { message: "Invalid token" });
        }

        const newPasswdHash = await Bun.password.hash(newPasswd);

        const success = await updatePasswd(email, newPasswdHash);
        if (!success) {
            console.error(`Password update failed for email: ${email}`);
            throw new HTTPException(500, { message: "Failed to reset password" });
        }

        await ioredis.del(tokenKey);

        return c.json({ message: "Password reset successfully." }, 200);
    }
);
