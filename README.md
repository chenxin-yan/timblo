<div align="center">

# 🗓️ Timblo

<p align="center">
  <em>Create an event, share a link, and instantly find the best time for everyone to meet.</em>
</p>

<p align="center">
  <img alt="Deploy" src="https://github.com/chenxin-yan/timblo/workflows/Deploy/badge.svg">
  <img alt="License" src="https://img.shields.io/badge/license-AGPL-blue.svg">
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#getting-started">Getting Started</a> •
  <a href="#deployment">Deployment</a> •
  <a href="#contributing">Contributing</a>
</p>

<hr>

</div>

Timblo is a modern scheduling application that helps groups coordinate meetings by allowing participants to indicate their availability across multiple time slots. Built with a full-stack TypeScript architecture using React, Hono, and Cloudflare Workers.

**🚀 [Try it live at timblo.co](https://timblo.co)**

## Features

- **Easy Event Creation**: Create events with custom titles, dates, and time ranges
- **Timezone Support**: Automatic timezone handling for global coordination
- **Availability Tracking**: Participants can mark themselves as "available" or "if needed"
- **Real-time Updates**: Live availability visualization as responses come in
- **No Account Required**: Simple link sharing without user registration

## Tech Stack

### Frontend (`apps/web`)

- **React 19** with TypeScript
- **TanStack Router** for client-side routing
- **TanStack Query** for server state management
- **Tailwind CSS** + **Shadcn/ui** for styling and components
- **Vite** for build tooling
- **Vitest** for testing

### Backend (`apps/api`)

- **Hono** web framework
- **Cloudflare Workers** for serverless deployment
- **Drizzle ORM** with SQLite (Cloudflare D1)
- **Zod** for schema validation
- **OpenAPI** documentation

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/)
- [Cloudflare Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/)

### Installation

1. Clone the repository:

```bash
git clone git@github.com:chenxin-yan/timblo.git
cd timblo
```

2. Install dependencies:

```bash
bun install
```

3. Configure environment variables:

```bash
cd apps/api
cp .env.example .env
# Edit .env file with your own Cloudflare account details
```

4. Set up the database:

```bash
# Generate database schema
cd apps/api
bun run dev
bun run db:push:local
```

### Development

Run the entire development stack:

```bash
bun run dev
```

This starts:

- Frontend dev server at <http://localhost:3000>
- API dev server at <http://localhost:8787>

## Available Scripts

- `bun run dev` - Start all apps in development mode
- `bun run build` - Build all apps for production and copy frontend assets to API directory
- `bun run deploy` - Deploy the API to Cloudflare Workers (includes built frontend assets)
- `bun run test` - Run all tests
- `bun run check` - Run linting and formatting checks
- `bun run check:types` - Run TypeScript type checking

## Deployment

- migrate database

```bash
cd apps/api
bun run db:push:remote
```

- deploy to Cloudflare Workers

```bash
bun run build
bun run deploy
```

When you run `bun run build` from the root directory, it builds the frontend and copies the assets into the API directory, where they're served by Cloudflare Workers.

## Project Structure

```
timblo/
├── apps/
│   ├── api/          # Hono API on Cloudflare Workers
│   └── web/          # React frontend application
└── packages/         # Shared packages and utilities
```

## API Documentation

Visit the auto-generated OpenAPI documentation at:

- Production: `https://timblo.co/api/docs`
- Local: `http://localhost:8787/api/docs`

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/amazing-feature`
3. Make your changes and ensure tests pass: `bun run test`
4. Run linting: `bun run check`
5. Commit your changes: `git commit -m 'add amazing feature'`
6. Push to the branch: `git push origin feature/amazing-feature`
7. Open a Pull Request
