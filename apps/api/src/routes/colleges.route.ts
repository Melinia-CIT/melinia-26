import { Hono } from "hono"
import { getColleges, searchColleges } from "../db/queries/colleges.queries"
import {
    getCollegeCache,
    setCollegeCache,
    getCollegeCacheKey,
    invalidateCollegeCache,
    COLLEGE_SEARCH_TTL,
    COLLEGE_ALL_TTL,
} from "../utils/cache"
import { sendSuccess, sendError } from "../utils/response"

export const college = new Hono()

college.get("/", async c => {
    try {
        const search = c.req.query("search") || ""
        const limit = Math.min(Number(c.req.query("limit")) || 20, 50)

        const cacheKey = getCollegeCacheKey(search, limit)
        const ttl = search.length >= 2 ? COLLEGE_SEARCH_TTL : COLLEGE_ALL_TTL

        try {
            const cached = await getCollegeCache(cacheKey)
            if (cached) {
                return sendSuccess(c, cached, "Colleges fetched from cache", true, 200)
            }
        } catch (error) {
            console.warn(
                "Cache read failed, falling back to DB:",
                error instanceof Error ? error.message : "Unknown error"
            )
        }

        const data = search.length >= 2 ? await searchColleges(search, limit) : await getColleges()

        setCollegeCache(cacheKey, data, ttl).catch(err =>
            console.warn(
                "Cache write failed:",
                err instanceof Error ? err.message : "Unknown error"
            )
        )

        return sendSuccess(c, data, "Colleges fetched", true, 200)
    } catch (error) {
        console.error("College endpoint error:", error)
        return sendError(c, "Failed to fetch colleges", 500)
    }
})

college.post("/invalidate-cache", async c => {
    try {
        await invalidateCollegeCache()
        return sendSuccess(c, null, "Cache invalidated", true, 200)
    } catch (error) {
        return sendError(c, "Failed to invalidate cache", 500)
    }
})
