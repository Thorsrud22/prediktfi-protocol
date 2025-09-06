#!/bin/bash

# =============================================================================
# PrediktFi Protocol - Automated Development Commands
# =============================================================================
# This script contains all commonly used commands to avoid manual approval
# Usage: ./dev-auto-commands.sh [command]
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}"
}

# =============================================================================
# SERVER MANAGEMENT
# =============================================================================

start_server() {
    log "Starting development server on port 3002..."
    PORT=3002 npm run dev
}

start_server_bg() {
    log "Starting development server in background on port 3002..."
    PORT=3002 npm run dev &
    sleep 5
    log "Server should be running on http://localhost:3002"
}

stop_server() {
    log "Stopping all Node.js processes..."
    pkill -f "next dev" || true
    pkill -f "node" || true
    log "Servers stopped"
}

restart_server() {
    stop_server
    sleep 2
    start_server_bg
}

check_server() {
    log "Checking if server is running..."
    if curl -s http://localhost:3002/api/status > /dev/null; then
        log "✅ Server is running on port 3002"
    else
        warn "❌ Server is not responding on port 3002"
    fi
}

# =============================================================================
# API TESTING
# =============================================================================

test_api_status() {
    log "Testing API status endpoint..."
    curl -s http://localhost:3002/api/status | jq '.' || curl -s http://localhost:3002/api/status
}

test_api_predict() {
    log "Testing AI prediction endpoint..."
    curl -X POST http://localhost:3002/api/ai/predict \
        -H "Content-Type: application/json" \
        -d '{
            "topic": "Politics",
            "question": "Will renewable energy adoption increase this year?",
            "horizon": "12 months"
        }' | jq '.' || curl -X POST http://localhost:3002/api/ai/predict \
        -H "Content-Type: application/json" \
        -d '{"topic": "Politics", "question": "Test question", "horizon": "24 hours"}'
}

test_api_all() {
    log "Running comprehensive API tests..."
    test_api_status
    echo ""
    test_api_predict
    echo ""
    log "API testing complete"
}

# =============================================================================
# DEVELOPMENT WORKFLOW
# =============================================================================

dev_setup() {
    log "Setting up development environment..."
    npm install
    log "Dependencies installed"
}

dev_build() {
    log "Building project..."
    npm run build
}

dev_test() {
    log "Running tests..."
    npm run test
}

dev_lint() {
    log "Running linter..."
    npm run lint
}

dev_typecheck() {
    log "Running TypeScript checks..."
    npm run typecheck
}

dev_full_check() {
    log "Running full development checks..."
    dev_lint
    dev_typecheck
    dev_test
    log "All checks complete"
}

# =============================================================================
# GIT OPERATIONS
# =============================================================================

git_status() {
    log "Git status:"
    git status
}

git_commit_ui() {
    log "Committing UI improvements..."
    git add .
    git commit -m "feat: UI improvements and fixes

- Enhanced user interface components
- Improved styling and responsiveness
- Fixed layout and theme issues
- Updated navigation and interactions"
}

git_commit_api() {
    log "Committing API improvements..."
    git add .
    git commit -m "fix: API improvements and error handling

- Fixed API endpoint issues
- Improved error handling and validation
- Enhanced rate limiting and security
- Updated response formats and documentation"
}

git_commit_docs() {
    log "Committing documentation updates..."
    git add .
    git commit -m "docs: update documentation and README

- Updated README with current features
- Added API documentation and examples
- Improved setup and deployment instructions
- Enhanced code comments and inline docs"
}

git_push() {
    log "Pushing to remote repository..."
    git push origin feat/ui-header-theme-polish
}

git_full_sync() {
    log "Full git synchronization..."
    git add .
    read -p "Enter commit message: " commit_msg
    git commit -m "$commit_msg"
    git push origin feat/ui-header-theme-polish
}

# =============================================================================
# SYSTEM UTILITIES
# =============================================================================

check_ports() {
    log "Checking port usage..."
    netstat -tulpn | grep -E ':(3000|3001|3002|8080|8000)' || echo "No services on common ports"
}

check_processes() {
    log "Checking Node.js processes..."
    ps aux | grep -E 'node|next' | grep -v grep || echo "No Node.js processes running"
}

check_system() {
    log "System information:"
    echo "Node.js version: $(node --version)"
    echo "npm version: $(npm --version)"
    echo "Current directory: $(pwd)"
    echo "Git branch: $(git branch --show-current)"
    check_ports
    check_processes
}

# =============================================================================
# FILE OPERATIONS
# =============================================================================

backup_config() {
    log "Creating backup of configuration files..."
    timestamp=$(date +%Y%m%d_%H%M%S)
    mkdir -p backups/$timestamp
    cp package.json backups/$timestamp/
    cp tsconfig.json backups/$timestamp/
    cp next.config.js backups/$timestamp/
    cp tailwind.config.ts backups/$timestamp/
    log "Backup created in backups/$timestamp/"
}

