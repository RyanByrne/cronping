import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { nanoid } from "nanoid"
import { canCreateMonitor, getSubscription } from "@/lib/subscription"

// GET /api/monitors - List all monitors
export async function GET(request: NextRequest) {
  try {
    // Get email from query param (simple auth for now)
    const email = request.nextUrl.searchParams.get("email")

    const monitors = await prisma.monitor.findMany({
      where: email ? { email } : undefined,
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { pings: true, alerts: true }
        }
      }
    })

    // Get subscription info if email provided
    let subscription = null
    if (email) {
      subscription = await getSubscription(email)
    }

    return NextResponse.json({ monitors, subscription })
  } catch (error) {
    console.error("Error fetching monitors:", error)
    return NextResponse.json({ error: "Failed to fetch monitors" }, { status: 500 })
  }
}

// POST /api/monitors - Create a new monitor
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, schedule, gracePeriod } = body

    if (!name || !email) {
      return NextResponse.json(
        { error: "Name and email are required" },
        { status: 400 }
      )
    }

    // Check if user can create more monitors
    const { allowed, reason } = await canCreateMonitor(email)
    if (!allowed) {
      return NextResponse.json(
        { error: reason, upgrade: true },
        { status: 403 }
      )
    }

    // Generate a unique slug
    const slug = nanoid(12)

    const monitor = await prisma.monitor.create({
      data: {
        name,
        slug,
        email,
        schedule: schedule || null,
        gracePeriod: gracePeriod || 300, // Default 5 minutes
      },
    })

    return NextResponse.json(monitor, { status: 201 })
  } catch (error) {
    console.error("Error creating monitor:", error)
    return NextResponse.json({ error: "Failed to create monitor" }, { status: 500 })
  }
}
