import { prisma } from "./db"
import { PLAN_LIMITS } from "./stripe"

export async function getSubscription(email: string) {
  const subscription = await prisma.subscription.findUnique({
    where: { email },
  })

  if (!subscription || subscription.plan === "free") {
    return {
      plan: "free" as const,
      limits: PLAN_LIMITS.free,
      isActive: true,
    }
  }

  // Check if subscription is still active
  const isActive = subscription.status === "active" &&
    (!subscription.currentPeriodEnd || subscription.currentPeriodEnd > new Date())

  return {
    plan: subscription.plan as "free" | "indie",
    limits: PLAN_LIMITS[subscription.plan as keyof typeof PLAN_LIMITS] || PLAN_LIMITS.free,
    isActive,
    subscription,
  }
}

export async function canCreateMonitor(email: string): Promise<{ allowed: boolean; reason?: string }> {
  const { limits } = await getSubscription(email)

  const monitorCount = await prisma.monitor.count({
    where: { email },
  })

  if (monitorCount >= limits.monitors) {
    return {
      allowed: false,
      reason: `You've reached the limit of ${limits.monitors} monitors on the free plan. Upgrade to create unlimited monitors.`,
    }
  }

  return { allowed: true }
}
