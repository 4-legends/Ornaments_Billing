#!/bin/bash

# Ornaments Billing System Docker Deployment Script

set -e

echo "🚀 Starting Ornaments Billing System Deployment..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Function to stop existing containers
stop_containers() {
    echo "🛑 Stopping existing containers..."
    docker-compose down 2>/dev/null || true
    docker-compose -f docker-compose.dev.yml down 2>/dev/null || true
}

# Function to build and start production
deploy_production() {
    echo "🏗️  Building production image..."
    docker-compose build --no-cache
    
    echo "🚀 Starting production containers..."
    docker-compose up -d
    
    echo "✅ Production deployment complete!"
    echo "🌐 Access your application at: http://localhost:3000"
}

# Function to build and start development
deploy_development() {
    echo "🏗️  Building development image..."
    docker-compose -f docker-compose.dev.yml build --no-cache
    
    echo "🚀 Starting development containers..."
    docker-compose -f docker-compose.dev.yml up -d
    
    echo "✅ Development deployment complete!"
    echo "🌐 Access your application at: http://localhost:3000"
    echo "📝 Development mode with hot reloading enabled"
}

# Function to show logs
show_logs() {
    echo "📋 Showing container logs..."
    docker-compose logs -f
}

# Function to show development logs
show_dev_logs() {
    echo "📋 Showing development container logs..."
    docker-compose -f docker-compose.dev.yml logs -f
}

# Function to clean up
cleanup() {
    echo "🧹 Cleaning up Docker resources..."
    docker-compose down -v
    docker-compose -f docker-compose.dev.yml down -v
    docker system prune -f
    echo "✅ Cleanup complete!"
}

# Main script logic
case "${1:-production}" in
    "production"|"prod")
        stop_containers
        deploy_production
        ;;
    "development"|"dev")
        stop_containers
        deploy_development
        ;;
    "logs")
        show_logs
        ;;
    "dev-logs")
        show_dev_logs
        ;;
    "stop")
        stop_containers
        echo "✅ Containers stopped"
        ;;
    "cleanup")
        cleanup
        ;;
    "help"|"-h"|"--help")
        echo "Usage: $0 [production|development|logs|dev-logs|stop|cleanup|help]"
        echo ""
        echo "Commands:"
        echo "  production, prod  - Deploy production version (default)"
        echo "  development, dev  - Deploy development version with hot reloading"
        echo "  logs             - Show production container logs"
        echo "  dev-logs         - Show development container logs"
        echo "  stop             - Stop all containers"
        echo "  cleanup          - Stop containers and clean up Docker resources"
        echo "  help             - Show this help message"
        ;;
    *)
        echo "❌ Unknown command: $1"
        echo "Use '$0 help' for usage information"
        exit 1
        ;;
esac 