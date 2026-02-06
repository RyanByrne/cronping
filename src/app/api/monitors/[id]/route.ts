import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

// GET /api/monitors/[id] - Get a single monitor with recent pings
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    const monitor = await prisma.monitor.findUnique({
      where: { id },
      include: {
        pings: {
          orderBy: { createdAt: "desc" },
          take: 50,
        },
        alerts: {
          orderBy: { sentAt: "desc" },
          take: 10,
        },
      },
    })

    if (!monitor) {
      return NextResponse.json({ error: "Monitor not found" }, { status: 404 })
    }

    return NextResponse.json(monitor)
  } catch (error) {
    console.error("Error fetching monitor:", error)
    return NextResponse.json({ error: "Failed to fetch monitor" }, { status: 500 })
  }
}

// PUT /api/monitors/[id] - Update a monitor
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    const body = await request.json()
    const { name, email, schedule, gracePeriod, status, ownerEmail } = body

    // First verify ownership
    const existingMonitor = await prisma.monitor.findUnique({
      where: { id },
      select: { email: true },
    })

    if (!existingMonitor) {
      return NextResponse.json({ error: "Monitor not found" }, { status: 404 })
    }

    if (!ownerEmail || existingMonitor.email !== ownerEmail) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const monitor = await prisma.monitor.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(email && { email }),
        ...(schedule !== undefined && { schedule }),
        ...(gracePeriod !== undefined && { gracePeriod }),
        ...(status && { status }),
      },
    })

    return NextResponse.json(monitor)
  } catch (error) {
    console.error("Error updating monitor:", error)
    return NextResponse.json({ error: "Failed to update monitor" }, { status: 500 })
  }
}

// DELETE /api/monitors/[id] - Delete a monitor
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  // Get email from query param for ownership verification
  const email = request.nextUrl.searchParams.get("email")

  try {
    // First verify ownership
    const monitor = await prisma.monitor.findUnique({
      where: { id },
      select: { email: true },
    })

    if (!monitor) {
      return NextResponse.json({ error: "Monitor not found" }, { status: 404 })
    }

    if (!email || monitor.email !== email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    await prisma.monitor.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting monitor:", error)
    return NextResponse.json({ error: "Failed to delete monitor" }, { status: 500 })
  }
}
