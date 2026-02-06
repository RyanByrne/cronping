import Link from "next/link"

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <header className="container mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
            <span className="text-xl">⏰</span>
          </div>
          <span className="font-semibold text-xl">CronPing</span>
        </div>
        <nav className="flex items-center gap-6">
          <a
            href="https://github.com/yourusername/cronping"
            className="text-zinc-400 hover:text-white transition-colors"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </a>
          <Link
            href="/dashboard"
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Get Started
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <main className="container mx-auto px-6 pt-24 pb-32">
        <div className="max-w-3xl mx-auto text-center">
          {/* Differentiator - above the fold */}
          <div className="inline-flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-full px-4 py-1.5 text-sm text-zinc-400 mb-8">
            <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
            Email-only alerts. No dashboards you won&apos;t check.
          </div>

          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            Cron jobs don&apos;t satisfyingly explode.<br />
            <span className="text-zinc-500">They just quietly stop.</span>
          </h1>

          <p className="text-xl text-zinc-400 mb-12 max-w-2xl mx-auto">
            CronPing alerts you when nothing happened.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/dashboard"
              className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-4 rounded-xl text-lg font-medium transition-colors"
            >
              Create Your First Monitor
            </Link>
          </div>
        </div>

        {/* Code Example */}
        <div className="max-w-2xl mx-auto mt-20">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-800">
              <div className="w-3 h-3 rounded-full bg-zinc-700"></div>
              <div className="w-3 h-3 rounded-full bg-zinc-700"></div>
              <div className="w-3 h-3 rounded-full bg-zinc-700"></div>
              <span className="text-zinc-500 text-sm ml-2">crontab</span>
            </div>
            <pre className="p-6 text-sm overflow-x-auto">
              <code className="text-zinc-300">
                <span className="text-zinc-500"># Run backup every hour, then ping CronPing</span>
                {"\n"}
                <span className="text-emerald-400">0 * * * *</span> /scripts/backup.sh && curl -fsS https://cronping.dev/api/ping/<span className="text-amber-400">abc123</span>
              </code>
            </pre>
          </div>
        </div>

        {/* How It Works */}
        <section id="how-it-works" className="mt-32">
          <h2 className="text-3xl font-bold text-center mb-16">Three steps. That&apos;s it.</h2>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 rounded-xl flex items-center justify-center text-xl font-bold mb-4">
                1
              </div>
              <h3 className="text-xl font-semibold mb-2">Create a monitor</h3>
              <p className="text-zinc-400">
                Give it a name. Set how long to wait before we alert you.
              </p>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 rounded-xl flex items-center justify-center text-xl font-bold mb-4">
                2
              </div>
              <h3 className="text-xl font-semibold mb-2">Add a curl</h3>
              <p className="text-zinc-400">
                Append it to your cron job. Takes 10 seconds.
              </p>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 rounded-xl flex items-center justify-center text-xl font-bold mb-4">
                3
              </div>
              <h3 className="text-xl font-semibold mb-2">Get an email</h3>
              <p className="text-zinc-400">
                If the ping doesn&apos;t come, you&apos;ll know.
              </p>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section className="mt-32">
          <h2 className="text-3xl font-bold text-center mb-4">Pricing</h2>
          <p className="text-zinc-400 text-center mb-16">Most users never leave the free plan.</p>

          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8">
              <h3 className="text-xl font-semibold mb-2">Free</h3>
              <p className="text-4xl font-bold mb-4">$0<span className="text-lg text-zinc-500 font-normal">/mo</span></p>
              <ul className="space-y-3 text-zinc-400 mb-8">
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span> 3 monitors
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span> Email alerts
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span> 1 minute checks
                </li>
              </ul>
              <Link
                href="/dashboard"
                className="block text-center bg-zinc-800 hover:bg-zinc-700 text-white px-6 py-3 rounded-lg transition-colors"
              >
                Get Started
              </Link>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8">
              <h3 className="text-xl font-semibold mb-2">Indie</h3>
              <p className="text-4xl font-bold mb-4">$9<span className="text-lg text-zinc-500 font-normal">/mo</span></p>
              <ul className="space-y-3 text-zinc-400 mb-8">
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span> Unlimited monitors
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span> Email + Slack
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span> 30-second checks
                </li>
              </ul>
              <Link
                href="/dashboard"
                className="block text-center bg-zinc-800 hover:bg-zinc-700 text-white px-6 py-3 rounded-lg transition-colors"
              >
                Upgrade
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-900 py-12">
        <div className="container mx-auto px-6 text-center text-zinc-500">
          <p>Built for cron jobs. Nothing else.</p>
        </div>
      </footer>
    </div>
  )
}
