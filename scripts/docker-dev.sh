#!/bin/bash

set -e

# Colors for pretty output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        log_error "Docker is not running. Please start Docker first."
        exit 1
    fi
    log_success "Docker is running"
}

# Create .env file if it doesn't exist
setup_env() {
    if [ ! -f .env ]; then
        log_info "Creating .env file from .env.example..."
        cp .env.example .env
        log_success ".env file created"
    else
        log_info ".env file already exists"
    fi
}

# Start database services
start_db() {
    log_info "Starting PostgreSQL and pgAdmin..."
    docker compose up -d postgres pgadmin
    
    log_info "Waiting for PostgreSQL to be ready..."
    timeout 60 bash -c 'until docker compose exec postgres pg_isready -U sbd_user -d sbd_inventory; do sleep 2; done'
    
    log_success "Database is ready!"
    log_info "PostgreSQL: localhost:5433"
    log_info "pgAdmin: http://localhost:8080"
    log_info "  Email: admin@sbd.local"
    log_info "  Password: admin123"
}

# Stop services
stop_services() {
    log_info "Stopping all services..."
    docker compose down
    log_success "Services stopped"
}

# Show logs
show_logs() {
    docker compose logs -f postgres pgadmin
}

# Reset database (WARNING: This will delete all data!)
reset_db() {
    log_warning "This will DELETE ALL DATABASE DATA!"
    read -p "Are you sure? Type 'yes' to continue: " -r
    if [[ $REPLY == "yes" ]]; then
        log_info "Stopping and removing database..."
        docker compose down -v
        docker volume rm sbd_postgres_data 2>/dev/null || true
        log_success "Database reset complete"
        start_db
    else
        log_info "Database reset cancelled"
    fi
}

# Show status
show_status() {
    log_info "Docker containers status:"
    docker compose ps
    
    log_info "Database connection test:"
    if docker compose exec postgres pg_isready -U sbd_user -d sbd_inventory > /dev/null 2>&1; then
        log_success "Database is accessible"
    else
        log_error "Database is not accessible"
    fi
}

# Main menu
main() {
    case "${1:-}" in
        "start")
            check_docker
            setup_env
            start_db
            ;;
        "stop")
            stop_services
            ;;
        "restart")
            stop_services
            start_db
            ;;
        "logs")
            show_logs
            ;;
        "status")
            show_status
            ;;
        "reset")
            reset_db
            ;;
        "help"|"--help"|"-h")
            echo "🐳 SBD Development Helper"
            echo ""
            echo "Usage: $0 [COMMAND]"
            echo ""
            echo "Commands:"
            echo "  start    Start PostgreSQL and pgAdmin services"
            echo "  stop     Stop all services"
            echo "  restart  Restart services"
            echo "  logs     Show live logs"
            echo "  status   Show services status"
            echo "  reset    Reset database (WARNING: deletes all data!)"
            echo "  help     Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0 start    # Start development environment"
            echo "  $0 logs     # Watch logs"
            echo "  $0 stop     # Stop when done"
            ;;
        *)
            log_error "Unknown command: ${1:-}"
            echo "Use '$0 help' for usage information"
            exit 1
            ;;
    esac
}

main "$@" 