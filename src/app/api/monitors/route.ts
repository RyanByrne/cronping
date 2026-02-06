import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { nanoid } from "nanoid"

// GET /api/monitors - List all monitors
export async function GET() {
  try {
    const monitors = await prisma.monitor.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { pings: true, alerts: true }
        }
      }
    })

    return NextResponse.json(monitors)
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
