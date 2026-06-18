#!/usr/bin/env bash
set -e

echo ""
echo "  ╔══════════════════════════════════════════╗"
echo "  ║   💅  BeautyOS — Setup & Launch          ║"
echo "  ╚══════════════════════════════════════════╝"
echo ""

# Node check
if ! command -v node &>/dev/null; then echo "  ✗ Node.js no encontrado."; exit 1; fi
echo "  ✓ Node.js $(node --version)"

# Install
echo "  → Instalando dependencias..."
npm install 2>&1 | tail -1
echo "  ✓ Dependencias instaladas"

# Docker postgres
if command -v docker &>/dev/null; then
  echo "  → Iniciando PostgreSQL..."
  docker compose up postgres -d
  sleep 3
  echo "  ✓ PostgreSQL listo"
fi

# Prisma
echo "  → Prisma migrate + seed..."
cd apps/api
npx prisma generate
npx prisma migrate dev --name init
npx ts-node prisma/seed.ts
cd ../..

echo ""
echo "  🚀 Iniciando BeautyOS..."
echo "  Frontend: http://localhost:5173"
echo "  API:      http://localhost:4000"
echo "  Login:    admin@beautyos.co / 123456"
echo ""

npm run dev
