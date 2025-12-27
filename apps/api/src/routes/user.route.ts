import { Hono , type Context } from "hono";
import { zValidator } from "@hono/zod-validator";
import { fullProfileSchema , createProfileSchema , type FullProfile } from "@packages/shared/dist";
import { getFullInformation, createProfile, getProfile , checkProfileCompleted, checkCollegeExists,  checkDegreeExists, setProfileCompleted, updateProfile} from "../db/queries";
import { getPendingInvitationsForUser } from "../db/queries/teams.queries"

import { authMiddleware} from "../middleware/auth.middleware";
import { HTTPException } from "hono/http-exception";

export const user = new Hono();


export const profileCheck = async ( user_id:string) => {
	const profile_completed = await checkProfileCompleted(user_id)

	if (profile_completed){
            throw new HTTPException(409, {message: "Profile already exists" })
	}
}

user.get("/profile",authMiddleware, async (c: Context) => {
    const user_id = c.get("user_id")
    await profileCheck(user_id)

    const profile = await getProfile(user_id);

    return c.json({
        details:profile
    }, 200);
});

user.get("/me",authMiddleware, async (c : Context) => {

    const user_id = c.get("user_id");
    await profileCheck(user_id)
    const profile = await getFullInformation(user_id);

    return c.json({
        details:profile
    }, 200);
});



user.post("/profile", authMiddleware, zValidator("json", createProfileSchema ),async (c ) => {
	const user_id = c.get("user_id")
        await profileCheck(user_id)

	const input = c.req.valid('json');
	const college_exists = await checkCollegeExists(input["college"])
	if (!college_exists){
	    throw new HTTPException(400, {message: "college does not exist"})
	}
	if (input["degree"] !== "other"){
		const degree_exists = await checkDegreeExists(input["degree"])
		if (!degree_exists){
		    throw new HTTPException(400, {message: "degree does not exist"})
		}
	}

	const profile_result = await createProfile(user_id, input);

	if (profile_result === undefined){
	    throw new HTTPException(500, { message: "internal server error" })
	}

	await setProfileCompleted(user_id)
	
	return c.json({status:true,
		      message:"Profile created successfully"},200);

})

user.put("/profile",authMiddleware, zValidator("json", createProfileSchema), async (c ) => {
	const user_id = c.get("user_id");
	await profileCheck(user_id);
	
	const input = c.req.valid('json');
	const college_exists = await checkCollegeExists(input["college"]);
	
	if (!college_exists) {
		throw new HTTPException(400, { message: "College does not exist" });
	}
	
	if (input["degree"] !== "other") {
		const degree_exists = await checkDegreeExists(input["degree"]);
		if (!degree_exists) {
			throw new HTTPException(400, { message: "Degree does not exist" });
		}
	}
	
	const profile_result = await updateProfile(user_id, input);
	
	if (profile_result === undefined) {
		throw new HTTPException(500, { message: "Internal server error" });
	}
	
	return c.json({
		status: true,
		message: "Profile updated successfully"
	}, 200);
});

user.get("/pending_invitations", authMiddleware, async (c: Context) => {
        const user_id = c.get('user_id');
	await profileCheck(user_id);

        const  data  = await getPendingInvitationsForUser(user_id);

	c.json({
		"invitations":data
	},200)
})
 
