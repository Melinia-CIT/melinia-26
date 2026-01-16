export const OTPTemplate = (otp: string) => ({
    subject: "Your OTP Code - Melinia'26",
    body: `Your OTP code is: ${otp}

This code will expire in 10 minutes.

If you didn't request this code, please ignore this email.

Need help? helpdesk@melinia.in

Melinia'26 Dev Team`,
    html: `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verification Code</title>
    <style>
        @keyframes borderFlow {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
        }
        .running-border {
            background: linear-gradient(90deg, #A07CFE, #FE8FB5, #FFBE7B, #A07CFE);
            background-size: 300% 100%;
            animation: borderFlow 3s linear infinite;
        }
    </style>
</head>
<body style="margin:0;padding:0;background-color:#09090b;font-family:system-ui,-apple-system,sans-serif;">
    <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
        <div class="running-border" style="border-radius:16px;padding:3px;">
            <div style="background:#18181b;border-radius:14px;">
                <img src="https://cdn.melinia.in/mln-e-bnr.jpg" alt="Melinia'26" style="display:block;width:100%;height:auto;border-radius:11px 11px 0 0;">
                
                <div style="padding:40px 32px;text-align:center;">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="color:#ffffff;margin-bottom:24px;">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                        <path d="M9 12l2 2 4-4"/>
                    </svg>
                    
                    <h1 style="margin:0 0 12px;color:#fafafa;font-size:28px;font-weight:600;letter-spacing:-0.5px;">
                        Your Verification Code
                    </h1>
                    
                    <p style="margin:0 0 32px;color:#a1a1aa;font-size:15px;line-height:1.6;">
                        Enter this code to complete your verification
                    </p>
                    
                    <div style="background:#27272a;border-radius:12px;padding:20px 32px;display:inline-block;margin-bottom:24px;">
                        <div style="color:#fafafa;font-size:36px;font-weight:700;letter-spacing:8px;font-family:monospace;">
                            ${otp}
                        </div>
                    </div>
                    
                    <p style="margin:0 0 8px;color:#a1a1aa;font-size:14px;">
                        This code will expire in <strong style="color:#fafafa;">10 minutes</strong>
                    </p>
                    
                    <p style="margin:0;color:#71717a;font-size:13px;">
                        If you didn't request this code, please ignore this email.
                    </p>
                </div>
                
                <div style="padding:20px 32px;border-top:1px solid #27272a;text-align:center;border-radius:0 0 11px 11px;">
                    <p style="margin:0 0 8px;color:#71717a;font-size:12px;">
                        This is an automated message, please do not reply.
                    </p>
                    <p style="margin:0 0 4px;color:#71717a;font-size:12px;">
                        Need help? <a href="mailto:helpdesk@melinia.in" style="color:#71717a;text-decoration:underline;">helpdesk@melinia.in</a>
                    </p>
                    <p style="margin:8px 0 0;color:#fafafa;font-size:12px;font-weight:600;letter-spacing:0.5px;">
                        Melinia'26 Dev Team
                    </p>
                </div>
            </div>
        </div>
    </div>
</body>
</html>
  `,
})

export const forgotPasswordTemplate = (resetLink: string) => ({
    subject: "Password Reset Link - Melinia'26",
    body: `Reset Your Password

We received a request to reset your password. Click the link below to create a new password.

${resetLink}

This link will expire in 15 minutes.

If you didn't request this reset, please ignore this email.

Need help? helpdesk@melinia.in

Melinia'26 Dev Team`,
    html: `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Reset</title>
    <style>
        @keyframes borderFlow {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
        }
        .running-border {
            background: linear-gradient(90deg, #A07CFE, #FE8FB5, #FFBE7B, #A07CFE);
            background-size: 300% 100%;
            animation: borderFlow 3s linear infinite;
        }
    </style>
</head>
<body style="margin:0;padding:0;background-color:#09090b;font-family:system-ui,-apple-system,sans-serif;">
    <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
        <div class="running-border" style="border-radius:16px;padding:3px;">
            <div style="background:#18181b;border-radius:14px;">
                <img src="https://cdn.melinia.in/mln-e-bnr.jpg" alt="Melinia'26" style="display:block;width:100%;height:auto;border-radius:11px 11px 0 0;">
                
                <div style="padding:40px 32px;text-align:center;">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="color:#ffffff;margin-bottom:24px;">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                    
                    <h1 style="margin:0 0 12px;color:#fafafa;font-size:28px;font-weight:600;letter-spacing:-0.5px;">
                        Reset Your Password
                    </h1>
                    
                    <p style="margin:0 0 32px;color:#a1a1aa;font-size:15px;line-height:1.6;">
                        We received a request to reset your password. Click the button below to create a new password.
                    </p>
                    
                    <a href="${resetLink}" target="_blank" rel="noopener noreferrer" style="display:inline-block;background:#ffffff;color:#09090b;text-decoration:none;padding:14px 32px;border-radius:10px;font-size:15px;font-weight:700;">
                        Reset Password
                    </a>
                    
                    <p style="margin:32px 0 8px;color:#a1a1aa;font-size:14px;">
                        This link will expire in <strong style="color:#fafafa;">15 minutes</strong>
                    </p>
                    
                    <p style="margin:0;color:#71717a;font-size:13px;">
                        If you didn't request this reset, please ignore this email.
                    </p>
                </div>
                
                <div style="padding:20px 32px;border-top:1px solid #27272a;text-align:center;border-radius:0 0 11px 11px;">
                    <p style="margin:0 0 8px;color:#71717a;font-size:12px;">
                        This is an automated message, please do not reply.
                    </p>
                    <p style="margin:0 0 4px;color:#71717a;font-size:12px;">
                        Need help? <a href="mailto:helpdesk@melinia.in" style="color:#71717a;text-decoration:underline;">helpdesk@melinia.in</a>
                    </p>
                    <p style="margin:8px 0 0;color:#fafafa;font-size:12px;font-weight:600;letter-spacing:0.5px;">
                        Melinia'26 Dev Team
                    </p>
                </div>
            </div>
        </div>
    </div>
</body>
</html>
    `,
})
