#!/bin/bash

# Docker Build Script for Facepet
# This script helps build and manage the Docker container

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Facepet Docker Build Script${NC}"
echo "================================"

# Check if .env.production exists
if [ ! -f .env.production ]; then
    echo -e "${YELLOW}Warning: .env.production not found!${NC}"
    echo "Creating from .env.production.example..."
    if [ -f .env.production.example ]; then
        cp .env.production.example .env.production
        echo -e "${YELLOW}Please edit .env.production with your actual values before deploying${NC}"
    else
        echo -e "${RED}Error: .env.production.example not found!${NC}"
        exit 1
    fi
fi

# Parse command line arguments
COMMAND=${1:-build}

case $COMMAND in
    build)
        echo -e "${GREEN}Building Docker image...${NC}"
        docker-compose build --no-cache
        echo -e "${GREEN}Build complete!${NC}"
        ;;

    up)
        echo -e "${GREEN}Starting containers...${NC}"
        docker-compose up -d
        echo -e "${GREEN}Containers started!${NC}"
        echo "Application available at: http://localhost"
        echo "Health check: http://localhost/health"
        ;;

    down)
        echo -e "${YELLOW}Stopping containers...${NC}"
        docker-compose down
        echo -e "${GREEN}Containers stopped!${NC}"
        ;;

    restart)
        echo -e "${YELLOW}Restarting containers...${NC}"
        docker-compose restart
        echo -e "${GREEN}Containers restarted!${NC}"
        ;;

    logs)
        echo -e "${GREEN}Showing logs...${NC}"
        docker-compose logs -f
        ;;

    clean)
        echo -e "${YELLOW}Cleaning up Docker resources...${NC}"
        docker-compose down -v
        docker system prune -f
        echo -e "${GREEN}Cleanup complete!${NC}"
        ;;

    rebuild)
        echo -e "${GREEN}Rebuilding and restarting...${NC}"
        docker-compose down
        docker-compose build --no-cache
        docker-compose up -d
        echo -e "${GREEN}Rebuild complete!${NC}"
        ;;

    shell)
        echo -e "${GREEN}Opening shell in container...${NC}"
        docker-compose exec facepet sh
        ;;

    *)
        echo -e "${RED}Unknown command: $COMMAND${NC}"
        echo ""
        echo "Available commands:"
        echo "  build    - Build the Docker image"
        echo "  up       - Start the containers"
        echo "  down     - Stop the containers"
        echo "  restart  - Restart the containers"
        echo "  logs     - View container logs"
        echo "  clean    - Clean up Docker resources"
        echo "  rebuild  - Rebuild and restart containers"
        echo "  shell    - Open a shell in the container"
        exit 1
        ;;
esac
