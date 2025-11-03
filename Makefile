.PHONY: help dev build up down logs restart clean

help:
	@echo "SmartLab Blood Cell Quality Testing - Commands"
	@echo ""
	@echo "Development Mode (without Docker):"
	@echo "  make dev-backend    - Start backend server (port 8000)"
	@echo "  make dev-frontend   - Start frontend server (port 3001)"
	@echo ""
	@echo "Docker Mode:"
	@echo "  make build          - Build Docker images"
	@echo "  make up             - Start all containers"
	@echo "  make down           - Stop all containers"
	@echo "  make logs           - View logs"
	@echo "  make restart        - Restart all containers"
	@echo "  make clean          - Remove containers and volumes"
	@echo ""
	@echo "Utilities:"
	@echo "  make status         - Check container status"
	@echo "  make shell-backend  - Access backend container shell"
	@echo "  make shell-frontend - Access frontend container shell"

# Development mode (without Docker)
dev-backend:
	@echo "Starting Backend Server..."
	cd web-app/backend && \
	source venv/bin/activate && \
	python -m uvicorn main:app --reload --port 8000

dev-frontend:
	@echo "Starting Frontend Server..."
	cd app && npm run dev

# Docker commands
build:
	@echo "Building Docker images..."
	docker compose build

up:
	@echo "Starting all containers..."
	docker compose up -d
	@echo ""
	@echo "✅ Services started!"
	@echo "Web App: http://localhost:3000"
	@echo "API Docs: http://localhost:8000/docs"

down:
	@echo "Stopping all containers..."
	docker compose down

logs:
	docker compose logs -f

logs-backend:
	docker compose logs -f backend

logs-frontend:
	docker compose logs -f frontend

restart:
	@echo "Restarting all containers..."
	docker compose restart

status:
	docker compose ps

clean:
	@echo "Removing containers and volumes..."
	docker compose down -v
	@echo "✅ Cleanup complete"

shell-backend:
	docker compose exec backend /bin/sh

shell-frontend:
	docker compose exec frontend /bin/sh

# Install dependencies
install-backend:
	cd web-app/backend && \
	python3 -m venv venv && \
	source venv/bin/activate && \
	pip install -r requirements.txt

install-frontend:
	cd app && npm install

install: install-backend install-frontend
	@echo "✅ All dependencies installed"
