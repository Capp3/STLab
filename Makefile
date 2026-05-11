# STLab — common development tasks
SHELL := /bin/bash
.ONESHELL:
.SHELLFLAGS := -eu -o pipefail -c

.DEFAULT_GOAL := help

.PHONY: help install dev build start test lint lint-fix format format-check typecheck check clean compose-up compose-down compose-logs db-migrate db-generate

NPM ?= npm

help: ## Show targets (requires column(1) for alignment)
	@echo "STLab targets:"
	@grep -hE '^[a-zA-Z0-9_.-]+:.*?##' $(MAKEFILE_LIST) | \
		sed -E 's/^([a-zA-Z0-9_.-]+):[^#]*##(.*)/  \1|\2/' | column -t -s '|'

install: ## Install Node dependencies
	$(NPM) ci || $(NPM) install

dev: ## Run API + Vite dev servers
	$(NPM) run dev

build: ## Production client + server build
	$(NPM) run build

start: ## Run compiled server (run build first)
	$(NPM) run start

test: ## Run Mocha tests under tests/
	$(NPM) test

lint: ## ESLint (TypeScript + React on client)
	$(NPM) run lint

lint-fix: ## ESLint with --fix
	$(NPM) run lint:fix

format: ## Prettier write
	$(NPM) run format

format-check: ## Prettier check (CI)
	$(NPM) run format:check

typecheck: ## TypeScript noEmit (client + server tsconfigs)
	$(NPM) run typecheck

check: ## lint + format check + typecheck + tests (typical CI gate)
	$(NPM) run lint
	$(NPM) run format:check
	$(NPM) run typecheck
	$(NPM) test

clean: ## Remove build output and local temp dirs
	rm -rf dist temp
	find . -type f \( -name '*.tmp' -o -name '*.bak' \) -delete 2>/dev/null || true

compose-up: ## docker compose up -d
	docker compose -f compose.yml up -d

compose-down: ## docker compose down
	docker compose -f compose.yml down

compose-logs: ## Follow stlab app logs (Ctrl+C to exit)
	docker compose -f compose.yml logs -f stlab

db-migrate: ## Run Drizzle migrations
	$(NPM) run db:migrate

db-generate: ## Drizzle: generate SQL from schema
	$(NPM) run db:generate
