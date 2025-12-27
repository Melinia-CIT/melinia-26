import { Worker } from "bullmq";
import { ioredis } from "../../utils/redis";
import { ses } from "../../utils/ses";
import { SendEmailCommand } from "@aws-sdk/client-ses";
import { getEnv } from "../../utils/lib";

const RATE_LIMIT = {
    max: 10,
    duration: 1000 // 10 emails per second
};

const emailWorker = new Worker(
    "email-queue",
    async (job) => {
        const { to, subject, body, html } = job.data;

        console.log(`[EmailWorker] Processing job id ${job.id} sending to ${to}`);

        const command = new SendEmailCommand({
            Source: getEnv("MAIL_FROM"),
            Destination: { ToAddresses: [to] },
            Message: {
                Subject: {
                    Data: subject,
                    Charset: "UTF-8"
                },
                Body: {
                    Text: {
                        Data: body,
                        Charset: "UTF-8"
                    },
                    ...(
                        html && {
                            Html: {
                                Data: html,
                                Charset: "UTF-8"
                            }
                        }
                    )
                }
            }
        });

        const result = await ses.send(command);

        console.log(`[EmailWorker] Email Sent. ${result.MessageId}`);

        return { messageId: result.MessageId }
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

process.on("SIGTERM", async () => {
    console.log("SIGTERM received, closing email worker...");
    await emailWorker.close();
});

console.log("Email worker running...");
