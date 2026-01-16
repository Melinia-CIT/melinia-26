import sql from "../connection"

export async function getUserEmail(userId: string): Promise<{ email: string } | null> {
    const [user] = await sql`
        SELECT email FROM users WHERE id = ${userId}
    `

    if (!user) {
        return null
    }

    return { email: user.email }
}

export async function createPaymentRecord(
    userId: string,
    orderId: string,
    email: string,
    orderData: any
) {
    await sql`
        INSERT INTO payments (
            user_id,
            order_id,
            payment_status,
            email,
            amount,
            payment_method,
            gateway_response,
            razorpay_order_created_at
        )
        VALUES (
            ${userId},
            ${orderId},
            'CREATED',
            ${email},
            1.00,
            null,
            ${JSON.stringify(orderData)},
            ${new Date(orderData.created_at * 1000)}
        )
    `
}

export async function updatePaymentStatus(paymentData: any, status: string, paidAt: Date | null) {
    await sql`
        UPDATE payments
        SET
            payment_id = ${paymentData.id},
            payment_status = ${status},
            payment_method = ${paymentData.method || null},
            gateway_response = ${JSON.stringify(paymentData)},
            paid_at = ${paidAt},
            razorpay_payment_created_at = ${new Date(paymentData.created_at * 1000)},
            updated_at = CURRENT_TIMESTAMP
        WHERE order_id = ${paymentData.order_id}
            AND payment_status != 'PAID'
    `
}

export async function getUserLatestPaymentStatus(
    userId: string
): Promise<{ payment_status: string } | null> {
    const [payment] = await sql`
        SELECT payment_status
        FROM payments
        WHERE user_id = ${userId}
        ORDER BY created_at DESC
        LIMIT 1
    `

    if (!payment) {
        return null
    }

    return { payment_status: payment.payment_status }
}

export async function checkUserExistsById(userId: string): Promise<boolean> {
    const [user] = await sql`
        SELECT id FROM users WHERE id = ${userId}
    `

    return !!user
}

export async function getUserIdByOrderId(orderId: string): Promise<string | null> {
    const [payment] = await sql`
        SELECT user_id FROM payments WHERE order_id = ${orderId}
    `

    if (!payment) {
        return null
    }

    return payment.user_id
}
