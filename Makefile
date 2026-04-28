# Piano for My Kids — developer Makefile
#
# Common workflow:
#   make up          # start mysql + app + adminer
#   make seed        # load lessons into the DB
#   make logs        # tail app logs
#   make down        # stop everything
#
# App:     http://localhost:3000
# Adminer: http://localhost:8080  (server=mysql, user=piano_user, pass=piano_password)

COMPOSE ?= docker compose

.PHONY: help up up-build down restart logs logs-app logs-db ps seed shell-app shell-db reset-db install lint clean

help: ## Show this help
	@awk 'BEGIN {FS = ":.*##"; printf "Targets:\n"} /^[a-zA-Z_-]+:.*##/ {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)

up: ## Start all containers (mysql, app, adminer) in the background
	$(COMPOSE) up -d
	@echo ""
	@echo "App      → http://localhost:3000"
	@echo "Adminer  → http://localhost:8080"
	@echo ""
	@echo "Run 'make seed' once on first start to load the lesson plan."

up-build: ## Rebuild images then start
	$(COMPOSE) up -d --build

down: ## Stop and remove containers (keeps volumes)
	$(COMPOSE) down

restart: ## Restart the app container
	$(COMPOSE) restart app

logs: ## Tail logs from all services
	$(COMPOSE) logs -f --tail=100

logs-app: ## Tail logs from the app only
	$(COMPOSE) logs -f --tail=100 app

logs-db: ## Tail logs from MySQL
	$(COMPOSE) logs -f --tail=100 mysql

ps: ## Show container status
	$(COMPOSE) ps

seed: ## Load lesson plan into MySQL (run once after first 'make up')
	$(COMPOSE) exec app node scripts/init-db.js

shell-app: ## Open a shell in the app container
	$(COMPOSE) exec app sh

shell-db: ## Open a MySQL shell as the app user
	$(COMPOSE) exec mysql mysql -u piano_user -ppiano_password piano_for_my_kids

reset-db: ## DESTRUCTIVE: drop the MySQL volume and restart fresh
	$(COMPOSE) down -v
	$(COMPOSE) up -d
	@echo "Waiting 10s for MySQL to initialize..." && sleep 10
	$(MAKE) seed

install: ## Install npm deps inside the app container (after editing package.json)
	$(COMPOSE) exec app npm install

clean: ## Remove containers, volumes, and the local node_modules cache
	$(COMPOSE) down -v
	@echo "All containers and volumes removed."
