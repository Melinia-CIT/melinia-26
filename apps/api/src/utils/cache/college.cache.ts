import { ioredis } from "../redis"

export const COLLEGE_SEARCH_TTL = 3600
export const DEGREE_SEARCH_TTL = 3600

export function getCollegeCacheKey(search: string, limit: number): string {
    return search.length >= 2
        ? `college:search:${search.toLowerCase()}:${limit}`
        : `college:list:${limit}`
}

export function getDegreeCacheKey(search: string, limit: number): string {
    return search.length >= 2
        ? `degree:search:${search.toLowerCase()}:${limit}`
        : `degree:list:${limit}`
}

export async function getCollegeCache<T>(key: string): Promise<T | null> {
    try {
        const cached = await ioredis.get(key)
        return cached ? JSON.parse(cached) : null
    } catch (error) {
        console.error("College cache GET error:", error)
        return null
    }
}

export async function setCollegeCache<T>(key: string, data: T, ttl: number): Promise<void> {
    try {
        await ioredis.setex(key, ttl, JSON.stringify(data))
    } catch (error) {
        console.error("College cache SET error:", error)
    }
}

export async function getDegreeCache<T>(key: string): Promise<T | null> {
    try {
        const cached = await ioredis.get(key)
        return cached ? JSON.parse(cached) : null
    } catch (error) {
        console.error("Degree cache GET error:", error)
        return null
    }
}

export async function setDegreeCache<T>(key: string, data: T, ttl: number): Promise<void> {
    try {
        await ioredis.setex(key, ttl, JSON.stringify(data))
    } catch (error) {
        console.error("Degree cache SET error:", error)
    }
}

export async function invalidateCollegeCache(): Promise<void> {
    try {
        const keys = await ioredis.keys("college:*")
        if (keys.length > 0) {
            await ioredis.del(...keys)
        }
    } catch (error) {
        console.error("College cache DEL error:", error)
    }
}

export async function invalidateDegreeCache(): Promise<void> {
    try {
        const keys = await ioredis.keys("degree:*")
        if (keys.length > 0) {
            await ioredis.del(...keys)
        }
    } catch (error) {
        console.error("Degree cache DEL error:", error)
    }
}
