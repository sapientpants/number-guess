# 2. Client-only single-page app built with Vite

- Status: Accepted
- Date: 2026-10-04

## Context

This project adopted practices from
[agentic-nextjs-ts-starter](https://github.com/sapientpants/agentic-nextjs-ts-starter), which is
built on Next.js. We considered migrating to Next.js at the same time.

## Decision

Stay a client-only React SPA built with Vite. The game has no server-side data, no SEO needs and
no API; Next.js would add a server runtime, routing conventions and deployment complexity with no
user-visible benefit.

## Consequences

- The app deploys as static files.
- Starter practices tied to Next.js or servers (Docker images, container scanning, health
  endpoints, load testing) and to publishing packages (changesets, publint, API extraction) are
  intentionally not adopted.
