import { OTPTemplate } from "./template";
import { emailQueue } from "./queue";

export async function sendOTP(email: string, otp: string): Promise<string | undefined> {
    const template = OTPTemplate(otp);

    const job = await emailQueue.add(
        "send-otp", {
        to: email,
        ...template
    }, {
        priority: 1
    });

    return job.id;
}