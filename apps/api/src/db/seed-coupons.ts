import { join } from "path"

const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:3000"
const ADMIN_EMAIL = process.env.ADMIN_EMAIL
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.error("❌ ADMIN_EMAIL and ADMIN_PASSWORD environment variables are required")
    console.error("   Please set them:")
    console.error("   export ADMIN_EMAIL=admin@example.com")
    console.error("   export ADMIN_PASSWORD=your_password")
    process.exit(1)
}

async function login(): Promise<string> {
    try {
        const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                email: ADMIN_EMAIL,
                passwd: ADMIN_PASSWORD,
            }),
        })

        const data = (await response.json()) as { accessToken?: string; message?: string }

        if (response.status === 200 && data.accessToken) {
            return data.accessToken
        } else {
            throw new Error(data.message || "Login failed")
        }
    } catch (error) {
        throw new Error(`Login failed: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
}

async function createCoupon(
    code: string,
    token: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const response = await fetch(`${API_BASE_URL}/api/v1/coupons`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ code }),
        })

        if (response.status === 200) {
            return { success: true }
        } else if (response.status === 409) {
            return { success: false, error: "already_exists" }
        } else {
            const data = (await response.json()) as { message?: string }
            return { success: false, error: data.message || "Unknown error" }
        }
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : "Network error" }
    }
}

async function generateCouponsFromCSV(csvFileName: string = "roll_numbers.csv"): Promise<void> {
    const csvPath = join(import.meta.dir, "data", csvFileName)

    try {
        console.log(`🔗 Connecting to API: ${API_BASE_URL}`)
        console.log(`👤 Logging in as: ${ADMIN_EMAIL}`)

        const token = await login()
        console.log("✅ Login successful!")

        const csvContent = await Bun.file(csvPath).text()

        const lines = csvContent.trim().split("\n")
        if (lines.length < 2) {
            console.log("❌ CSV file is empty or only contains headers")
            return
        }

        const headers = lines[0]?.split(",").map(h => h.trim().toLowerCase()) || []
        const rollNumberIndex = headers.findIndex(h => h === "roll_number")

        if (rollNumberIndex === -1) {
            console.log("❌ 'roll_number' column not found in CSV. Available columns:", headers)
            return
        }

        const rollNumbers: string[] = lines
            .slice(1)
            .map(line => {
                const columns = line.split(",")
                const rollNumber = columns[rollNumberIndex]?.trim()
                return rollNumber || null
            })
            .filter(
                (rollNumber): rollNumber is string => rollNumber !== null && rollNumber.length > 0
            )

        if (rollNumbers.length === 0) {
            console.log("❌ No valid roll numbers found in CSV")
            return
        }

        console.log(`📋 Found ${rollNumbers.length} roll numbers in ${csvFileName}`)

        let successCount = 0
        let duplicateCount = 0
        let errorCount = 0
        const errors: string[] = []

        for (const rollNumber of rollNumbers) {
            const result = await createCoupon(rollNumber, token)

            if (result.success) {
                successCount++
            } else if (result.error === "already_exists") {
                duplicateCount++
            } else {
                errorCount++
                errors.push(`${rollNumber}: ${result.error}`)
            }

            if ((successCount + duplicateCount + errorCount) % 10 === 0) {
                process.stdout.write(
                    `\r📊 Progress: ${successCount + duplicateCount + errorCount}/${rollNumbers.length}`
                )
            }
        }

        console.log("\r" + " ".repeat(50))
        console.log("\n✅ Seeding completed!")
        console.log(`   📝 Successfully created: ${successCount} coupons`)
        console.log(`   🔁 Already existed (duplicates): ${duplicateCount}`)
        if (errorCount > 0) {
            console.log(`   ⚠️ Errors encountered: ${errorCount}`)
            console.log("\n   Error details:")
            errors.slice(0, 10).forEach(err => console.log(`   - ${err}`))
            if (errors.length > 10) {
                console.log(`   ... and ${errors.length - 10} more errors`)
            }
        }
    } catch (error) {
        if (error instanceof Error && error.message.includes("No such file or directory")) {
            console.log(`❌ CSV file not found: ${csvPath}`)
            console.log("   Please ensure your CSV file exists in the data/ directory")
        } else {
            console.error("❌ Error processing CSV file:", error)
        }
        process.exit(1)
    }
}

const csvFileName = process.argv[2] || "roll_numbers.csv"
await generateCouponsFromCSV(csvFileName)
