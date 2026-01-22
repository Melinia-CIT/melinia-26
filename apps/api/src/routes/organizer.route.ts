import { Hono } from "hono"
import { zValidator } from "@hono/zod-validator"
import { HTTPException } from "hono/http-exception"
import { type CreateOrganizer, createOrganizerSchema } from "@melinia/shared";
import {
    checkUserExists,
    checkPhoneNumberExists,
    checkProfileExists,
    setProfileCompleted,
    getUserById,
    insertUser,
    createProfile,
    insertEventIncharge
} from "../db/queries"
import { authMiddleware, adminOnlyMiddleware } from "../middleware/auth.middleware"

export const organizer = new Hono()
organizer.post("", authMiddleware, adminOnlyMiddleware, zValidator("json", createOrganizerSchema), async (c) => {

    const formData = c.req.valid("json");
    const role = c.req.query('role')?.toUpperCase();
    if(role!=='ORGANIZER' && role!=='VOLUNTEER'){
        throw new HTTPException(401, {message: "Invalid role"});
    }
    
    if (await checkUserExists(formData.email)) {
        throw new HTTPException(409, { message: `Email ${formData.email} is already registered` })
    }
    if (await checkPhoneNumberExists(formData.ph_no)) {
        throw new HTTPException(409, { message: "Phone number already registered!" })
    }

    const passwdHash = await Bun.password.hash(formData.password);
    const newUser = await insertEventIncharge(formData.email, passwdHash, role);
    if (!newUser.id) {
        throw new HTTPException(500, { message: "Failed to create organizer" });
    }
    const { first_name, last_name, ph_no, college, degree, year } = formData;
    const profileData = { first_name, last_name, ph_no, college, degree, year };
    const profile = await createProfile(newUser.id, profileData);

    if (!profile) {
        throw new HTTPException(500, { message: "Failed to create profile." })
    }

    await setProfileCompleted(newUser.id);

    return c.json(
        {
            status: true,
            message: "Event organzier created successfully",
            data: {
                ...profile,
            },
        },
        200
    )
});
