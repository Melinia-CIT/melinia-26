import { Hono } from "hono"
import { check, z } from "zod"
import { zValidator } from "@hono/zod-validator"
import { HTTPException } from "hono/http-exception"
import { createProfileSchema, createOrganizerAccountSchema } from "@melinia/shared"
import { 
    checkUserExists, 
    checkPhoneNumberExists, 
    checkProfileExists, 
    setProfileCompleted,
    getUserById
} from "../db/queries"
import { insertOrganizer, createOrganizerProfile } from "../db/queries/organizer.queries"
import { authMiddleware, adminOnlyMiddleware } from "../middleware/auth.middleware"

export const organizer = new Hono()

organizer.post("", authMiddleware, adminOnlyMiddleware, zValidator("json", createOrganizerAccountSchema), async (c) => {
    try {
        const { email, password } = c.req.valid("json")

        if (await checkUserExists(email)) {
            throw new HTTPException(409, { message: `Email ${email} is already registered` })
        }
        const passwdHash = await Bun.password.hash(password)
        const newUser = await insertOrganizer(email, passwdHash)

        return c.json({ status: true, data: newUser }, 201)
    } catch (e: any) {
        if (e instanceof HTTPException) throw e;
        throw new HTTPException(500, { message: `Route Error: ${e.message}` })
    }
})

organizer.post(
    "/profile", 
    authMiddleware, 
    adminOnlyMiddleware, 
    zValidator("json", createProfileSchema), 
    async (c) => {
        const user_id = c.get('user_id');
        const profileData = c.req.valid("json")

        try {
            const user = await getUserById(user_id)
            if (!user) {
                throw new HTTPException(404, { message: `User ID ${user_id} not found` })
            }

            if (await checkProfileExists(user_id)) {
                throw new HTTPException(409, { message: "Profile already exists for this user" })
            }
            if(profileData.ph_no){
                if(await checkPhoneNumberExists(profileData.ph_no)){
                    throw new HTTPException(409, {message:"Phone number already registered!"})
                }
            }

            const profile = await createOrganizerProfile(user_id, profileData)
            await setProfileCompleted(user_id)

            return c.json({ status: true, data: profile }, 200)
            
        } catch (e: any) {
            if (e instanceof HTTPException) throw e;
            throw new HTTPException(500, { message: `Profile Error: ${e.message}` })
        }
    }
);

