import Stripe from "stripe"

let stripeInstance: Stripe | null = null

export function getStripe(): Stripe {
  if (!stripeInstance) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY is not set")
    }
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY)
  }
  return stripeInstance
}

// For backwards compatibility
export const stripe = {
  get customers() { return getStripe().customers },
  get checkout() { return getStripe().checkout },
  get webhooks() { return getStripe().webhooks },
}

// Price ID for the Indie plan ($9/mo)
export const INDIE_PRICE_ID = process.env.STRIPE_INDIE_PRICE_ID || ""

// Plan limits
export const PLAN_LIMITS = {
  free: {
    monitors: 3,
  },
  indie: {
    monitors: Infinity,
  },
}
