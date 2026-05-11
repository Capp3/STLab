# =============================================================================
# Vibe Dev Template Makefile
# =============================================================================

# Automatic hostname detection
DETECTED_HOST := $(shell hostname)
HOST ?= $(DETECTED_HOST)

# Directories
SCRIPTS_DIR := ./scripts
TEMP_DIR := ./temp
USERNAME := $(USER)
DATA_DIR ?= $(HOME)/.local/docker

# Shell
SHELL := /bin/bash

# Enable better error handling
.ONESHELL:
.SHELLFLAGS := -e -u -o pipefail -c

# Default target
.DEFAULT_GOAL := help

# Phony targets (targets that don't represent files)
.PHONY: help post-install update-memory-bank install-memory-bank update-rules install-rules vibe clean

# =============================================================================
# Help Target
# =============================================================================

help: ## Show this help message
	@echo "Available targets:"
	@fgrep -h "##" $(MAKEFILE_LIST) | grep -v fgrep | sed -e 's/\([^:]*\):[^#]*##\(.*\)/  \1|\2/' | column -t -s '|'

# =============================================================================
# Cleanup Targets
# =============================================================================

clean: ## Remove temporary directories and files
	@echo "Cleaning up temporary files..."
	@rm -rf $(TEMP_DIR)
	@rm -rf $(SCRIPTS_DIR)
	@echo "Cleanup complete."

post-install: ## Clean up after installation
	@echo "Running post-install cleanup..."
	@rm -rf $(SCRIPTS_DIR) 2>/dev/null || true
	@rm -rf $(TEMP_DIR) 2>/dev/null || true
	@echo "Post-install cleanup complete."

# =============================================================================
# Cursor Memory Bank
# =============================================================================
# Source: https://github.com/vanzan01/cursor-memory-bank
# Provides AI-powered development commands and rules for Cursor IDE

update-memory-bank: ## Update the memory bank commands and rules
	@echo "Updating Cursor Memory Bank..."
	@mkdir -p $(TEMP_DIR)
	@if git clone --depth 1 https://github.com/vanzan01/cursor-memory-bank.git $(TEMP_DIR)/cursor-memory-bank 2>/dev/null; then \
		echo "Successfully cloned cursor-memory-bank repository"; \
		if [ -d "$(TEMP_DIR)/cursor-memory-bank/.cursor/commands" ]; then \
			mkdir -p .cursor/commands; \
			cp -R $(TEMP_DIR)/cursor-memory-bank/.cursor/commands/* .cursor/commands/ && \
			echo "Commands updated successfully"; \
		else \
			echo "Warning: Commands directory not found in repository"; \
		fi; \
		if [ -d "$(TEMP_DIR)/cursor-memory-bank/.cursor/rules/isolation_rules" ]; then \
			mkdir -p .cursor/rules/isolation_rules; \
			cp -R $(TEMP_DIR)/cursor-memory-bank/.cursor/rules/isolation_rules/* .cursor/rules/isolation_rules/ && \
			echo "Isolation rules updated successfully"; \
		else \
			echo "Warning: Isolation rules directory not found in repository"; \
		fi; \
		rm -rf $(TEMP_DIR)/cursor-memory-bank; \
		echo "Memory bank update complete."; \
	else \
		echo "Error: Failed to clone cursor-memory-bank repository"; \
		echo "Please check your internet connection and try again"; \
		exit 1; \
	fi

install-memory-bank: update-memory-bank ## Install the memory bank commands and rules (alias for update)

# =============================================================================
# Awesome Cursor Rules
# =============================================================================
# Source: https://github.com/PatrickJS/awesome-cursorrules
# Collection of cursor rules for various frameworks and languages

update-rules: ## Update cursor rules for frameworks and languages
	@echo "Updating Awesome Cursor Rules..."
	@mkdir -p $(TEMP_DIR)
	@if git clone --depth 1 https://github.com/PatrickJS/awesome-cursorrules.git $(TEMP_DIR)/awesome-cursorrules 2>/dev/null; then \
		echo "Successfully cloned awesome-cursorrules repository"; \
		if [ -d "$(TEMP_DIR)/awesome-cursorrules/rules-new" ]; then \
			mkdir -p .cursor/rules-new ; \
			cp -R $(TEMP_DIR)/awesome-cursorrules/rules-new/* .cursor/rules-new/ && \
			echo "Rules updated successfully"; \
		else \
			echo "Warning: Rules directory not found in repository"; \
		fi; \
		rm -rf $(TEMP_DIR)/awesome-cursorrules; \
		echo "Rules update complete."; \
	else \
		echo "Error: Failed to clone awesome-cursorrules repository"; \
		echo "Please check your internet connection and try again"; \
		exit 1; \
	fi

install-rules: update-rules ## Install cursor rules (alias for update)

# =============================================================================
# Combined Installation
# =============================================================================

vibe: install-rules install-memory-bank ## Install both cursor rules and memory bank
	@echo ""
	@echo "=========================================="
	@echo "Vibe setup complete!"
	@echo "=========================================="
	@echo "Installed:"
	@echo "  - Cursor Memory Bank (commands & rules)"
	@echo "  - Awesome Cursor Rules (framework rules)"
	@echo ""
	@echo "Please restart Cursor IDE to load the new configurations."
	@echo ""


# =============================================================================
# Docker Management
# =============================================================================

create-data-dir:
	@echo "Checking data directory: $(DATA_DIR)"
	@if [ ! -d "$(DATA_DIR)" ]; then \
		echo "Creating data directory..."; \
		mkdir -p $(DATA_DIR); \
		echo "Data directory created successfully."; \
	else \
		echo "Data directory already exists."; \
	fi
	@echo "Setting permissions to 775..."
	@chmod 775 $(DATA_DIR)
	@echo "Data directory ready: $(DATA_DIR)"

clean:
	@echo "Cleaning temporary files..."
	@find . -name "*.tmp" -delete
	@find . -name "*.bak" -delete
	@find . -name "*.log" -delete
	@docker system prune -f
	@docker volume prune -f
	@docker image prune -f
	@echo "Cleaning complete."

# List all containers showing only name and ID
list:
	@echo "Listing all containers (name and ID only):"
	@docker container ls --format "table {{.Names}}\t{{.ID}}"

# Show logs for a specific container
logs:
	@if [ -z "$(filter-out $@,$(MAKECMDGOALS))" ]; then \
		echo "Error: Please specify a container ID"; \
		echo "Usage: make logs <container_id>"; \
		echo "Use 'make list' to see available containers"; \
		exit 1; \
	fi
	@echo "Showing logs for container: $(filter-out $@,$(MAKECMDGOALS)) (Ctrl+C to exit)..."
	@docker logs -f $(filter-out $@,$(MAKECMDGOALS))

# Execute shell inside a specific container
exec:
	@if [ -z "$(filter-out $@,$(MAKECMDGOALS))" ]; then \
		echo "Error: Please specify a container ID"; \
		echo "Usage: make exec <container_id>"; \
		echo "Use 'make list' to see available containers"; \
		exit 1; \
	fi
	@echo "Executing shell inside container: $(filter-out $@,$(MAKECMDGOALS))"
	@echo "Type 'exit' to return to host shell"
	@docker exec -it $(filter-out $@,$(MAKECMDGOALS)) sh
