import { OTPTemplate, forgotPasswordTemplate } from "./template";
import { emailQueue } from "./queue";

export async function sendOTP(email: string, otp: string): Promise<string> {
    const template = OTPTemplate(otp);

    const job = await emailQueue.add(
        "send-otp", {
        to: email,
        ...template
    }, {
        priority: 1
    });

    return job.id!;
}

export async function sendResetLink(email: string, resetLink: string): Promise<string> {
    const template = forgotPasswordTemplate(resetLink);

    const job = await emailQueue.add(
        "send-reset-link", {
        to: email,
        ...template
    }, {
        priority: 2
    });

    return job.id!;
}