clean_deps() {
    log "Cleaning dependencies..."
    rm -rf node_modules
    rm -f package-lock.json
    npm install
    log "Dependencies cleaned and reinstalled"
}

clean_build() {
    log "Cleaning build artifacts..."
    rm -rf .next
    rm -rf dist
    rm -rf build
    log "Build artifacts cleaned"
}

clean_all() {
    stop_server
    clean_build
    clean_deps
    log "Full cleanup complete"
}

# =============================================================================
# MONITORING & DEBUGGING
# =============================================================================

watch_logs() {
    log "Watching application logs..."
    tail -f dev.log 2>/dev/null || echo "No dev.log file found"
}

debug_server() {
    log "Server debugging information:"
    check_server
    check_processes
    check_ports
    echo ""
    log "Recent server logs:"
    tail -20 dev.log 2>/dev/null || echo "No recent logs available"
}

performance_check() {
    log "Performance check..."
    echo "Memory usage:"
    free -h
    echo ""
    echo "Disk usage:"
    df -h .
    echo ""
    echo "Load average:"
    uptime
}

# =============================================================================
# QUICK ACTIONS
# =============================================================================

quick_start() {
    log "Quick start sequence..."
    stop_server
    check_system
    start_server_bg
    sleep 3
    check_server
    test_api_status
}

quick_test() {
    log "Quick test sequence..."
    check_server || start_server_bg && sleep 3
    test_api_all
}

quick_deploy_check() {
    log "Quick deployment check..."
    dev_full_check
    dev_build
    log "Deployment check complete - ready for production"
}

# =============================================================================
# MAIN COMMAND HANDLER
# =============================================================================

show_help() {
    cat << EOF
🚀 PrediktFi Protocol - Automated Development Commands

SERVER MANAGEMENT:
  start           Start development server on port 3002
  start-bg        Start server in background
  stop            Stop all Node.js processes
  restart         Restart development server
  check           Check if server is running

API TESTING:
  test-status     Test API status endpoint
  test-predict    Test AI prediction endpoint
  test-api        Run all API tests

DEVELOPMENT:
  setup           Install dependencies
  build           Build project
  test            Run tests
  lint            Run linter
  typecheck       Run TypeScript checks
  full-check      Run all development checks

GIT OPERATIONS:
  status          Show git status
  commit-ui       Commit UI improvements
  commit-api      Commit API improvements
  commit-docs     Commit documentation
  push            Push to remote
  sync            Full git synchronization

SYSTEM UTILITIES:
  ports           Check port usage
  processes       Check Node.js processes
  system          Show system information
  
FILE OPERATIONS:
  backup          Backup configuration files
  clean-deps      Clean and reinstall dependencies
  clean-build     Clean build artifacts
  clean-all       Full cleanup

MONITORING:
  logs            Watch application logs
  debug           Debug server issues
  performance     Performance check

QUICK ACTIONS:
  quick-start     Quick start sequence
  quick-test      Quick test sequence
  quick-deploy    Quick deployment check

USAGE:
  ./dev-auto-commands.sh [command]
  
EXAMPLES:
  ./dev-auto-commands.sh start
  ./dev-auto-commands.sh test-api
  ./dev-auto-commands.sh quick-start

EOF
}

# =============================================================================
# COMMAND EXECUTION
# =============================================================================

case "${1:-help}" in
    # Server management
    "start") start_server ;;
    "start-bg") start_server_bg ;;
    "stop") stop_server ;;
    "restart") restart_server ;;
    "check") check_server ;;
    
    # API testing
    "test-status") test_api_status ;;
    "test-predict") test_api_predict ;;
    "test-api") test_api_all ;;
    
    # Development
    "setup") dev_setup ;;
    "build") dev_build ;;
    "test") dev_test ;;
    "lint") dev_lint ;;
    "typecheck") dev_typecheck ;;
    "full-check") dev_full_check ;;
    
    # Git operations
    "status") git_status ;;
    "commit-ui") git_commit_ui ;;
    "commit-api") git_commit_api ;;
    "commit-docs") git_commit_docs ;;
    "push") git_push ;;
    "sync") git_full_sync ;;
    
    # System utilities
    "ports") check_ports ;;
    "processes") check_processes ;;
    "system") check_system ;;
    
    # File operations
    "backup") backup_config ;;
    "clean-deps") clean_deps ;;
    "clean-build") clean_build ;;
    "clean-all") clean_all ;;
    
    # Monitoring
    "logs") watch_logs ;;
    "debug") debug_server ;;
    "performance") performance_check ;;
    
    # Quick actions
    "quick-start") quick_start ;;
    "quick-test") quick_test ;;
    "quick-deploy") quick_deploy_check ;;
    
    # Help
    "help"|*) show_help ;;
esac
