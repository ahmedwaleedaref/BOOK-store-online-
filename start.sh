#!/bin/bash

echo "========================================"
echo "   Bookstore - Quick Start"
echo "========================================"
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo " Docker is not running!"
    echo "   Please start Docker Desktop and try again."
    exit 1
fi

echo " Docker is running"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo " Creating .env file..."
    cp .env.example .env
fi

echo " Starting all services..."
echo "   This may take a few minutes on first run..."
echo ""

# Start services
docker-compose up -d

echo ""
echo " Waiting for services to start (30 seconds)..."
echo "   MySQL needs time to initialize the database..."
sleep 30

echo ""
echo " Checking service status..."
docker-compose ps

echo ""
echo "========================================"
echo "   Bookstore is Ready!"
echo "========================================"
echo ""
echo "   Frontend:   http://localhost"
echo "   Backend:    http://localhost:3000"
echo "   phpMyAdmin: http://localhost:8081"
echo ""
echo "   Login Credentials:"
echo "     Admin:    admin / Admin123!"
echo "     Customer: john_doe / Customer123!"
echo ""
echo "    phpMyAdmin Login:"
echo "     Server:   mysql"
echo "     Username: root"
echo "     Password: rootpassword"
echo ""
echo "   Useful Commands:"
echo "     View logs:  docker-compose logs -f"
echo "     Stop:       docker-compose down"
echo "     Restart:    docker-compose restart"
echo ""
echo "========================================"
echo ""
echo " Tip: If login doesn't work, wait another"
echo "   30 seconds for the database to be ready!"
echo ""
