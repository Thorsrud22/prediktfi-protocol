# Makefile for PrediktFi Protocol
# Provides convenient shortcuts for development tasks

.PHONY: help install build test deploy clean start localnet setup lint

# Default target
help:
	@echo "PrediktFi Protocol - Available Commands:"
	@echo ""
	@echo "Setup:"
	@echo "  make setup     - Install dependencies and build project"
	@echo "  make install   - Install Node.js dependencies"
	@echo ""
	@echo "Development:"
	@echo "  make build     - Build the Anchor program"
	@echo "  make test      - Run tests"
	@echo "  make deploy    - Deploy program to configured network"
	@echo "  make start     - Start Anchor localnet"
	@echo "  make localnet  - Start Solana test validator"
	@echo ""
	@echo "Maintenance:"
	@echo "  make clean     - Clean build artifacts"
	@echo "  make lint      - Check code formatting"
	@echo "  make lint-fix  - Fix code formatting"
	@echo ""
	@echo "Quick Start:"
	@echo "  ./start.sh     - Complete setup and configuration"

# Installation
install:
	yarn install

setup: install build

# Development
build:
	anchor build

test:
	anchor test

deploy:
	anchor deploy

start:
	anchor localnet

localnet:
	solana-test-validator

# Maintenance
clean:
	anchor clean

lint:
	yarn lint

lint-fix:
	yarn lint:fix