import { Queue } from "bullmq";
import { redis } from "bun";

export const emailQueue = new Queue("email-queue", {
    connection: redis,
    defaultJobOptions: {
        attempts: 2,
        backoff: {
            type: "exponential",
            delay: 5000
        },
        removeOnComplete: true,
        removeOnFail: false
    }
});
