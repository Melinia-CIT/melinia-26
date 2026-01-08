import { Worker } from "bullmq";
import { ses } from "../../utils/ses";
import { SendEmailCommand } from "@aws-sdk/client-ses";
import { getEnv } from "../../utils/lib";
import { ioredis } from "../../utils/redis";

const RATE_LIMIT = {
    max: 10,
    duration: 1000 // 10 emails per second
};

const emailWorker = new Worker(
    "email-queue",
    async (job) => {
        const { to, subject, body, html } = job.data;

        // Validate required fields before processing
        if (!to || typeof to !== 'string' || !to.trim()) {
            throw new Error(`Invalid job data: 'to' is required and must be a non-empty string. Got: ${to}`);
        }
        if (!subject || typeof subject !== 'string' || !subject.trim()) {
            throw new Error(`Invalid job data: 'subject' is required and must be a non-empty string. Got: ${subject}`);
        }
        if (!body || typeof body !== 'string' || !body.trim()) {
            throw new Error(`Invalid job data: 'body' is required and must be a non-empty string. Got: ${body}`);
        }

        console.log(`[EmailWorker] Processing job id ${job.id} sending to ${to}`);

        const command = new SendEmailCommand({
            Source: getEnv("MAIL_FROM"),
            Destination: { ToAddresses: [to.trim()] },
            Message: {
                Subject: {
                    Data: subject.trim(),
                    Charset: "UTF-8"
                },
                Body: {
                    Text: {
                        Data: body.trim(),
                        Charset: "UTF-8"
                    },
                    ...(
                        html && typeof html === 'string' && html.trim() && {
                            Html: {
                                Data: html.trim(),
                                Charset: "UTF-8"
                            }
                        }
                    )
                }
            }
        });

        const result = await ses.send(command);

        console.log(`[EmailWorker] Email Sent. MessageId: ${result.MessageId}`);

        return { messageId: result.MessageId };
    },
    {
        connection: ioredis,
        concurrency: 5,
        limiter: RATE_LIMIT
    }
);

emailWorker.on("failed", (job, err) => {
    console.error(`[EmailWorker] Job ${job?.id} failed:`, err.message);
});

emailWorker.on("error", (err) => {
    console.error(`[EmailWorker] Worker error:`, err);
});

process.on("SIGTERM", async () => {
    console.log("SIGTERM received, closing email worker...");
    await emailWorker.close();
});

console.log("Email worker running...");

export { emailWorker };
