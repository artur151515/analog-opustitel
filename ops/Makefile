# Opustoshitel TV - Development Makefile

.PHONY: help up down build restart logs shell-backend shell-web test migrate seed clean

# Default target
help: ## Show this help message
	@echo "Opustoshitel TV - Development Commands"
	@echo "====================================="
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)

# Docker Compose commands
up: ## Start all services
	@echo "Starting Opustoshitel TV services..."
	docker-compose -f docker-compose.yml up -d
	@echo "Services started. Access:"
	@echo "  Frontend: http://localhost:3000"
	@echo "  Backend API: http://localhost:8000"
	@echo "  Nginx: http://localhost"

down: ## Stop all services
	@echo "Stopping Opustoshitel TV services..."
	docker-compose -f docker-compose.yml down

build: ## Build all Docker images
	@echo "Building Docker images..."
	docker-compose -f docker-compose.yml build

restart: ## Restart all services
	@echo "Restarting services..."
	docker-compose -f docker-compose.yml restart

logs: ## Show logs from all services
	docker-compose -f docker-compose.yml logs -f

logs-backend: ## Show backend logs
	docker-compose -f docker-compose.yml logs -f backend

logs-web: ## Show web logs
	docker-compose -f docker-compose.yml logs -f web

logs-nginx: ## Show nginx logs
	docker-compose -f docker-compose.yml logs -f nginx

# Development commands
shell-backend: ## Open shell in backend container
	docker-compose -f docker-compose.yml exec backend /bin/bash

shell-web: ## Open shell in web container
	docker-compose -f docker-compose.yml exec web /bin/sh

shell-postgres: ## Open PostgreSQL shell
	docker-compose -f docker-compose.yml exec postgres psql -U opustoshitel -d opustoshitel

shell-redis: ## Open Redis CLI
	docker-compose -f docker-compose.yml exec redis redis-cli

# Database commands
migrate: ## Run database migrations
	@echo "Running database migrations..."
	docker-compose -f docker-compose.yml exec backend alembic upgrade head

migrate-create: ## Create new migration (usage: make migrate-create NAME=migration_name)
	@if [ -z "$(NAME)" ]; then echo "Usage: make migrate-create NAME=migration_name"; exit 1; fi
	docker-compose -f docker-compose.yml exec backend alembic revision --autogenerate -m "$(NAME)"

seed: ## Seed initial data
	@echo "Seeding initial data..."
	docker-compose -f docker-compose.yml exec backend python scripts/seed_data.py

# Testing commands
test: ## Run backend tests
	@echo "Running tests..."
	docker-compose -f docker-compose.yml exec backend pytest

test-verbose: ## Run tests with verbose output
	docker-compose -f docker-compose.yml exec backend pytest -v

test-coverage: ## Run tests with coverage
	docker-compose -f docker-compose.yml exec backend pytest --cov=app

# Health checks
health: ## Check health of all services
	@echo "Checking service health..."
	@echo "Backend health:"
	@curl -s http://localhost:8000/health | jq . || echo "Backend not responding"
	@echo "Web health:"
	@curl -s http://localhost:3000 > /dev/null && echo "Web is healthy" || echo "Web not responding"
	@echo "Nginx health:"
	@curl -s http://localhost/health | jq . || echo "Nginx not responding"

# Cleanup commands
clean: ## Remove all containers, networks, and volumes
	@echo "Cleaning up..."
	docker-compose -f docker-compose.yml down -v --remove-orphans
	docker system prune -f

clean-images: ## Remove all Docker images
	@echo "Removing Docker images..."
	docker-compose -f docker-compose.yml down --rmi all

# Development setup
setup: ## Initial setup (build, up, migrate, seed)
	@echo "Setting up Opustoshitel TV..."
	make build
	make up
	@echo "Waiting for services to start..."
	sleep 10
	make migrate
	make seed
	@echo "Setup complete!"

# Production commands
prod-up: ## Start services in production mode
	@echo "Starting production services..."
	docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

prod-down: ## Stop production services
	@echo "Stopping production services..."
	docker-compose -f docker-compose.yml -f docker-compose.prod.yml down

# Monitoring
stats: ## Show container resource usage
	docker stats

ps: ## Show running containers
	docker-compose -f docker-compose.yml ps

# Backup and restore
backup-db: ## Backup PostgreSQL database
	@echo "Creating database backup..."
	docker-compose -f docker-compose.yml exec postgres pg_dump -U opustoshitel opustoshitel > backup_$(shell date +%Y%m%d_%H%M%S).sql
	@echo "Backup created: backup_$(shell date +%Y%m%d_%H%M%S).sql"

# API testing
test-webhook: ## Test webhook endpoint
	@echo "Testing webhook endpoint..."
	@curl -X POST http://localhost/api/tv-hook \
		-H "Content-Type: application/json" \
		-H "X-TV-Signature: test-signature" \
		-d '{"ts":1640995200000,"symbol":"CADJPY","tf":"5m","dir":"UP"}' \
		| jq . || echo "Webhook test failed"

test-api: ## Test API endpoints
	@echo "Testing API endpoints..."
	@echo "Health check:"
	@curl -s http://localhost/api/health | jq . || echo "Health check failed"
	@echo "Symbols:"
	@curl -s http://localhost/api/symbols | jq . || echo "Symbols endpoint failed"
