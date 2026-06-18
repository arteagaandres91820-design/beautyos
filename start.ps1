# BeautyOS — Script de inicio rapido (Windows PowerShell)
$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "  ╔══════════════════════════════════════════╗" -ForegroundColor Magenta
Write-Host "  ║   💅  BeautyOS — Setup & Launch          ║" -ForegroundColor Magenta
Write-Host "  ╚══════════════════════════════════════════╝" -ForegroundColor Magenta
Write-Host ""

# Verificar Node.js
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "  ✗ Node.js no encontrado. Descargalo en https://nodejs.org" -ForegroundColor Red; exit 1
}
Write-Host "  ✓ Node.js $(node --version)" -ForegroundColor Green

# Verificar Docker
$useDocker = $false
if (Get-Command docker -ErrorAction SilentlyContinue) {
    Write-Host "  ✓ Docker encontrado" -ForegroundColor Green
    $useDocker = $true
} else {
    Write-Host "  ! Docker no encontrado — asegurate de tener PostgreSQL corriendo en localhost:5432" -ForegroundColor Yellow
}

# Instalar dependencias
Write-Host ""
Write-Host "  → Instalando dependencias..." -ForegroundColor Cyan
npm install --workspace=apps/api --workspace=apps/web 2>&1 | Out-Null
Write-Host "  ✓ Dependencias instaladas" -ForegroundColor Green

# Levantar PostgreSQL con Docker si está disponible
if ($useDocker) {
    Write-Host ""
    Write-Host "  → Iniciando PostgreSQL con Docker..." -ForegroundColor Cyan
    docker compose up postgres -d 2>&1 | Out-Null
    Write-Host "  ✓ PostgreSQL listo en localhost:5432" -ForegroundColor Green
    Start-Sleep -Seconds 3
}

# Generar Prisma Client
Write-Host ""
Write-Host "  → Generando Prisma Client..." -ForegroundColor Cyan
Set-Location apps/api
npx prisma generate 2>&1 | Out-Null
Write-Host "  ✓ Prisma Client generado" -ForegroundColor Green

# Ejecutar migraciones
Write-Host "  → Ejecutando migraciones..." -ForegroundColor Cyan
npx prisma migrate dev --name init 2>&1 | Out-Null
Write-Host "  ✓ Migraciones aplicadas" -ForegroundColor Green

# Seed
Write-Host "  → Cargando datos de prueba..." -ForegroundColor Cyan
npx ts-node prisma/seed.ts
Write-Host "  ✓ Seed completado" -ForegroundColor Green
Set-Location ../..

# Lanzar en dev
Write-Host ""
Write-Host "  ┌─────────────────────────────────────────┐" -ForegroundColor Magenta
Write-Host "  │  🚀 Levantando BeautyOS...              │" -ForegroundColor Magenta
Write-Host "  │                                         │" -ForegroundColor Magenta
Write-Host "  │  Frontend: http://localhost:5173        │" -ForegroundColor Magenta
Write-Host "  │  API:      http://localhost:4000        │" -ForegroundColor Magenta
Write-Host "  │  DB Studio:http://localhost:5555        │" -ForegroundColor Magenta
Write-Host "  │                                         │" -ForegroundColor Magenta
Write-Host "  │  Login: admin@beautyos.co / 123456      │" -ForegroundColor Magenta
Write-Host "  └─────────────────────────────────────────┘" -ForegroundColor Magenta
Write-Host ""

npm run dev
