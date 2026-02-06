"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"

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

export default function DashboardPage() {
  const [monitors, setMonitors] = useState<Monitor[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    gracePeriod: 300,
  })
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    fetchMonitors()
  }, [])

  const fetchMonitors = async () => {
    try {
      const res = await fetch("/api/monitors")
      const data = await res.json()
      if (Array.isArray(data)) {
        setMonitors(data)
      } else {
        console.error("API returned non-array:", data)
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

    try {
      const res = await fetch("/api/monitors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        setFormData({ name: "", email: "", gracePeriod: 300 })
        setShowCreateForm(false)
        fetchMonitors()
      }
    } catch (error) {
      console.error("Error creating monitor:", error)
    } finally {
      setCreating(false)
    }
  }

  const deleteMonitor = async (id: string) => {
    if (!confirm("Are you sure you want to delete this monitor?")) return

    try {
      await fetch(`/api/monitors/${id}`, { method: "DELETE" })
      fetchMonitors()
    } catch (error) {
      console.error("Error deleting monitor:", error)
    }
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

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <header className="border-b border-zinc-900">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
              <span className="text-xl">⏰</span>
            </div>
            <span className="font-semibold text-xl">CronPing</span>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Monitors</h1>
            <p className="text-zinc-400">Track your cron jobs</p>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            + New Monitor
          </button>
        </div>

        {/* Create Form Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 w-full max-w-md">
              <h2 className="text-xl font-semibold mb-4">Create Monitor</h2>
              <form onSubmit={createMonitor}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1">Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Daily backup"
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1">Alert Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="you@example.com"
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
                      How long to wait after expected ping before alerting
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
          <div className="text-center py-12">
            <div className="text-zinc-500 mb-4">No monitors yet</div>
            <button
              onClick={() => setShowCreateForm(true)}
              className="text-emerald-400 hover:text-emerald-300"
            >
              Create your first monitor →
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {monitors.map((monitor) => (
              <div
                key={monitor.id}
                className="bg-zinc-900 border border-zinc-800 rounded-xl p-6"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(monitor.status)}`}></div>
                    <div>
                      <h3 className="font-semibold text-lg">{monitor.name}</h3>
                      <p className="text-zinc-500 text-sm">
                        {monitor.lastPing
                          ? `Last ping: ${formatDistanceToNow(new Date(monitor.lastPing))} ago`
                          : "No pings yet"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded ${
                      monitor.status === "up" ? "bg-emerald-500/20 text-emerald-400" :
                      monitor.status === "down" ? "bg-red-500/20 text-red-400" :
                      "bg-zinc-700 text-zinc-400"
                    }`}>
                      {monitor.status.toUpperCase()}
                    </span>
                    <button
                      onClick={() => deleteMonitor(monitor.id)}
                      className="text-zinc-500 hover:text-red-400 transition-colors p-2"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                <div className="mt-4 bg-zinc-800 rounded-lg p-4">
                  <p className="text-xs text-zinc-500 mb-2">Ping URL</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-sm text-emerald-400 break-all">
                      {baseUrl}/api/ping/{monitor.slug}
                    </code>
                    <button
                      onClick={() => navigator.clipboard.writeText(`${baseUrl}/api/ping/${monitor.slug}`)}
                      className="text-zinc-500 hover:text-white transition-colors shrink-0"
                    >
                      📋
                    </button>
                  </div>
                </div>

                <div className="mt-4 flex gap-6 text-sm text-zinc-500">
                  <span>{monitor._count.pings} pings</span>
                  <span>{monitor._count.alerts} alerts</span>
                  <span>Grace: {monitor.gracePeriod / 60}m</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
