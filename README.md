# CronPing

Cron jobs don't fail loudly. They just stop running.
CronPing alerts you when a cron job doesn't run.

```bash
# Run backup every hour, then ping CronPing
0 * * * * /scripts/backup.sh && curl -fsS https://cronping.dev/ping/YOUR_ID
```

## What it does

- You get a unique URL
- Your cron job pings it when it runs
- If the ping doesn't arrive in time, you get alerted

## What it does NOT do

CronPing does not:

- monitor servers
- track metrics
- provide dashboards you won't check
- replace full observability tools

## How to use it

1. Create a monitor
2. Add the ping URL to your cron job
3. Get an alert if the ping doesn't arrive

## Alerts

Alerts are sent via email.
Slack is supported on paid plans.

## Pricing

CronPing is free for small usage.
Paid plans exist for higher limits and Slack alerts.
See [pricing](https://cronping.dev#pricing).

## Why this exists

I built this after multiple cron jobs failed silently in production.
I wanted the smallest possible tool that tells me when nothing happened.

## Get started

https://cronping.dev
