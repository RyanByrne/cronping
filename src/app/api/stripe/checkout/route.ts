import { NextRequest, NextResponse } from "next/server"
import { getStripe, INDIE_PRICE_ID } from "@/lib/stripe"
import { prisma } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    if (!INDIE_PRICE_ID) {
      return NextResponse.json({ error: "Stripe not configured" }, { status: 500 })
    }

    // Check if customer already exists
    let subscription = await prisma.subscription.findUnique({
      where: { email },
    })

    let customerId = subscription?.stripeCustomerId

    // Create Stripe customer if needed
    if (!customerId) {
      const customer = await getStripe().customers.create({
        email,
        metadata: { email },
      })
      customerId = customer.id

      // Create or update subscription record
      subscription = await prisma.subscription.upsert({
        where: { email },
        update: { stripeCustomerId: customerId },
        create: {
          email,
          stripeCustomerId: customerId,
          plan: "free",
        },
      })
    }

    // Create checkout session
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://cronping.dev"

    const session = await getStripe().checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [
        {
          price: INDIE_PRICE_ID,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${baseUrl}/dashboard?upgraded=true`,
      cancel_url: `${baseUrl}/dashboard`,
      metadata: {
        email,
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error("Checkout error:", error)
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 })
  }
}
