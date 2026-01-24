import { Hono, type Context } from "hono"
import { zValidator } from "@hono/zod-validator"
import {
    createProfileSchema,
    invitationStatusSchema,
    type InvitationStatus,
} from "@melinia/shared"
import {
    createProfile,
    getProfileById,
    setProfileCompleted,
    updateProfile,
    checkPhoneNumberExists,
    getUserById,
    checkProfileExists,
    getRegisteredEvents,
} from "../db/queries"
import { getPendingInvitationsForUser } from "../db/queries/teams.queries"

import { authMiddleware } from "../middleware/auth.middleware"
import { HTTPException } from "hono/http-exception"

export const user = new Hono()

user.get("/profile", authMiddleware, async (c: Context) => {
    const userId = c.get("user_id")

    const profileExists = await checkProfileExists(userId)
    if (!profileExists) {
        throw new HTTPException(409, { message: "Profile already exists" })
    }

    const profile = await getProfileById(userId)

    return c.json(
        {
            profile: profile,
        },
        200
    )
})

user.get("/me", authMiddleware, async (c: Context) => {
    const userId = c.get("user_id")

    const [user, profile] = await Promise.all([getUserById(userId), getProfileById(userId)])

    return c.json(
        {
            ...user,
            profile: profile,
        },
        200
    )
})

user.post("/profile", authMiddleware, zValidator("json", createProfileSchema), async c => {
    const userId = c.get("user_id")
    const { first_name, last_name, college, degree, year, ph_no } = c.req.valid("json")

    const profileExists = await checkProfileExists(userId)
    if (profileExists) {
        throw new HTTPException(409, { message: "Profile already exists" })
    }

    const phoneNumberExists = await checkPhoneNumberExists(ph_no)
    if (phoneNumberExists) {
        throw new HTTPException(409, { message: "Phone Number is already registered" })
    }

    const profile = await createProfile(userId, {
        first_name,
        last_name,
        college,
        degree,
        year,
        ph_no,
    })

    if (!profile) {
        throw new HTTPException(500, { message: "Failed to create profile." })
    }

    await setProfileCompleted(userId)

    return c.json(
        {
            status: true,
            message: "Profile created successfully",
            data: {
                ...profile,
            },
        },
        200
    )
})

user.put("/profile", authMiddleware, zValidator("json", createProfileSchema), async c => {
    const userId = c.get("user_id")
    const { first_name, last_name, year, ph_no, degree, college } = c.req.valid("json")

    const profileExists = await checkProfileExists(userId)
    if (!profileExists) {
        throw new HTTPException(409, { message: "Profile does not exists" })
    }

    const profile = await updateProfile(userId, {
        first_name,
        last_name,
        year,
        ph_no,
        degree,
        college,
    })

    if (!profile) {
        throw new HTTPException(500, { message: "Failed to update profile." })
    }

    return c.json(
        {
            status: true,
            message: "Profile updated successfully",
            profile,
        },
        200
    )
})

user.get("/me/invites", authMiddleware, zValidator("query", invitationStatusSchema), async c => {
    const userId = c.get("user_id")

    const { status }: InvitationStatus = c.req.valid("query")

    if (status === "pending") {
        const invitations = await getPendingInvitationsForUser(userId)
        return c.json(
            {
                invitations: invitations,
            },
            200
        )
    }

    return c.json({ invitations: "" }, 200)
})


user.get(
    "/me/events",
    authMiddleware,
    async (c) => {
        const userId = c.get("user_id");
        const registeredEvents = getRegisteredEvents(userId);
        return c.json({
            events: registeredEvents
        }, 200);;
    }
);
