import { Hono } from "hono"
import {
    searchColleges,
    getColleges,
    searchDegrees,
    getDegrees,
} from "../db/queries/colleges.queries"
import {
    getCollegeCache,
    setCollegeCache,
    getCollegeCacheKey,
    invalidateCollegeCache,
    getDegreeCache,
    setDegreeCache,
    getDegreeCacheKey,
    invalidateDegreeCache,
    COLLEGE_SEARCH_TTL,
    DEGREE_SEARCH_TTL,
} from "../utils/cache/college.cache"
import { sendSuccess, sendError } from "../utils/response"
import { adminOnlyMiddleware, authMiddleware } from "../middleware/auth.middleware"

export const college = new Hono()

college.get("/", authMiddleware, async c => {
    try {
        const search = c.req.query("q")?.trim() || ""
        const limit = Math.min(Number(c.req.query("limit")) || 20, 50)
        const isSearch = search.length >= 2

        const cacheKey = getCollegeCacheKey(search, limit)

        try {
            const cached = await getCollegeCache(cacheKey)
            if (cached) {
                return sendSuccess(c, cached, "Colleges fetched from cache", true, 200)
            }
        } catch (error) {
            console.warn(
                "College cache read failed, falling back to DB:",
                error instanceof Error ? error.message : "Unknown error"
            )
        }

        const data = isSearch ? await searchColleges(search, limit) : await getColleges(limit)

        setCollegeCache(cacheKey, data, COLLEGE_SEARCH_TTL)
            .catch(err =>
                console.warn("College cache write failed:", err instanceof Error ? err.message : "Unknown error")
            )

        return sendSuccess(
            c,
            data,
            data.length === 0 ? "No colleges found" : `${data.length} colleges fetched`,
            true,
            200
        )
    } catch (error) {
        console.error("College endpoint error:", error)
        return sendError(c, "Failed to fetch colleges", 500)
    }
})

college.get("/degrees", authMiddleware, async c => {
    try {
        const search = c.req.query("q")?.trim() || ""
        const limit = Math.min(Number(c.req.query("limit")) || 20, 50)
        const isSearch = search.length >= 2

        const cacheKey = getDegreeCacheKey(search, limit)

        try {
            const cached = await getDegreeCache(cacheKey)
            if (cached) {
                return sendSuccess(c, cached, "Degrees fetched from cache", true, 200)
            }
        } catch (error) {
            console.warn(
                "Degree cache read failed, falling back to DB:",
                error instanceof Error ? error.message : "Unknown error"
            )
        }

        const data = isSearch ? await searchDegrees(search, limit) : await getDegrees(limit)

        setDegreeCache(cacheKey, data, DEGREE_SEARCH_TTL)
            .catch(err =>
                console.warn(
                    "Degree cache write failed:",
                    err instanceof Error ? err.message : "Unknown error"
                )
            )

        return sendSuccess(
            c,
            data,
            data.length === 0 ? "No degrees found" : `${data.length} degrees fetched`,
            true,
            200
        )
    } catch (error) {
        console.error("Degrees endpoint error:", error)
        return sendError(c, "Failed to fetch degrees", 500)
    }
})

college.post("/invalidate-cache", authMiddleware, adminOnlyMiddleware, async c => {
    try {
        await invalidateCollegeCache()
        await invalidateDegreeCache()
        return c.json("Cache invalidated", 200);
    } catch (error) {
        return c.json("Failed to invalidate cache", 500);
    }
})
