#!/bin/bash

set -e

echo "=== Myntra Clone — Setup Script ==="
echo ""

cd "$(dirname "$0")"

# Check for .env
if [ ! -f .env ]; then
  echo "Creating .env from .env.example..."
  cp .env.example .env
  echo "⚠️  Edit .env with your actual keys before running in production."
fi

source .env

echo ""
echo "=== Step 1: Starting PostgreSQL and Redis ==="
docker compose up -d postgres redis

echo ""
echo "=== Step 2: Waiting for database to be ready ==="
sleep 5

echo ""
echo "=== Step 3: Installing backend dependencies ==="
cd backend && npm install

echo ""
echo "=== Step 4: Running database migrations ==="
npx medusa migrations run

echo ""
echo "=== Step 5: Seeding data ==="
npx medusa exec src/scripts/seed.ts

echo ""
echo "=== Step 6: Building backend ==="
npm run build

echo ""
echo "=== Step 7: Installing storefront dependencies ==="
cd ../storefront && npm install

echo ""
echo "=== Step 8: Building storefront ==="
npm run build

echo ""
echo "=== Step 9: Starting all services ==="
cd .. && docker compose up -d

echo ""
echo "=== Setup Complete! ==="
echo "Services running:"
echo "  - PostgreSQL: localhost:5432"
echo "  - Redis: localhost:6379"
echo "  - Medusa API: localhost:9000"
echo "  - Storefront: localhost:3000"
echo ""
echo "Admin panel: http://localhost:9000/app"
echo "Storefront:  http://localhost:3000"
