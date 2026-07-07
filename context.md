# Myntra Clone — Project Context

## Project
A full-featured Myntra.com clone with Medusa.js v2 backend + Next.js 14 storefront.

## Tech Stack
- Backend: Medusa.js v2 (Node.js/TypeScript)
- Frontend: Next.js 14 (App Router)
- Database: PostgreSQL 15
- Cache/Queue: Redis
- Payments: Razorpay + COD
- Infrastructure: Docker Compose
- Deployment: VPS

## Directory Structure
```
E:/Projects/ecom store/
├── backend/          # Medusa v2 backend
├── storefront/       # Next.js 14 frontend
├── docker-compose.yml
├── .env.example
├── setup.sh
├── progress.md
└── docs/
    └── plans/
        └── 2026-07-07-myntra-clone-design.md
```

## Key Design Decisions
- Medusa native modules for core commerce
- Custom modules only for India-specific features
- Pixel-perfect frontend clone of Myntra.com
- Sub-agents for parallel development
- progress.md for cross-session tracking
