import { NextRequest, NextResponse } from "next/server"
import { getStripe } from "@/lib/stripe"
import { prisma } from "@/lib/db"
import Stripe from "stripe"

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get("stripe-signature")

  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Missing signature or webhook secret" }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = getStripe().webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    )
  } catch (error) {
    console.error("Webhook signature verification failed:", error)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session
        const customerId = session.customer as string
        const subscriptionId = session.subscription as string

        // Get customer email
        const customer = await getStripe().customers.retrieve(customerId) as Stripe.Customer
        const email = customer.email

        if (email) {
          await prisma.subscription.upsert({
            where: { email },
            update: {
              stripeCustomerId: customerId,
              stripeSubscriptionId: subscriptionId,
              plan: "indie",
              status: "active",
            },
            create: {
              email,
              stripeCustomerId: customerId,
              stripeSubscriptionId: subscriptionId,
              plan: "indie",
              status: "active",
            },
          })
          console.log(`[Stripe] Subscription activated for ${email}`)
        }
        break
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object
        const customerId = subscription.customer as string

        const customer = await getStripe().customers.retrieve(customerId) as Stripe.Customer
        const email = customer.email

        if (email) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const subData = subscription as any
          await prisma.subscription.update({
            where: { email },
            data: {
              status: subData.status === "active" ? "active" : subData.status,
              currentPeriodEnd: subData.current_period_end
                ? new Date(subData.current_period_end * 1000)
                : null,
            },
          })
          console.log(`[Stripe] Subscription updated for ${email}: ${subData.status}`)
        }
        break
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object
        const customerId = subscription.customer as string

        const customer = await getStripe().customers.retrieve(customerId) as Stripe.Customer
        const email = customer.email

        if (email) {
          await prisma.subscription.update({
            where: { email },
            data: {
              plan: "free",
              status: "canceled",
            },
          })
          console.log(`[Stripe] Subscription canceled for ${email}`)
        }
        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("Webhook handler error:", error)
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 })
  }
}
