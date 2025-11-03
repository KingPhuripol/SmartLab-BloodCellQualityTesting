# SmartLab Blood Cell Quality Testing - Docker Deployment

## 🐳 Docker Setup

Professional web application for hospital blood cell quality testing, containerized with Docker.

## Prerequisites

- Docker (v20.10 or higher)
- Docker Compose (v2.0 or higher)

## Quick Start

### 1. Build and Start All Services

```bash
# Build and start all containers
docker-compose up --build -d

# View logs
docker-compose logs -f
```

### 2. Access the Application

- **Web Application**: http://localhost:3000
- **API Documentation**: http://localhost:8000/docs
- **Backend API**: http://localhost:8000

### 3. Login Credentials

- **Administrator**: `admin` / `admin123`
- **Supervisor**: `supervisor` / `super123`
- **Analyst**: `analyst` / `analyst123`

## Docker Commands

### View Running Containers

```bash
docker-compose ps
```

### Stop All Services

```bash
docker-compose down
```

### Stop and Remove All Data

```bash
docker-compose down -v
```

### Restart Services

```bash
docker-compose restart
```

### View Logs

```bash
# All services
docker-compose logs -f

# Backend only
docker-compose logs -f backend

# Frontend only
docker-compose logs -f frontend
```

### Rebuild Containers

```bash
docker-compose up --build -d
```

## Architecture

```
┌─────────────────────────────────────────┐
│         Docker Network                   │
│                                          │
│  ┌──────────────┐    ┌──────────────┐  │
│  │   Frontend   │    │   Backend    │  │
│  │   Next.js    │───▶│   FastAPI    │  │
│  │   Port 3000  │    │   Port 8000  │  │
│  └──────────────┘    └──────────────┘  │
│                            │             │
│                            ▼             │
│                      ┌──────────┐        │
│                      │   Data   │        │
│                      │  Volume  │        │
│                      └──────────┘        │
└─────────────────────────────────────────┘
```

## Services

### Backend (FastAPI)

- **Image**: Python 3.13 Slim
- **Port**: 8000
- **Features**:
  - JWT Authentication
  - File Upload & Analysis
  - Z-Score Calculation
  - Grade Assignment
  - Report Export (CSV/Excel)
  - Activity Logging

### Frontend (Next.js)

- **Image**: Node 20 Alpine
- **Port**: 3000
- **Features**:
  - Modern React UI
  - Responsive Design
  - Real-time Data Updates
  - Interactive Dashboard
  - Report Downloads

## Data Persistence

Data is stored in Docker volumes:

- `backend-data`: Uploaded files, analysis results, reports

## Environment Variables

Edit `.env` file to configure:

```env
SECRET_KEY=your-secret-key-here
DATABASE_URL=sqlite:///./smartlab.db
CORS_ORIGINS=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Production Deployment

### 1. Update Environment Variables

```bash
# Generate a secure secret key
openssl rand -hex 32

# Update .env file with production values
```

### 2. Use Production Docker Compose

```bash
docker-compose -f docker-compose.prod.yml up -d
```

### 3. Enable HTTPS

Consider using:

- Nginx reverse proxy
- Let's Encrypt SSL certificates
- Traefik for automatic HTTPS

## Troubleshooting

### Port Already in Use

```bash
# Check what's using port 3000 or 8000
lsof -i :3000
lsof -i :8000

# Stop existing processes or change ports in docker-compose.yml
```

### Container Won't Start

```bash
# Check logs
docker-compose logs backend
docker-compose logs frontend

# Rebuild without cache
docker-compose build --no-cache
```

### Permission Issues

```bash
# Fix volume permissions
docker-compose down -v
docker volume rm smartlab_backend-data
docker-compose up -d
```

## Development Mode

For development with hot-reload:

```bash
# Backend
cd web-app/backend
source venv/bin/activate
uvicorn main:app --reload --port 8000

# Frontend
cd app
npm run dev
```

## Health Checks

Backend includes health check endpoint:

```bash
curl http://localhost:8000/docs
```

## Security Notes

- Change default `SECRET_KEY` in production
- Use strong passwords for user accounts
- Enable HTTPS in production
- Regularly update Docker images
- Backup data volumes regularly

## Support

For issues or questions, check:

- Backend logs: `docker-compose logs backend`
- Frontend logs: `docker-compose logs frontend`
- API docs: http://localhost:8000/docs
