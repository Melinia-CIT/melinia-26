import { describe, it, expect, beforeAll, afterAll } from "bun:test"
import { Hono } from "hono"
import sql from "../db/connection"
import { college } from "../routes/colleges.route"
import { ioredis } from "../utils/redis"

const app = new Hono().route("/", college)

interface CollegeResponse {
    status: boolean
    message?: string
    data: Array<{ id: number; name: string; degrees: string[] }>
}

describe("College Endpoint", () => {
    beforeAll(async () => {
        await ioredis.flushdb()
    })

    afterAll(async () => {
        await sql.end()
        await ioredis.quit()
    })

    describe("GET /colleges", () => {
        it("should return all colleges when no search param", async () => {
            const res = await app.request("/")
            expect(res.status).toBe(200)

            const body = (await res.json()) as CollegeResponse
            expect(body.status).toBe(true)
            expect(body.data).toBeDefined()
            expect(Array.isArray(body.data)).toBe(true)
        })

        it("should return cached result on second request", async () => {
            await app.request("/")

            const res = await app.request("/")
            expect(res.status).toBe(200)

            const body = (await res.json()) as CollegeResponse
            expect(body.message).toBe("Colleges fetched from cache")
        })

        it("should filter colleges by search term", async () => {
            const res = await app.request("/?search=indian")
            expect(res.status).toBe(200)

            const body = (await res.json()) as CollegeResponse
            expect(body.status).toBe(true)
            expect(body.data).toBeDefined()

            if (body.data.length > 0) {
                for (const c of body.data) {
                    expect(c.name.toLowerCase()).toContain("indian")
                }
            }
        })

        it("should limit results by limit param", async () => {
            const res = await app.request("/?search=uni&limit=5")
            expect(res.status).toBe(200)

            const body = (await res.json()) as CollegeResponse
            expect(body.status).toBe(true)
            expect(body.data.length).toBeLessThanOrEqual(5)
        })

        it("should cap limit at 50", async () => {
            const res = await app.request("/?search=uni&limit=100")
            expect(res.status).toBe(200)

            const body = (await res.json()) as CollegeResponse
            expect(body.status).toBe(true)
            expect(body.data.length).toBeLessThanOrEqual(50)
        })

        it("should return empty array for no matches", async () => {
            const res = await app.request("/?search=xyznonexistentcollege123")
            expect(res.status).toBe(200)

            const body = (await res.json()) as CollegeResponse
            expect(body.status).toBe(true)
            expect(body.data).toEqual([])
        })
    })

    describe("POST /colleges/invalidate-cache", () => {
        it("should invalidate all college cache", async () => {
            await app.request("/")

            const res = await app.request("/invalidate-cache", { method: "POST" })
            expect(res.status).toBe(200)

            const body = (await res.json()) as { status: boolean; message: string }
            expect(body.status).toBe(true)
            expect(body.message).toBe("Cache invalidated")
        })

        it("should fetch fresh data after cache invalidation", async () => {
            await app.request("/")

            await app.request("/invalidate-cache", { method: "POST" })

            const res = await app.request("/")
            expect(res.status).toBe(200)

            const body = (await res.json()) as CollegeResponse
            expect(body.message).toBe("Colleges fetched")
        })
    })
})

describe("Cache Utilities", () => {
    it("should generate correct cache key for search", () => {
        const { getCollegeCacheKey } = require("../utils/cache")
        const key = getCollegeCacheKey("mit", 20)
        expect(key).toBe("college:search:mit:20")
    })

    it("should generate correct cache key for all", () => {
        const { getCollegeCacheKey } = require("../utils/cache")
        const key = getCollegeCacheKey("", 20)
        expect(key).toBe("college:all:20")
    })

    it("should have correct TTL values", () => {
        const { COLLEGE_SEARCH_TTL, COLLEGE_ALL_TTL } = require("../utils/cache")
        expect(COLLEGE_SEARCH_TTL).toBe(3600)
        expect(COLLEGE_ALL_TTL).toBe(21600)
    })
})

describe("Database Queries", () => {
    it("getColleges should return array", async () => {
        const { getColleges } = require("../db/queries/colleges.queries")
        const data = await getColleges()
        expect(Array.isArray(data)).toBe(true)
    })

    it("searchColleges should return filtered results", async () => {
        const { searchColleges } = require("../db/queries/colleges.queries")
        const data = await searchColleges("university", 10)
        expect(Array.isArray(data)).toBe(true)
        expect(data.length).toBeLessThanOrEqual(10)

        if (data.length > 0) {
            for (const c of data as Array<{ name: string }>) {
                expect(c.name.toLowerCase()).toContain("university")
            }
        }
    })

    it("searchColleges should respect limit", async () => {
        const { searchColleges } = require("../db/queries/colleges.queries")
        const data = await searchColleges("college", 5)
        expect(data.length).toBeLessThanOrEqual(5)
    })
})
