"use client"

import { useState, useEffect, Suspense } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { formatDistanceToNow } from "date-fns"

// Separate component that uses useSearchParams
function UpgradeHandler() {
  const searchParams = useSearchParams()

  useEffect(() => {
    if (searchParams.get("upgraded") === "true") {
      // Clear the URL param after successful upgrade
      window.history.replaceState({}, "", "/dashboard")
    }
  }, [searchParams])

  return null
}

interface Monitor {
  id: string
  name: string
  slug: string
  email: string
  status: string
  gracePeriod: number
  lastPing: string | null
  createdAt: string
  _count: {
    pings: number
    alerts: number
  }
}

interface Subscription {
  plan: "free" | "indie"
  limits: { monitors: number }
  isActive: boolean
}

export default function DashboardPage() {
  const [monitors, setMonitors] = useState<Monitor[]>([])
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showEmailPrompt, setShowEmailPrompt] = useState(false)
  const [userEmail, setUserEmail] = useState("")
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    gracePeriod: 300,
  })
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null)
  const [upgrading, setUpgrading] = useState(false)

  // Load saved email on mount
  useEffect(() => {
    const savedEmail = localStorage.getItem("cronping_email")
    if (savedEmail) {
      setUserEmail(savedEmail)
      setFormData(prev => ({ ...prev, email: savedEmail }))
      fetchMonitors(savedEmail)
    } else {
      setShowEmailPrompt(true)
      setLoading(false)
    }
  }, [])

  const saveEmail = (email: string) => {
    localStorage.setItem("cronping_email", email)
    setUserEmail(email)
    setFormData(prev => ({ ...prev, email }))
    setShowEmailPrompt(false)
    fetchMonitors(email)
  }

  const fetchMonitors = async (email: string) => {
    try {
      const res = await fetch(`/api/monitors?email=${encodeURIComponent(email)}`)
      const data = await res.json()
      if (data.monitors && Array.isArray(data.monitors)) {
        setMonitors(data.monitors)
        setSubscription(data.subscription)
      } else if (Array.isArray(data)) {
        // Fallback for old API response
        setMonitors(data)
      } else {
        setMonitors([])
      }
    } catch (error) {
      console.error("Error fetching monitors:", error)
      setMonitors([])
    } finally {
      setLoading(false)
    }
  }

  const createMonitor = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    setError(null)

    try {
      const res = await fetch("/api/monitors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, email: userEmail }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (data.upgrade) {
          setError(data.error)
        } else {
          setError(data.error || "Failed to create monitor")
        }
        return
      }

      setFormData({ name: "", email: userEmail, gracePeriod: 300 })
      setShowCreateForm(false)
      fetchMonitors(userEmail)
    } catch (error) {
      console.error("Error creating monitor:", error)
      setError("Failed to create monitor")
    } finally {
      setCreating(false)
    }
  }

  const deleteMonitor = async (id: string) => {
    if (!confirm("Are you sure you want to delete this monitor?")) return

    try {
      await fetch(`/api/monitors/${id}?email=${encodeURIComponent(userEmail)}`, { method: "DELETE" })
      fetchMonitors(userEmail)
    } catch (error) {
      console.error("Error deleting monitor:", error)
    }
  }

  const handleUpgrade = async () => {
    setUpgrading(true)
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: userEmail }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        const errorDetail = data.details ? `\n\nError: ${data.details}` : ""
        alert(`Failed to start checkout. Please try again.${errorDetail}`)
      }
    } catch (error) {
      console.error("Checkout error:", error)
      alert("Failed to start checkout. Please try again.")
    } finally {
      setUpgrading(false)
    }
  }

  const copyToClipboard = (text: string, slug: string) => {
    navigator.clipboard.writeText(text)
    setCopiedSlug(slug)
    setTimeout(() => setCopiedSlug(null), 2000)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "up":
        return "bg-emerald-500"
      case "down":
        return "bg-red-500"
      case "paused":
        return "bg-zinc-500"
      default:
        return "bg-amber-500"
    }
  }

  const baseUrl = typeof window !== "undefined" ? window.location.origin : ""
  const atLimit = subscription?.plan === "free" && monitors.length >= (subscription?.limits.monitors || 3)

  // Email prompt
  if (showEmailPrompt) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 w-full max-w-md">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
              <span className="text-xl">⏰</span>
            </div>
            <span className="font-semibold text-xl">CronPing</span>
          </div>
          <h2 className="text-xl font-semibold mb-2">Enter your email</h2>
          <p className="text-zinc-400 mb-6">We&apos;ll use this to send you alerts and track your monitors.</p>
          <form onSubmit={(e) => { e.preventDefault(); saveEmail(formData.email) }}>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="you@example.com"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 mb-4"
              required
              autoFocus
            />
            <button
              type="submit"
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-3 rounded-lg transition-colors font-medium"
            >
              Continue
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Handle upgrade success URL param */}
      <Suspense fallback={null}>
        <UpgradeHandler />
      </Suspense>

      {/* Header */}
      <header className="border-b border-zinc-900">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
              <span className="text-xl">⏰</span>
            </div>
            <span className="font-semibold text-xl">CronPing</span>
          </Link>
          <div className="flex items-center gap-4">
            {subscription?.plan === "indie" && (
              <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded">
                Indie Plan
              </span>
            )}
            <span className="text-zinc-400 text-sm">{userEmail}</span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 max-w-3xl">
        {/* Plan status bar */}
        {subscription?.plan === "free" && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 mb-6 flex items-center justify-between">
            <div>
              <span className="text-zinc-400">
                {monitors.length} / {subscription.limits.monitors} monitors used
              </span>
              {atLimit && (
                <span className="text-amber-400 ml-2">(limit reached)</span>
              )}
            </div>
            <button
              onClick={handleUpgrade}
              disabled={upgrading}
              className="text-sm bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              {upgrading ? "Loading..." : "Upgrade to Indie ($9/mo)"}
            </button>
          </div>
        )}

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Monitors</h1>
            <p className="text-zinc-400">Track your cron jobs</p>
          </div>
          <button
            onClick={() => { setError(null); setShowCreateForm(true) }}
            disabled={atLimit}
            className={`px-4 py-2 rounded-lg transition-colors ${
              atLimit
                ? "bg-zinc-700 text-zinc-400 cursor-not-allowed"
                : "bg-emerald-500 hover:bg-emerald-600 text-white"
            }`}
          >
            + New Monitor
          </button>
        </div>

        {/* Create Form Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 w-full max-w-md">
              <h2 className="text-xl font-semibold mb-4">Create Monitor</h2>
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-4">
                  <p className="text-red-400 text-sm">{error}</p>
                  {error.includes("Upgrade") && (
                    <button
                      onClick={handleUpgrade}
                      className="mt-2 text-sm bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      Upgrade to Indie ($9/mo)
                    </button>
                  )}
                </div>
              )}
              <form onSubmit={createMonitor}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1">Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Nightly backup"
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1">Grace Period</label>
                    <select
                      value={formData.gracePeriod}
                      onChange={(e) => setFormData({ ...formData, gracePeriod: parseInt(e.target.value) })}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value={60}>1 minute</option>
                      <option value={300}>5 minutes</option>
                      <option value={900}>15 minutes</option>
                      <option value={1800}>30 minutes</option>
                      <option value={3600}>1 hour</option>
                      <option value={86400}>24 hours</option>
                    </select>
                    <p className="text-xs text-zinc-500 mt-1">
                      If we don&apos;t receive a ping within this time, we&apos;ll alert you at {userEmail}
                    </p>
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="flex-1 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    {creating ? "Creating..." : "Create"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Monitors List */}
        {loading ? (
          <div className="text-center py-12 text-zinc-500">Loading...</div>
        ) : monitors.length === 0 ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8">
            <h2 className="text-xl font-semibold mb-4">How CronPing works</h2>
            <div className="space-y-4 text-zinc-400 mb-6">
              <div className="flex gap-3">
                <span className="text-emerald-400 font-bold">1.</span>
                <p>Create a monitor for your cron job</p>
              </div>
              <div className="flex gap-3">
                <span className="text-emerald-400 font-bold">2.</span>
                <p>Add the ping URL to the end of your cron job</p>
              </div>
              <div className="flex gap-3">
                <span className="text-emerald-400 font-bold">3.</span>
                <p>If the ping doesn&apos;t arrive, you get an email</p>
              </div>
            </div>
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-lg transition-colors"
            >
              Create your first monitor
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {monitors.map((monitor) => (
              <div
                key={monitor.id}
                className="bg-zinc-900 border border-zinc-800 rounded-xl p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(monitor.status)}`}></div>
                    <div>
                      <h3 className="font-semibold text-lg">{monitor.name}</h3>
                      <p className="text-zinc-500 text-sm">
                        {monitor.lastPing
                          ? `Last ping: ${formatDistanceToNow(new Date(monitor.lastPing))} ago`
                          : "Waiting for first ping..."}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded ${
                      monitor.status === "up" ? "bg-emerald-500/20 text-emerald-400" :
                      monitor.status === "down" ? "bg-red-500/20 text-red-400" :
                      "bg-amber-500/20 text-amber-400"
                    }`}>
                      {monitor.status === "new" ? "WAITING" : monitor.status.toUpperCase()}
                    </span>
                    <button
                      onClick={() => deleteMonitor(monitor.id)}
                      className="text-zinc-500 hover:text-red-400 transition-colors p-2"
                      title="Delete monitor"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                {/* Setup instructions for new monitors */}
                {monitor.status === "new" && (
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 mb-4">
                    <p className="text-amber-400 text-sm font-medium mb-3">Next step: Add this to your cron job</p>
                    <p className="text-zinc-400 text-sm mb-3">
                      Append this curl command to the end of your scheduled task. When the task runs, it will ping this URL.
                      If we don&apos;t hear from it within {monitor.gracePeriod / 60} minute{monitor.gracePeriod > 60 ? "s" : ""}, we&apos;ll email you.
                    </p>
                  </div>
                )}

                {/* Ping URL */}
                <div className="bg-zinc-800 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-zinc-500">Ping URL</p>
                    <button
                      onClick={() => copyToClipboard(`${baseUrl}/api/ping/${monitor.slug}`, monitor.slug)}
                      className="text-xs text-zinc-500 hover:text-white transition-colors"
                    >
                      {copiedSlug === monitor.slug ? "Copied!" : "Copy"}
                    </button>
                  </div>
                  <code className="text-sm text-emerald-400 break-all block">
                    {baseUrl}/api/ping/{monitor.slug}
                  </code>
                </div>

                {/* Example usage */}
                {monitor.status === "new" && (
                  <div className="bg-zinc-800 rounded-lg p-4 mt-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-zinc-500">Example crontab line</p>
                      <button
                        onClick={() => copyToClipboard(
                          `0 * * * * /your/script.sh && curl -fsS ${baseUrl}/api/ping/${monitor.slug}`,
                          monitor.slug + "-example"
                        )}
                        className="text-xs text-zinc-500 hover:text-white transition-colors"
                      >
                        {copiedSlug === monitor.slug + "-example" ? "Copied!" : "Copy"}
                      </button>
                    </div>
                    <code className="text-sm text-zinc-300 break-all block">
                      0 * * * * /your/script.sh && curl -fsS {baseUrl}/api/ping/{monitor.slug}
                    </code>
                  </div>
                )}

                <div className="mt-4 flex gap-6 text-sm text-zinc-500">
                  <span>{monitor._count.pings} ping{monitor._count.pings !== 1 ? "s" : ""}</span>
                  <span>{monitor._count.alerts} alert{monitor._count.alerts !== 1 ? "s" : ""}</span>
                  <span>Grace: {monitor.gracePeriod >= 3600 ? `${monitor.gracePeriod / 3600}h` : `${monitor.gracePeriod / 60}m`}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
