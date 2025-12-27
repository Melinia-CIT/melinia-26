export const OTPTemplate = (otp: string) => ({
    subject: "Your OTP Code - Melinia'26",
    body: `Your OTP code is: ${otp}\n\nThis code will expire in 10 minutes.\n\nIf you didn't request this code, please ignore this email.\n\n- Melinia'26 Dev Team`,
    html: `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verification Code</title>

        <style>
            @media only screen and (max-width: 480px) {

                .outer-wrapper {
                    border-radius: 14px !important;
                }

                .container {
                    border-radius: 12px !important;
                }

                .content {
                    padding: 30px 20px !important;
                }

                .footer {
                    padding: 20px 16px !important;
                }

                .divider {
                    padding: 0 20px !important;
                }

                .heading {
                    font-size: 24px !important;
                    line-height: 32px !important;
                }

                .text {
                    font-size: 15px !important;
                }

                .otp {
                    font-size: 30px !important;
                    letter-spacing: 4px !important;
                    line-height: 1 !important;
                }

                .footer-text {
                    font-size: 11px !important;
                }
            }
        </style>
    </head>

    <body style="margin:0;padding:0;background-color:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#0a0a0a;">
        <tr>
            <td align="center" style="padding:40px 20px;">

                <!-- OUTER ROUNDED BACKGROUND -->
                <table role="presentation"
                       width="100%"
                       cellspacing="0"
                       cellpadding="0"
                       class="outer-wrapper"
                       style="
                            max-width:640px;
                            background-color:#111111;
                            border-radius:16px;
                            padding:12px;
                       ">

                    <tr>
                        <td>

                            <!-- INNER CARD -->
                            <table role="presentation"
                                   width="100%"
                                   cellspacing="0"
                                   cellpadding="0"
                                   class="container"
                                   style="
                                        background-color:#1a1a1a;
                                        border-radius:12px;
                                        overflow:hidden;
                                        box-shadow:0 8px 16px rgba(0,0,0,0.4);
                                   ">

                                <!-- Banner -->
                                <tr>
                                    <td style="padding:0;background-color:#87CEEB;">
                                        <img src="https://cdn.melinia.dev/mln-e-bnr.jpg"
                                             alt="Melinia'26"
                                             width="600"
                                             style="display:block;width:100%;height:auto;max-height:200px;object-fit:cover;">
                                    </td>
                                </tr>

                                <!-- Content -->
                                <tr>
                                    <td class="content" style="padding:48px 40px;text-align:center;">

                                        <h1 class="heading"
                                            style="margin:0 0 18px;color:#ffffff;font-size:32px;font-weight:700;">
                                            Your Verification Code
                                        </h1>

                                        <p class="text"
                                           style="margin:0 0 32px;color:#a0a0a0;font-size:16px;line-height:24px;">
                                            Enter this code to complete your verification
                                        </p>

                                        <!-- OTP (COMPACT HEIGHT) -->
                                        <div
                                            style="
                                                background-color:#2a2a2a;
                                                border-radius:10px;
                                                padding:14px 28px;
                                                display:inline-block;
                                                margin-bottom:24px;
                                                box-shadow:0 4px 12px rgba(0,0,0,0.3);
                                            ">
                                            <div
                                                class="otp"
                                                style="
                                                    font-size:38px;
                                                    font-weight:700;
                                                    color:#ffffff;
                                                    letter-spacing:6px;
                                                    font-family:SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
                                                    line-height:1;
                                                    white-space:nowrap;
                                                    font-variant-numeric: tabular-nums;
                                                    font-feature-settings:'tnum';
                                                ">
                                                ${otp}
                                            </div>
                                        </div>

                                        <p style="margin:0 0 8px;color:#a0a0a0;font-size:13px;">
                                            This code will expire in
                                            <strong style="color:#ffffff;">10 minutes</strong>
                                        </p>

                                        <p style="margin:0;color:#7a7a7a;font-size:12px;">
                                            If you didn't request this code, please ignore this email.
                                        </p>

                                    </td>
                                </tr>

                                <!-- Divider -->
                                <tr>
                                    <td class="divider" style="padding:0 40px;">
                                        <div style="height:1px;background:linear-gradient(90deg,transparent,#333333,transparent);"></div>
                                    </td>
                                </tr>

                                <!-- Footer -->
                                <tr>
                                    <td class="footer" style="padding:26px 40px;text-align:center;">
                                        <p class="footer-text"
                                           style="margin:0 0 6px;color:#555555;font-size:11px;line-height:16px;">
                                            This is an automated message, please do not reply.
                                        </p>
                                        <p class="footer-text"
                                           style="
                                                margin:0;
                                                color:#ffffff;
                                                font-size:12px;
                                                font-weight:700;
                                                letter-spacing:0.4px;
                                           ">
                                            Melinia'26 Dev Team
                                        </p>
                                    </td>
                                </tr>

                            </table>
                            <!-- /Inner card -->

                        </td>
                    </tr>
                </table>
                <!-- /Outer rounded background -->

            </td>
        </tr>
    </table>

    </body>
    </html>

  `,
});
