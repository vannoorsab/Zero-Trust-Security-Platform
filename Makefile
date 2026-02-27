.PHONY: help install dev build test clean deploy docker-build docker-push

help:
	@echo "Zero Trust Security Platform - Available Commands"
	@echo ""
	@echo "Development:"
	@echo "  make install          - Install dependencies (frontend + backend)"
	@echo "  make dev              - Run frontend dev server"
	@echo "  make backend          - Run backend dev server"
	@echo "  make docker-dev       - Run all services with Docker Compose"
	@echo ""
	@echo "Building:"
	@echo "  make build            - Build frontend for production"
	@echo "  make docker-build     - Build backend Docker image"
	@echo ""
	@echo "Deployment:"
	@echo "  make docker-push      - Push Docker image to registry"
	@echo "  make deploy           - Deploy to Google Cloud Run"
	@echo ""
	@echo "Utilities:"
	@echo "  make clean            - Clean build artifacts"
	@echo "  make test             - Run tests"
	@echo "  make lint             - Run linters"
	@echo "  make setup-mongo      - Initialize MongoDB collections"

install:
	npm install
	cd backend && pip install -r requirements.txt

dev:
	npm run dev

backend:
	cd backend && uvicorn main:app --reload

docker-dev:
	docker-compose up --build

docker-dev-down:
	docker-compose down

build:
	npm run build

docker-build:
	docker build -t us-central1-docker.pkg.dev/$(PROJECT_ID)/zero-trust/backend:latest -f backend/Dockerfile ./backend

docker-push:
	docker push us-central1-docker.pkg.dev/$(PROJECT_ID)/zero-trust/backend:latest

deploy: docker-build docker-push
	gcloud run deploy zero-trust-backend \
		--image us-central1-docker.pkg.dev/$(PROJECT_ID)/zero-trust/backend:latest \
		--region us-central1 \
		--platform managed

clean:
	rm -rf .next
	rm -rf node_modules
	rm -rf backend/__pycache__
	rm -rf backend/*.pyc
	find . -type d -name __pycache__ -exec rm -rf {} +

test:
	npm run test
	cd backend && pytest

lint:
	npm run lint
	cd backend && pylint *.py

setup-mongo:
	@echo "MongoDB collections will be auto-created on first API call"
	@echo "Or run this Python script to initialize:"
	@echo "cd backend && python -c \"from db import init_db; init_db()\""

.PHONY: logs logs-backend logs-frontend
logs:
	docker-compose logs -f

logs-backend:
	docker-compose logs -f backend

logs-frontend:
	docker-compose logs -f frontend
