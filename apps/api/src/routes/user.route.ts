import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { profileSchema , createEventSchema} from "@packages/shared/dist";
import { createProfile, getProfile , checkProfileCompleted, checkCollegeExists,  checkDegreeExists} from "../db/queries";
import { getUserID } from "../middleware/profile.middleware";
import { HTTPException } from "hono/http-exception";

export const user = new Hono();


user.get("/profile", getUserID, async (c) => {
    const user_id = c.get("user_id");

    const profile = getProfile(user_id);

    return c.json({
        details:profile
    }, 200);
});



user.post("/profile", getUserID, zValidator("json",profileSchema),async (c) => {
	const user_id = c.get("user_id")
	const profile_completed = await checkProfileCompleted(user_id)

	if (profile_completed){
            throw new HTTPException(409, {message: "Profile already exists" })

	}

	const input = c.req.valid('json');
	const college_exists = await checkCollegeExists(input["college"])
	if (!college_exists){
	    throw new HTTPException(400, {message: "college does not exist"})
	}
	if (input["degree"] !== "other"){
		const degree_exists = await checkDegreeExists(input["degree"])
	}

	if (!college_exists){
	    throw new HTTPException(400, {message: "degree does not exist"})
	}
	const profile_result = await createProfile(user_id, input);

	if (profile_result === undefined){
	    throw new HTTPException(500, { message: "internal server error" })
	}
	return c.json({status:true,
		      message:"Profile created successfully"},200);

})
