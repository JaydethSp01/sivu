.DEFAULT_GOAL := help

# Cargar .env si existe
ifneq (,$(wildcard .env))
	include .env
	export
endif

.PHONY: help up down clean dev-deps stop-dev seed logs ps build \
        backend-run backend-test backend-coverage \
        frontend-install frontend-run frontend-build \
        mcp-install mcp-run \
        test-api test-e2e test-e2e-ci test-load \
        sonar-scan demo

help: ## Mostrar este menú
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-22s\033[0m %s\n", $$1, $$2}'

## ------------------------------------------------------------------
## Orquestación full (todo dockerizado)
## ------------------------------------------------------------------

up: ## Levantar TODO el stack (postgres, mongo, mailhog, backend, frontend, mcp)
	docker compose up -d --build

down: ## Apagar contenedores conservando volúmenes
	docker compose down

clean: ## Apagar y borrar volúmenes (reset total)
	docker compose down -v

ps: ## Listar contenedores del proyecto
	docker compose ps

logs: ## Ver logs de todos los servicios (Ctrl+C para salir)
	docker compose logs -f --tail=100

build: ## Reconstruir imágenes sin levantar
	docker compose build

## ------------------------------------------------------------------
## Desarrollo (hot reload)
## ------------------------------------------------------------------

dev-deps: ## Levantar solo postgres+mongo+mailhog para desarrollo
	docker compose -f docker-compose.dev.yml up -d

stop-dev: ## Detener dependencias de desarrollo
	docker compose -f docker-compose.dev.yml down

## ------------------------------------------------------------------
## Backend
## ------------------------------------------------------------------

backend-run: ## Correr backend con Maven en host (Spring Boot dev profile)
	cd backend && ./mvnw spring-boot:run -Dspring-boot.run.profiles=dev

backend-test: ## Correr tests unitarios del backend
	cd backend && ./mvnw test

backend-coverage: ## Tests + reporte JaCoCo
	cd backend && ./mvnw clean verify
	@echo "Reporte: backend/target/site/jacoco/index.html"

## ------------------------------------------------------------------
## Frontend
## ------------------------------------------------------------------

frontend-install: ## Instalar dependencias del frontend
	cd frontend && npm install

frontend-run: ## Correr frontend en modo dev (Vite)
	cd frontend && npm run dev

frontend-build: ## Build producción del frontend
	cd frontend && npm run build

## ------------------------------------------------------------------
## MCP Server
## ------------------------------------------------------------------

mcp-install: ## Instalar deps del MCP server
	cd mcp-server && npm install

mcp-run: ## Correr MCP server en modo dev
	cd mcp-server && npm run dev

## ------------------------------------------------------------------
## Pruebas
## ------------------------------------------------------------------

test-api: ## Pruebas de contrato API con Newman
	cd tests && npx newman run postman/SIVU.postman_collection.json \
		-e postman/SIVU.local.postman_environment.json \
		--reporters cli,html \
		--reporter-html-export newman/reports/report.html

test-e2e: ## Cypress en modo interactivo
	cd tests/cypress && npm install && npx cypress open

test-e2e-ci: ## Cypress headless (CI)
	cd tests/cypress && npm install && npx cypress run

test-load: ## Prueba de carga con k6
	docker run --rm -i --network host -v $(PWD)/tests/k6:/scripts grafana/k6:latest run /scripts/postulaciones-load.js

## ------------------------------------------------------------------
## Calidad
## ------------------------------------------------------------------

sonar-scan: ## Escaneo local con sonar-scanner (requiere SONAR_TOKEN)
	cd backend && ./mvnw clean verify sonar:sonar \
		-Dsonar.projectKey=sivu \
		-Dsonar.organization=$(SONAR_ORG) \
		-Dsonar.host.url=https://sonarcloud.io \
		-Dsonar.login=$(SONAR_TOKEN)

## ------------------------------------------------------------------
## Demo / seed
## ------------------------------------------------------------------

seed: ## Cargar datos demo en el backend (debe estar corriendo)
	curl -fsS -X POST http://localhost:$(BACKEND_PORT)/api/v1/admin/seed | jq . || true

demo: up ## Levantar stack completo + cargar seed
	@echo "Esperando backend..."
	@for i in $$(seq 1 60); do \
		if curl -fsS http://localhost:$(BACKEND_PORT)/actuator/health >/dev/null 2>&1; then break; fi; \
		sleep 2; \
	done
	$(MAKE) seed
	@echo ""
	@echo "============================================================"
	@echo "  Frontend:    http://localhost:$(FRONTEND_PORT)"
	@echo "  Swagger:     http://localhost:$(BACKEND_PORT)/swagger-ui.html"
	@echo "  MailHog:     http://localhost:$(MAILHOG_UI_PORT)"
	@echo "============================================================"
