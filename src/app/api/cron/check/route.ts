import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { sendDownAlert } from "@/lib/email"

// This endpoint should be called every minute by an external cron service
// or Vercel cron jobs
export async function GET(request: NextRequest) {
  // Optional: Verify cron secret to prevent unauthorized calls
  const authHeader = request.headers.get("authorization")
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const now = new Date()

    // Find all monitors that are "up" or "new" and haven't pinged within their grace period
    const monitors = await prisma.monitor.findMany({
      where: {
        status: { in: ["up", "new"] },
      },
    })

    const results = {
      checked: 0,
      alertsSent: 0,
      errors: 0,
    }

    for (const monitor of monitors) {
      results.checked++

      // Skip if no lastPing yet and status is "new"
      if (!monitor.lastPing && monitor.status === "new") {
        continue
      }

      // Calculate if the monitor is overdue
      const lastPingTime = monitor.lastPing ? new Date(monitor.lastPing) : null
      const gracePeriodMs = monitor.gracePeriod * 1000

      if (lastPingTime) {
        const timeSinceLastPing = now.getTime() - lastPingTime.getTime()

        if (timeSinceLastPing > gracePeriodMs) {
          // Monitor is down!
          console.log(`[Checker] Monitor "${monitor.name}" is down. Last ping: ${lastPingTime.toISOString()}`)

          // Update status to down
          await prisma.monitor.update({
            where: { id: monitor.id },
            data: { status: "down" },
          })

          // Create alert record
          await prisma.alert.create({
            data: {
              monitorId: monitor.id,
              type: "down",
            },
          })

          // Send email alert
          const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://cronping.dev"
          const pingUrl = `${baseUrl}/api/ping/${monitor.slug}`

          const sent = await sendDownAlert(
            monitor.email,
            monitor.name,
            lastPingTime,
            pingUrl
          )

          if (sent) {
            results.alertsSent++
          } else {
            results.errors++
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      ...results,
    })
  } catch (error) {
    console.error("Checker error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
