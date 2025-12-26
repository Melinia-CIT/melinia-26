import { Queue } from "bullmq";
import { ioredis } from "../../utils/redis";

export const emailQueue = new Queue("email-queue", {
    connection: ioredis,
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
