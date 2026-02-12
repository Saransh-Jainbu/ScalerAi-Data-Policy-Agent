# Quick Start Script for Compliance Platform
# Run this to start all services

Write-Host "🚀 Starting Compliance Platform..." -ForegroundColor Cyan
Write-Host ""

# Check if Docker is running
Write-Host "Checking Docker..." -ForegroundColor Yellow
try {
    docker ps | Out-Null
    Write-Host "✅ Docker is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker is not running. Please start Docker Desktop first." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Starting all services with Docker Compose..." -ForegroundColor Yellow
docker-compose up -d

Write-Host ""
Write-Host "Waiting for services to be healthy..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

Write-Host ""
Write-Host "Checking service status..." -ForegroundColor Yellow
docker-compose ps

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✅ Compliance Platform is starting!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📍 Access Points:" -ForegroundColor Yellow
Write-Host "   Frontend:    http://localhost:5173" -ForegroundColor White
Write-Host "   API:         http://localhost:8080" -ForegroundColor White
Write-Host "   Grafana:     http://localhost:3000 (admin/admin)" -ForegroundColor White
Write-Host "   Prometheus:  http://localhost:9090" -ForegroundColor White
Write-Host ""
Write-Host "📝 Next Steps:" -ForegroundColor Yellow
Write-Host "   1. Pull LLM model:" -ForegroundColor White
Write-Host "      docker exec -it compliance-ollama ollama pull llama3.1:8b" -ForegroundColor Cyan
Write-Host ""
Write-Host "   2. Upload a PDF document:" -ForegroundColor White
Write-Host "      Copy PDF to: ./data/documents/" -ForegroundColor Cyan
Write-Host ""
Write-Host "   3. View logs:" -ForegroundColor White
Write-Host "      docker-compose logs -f" -ForegroundColor Cyan
Write-Host ""
Write-Host "🛑 To stop all services:" -ForegroundColor Yellow
Write-Host "   docker-compose down" -ForegroundColor White
Write-Host ""
