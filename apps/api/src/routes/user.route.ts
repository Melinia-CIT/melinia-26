import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { profileSchema , createEventSchema} from "@packages/shared/dist";
import { createEvent, getProfile , checkProfileCompleted} from "../db/queries";
import { getUserID } from "../middleware/profile.middleware";

export const user = new Hono();


user.get("/profile", getUserID, async (c) => {
    const user_id = c.get("user_id");

    const profile = getProfile(user_id);
    if (profile === undefined)

    return c.json({
        details:profile
    }, 200);
});

/*


user.post("/profile", getUserID, zValidator("json",profileSchema),async (c) => {
    try {
	const user_id = c.get("user_id")
	const profile_completed = await checkProfileCompleted(user_id)
	if (profile_completed){

		return c.json({
			error: "Profile already exists",
			message: "A profile has already been created for this user. Use PUT to update.",
		}, 409);
	}

    const input = c.req.valid('json');
    const { statusCode, status, data, message } = await (input);

    return sendSuccess(c, data, message, status, statusCode);
} catch (error: unknown) {
	console.error(error);
	return sendError(c);
}
})
*/
