import { Resend } from "resend"

// Lazy initialization to avoid build-time errors
let resend: Resend | null = null

function getResend(): Resend {
  if (!resend) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not set")
    }
    resend = new Resend(process.env.RESEND_API_KEY)
  }
  return resend
}

export async function sendDownAlert(
  email: string,
  monitorName: string,
  lastPing: Date | null,
  pingUrl: string
) {
  const lastPingText = lastPing
    ? `Last successful ping: ${lastPing.toISOString()}`
    : "No pings received yet"

  try {
    await getResend().emails.send({
      from: "CronPing <alerts@cronping.dev>",
      to: email,
      subject: `[DOWN] ${monitorName} is not responding`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc2626;">Your cron job "${monitorName}" is DOWN</h2>
          <p>We haven't received a ping within the expected timeframe.</p>
          <p style="color: #6b7280;">${lastPingText}</p>
          <p style="margin-top: 24px;">
            <strong>Ping URL:</strong><br/>
            <code style="background: #f3f4f6; padding: 8px 12px; display: inline-block; border-radius: 4px;">${pingUrl}</code>
          </p>
          <hr style="margin: 24px 0; border: none; border-top: 1px solid #e5e7eb;" />
          <p style="color: #9ca3af; font-size: 12px;">
            Sent by CronPing - Simple cron job monitoring
          </p>
        </div>
      `,
    })
    return true
  } catch (error) {
    console.error("Failed to send down alert:", error)
    return false
  }
}

export async function sendUpAlert(
  email: string,
  monitorName: string,
  downDuration: string
) {
  try {
    await getResend().emails.send({
      from: "CronPing <alerts@cronping.dev>",
      to: email,
      subject: `[RECOVERED] ${monitorName} is back up`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #16a34a;">Your cron job "${monitorName}" has RECOVERED</h2>
          <p>We received a successful ping after being down.</p>
          <p style="color: #6b7280;">Downtime duration: ${downDuration}</p>
          <hr style="margin: 24px 0; border: none; border-top: 1px solid #e5e7eb;" />
          <p style="color: #9ca3af; font-size: 12px;">
            Sent by CronPing - Simple cron job monitoring
          </p>
        </div>
      `,
    })
    return true
  } catch (error) {
    console.error("Failed to send up alert:", error)
    return false
  }
}
