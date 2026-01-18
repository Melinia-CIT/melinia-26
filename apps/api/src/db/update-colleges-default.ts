import sql from "./connection"

async function updateCollegesDefault() {
    try {
        console.log("Updating is_default for all colleges...")

        const result = await sql`
            UPDATE colleges
            SET is_default = true
        `

        console.log(`Updated ${result.count} colleges`)

        const totalColleges = await sql`SELECT COUNT(*) as count FROM colleges`
        console.log(`Total colleges in database: ${totalColleges[0]?.count ?? 0}`)
    } catch (error) {
        console.error("Error updating colleges:", error)
        throw error
    } finally {
        await sql.end()
    }
}

updateCollegesDefault()
