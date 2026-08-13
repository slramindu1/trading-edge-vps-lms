import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { mailTransporter } from "@/lib/mail";

// GET /api/cron/expiry-warnings?key=CRON_SECRET
// Call this daily from a cron service (e.g. crontab, EasyCron, etc.)
export async function GET(request: NextRequest) {
  const key = new URL(request.url).searchParams.get("key");
  if (key !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const warningDays = [1, 7, 14, 30];
  let emailsSent = 0;

  for (const daysLeft of warningDays) {
    // Find users whose expiry falls within a 24h window around [now + daysLeft days]
    const windowStart = new Date(now);
    windowStart.setDate(windowStart.getDate() + daysLeft);
    windowStart.setHours(0, 0, 0, 0);

    const windowEnd = new Date(windowStart);
    windowEnd.setHours(23, 59, 59, 999);

    // We use the custom expiry_date if set, otherwise joined_date + 1yr
    // Prisma doesn't allow computed fields in WHERE, so we fetch candidates and filter in JS
    const candidates = await prisma.user.findMany({
      where: {
        status_id: 1,            // Active users only
        is_paid: true,
        expiry_disabled: false,  // Skip users with expiry disabled
        user_type_id: 2,         // Students only
      },
      select: {
        id:           true,
        fname:        true,
        lname:        true,
        email:        true,
        joined_date:  true,
        expiry_date:  true,
        payment_date: true,
      },
    });

    for (const user of candidates) {
      // Determine effective expiry date
      let expiryDate: Date;
      if (user.expiry_date) {
        expiryDate = new Date(user.expiry_date);
      } else {
        expiryDate = new Date(user.joined_date);
        expiryDate.setFullYear(expiryDate.getFullYear() + 1);
      }

      // Check if expiry falls within today's warning window
      if (expiryDate >= windowStart && expiryDate <= windowEnd) {
        try {
          await mailTransporter.sendMail({
            from: `"TradingEdge LMS" <${process.env.SMTP_USER}>`,
            to: user.email,
            subject: getSubject(daysLeft),
            html: getExpiryWarningEmailHtml(user.fname, user.email, expiryDate, daysLeft),
          });
          emailsSent++;
          console.log(`✅ Sent ${daysLeft}-day warning to: ${user.email}`);
        } catch (err) {
          console.warn(`⚠️ Failed to send warning to ${user.email}:`, err);
        }
      }
    }
  }

  return NextResponse.json({
    success: true,
    message: `Expiry warning emails sent: ${emailsSent}`,
    timestamp: now.toISOString(),
  });
}

function getSubject(daysLeft: number): string {
  if (daysLeft === 1) return "⚠️ Your TradingEdge account expires TOMORROW";
  if (daysLeft === 7) return "⚠️ Your TradingEdge account expires in 1 week";
  if (daysLeft === 14) return "⚠️ Your TradingEdge account expires in 2 weeks";
  return "⚠️ Your TradingEdge account expires in 1 month";
}

function getExpiryWarningEmailHtml(
  fname: string,
  email: string,
  expiryDate: Date,
  daysLeft: number
): string {
  const formattedDate = expiryDate.toLocaleDateString("en-GB", {
    day: "numeric", month: "long", year: "numeric",
  });

  const urgencyColor = daysLeft === 1 ? "#ef4444" : daysLeft <= 7 ? "#f97316" : "#f59e0b";
  const urgencyBg = daysLeft === 1 ? "#fef2f2" : daysLeft <= 7 ? "#fff7ed" : "#fffbeb";
  const urgencyText = daysLeft === 1
    ? "Your account expires <strong>tomorrow</strong>!"
    : `Your account expires in <strong>${daysLeft} days</strong>.`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Account Expiry Warning</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr>
          <td style="background:#000000;padding:36px 48px;text-align:center;">
            <p style="margin:0;font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">TradingEdge LMS</p>
            <p style="margin:8px 0 0;font-size:13px;color:#999999;">Your trading education platform</p>
          </td>
        </tr>

        <!-- Urgency Banner -->
        <tr>
          <td style="background:${urgencyBg};padding:20px 48px;border-bottom:2px solid ${urgencyColor}20;">
            <p style="margin:0;font-size:14px;color:${urgencyColor};text-align:center;">${urgencyText}</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:48px;">
            <p style="margin:0 0 24px;font-size:16px;color:#111827;">Hi ${fname},</p>
            <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.6;">
              We wanted to give you a heads-up that your TradingEdge LMS subscription is
              <strong style="color:${urgencyColor};">expiring on ${formattedDate}</strong>.
            </p>
            <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.6;">
              After this date, you will lose access to all course materials, lessons, and progress data.
            </p>

            <!-- Expiry Date Card -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:${urgencyBg};border:1px solid ${urgencyColor}30;border-radius:12px;margin:32px 0;">
              <tr>
                <td style="padding:24px;text-align:center;">
                  <p style="margin:0 0 8px;font-size:13px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">Account Expiry Date</p>
                  <p style="margin:0;font-size:28px;font-weight:700;color:${urgencyColor};">${formattedDate}</p>
                </td>
              </tr>
            </table>

            <p style="margin:0 0 32px;font-size:15px;color:#374151;line-height:1.6;">
              To continue your learning journey, please contact us to renew your subscription before
              your account is deactivated.
            </p>

            <!-- CTA Button -->
            <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
              <tr>
                <td style="background:#000000;border-radius:8px;padding:14px 32px;text-align:center;">
                  <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" style="color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;">
                    Go to Dashboard →
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f9fafb;padding:24px 48px;border-top:1px solid #e5e7eb;text-align:center;">
            <p style="margin:0;font-size:13px;color:#9ca3af;">
              This email was sent to ${email} because your account is registered with TradingEdge LMS.
            </p>
            <p style="margin:8px 0 0;font-size:13px;color:#9ca3af;">© ${new Date().getFullYear()} TradingEdge FX. All rights reserved.</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export const dynamic = "force-dynamic";
