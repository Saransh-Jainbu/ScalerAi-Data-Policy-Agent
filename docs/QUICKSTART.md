# 🚀 Quick Start Guide

## Step 1: Start the Platform

```powershell
# Run the startup script
.\start.ps1
```

This will:
- ✅ Check if Docker is running
- ✅ Start all 11 services
- ✅ Show you access URLs

## Step 2: Pull the LLM Model

```powershell
docker exec -it compliance-ollama ollama pull llama3.1:8b
```

⏱️ This takes 5-10 minutes (downloads ~4.7GB)

## Step 3: Test with a Sample PDF

1. **Copy a PDF** to `./data/documents/`
2. **Trigger processing**:
   ```powershell
   curl -X POST http://localhost:8081/scan
   ```

3. **Check status**:
   ```powershell
   curl http://localhost:8081/documents
   ```

## Access the Platform

- **Frontend**: http://localhost:5173
- **API Docs**: http://localhost:8080/docs
- **Grafana**: http://localhost:3000 (admin/admin)
- **Database**: `localhost:5432` (admin/admin123)

## View Logs

```powershell
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f document-processor
```

## Stop the Platform

```powershell
docker-compose down
```

## Troubleshooting

**Services won't start?**
```powershell
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

**Check service health:**
```powershell
docker-compose ps
```

---

**Need help?** Check the full [README.md](README.md)
