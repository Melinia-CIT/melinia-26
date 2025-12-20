import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import type { ApiResponse } from "@melinia/shared";

export const app = new Hono()
	.use(cors())
	.use(logger())

	.get("/", (c) => {
		return c.text("Hello Hono!");
	})

	.get("/hello", async (c) => {
		const data: ApiResponse = {
			message: "Hello !",
			success: false,
		};

		return c.json(data, { status: 200 });
	});

export default app;
