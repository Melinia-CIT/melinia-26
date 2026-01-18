import { ioredis } from "./redis"

export const COLLEGE_SEARCH_TTL = 3600
export const COLLEGE_ALL_TTL = 21600

export function getCollegeCacheKey(search: string, limit: number): string {
    return search.length >= 2
        ? `college:search:${search.toLowerCase()}:${limit}`
        : `college:all:${limit}`
}

export async function getCollegeCache<T>(key: string): Promise<T | null> {
    try {
        const cached = await ioredis.get(key)
        return cached ? JSON.parse(cached) : null
    } catch (error) {
        console.error("Cache GET error:", error)
        return null
    }
}

export async function setCollegeCache<T>(key: string, data: T, ttl: number): Promise<void> {
    try {
        await ioredis.setex(key, ttl, JSON.stringify(data))
    } catch (error) {
        console.error("Cache SET error:", error)
    }
}

export async function invalidateCollegeCache(): Promise<void> {
    try {
        const keys = await ioredis.keys("college:*")
        if (keys.length > 0) {
            await ioredis.del(...keys)
        }
    } catch (error) {
        console.error("Cache DEL error:", error)
    }
}
