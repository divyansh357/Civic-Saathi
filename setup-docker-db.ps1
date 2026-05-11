# Docker PostgreSQL Setup Script
# This script sets up PostgreSQL with PostGIS and the full schema

Write-Host "🐳 Civic Saathi - Docker PostgreSQL Setup" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Stop and remove existing containers
Write-Host "📦 Step 1: Cleaning up existing containers..." -ForegroundColor Yellow
cd infra
docker compose down -v postgres
Write-Host "✅ Cleanup complete" -ForegroundColor Green
Write-Host ""

# Step 2: Build and start PostgreSQL
Write-Host "🔨 Step 2: Building PostgreSQL with PostGIS..." -ForegroundColor Yellow
docker compose build postgres
Write-Host "✅ Build complete" -ForegroundColor Green
Write-Host ""

Write-Host "🚀 Step 3: Starting PostgreSQL..." -ForegroundColor Yellow
docker compose up -d postgres
Write-Host "✅ PostgreSQL started" -ForegroundColor Green
Write-Host ""

# Step 4: Wait for PostgreSQL to be ready
Write-Host "⏳ Step 4: Waiting for PostgreSQL to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

$maxAttempts = 30
$attempt = 0
$ready = $false

while (-not $ready -and $attempt -lt $maxAttempts) {
    $attempt++
    Write-Host "   Attempt $attempt/$maxAttempts..." -ForegroundColor Gray
    
    $health = docker inspect --format='{{.State.Health.Status}}' civic_postgres 2>$null
    
    if ($health -eq "healthy") {
        $ready = $true
        Write-Host "✅ PostgreSQL is ready!" -ForegroundColor Green
    } else {
        Start-Sleep -Seconds 2
    }
}

if (-not $ready) {
    Write-Host "❌ PostgreSQL failed to start. Check logs with: docker compose logs postgres" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 5: Verify setup
Write-Host "🔍 Step 5: Verifying database setup..." -ForegroundColor Yellow

# Check if schema was created
$tableCount = docker exec civic_postgres psql -U postgres -d Civic -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';" 2>$null

if ($tableCount) {
    $tableCount = $tableCount.Trim()
    Write-Host "   Tables created: $tableCount" -ForegroundColor Cyan
    
    if ([int]$tableCount -ge 25) {
        Write-Host "✅ Schema created successfully!" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Expected 25+ tables, found $tableCount" -ForegroundColor Yellow
    }
} else {
    Write-Host "⚠️  Could not verify table count" -ForegroundColor Yellow
}

# Check extensions
Write-Host ""
Write-Host "   Checking extensions..." -ForegroundColor Cyan
docker exec civic_postgres psql -U postgres -d Civic -c "SELECT extname, extversion FROM pg_extension WHERE extname IN ('postgis', 'vector', 'pgcrypto', 'uuid-ossp');" 2>$null

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "✅ Docker PostgreSQL Setup Complete!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📊 Database Information:" -ForegroundColor Cyan
Write-Host "   Host: localhost" -ForegroundColor White
Write-Host "   Port: 5432" -ForegroundColor White
Write-Host "   Database: Civic" -ForegroundColor White
Write-Host "   Username: postgres" -ForegroundColor White
Write-Host "   Password: (from .env file)" -ForegroundColor White
Write-Host ""
Write-Host "🔧 Useful Commands:" -ForegroundColor Cyan
Write-Host "   View logs:    docker compose logs -f postgres" -ForegroundColor White
Write-Host "   Stop:         docker compose down postgres" -ForegroundColor White
Write-Host "   Restart:      docker compose restart postgres" -ForegroundColor White
Write-Host "   Connect:      docker exec -it civic_postgres psql -U postgres -d Civic" -ForegroundColor White
Write-Host ""
Write-Host "🎯 Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Backend will connect to localhost:5432" -ForegroundColor White
Write-Host "   2. Run: cd .. && .\mvnw.cmd spring-boot:run" -ForegroundColor White
Write-Host ""

cd ..
