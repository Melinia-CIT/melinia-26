import sql from "./connection"
import fs from "fs/promises"
import path from "path"

async function seedColleges() {
    const collegesFile = path.join(__dirname, "tn_colleges.txt")
    const degreesFile = path.join(__dirname, "common_degrees.txt")
    const batchSize = 100

    try {
        console.log("Reading colleges from file:", collegesFile)
        const collegesContent = await fs.readFile(collegesFile, "utf-8")
        const collegeLines = collegesContent.split("\n").filter(line => line.trim() !== "")

        console.log("Reading degrees from file:", degreesFile)
        const degreesContent = await fs.readFile(degreesFile, "utf-8")
        const degreeNames = degreesContent
            .split("\n")
            .filter(line => line.trim() !== "")
            .map(d => d.trim())

        console.log(`Found ${collegeLines.length} colleges and ${degreeNames.length} degrees`)

        const collegeNames: string[] = []
        for (const line of collegeLines) {
            const name = line.trim()
            if (name) {
                collegeNames.push(name)
            }
        }

        console.log(`Extracted ${collegeNames.length} college names`)

        let insertedCount = 0
        let skippedCount = 0

        for (let i = 0; i < collegeNames.length; i += batchSize) {
            const batch = collegeNames.slice(i, i + batchSize)

            const result = await sql`
				INSERT INTO colleges (name)
				VALUES ${sql(batch.map(name => [name]))}
				ON CONFLICT (name) DO NOTHING
				RETURNING id, name
			`

            insertedCount += result.length

            if ((i + batchSize) % 500 === 0 || i + batchSize >= collegeNames.length) {
                console.log(
                    `Processed ${Math.min(i + batchSize, collegeNames.length)}/${collegeNames.length} colleges...`
                )
            }
        }

        console.log("\nSeeding default degrees...")

        let degreesInserted = 0
        let degreesSkipped = 0

        for (const degreeName of degreeNames) {
            const result = await sql`
                INSERT INTO degrees (name, college_id, is_default)
                VALUES (${degreeName}, NULL, true)
                ON CONFLICT DO NOTHING
            `

            if (result.count > 0) {
                degreesInserted++
            } else {
                degreesSkipped++
            }
        }

        console.log(`Inserted ${degreesInserted} default degrees`)

        const totalColleges = await sql`SELECT COUNT(*) as count FROM colleges`
        const totalDegrees = await sql`SELECT COUNT(*) as count FROM degrees`
        console.log("\n=== Seeding Complete ===")
        console.log(`Total colleges processed: ${collegeNames.length}`)
        console.log(`New colleges inserted: ${insertedCount}`)
        console.log(`Colleges skipped (duplicates): ${skippedCount}`)
        console.log(`Total colleges in database: ${totalColleges[0]?.count ?? 0}`)
        console.log(`Degrees inserted: ${degreesInserted}`)
        console.log(`Degrees skipped (duplicates): ${degreesSkipped}`)
        console.log(`Total degrees in database: ${totalDegrees[0]?.count ?? 0}`)
    } catch (error) {
        console.error("Error seeding colleges:", error)
        throw error
    } finally {
        await sql.end()
    }
}

seedColleges()
