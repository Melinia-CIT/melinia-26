import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { otpVerificationSchema, userContactSchema } from "@melinia/shared/dist";
import { checkUserExists } from "../db/queries";
import { generateOTP } from "../utils";

const auth = new Hono();

let store = new Map();

auth.post("/send-otp", zValidator("json", userContactSchema), async (c) => {
    try {
        const { email } = c.req.valid("json");

        const user = await checkUserExists(email);
        if (user) {
            console.log(`OTP requested for existing user: ${email}`);
            return c.json({ msg: "OTP sent if account does not exist." }, 200);
        }

        const OTP = generateOTP();
        store.set(email, OTP);

        return c.json({ msg: "OTP sent" }, 200);
    } catch (error) {
        console.error("sent-otp failed", error);
        return c.json({ error: "Internal Server Error" }, 500);
    }
});

auth.post(
    "/verify-otp",
    zValidator("json", otpVerificationSchema),
    async (c) => {
        const { email, otp } = c.req.valid("json");

        const storedOTP = store.get(email);

        if (!storedOTP) {
            console.info(`OTP-Verification failed (not found): ${email}`);
            return c.json({ error: "Invalid or expired OTP" }, 200);
        }

        if (storedOTP !== otp) {
            console.info(`OTP-Verification failed (match failed): ${email}`);
            return c.json({ error: "Invalid or expired OTP" }, 200);
        }

        console.log(`OTP-Verification succeded: ${email}`);
        return c.json({ msg: "OTP verified" }, 200);
    }
);
