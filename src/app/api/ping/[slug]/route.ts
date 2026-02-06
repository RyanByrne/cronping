import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { sendUpAlert } from "@/lib/email"
import { formatDistanceToNow } from "date-fns"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  try {
    const monitor = await prisma.monitor.findUnique({
      where: { slug },
    })

    if (!monitor) {
      return NextResponse.json({ error: "Monitor not found" }, { status: 404 })
    }

    if (monitor.status === "paused") {
      return NextResponse.json({ status: "paused", message: "Monitor is paused" })
    }

    // Record the ping
    const source = request.headers.get("x-forwarded-for") ||
                   request.headers.get("x-real-ip") ||
                   "unknown"

    await prisma.ping.create({
      data: {
        monitorId: monitor.id,
        source,
      },
    })

    // Update monitor status and lastPing
    const wasDown = monitor.status === "down"

    await prisma.monitor.update({
      where: { id: monitor.id },
      data: {
        status: "up",
        lastPing: new Date(),
      },
    })

    // If it was down and is now up, send a recovery alert
    if (wasDown) {
      // Get the last down alert to calculate downtime
      const lastDownAlert = await prisma.alert.findFirst({
        where: { monitorId: monitor.id, type: "down" },
        orderBy: { sentAt: "desc" },
      })

      const downDuration = lastDownAlert
        ? formatDistanceToNow(lastDownAlert.sentAt)
        : "unknown duration"

      // Record recovery alert
      await prisma.alert.create({
        data: {
          monitorId: monitor.id,
          type: "up",
        },
      })

      // Send recovery email
      await sendUpAlert(monitor.email, monitor.name, downDuration)
    }

    return NextResponse.json({
      status: "ok",
      monitor: monitor.name,
      timestamp: new Date().toISOString(),
      recovered: wasDown,
    })
  } catch (error) {
    console.error("Ping error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Also support POST and HEAD for flexibility
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  return GET(request, { params })
}

export async function HEAD(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  try {
    const monitor = await prisma.monitor.findUnique({
      where: { slug },
    })

    if (!monitor) {
      return new NextResponse(null, { status: 404 })
    }

    // Don't record ping for paused monitors
    if (monitor.status === "paused") {
      return new NextResponse(null, { status: 200 })
    }

    // Record the ping silently
    await prisma.ping.create({
      data: {
        monitorId: monitor.id,
        source: request.headers.get("x-forwarded-for") || "unknown",
      },
    })

    await prisma.monitor.update({
      where: { id: monitor.id },
      data: {
        status: "up",
        lastPing: new Date(),
      },
    })

    return new NextResponse(null, { status: 200 })
  } catch {
    return new NextResponse(null, { status: 500 })
  }
}
