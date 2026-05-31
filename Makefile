# Casino monorepo — convenience targets.
# Windows note: requires `make` (e.g. via Git Bash / choco install make) — pnpm scripts work without it.

.PHONY: up down logs install dev wallet backend frontend

up:          ## start Postgres + Redis
	docker compose -f infra/docker-compose.yml up -d

down:        ## stop infra
	docker compose -f infra/docker-compose.yml down

logs:        ## tail infra logs
	docker compose -f infra/docker-compose.yml logs -f

install:     ## install JS deps
	pnpm install

dev:         ## run all JS apps in dev (backend + frontend)
	pnpm dev

wallet:      ## run Go wallet service
	cd apps/wallet && go run ./cmd/server

backend:     ## run backend only
	cd apps/backend && pnpm dev

frontend:    ## run frontend only
	cd apps/frontend && pnpm dev
